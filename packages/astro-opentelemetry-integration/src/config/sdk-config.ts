/**
 * Configuration builders for OpenTelemetry SDK
 * Pure functions that build configuration objects
 */

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import type { NodeSDKConfiguration } from "@opentelemetry/sdk-node";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { getMetricsExporter } from "../exporters/metrics.js";
import { getTraceExporter } from "../exporters/traces.js";
import type { IntegrationSchema } from "../integrationSchema.js";
import { GET_APP_CONSOLE_NAME } from "../utils/constants.ts";
import {
	OTEL_SERVICE_NAME,
	OTEL_SERVICE_VERSION,
} from "../utils/getAttributes.js";

/**
 * Create HTTP instrumentation configuration
 */
export function createHttpInstrumentation(): HttpInstrumentation {
	return new HttpInstrumentation({
		// Only enable detailed metrics collection when Prometheus is selected
		enabled: true,
		// Configure request/response hooks for better metrics
		requestHook: (span, request) => {
			// Add custom attributes to spans for better Prometheus metrics
			span.setAttributes({
				"http.request.method": request.method || "UNKNOWN",
				"http.request.url": (request as { url?: string }).url || "",
			});
		},
		responseHook: (span, response) => {
			// Add response attributes for metrics
			span.setAttributes({
				"http.response.status_code": response.statusCode || 0,
				"http.response.status_text": response.statusMessage || "",
			});
		},
		// Configure which HTTP methods to instrument
		ignoreIncomingRequestHook: (req) => {
			// Skip health check endpoints to reduce noise
			const url = (req as { url?: string }).url || "";
			return url.includes("/health") || url.includes("/ping");
		},
		// Configure outgoing request instrumentation
		ignoreOutgoingRequestHook: (req) => {
			// Skip internal OpenTelemetry requests
			const url = (req as { url?: string }).url || "";
			return url.includes("/v1/traces") || url.includes("/v1/metrics");
		},
	});
}

/**
 * Check if Prometheus metrics are enabled
 */
export function isPrometheusEnabled(): boolean {
	return globalThis.__OTEL_PRESETS__?.metricExporter === "prometheus";
}

/**
 * Build the complete SDK configuration
 */
export function buildSDKConfig(
	presets: IntegrationSchema["presets"],
): Partial<NodeSDKConfiguration> {
	const config: Partial<NodeSDKConfiguration> = {
		resource: resourceFromAttributes({
			[ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
			[ATTR_SERVICE_VERSION]: OTEL_SERVICE_VERSION,
		}),
		// Use enhanced HTTP instrumentation
		instrumentations: [createHttpInstrumentation()],
	};

	// Get the trace exporter
	const traceExporter = getTraceExporter(presets?.traceExporter);
	if (traceExporter) {
		config.traceExporter = traceExporter;
	}

	// Get the metrics exporter
	const metricsExporter = getMetricsExporter(presets?.metricExporter);
	if (metricsExporter) {
		config.metricReaders = [metricsExporter];
	}

	// Only add the Node auto instrumentations if the metric exporter is prometheus
	if (isPrometheusEnabled() && metricsExporter) {
		console.log(
			GET_APP_CONSOLE_NAME(),
			"Prometheus metrics enabled - adding comprehensive auto instrumentations",
		);

		// Add auto instrumentations for comprehensive metrics
		config?.instrumentations?.push(
			getNodeAutoInstrumentations({
				// Configure auto instrumentations for better Prometheus metrics
				"@opentelemetry/instrumentation-http": {
					enabled: false, // We're using our custom HTTP instrumentation above
				},
				"@opentelemetry/instrumentation-fs": {
					enabled: true,
				},
				"@opentelemetry/instrumentation-dns": {
					enabled: true,
				},
				"@opentelemetry/instrumentation-net": {
					enabled: true,
				},
				"@opentelemetry/instrumentation-express": {
					enabled: true,
				},
				"@opentelemetry/instrumentation-connect": {
					enabled: true,
				},
			}),
		);
	} else {
		console.log(
			"Prometheus metrics disabled - using basic HTTP instrumentation only",
		);
	}

	return config;
}
