/**
 * Conditional metrics creation based on exporter type
 * Follows OpenTelemetry best practices for different exporters
 */

import { metrics } from "@opentelemetry/api";
import type { IntegrationSchema } from "../integrationSchema.js";
import { OTEL_SERVICE_VERSION } from "./getAttributes.js";

type MetricsPresets = NonNullable<
	IntegrationSchema["presets"]
>["metricExporter"];

/**
 * Check if metrics should be created based on exporter type
 */
export function shouldCreateMetrics(exporter: MetricsPresets): boolean {
	switch (exporter) {
		case "prometheus":
		case "http":
		case "grpc":
		case "proto":
			return true;
		default:
			return false;
	}
}

/**
 * Get the appropriate meter for metrics creation
 */
export function getMetricsMeter() {
	return metrics.getMeter(
		"astro-opentelemetry-integration-metrics",
		OTEL_SERVICE_VERSION,
	);
}

/**
 * Create metrics based on exporter type following OpenTelemetry best practices
 */
export function createMetricsForExporter(exporter: MetricsPresets) {
	if (!shouldCreateMetrics(exporter)) {
		return {
			httpRequestsTotal: null,
			httpRequestDuration: null,
			httpServerDurationSeconds: null,
		};
	}

	const meter = getMetricsMeter();

	switch (exporter) {
		case "prometheus":
			// Create detailed metrics for Prometheus (debugging-friendly)
			return {
				httpRequestsTotal: meter.createCounter("http_requests_total", {
					description: "Total number of HTTP requests",
				}),
				httpRequestDuration: meter.createHistogram(
					"http_request_duration_seconds",
					{
						description:
							"Duration in seconds of initial server-side request processing, including middleware and Astro frontmatter, measured until the response is ready to send/stream.",
					},
				),
				httpServerDurationSeconds: meter.createHistogram(
					"http_server_duration_seconds",
					{
						description:
							"Full server-side HTTP request duration in seconds, including processing, Astro rendering, and response streaming.",
					},
				),
			};

		case "http":
		case "grpc":
		case "proto":
			// Create essential metrics only for OTLP exporters (production-optimized)
			return {
				httpRequestsTotal: null, // Skip counter for OTLP (can be derived from histogram)
				httpRequestDuration: meter.createHistogram(
					"http_request_duration_seconds",
					{
						description:
							"Duration in seconds of initial server-side request processing, including middleware and Astro frontmatter, measured until the response is ready to send/stream.",
					},
				),
				httpServerDurationSeconds: meter.createHistogram(
					"http_server_duration_seconds",
					{
						description:
							"Full server-side HTTP request duration in seconds, including processing, Astro rendering, and response streaming.",
					},
				),
			};

		default:
			return {
				httpRequestsTotal: null,
				httpRequestDuration: null,
				httpServerDurationSeconds: null,
			};
	}
}

/**
 * Get the current exporter type from global presets
 */
export function getCurrentExporter(): MetricsPresets {
	return globalThis.__OTEL_PRESETS__?.metricExporter || "none";
}
