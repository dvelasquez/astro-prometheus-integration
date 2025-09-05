// src/exporters/metrics.ts
import { OTLPMetricExporter as GrpcExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPMetricExporter as HttpExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPMetricExporter as ProtoExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { HostMetrics } from "@opentelemetry/host-metrics";
import {
  PeriodicExportingMetricReader
} from "@opentelemetry/sdk-metrics";
var prometheusConfig = globalThis.__OTEL_PRESETS__?.prometheusConfig;
var hostMetricsInitialized = false;
function getMetricsExporter(presets) {
  switch (presets) {
    case "proto":
      return new PeriodicExportingMetricReader({
        exporter: new ProtoExporter()
      });
    case "http":
      return new PeriodicExportingMetricReader({
        exporter: new HttpExporter()
      });
    case "grpc":
      return new PeriodicExportingMetricReader({
        exporter: new GrpcExporter()
      });
    case "prometheus":
      return new PrometheusExporter({
        port: Number.parseInt(
          process.env.OTEL_PROMETHEUS_PORT || prometheusConfig?.port?.toString() || "9464",
          10
        ),
        endpoint: process.env.OTEL_PROMETHEUS_ENDPOINT || prometheusConfig?.endpoint || "/metrics",
        host: process.env.OTEL_PROMETHEUS_HOST || prometheusConfig?.host || "0.0.0.0",
        prefix: process.env.OTEL_PROMETHEUS_PREFIX || prometheusConfig?.prefix || "metrics",
        appendTimestamp: process.env.OTEL_PROMETHEUS_APPEND_TIMESTAMP === "true" || (prometheusConfig?.appendTimestamp ?? true),
        withResourceConstantLabels: process.env.OTEL_PROMETHEUS_RESOURCE_LABELS || prometheusConfig?.withResourceConstantLabels || "/service/"
      });
    case "none":
      return null;
    default:
      return null;
  }
}
function initializeHostMetrics(meterProvider) {
  if (!hostMetricsInitialized) {
    const hostMetrics = new HostMetrics({
      meterProvider,
      name: "astro-host-metrics"
    });
    hostMetrics.start();
    hostMetricsInitialized = true;
    console.log("Host metrics initialized for Astro");
  }
}
export {
  getMetricsExporter,
  initializeHostMetrics
};
//# sourceMappingURL=metrics.js.map