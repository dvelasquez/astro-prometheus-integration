// src/exporters/traces.ts
import { OTLPTraceExporter as GrpcExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPTraceExporter as HttpExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPTraceExporter as ProtoExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
var traceConsoleExporter = new ConsoleSpanExporter();
function getTraceExporter(presets) {
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
export {
  getTraceExporter,
  traceConsoleExporter
};
//# sourceMappingURL=traces.js.map