import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
	ConsoleSpanExporter,
	SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

console.log("Initializing OpenTelemetry for Astro...");

const sdk = new NodeSDK({
	// A Resource describes the entity producing telemetry.
	// We'll make this configurable later.
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: "astro-app",
		[ATTR_SERVICE_VERSION]: "1.0.0",
	}),

	// For Phase 1, we use a simple processor and a console exporter.
	// This means spans are sent to the console as soon as they end.
	spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),

	// Auto-instrumentations automatically patch popular libraries.
	// HttpInstrumentation traces outgoing HTTP requests made by your server.
	instrumentations: [new HttpInstrumentation()],
});

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
