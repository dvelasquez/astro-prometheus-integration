import { metrics } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import type { MeterProvider } from "@opentelemetry/sdk-metrics";
import { NodeSDK, type NodeSDKConfiguration } from "@opentelemetry/sdk-node";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import {
	getMetricsExporter,
	initializeHostMetrics,
} from "./exporters/metrics.ts";
import { getTraceExporter } from "./exporters/traces.ts";
import {
	OTEL_SERVICE_NAME,
	OTEL_SERVICE_VERSION,
} from "./utils/getAttributes.js";

console.log("Initializing OpenTelemetry for Astro...");

// Check if Prometheus metrics are enabled
const isPrometheusEnabled =
	globalThis.__OTEL_PRESETS__?.metricExporter === "prometheus";

// Enhanced HTTP instrumentation configuration for Prometheus metrics
const httpInstrumentation = new HttpInstrumentation({
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

// Set the default shared configuration for the SDK
const sdkConfig: Partial<NodeSDKConfiguration> = {
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
		[ATTR_SERVICE_VERSION]: OTEL_SERVICE_VERSION,
	}),
	// Use enhanced HTTP instrumentation
	instrumentations: [httpInstrumentation],
};

// Get the trace exporter
const traceExporter = getTraceExporter(
	globalThis.__OTEL_PRESETS__?.traceExporter,
);

// Get the metrics exporter
const metricsExporter = getMetricsExporter(
	globalThis.__OTEL_PRESETS__?.metricExporter,
);
//Add the trace exporter to the SDK configuration conditionally
if (traceExporter) {
	sdkConfig.traceExporter = traceExporter;
}

//Add the metrics exporter to the SDK configuration conditionally
if (metricsExporter) {
	sdkConfig.metricReaders = [metricsExporter];
}

// Only add the Node auto instrumentations if the metric exporter is prometheus
if (isPrometheusEnabled && metricsExporter) {
	console.log(
		"Prometheus metrics enabled - adding comprehensive auto instrumentations",
	);

	// Add auto instrumentations for comprehensive metrics
	sdkConfig?.instrumentations?.push(
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

const sdk = new NodeSDK(sdkConfig);

// Start the SDK and gracefully shut it down on process exit.
sdk.start();

// Initialize host metrics after SDK is started (for Prometheus exporter only)
if (isPrometheusEnabled) {
	console.log("Initializing host metrics for Prometheus");
	// Get the MeterProvider from the global metrics API and cast it to SDK MeterProvider
	const meterProvider = metrics.getMeterProvider() as MeterProvider;
	if (meterProvider) {
		initializeHostMetrics(meterProvider);
	}
}

process.on("SIGTERM", () => {
	sdk
		.shutdown()
		.then(() => console.log("Telemetry terminated"))
		.catch((error) => console.log("Error terminating telemetry", error))
		.finally(() => process.exit(0));
});

console.log("OpenTelemetry for Astro initialized.");
