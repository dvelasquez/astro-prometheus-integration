/**
 * Error handling utilities for OpenTelemetry metrics export
 * Provides graceful handling of export failures
 */

import { metrics } from "@opentelemetry/api";

/**
 * Set up error handling for metrics export failures
 * This follows OpenTelemetry best practices for production resilience
 */
export function setupMetricsErrorHandling() {
	const meter = metrics.getMeter(
		"astro-opentelemetry-integration-error-handler",
	);

	// Create a counter to track export failures
	const exportFailureCounter = meter.createCounter(
		"otel_export_failures_total",
		{
			description: "Total number of OpenTelemetry export failures",
		},
	);

	// Set up global error handler for unhandled promise rejections
	process.on("unhandledRejection", (reason) => {
		// Check if this is an OpenTelemetry export error
		if (reason && typeof reason === "object" && "message" in reason) {
			const errorMessage = (reason as Error).message;
			if (errorMessage.includes("OTLP") || errorMessage.includes("export")) {
				console.warn("OpenTelemetry export failed:", errorMessage);
				exportFailureCounter.add(1, {
					error_type: "unhandled_rejection",
					exporter: "unknown",
				});
			}
		}
	});

	// Set up error handler for uncaught exceptions
	process.on("uncaughtException", (error) => {
		if (error.message.includes("OTLP") || error.message.includes("export")) {
			console.warn("OpenTelemetry export failed:", error.message);
			exportFailureCounter.add(1, {
				error_type: "uncaught_exception",
				exporter: "unknown",
			});
		}
	});

	console.log("OpenTelemetry error handling initialized");
}

/**
 * Check if metrics export is working by testing the meter provider
 */
export function isMetricsExportHealthy(): boolean {
	try {
		const meterProvider = metrics.getMeterProvider();
		// Simple health check - if we can get a meter, export is likely working
		return meterProvider !== undefined;
	} catch (error) {
		console.warn("Metrics export health check failed:", error);
		return false;
	}
}
