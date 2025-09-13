import { OTLPTraceExporter as GrpcExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPTraceExporter as HttpExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPTraceExporter as ProtoExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import type { IntegrationSchema } from "../integrationSchema.ts";

export const traceConsoleExporter = new ConsoleSpanExporter();

type TracePresets = NonNullable<IntegrationSchema["presets"]>["traceExporter"];

/**
 * Get trace exporter with proper configuration based on OpenTelemetry best practices
 * Uses OTEL_ environment variables automatically handled by the SDK
 */
export function getTraceExporter(presets: TracePresets) {
	switch (presets) {
		case "console":
			return traceConsoleExporter;
		case "proto":
			return new ProtoExporter();
		case "http":
			return new HttpExporter();
		case "grpc":
			return new GrpcExporter();
		default:
			return null;
	}
}
