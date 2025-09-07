import { OTLPTraceExporter as GrpcExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPTraceExporter as HttpExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPTraceExporter as ProtoExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import type { IntegrationSchema } from "../integrationSchema.ts";

export const traceConsoleExporter = new ConsoleSpanExporter();
export const traceProtoExporter = new ProtoExporter({});
export const traceHttpExporter = new HttpExporter({});
export const traceGrpcExporter = new GrpcExporter({});

type TracePresets = NonNullable<IntegrationSchema["presets"]>["traceExporter"];

export function getTraceExporter(presets: TracePresets) {
	switch (presets) {
		case "console":
			return traceConsoleExporter;
		case "proto":
			return traceProtoExporter;
		case "http":
			return traceHttpExporter;
		case "grpc":
			return traceGrpcExporter;
		default:
			return null;
	}
}
