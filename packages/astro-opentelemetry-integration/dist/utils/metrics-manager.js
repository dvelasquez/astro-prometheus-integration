// src/utils/metrics-manager.ts
import { metrics } from "@opentelemetry/api";

// src/utils/getAttributes.ts
var OTEL_SERVICE_NAME = globalThis.__OTEL_OPTIONS__.serviceName || process.env.OTEL_SERVICE_NAME;
var OTEL_SERVICE_VERSION = globalThis.__OTEL_OPTIONS__.serviceVersion || process.env.OTEL_SERVICE_VERSION;

// src/utils/metrics-manager.ts
function shouldCreateMetrics(exporter) {
  switch (exporter) {
    case "prometheus":
    case "http":
    case "grpc":
    case "proto":
      return true;
    case "none":
    default:
      return false;
  }
}
function getMetricsMeter() {
  return metrics.getMeter(
    "astro-opentelemetry-integration-metrics",
    OTEL_SERVICE_VERSION
  );
}
function createMetricsForExporter(exporter) {
  if (!shouldCreateMetrics(exporter)) {
    return {
      httpRequestsTotal: null,
      httpRequestDuration: null,
      httpServerDurationSeconds: null
    };
  }
  const meter = getMetricsMeter();
  switch (exporter) {
    case "prometheus":
      return {
        httpRequestsTotal: meter.createCounter("http_requests_total", {
          description: "Total number of HTTP requests"
        }),
        httpRequestDuration: meter.createHistogram(
          "http_request_duration_seconds",
          {
            description: "Duration in seconds of initial server-side request processing, including middleware and Astro frontmatter, measured until the response is ready to send/stream."
          }
        ),
        httpServerDurationSeconds: meter.createHistogram(
          "http_server_duration_seconds",
          {
            description: "Full server-side HTTP request duration in seconds, including processing, Astro rendering, and response streaming."
          }
        )
      };
    case "http":
    case "grpc":
    case "proto":
      return {
        httpRequestsTotal: null,
        // Skip counter for OTLP (can be derived from histogram)
        httpRequestDuration: meter.createHistogram(
          "http_request_duration_seconds",
          {
            description: "Duration in seconds of initial server-side request processing, including middleware and Astro frontmatter, measured until the response is ready to send/stream."
          }
        ),
        httpServerDurationSeconds: meter.createHistogram(
          "http_server_duration_seconds",
          {
            description: "Full server-side HTTP request duration in seconds, including processing, Astro rendering, and response streaming."
          }
        )
      };
    default:
      return {
        httpRequestsTotal: null,
        httpRequestDuration: null,
        httpServerDurationSeconds: null
      };
  }
}
function getCurrentExporter() {
  return globalThis.__OTEL_PRESETS__?.metricExporter || "none";
}
export {
  createMetricsForExporter,
  getCurrentExporter,
  getMetricsMeter,
  shouldCreateMetrics
};
//# sourceMappingURL=metrics-manager.js.map