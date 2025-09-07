import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK, type NodeSDKConfiguration } from "@opentelemetry/sdk-node";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { getMetricsExporter } from "./exporters/metrics.ts";
import { getTraceExporter } from "./exporters/traces.ts";
import {
	OTEL_SERVICE_NAME,
	OTEL_SERVICE_VERSION,
} from "./utils/getAttributes.js";

console.log("Initializing OpenTelemetry for Astro...");

const sdkConfig: Partial<NodeSDKConfiguration> = {
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
		[ATTR_SERVICE_VERSION]: OTEL_SERVICE_VERSION,
	}),
	// Auto-instrumentations automatically patch popular libraries.
	// HttpInstrumentation traces outgoing HTTP requests made by your server.
	instrumentations: [new HttpInstrumentation(), getNodeAutoInstrumentations()],
};
const traceExporter = getTraceExporter(
	globalThis.__OTEL_PRESETS__?.traceExporter,
);
const metricsExporter = getMetricsExporter(
	globalThis.__OTEL_PRESETS__?.metricExporter,
);

if (traceExporter) {
	sdkConfig.traceExporter = traceExporter;
}

if (metricsExporter) {
	sdkConfig.metricReaders = [metricsExporter];
}

const sdk = new NodeSDK(sdkConfig);

// Start the SDK and gracefully shut it down on process exit.
sdk.start();

process.on("SIGTERM", () => {
	sdk
		.shutdown()
		.then(() => console.log("Telemetry terminated"))
		.catch((error) => console.log("Error terminating telemetry", error))
		.finally(() => process.exit(0));
});

console.log("OpenTelemetry for Astro initialized.");
