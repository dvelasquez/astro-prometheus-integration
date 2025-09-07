import { OTLPMetricExporter as GrpcExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPMetricExporter as HttpExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPMetricExporter as ProtoExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import type { IntegrationSchema } from "../integrationSchema.ts";

const prometheusConfig = globalThis.__OTEL_PRESETS__?.prometheusConfig;

export const metricsProtoExporter = new PeriodicExportingMetricReader({
	exporter: new ProtoExporter({}),
});
export const metricsHttpExporter = new PeriodicExportingMetricReader({
	exporter: new HttpExporter({}),
});
export const metricsGrpcExporter = new PeriodicExportingMetricReader({
	exporter: new GrpcExporter({}),
});
export const metricsPrometheusExporter = new PrometheusExporter({
	...prometheusConfig,
});

type MetricsPresets = NonNullable<
	IntegrationSchema["presets"]
>["metricExporter"];

export function getMetricsExporter(presets: MetricsPresets) {
	switch (presets) {
		case "proto":
			return metricsProtoExporter;
		case "http":
			return metricsHttpExporter;
		case "grpc":
			return metricsGrpcExporter;
		case "prometheus": {
			return metricsPrometheusExporter;
		}
		case "none":
			return null;
		default:
			return null;
	}
}
