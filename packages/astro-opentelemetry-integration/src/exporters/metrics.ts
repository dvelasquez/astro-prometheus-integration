import { OTLPMetricExporter as GrpcExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPMetricExporter as HttpExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPMetricExporter as ProtoExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { HostMetrics } from "@opentelemetry/host-metrics";
import {
	type MeterProvider,
	PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
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

// Create PrometheusExporter instance
export const metricsPrometheusExporter = new PrometheusExporter({
	...prometheusConfig,
});

// Global variable to track if host metrics have been initialized
let hostMetricsInitialized = false;

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
		case "prometheus":
			return metricsPrometheusExporter;
		case "none":
			return null;
		default:
			return null;
	}
}

// Function to initialize host metrics after the MeterProvider is created
export function initializeHostMetrics(meterProvider: MeterProvider) {
	if (
		!hostMetricsInitialized &&
		globalThis.__OTEL_PRESETS__?.metricExporter === "prometheus"
	) {
		const hostMetrics = new HostMetrics({
			meterProvider,
			name: "astro-host-metrics",
		});
		hostMetrics.start();
		hostMetricsInitialized = true;
		console.log("Host metrics initialized for Astro");
	}
}
