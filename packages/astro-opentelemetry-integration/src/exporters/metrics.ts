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

// Global variable to track if host metrics have been initialized
let hostMetricsInitialized = false;

type MetricsPresets = NonNullable<
	IntegrationSchema["presets"]
>["metricExporter"];

/**
 * Get metrics exporter with proper configuration based on OpenTelemetry best practices
 * Uses OTEL_ environment variables automatically handled by the SDK
 */
export function getMetricsExporter(presets: MetricsPresets) {
	switch (presets) {
		case "proto":
			return new PeriodicExportingMetricReader({
				exporter: new ProtoExporter(),
			});

		case "http":
			return new PeriodicExportingMetricReader({
				exporter: new HttpExporter(),
			});

		case "grpc":
			return new PeriodicExportingMetricReader({
				exporter: new GrpcExporter(),
			});

		case "prometheus":
			return new PrometheusExporter({
				port: Number.parseInt(
					process.env.OTEL_PROMETHEUS_PORT ||
						prometheusConfig?.port?.toString() ||
						"9464",
					10,
				),
				endpoint:
					process.env.OTEL_PROMETHEUS_ENDPOINT ||
					prometheusConfig?.endpoint ||
					"/metrics",
				host:
					process.env.OTEL_PROMETHEUS_HOST ||
					prometheusConfig?.host ||
					"0.0.0.0",
				prefix:
					process.env.OTEL_PROMETHEUS_PREFIX ||
					prometheusConfig?.prefix ||
					"metrics",
				appendTimestamp:
					process.env.OTEL_PROMETHEUS_APPEND_TIMESTAMP === "true" ||
					(prometheusConfig?.appendTimestamp ?? true),
				withResourceConstantLabels:
					process.env.OTEL_PROMETHEUS_RESOURCE_LABELS ||
					prometheusConfig?.withResourceConstantLabels ||
					"/service/",
			});

		case "none":
			return null;

		default:
			return null;
	}
}

/**
 * Initialize host metrics for all exporters (not just Prometheus)
 * This follows OpenTelemetry best practices for comprehensive observability
 */
export function initializeHostMetrics(meterProvider: MeterProvider) {
	if (!hostMetricsInitialized) {
		const hostMetrics = new HostMetrics({
			meterProvider,
			name: "astro-host-metrics",
		});
		hostMetrics.start();
		hostMetricsInitialized = true;
		console.log("Host metrics initialized for Astro");
	}
}
