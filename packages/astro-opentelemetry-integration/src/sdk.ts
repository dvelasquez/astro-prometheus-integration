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

// Set the default shared configuration for the SDK
const sdkConfig: Partial<NodeSDKConfiguration> = {
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
		[ATTR_SERVICE_VERSION]: OTEL_SERVICE_VERSION,
	}),
	// Auto-instrumentations automatically patch popular libraries.
	// HttpInstrumentation traces outgoing HTTP requests made by your server.
	instrumentations: [new HttpInstrumentation()],
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
if (
	globalThis.__OTEL_PRESETS__.metricExporter === "prometheus" &&
	metricsExporter
) {
	sdkConfig?.instrumentations?.push(getNodeAutoInstrumentations());
}

const sdk = new NodeSDK(sdkConfig);

// Start the SDK and gracefully shut it down on process exit.
sdk.start();

// Initialize host metrics after SDK is started (for Prometheus exporter)
if (globalThis.__OTEL_PRESETS__?.metricExporter === "prometheus") {
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
