// src/config/sdk-config.ts
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION
} from "@opentelemetry/semantic-conventions";

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

// src/exporters/traces.ts
import { OTLPTraceExporter as GrpcExporter2 } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPTraceExporter as HttpExporter2 } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPTraceExporter as ProtoExporter2 } from "@opentelemetry/exporter-trace-otlp-proto";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
var traceConsoleExporter = new ConsoleSpanExporter();
function getTraceExporter(presets) {
  switch (presets) {
    case "console":
      return traceConsoleExporter;
    case "proto":
      return new ProtoExporter2();
    case "http":
      return new HttpExporter2();
    case "grpc":
      return new GrpcExporter2();
    default:
      return null;
  }
}

// src/utils/getAttributes.ts
var OTEL_SERVICE_NAME = globalThis.__OTEL_OPTIONS__.serviceName || process.env.OTEL_SERVICE_NAME;
var OTEL_SERVICE_VERSION = globalThis.__OTEL_OPTIONS__.serviceVersion || process.env.OTEL_SERVICE_VERSION;

// src/config/sdk-config.ts
function createHttpInstrumentation() {
  return new HttpInstrumentation({
    // Only enable detailed metrics collection when Prometheus is selected
    enabled: true,
    // Configure request/response hooks for better metrics
    requestHook: (span, request) => {
      span.setAttributes({
        "http.request.method": request.method || "UNKNOWN",
        "http.request.url": request.url || ""
      });
    },
    responseHook: (span, response) => {
      span.setAttributes({
        "http.response.status_code": response.statusCode || 0,
        "http.response.status_text": response.statusMessage || ""
      });
    },
    // Configure which HTTP methods to instrument
    ignoreIncomingRequestHook: (req) => {
      const url = req.url || "";
      return url.includes("/health") || url.includes("/ping");
    },
    // Configure outgoing request instrumentation
    ignoreOutgoingRequestHook: (req) => {
      const url = req.url || "";
      return url.includes("/v1/traces") || url.includes("/v1/metrics");
    }
  });
}
function isPrometheusEnabled() {
  return globalThis.__OTEL_PRESETS__?.metricExporter === "prometheus";
}
function buildSDKConfig(presets) {
  const config = {
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: OTEL_SERVICE_VERSION
    }),
    // Use enhanced HTTP instrumentation
    instrumentations: [createHttpInstrumentation()]
  };
  const traceExporter = getTraceExporter(presets?.traceExporter);
  if (traceExporter) {
    config.traceExporter = traceExporter;
  }
  const metricsExporter = getMetricsExporter(presets?.metricExporter);
  if (metricsExporter) {
    config.metricReaders = [metricsExporter];
  }
  if (isPrometheusEnabled() && metricsExporter) {
    console.log(
      "Prometheus metrics enabled - adding comprehensive auto instrumentations"
    );
    config?.instrumentations?.push(
      getNodeAutoInstrumentations({
        // Configure auto instrumentations for better Prometheus metrics
        "@opentelemetry/instrumentation-http": {
          enabled: false
          // We're using our custom HTTP instrumentation above
        },
        "@opentelemetry/instrumentation-fs": {
          enabled: true
        },
        "@opentelemetry/instrumentation-dns": {
          enabled: true
        },
        "@opentelemetry/instrumentation-net": {
          enabled: true
        },
        "@opentelemetry/instrumentation-express": {
          enabled: true
        },
        "@opentelemetry/instrumentation-connect": {
          enabled: true
        }
      })
    );
  } else {
    console.log(
      "Prometheus metrics disabled - using basic HTTP instrumentation only"
    );
  }
  return config;
}
export {
  buildSDKConfig,
  createHttpInstrumentation,
  isPrometheusEnabled
};
//# sourceMappingURL=sdk-config.js.map