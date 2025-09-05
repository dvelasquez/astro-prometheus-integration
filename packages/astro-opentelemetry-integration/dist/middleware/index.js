// src/middleware/index.ts
import { SpanStatusCode, trace } from "@opentelemetry/api";
import {
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_HTTP_ROUTE,
  ATTR_NETWORK_LOCAL_ADDRESS,
  ATTR_URL_FULL,
  ATTR_URL_PATH,
  ATTR_URL_SCHEME
} from "@opentelemetry/semantic-conventions";

// src/utils/getAttributes.ts
var OTEL_SERVICE_NAME = globalThis.__OTEL_OPTIONS__.serviceName || process.env.OTEL_SERVICE_NAME;
var OTEL_SERVICE_VERSION = globalThis.__OTEL_OPTIONS__.serviceVersion || process.env.OTEL_SERVICE_VERSION;

// src/utils/metrics-manager.ts
import { metrics } from "@opentelemetry/api";
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

// src/middleware/timing-utils.ts
function measureTTLBWithStreamWrapping(response, options) {
  const { startTime, labels, histogram } = options;
  if (response.body instanceof ReadableStream) {
    const originalBody = response.body;
    const wrappedBody = new ReadableStream({
      start(controller) {
        const reader = originalBody.getReader();
        function pump() {
          return reader.read().then((result) => {
            if (result.done) {
              const duration = (performance.now() - startTime) / 1e3;
              histogram.record(duration, labels);
              controller.close();
              return;
            }
            controller.enqueue(result.value);
            return pump();
          });
        }
        return pump();
      }
    });
    return new Response(wrappedBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
  return response;
}
function measureTTLBWithAsyncTiming(response, options) {
  const { startTime, labels, histogram } = options;
  if (response.body instanceof ReadableStream) {
    const clonedResponse = response.clone();
    setImmediate(async () => {
      try {
        const reader = clonedResponse.body?.getReader();
        if (!reader) return;
        while (true) {
          const { done } = await reader.read();
          if (done) {
            const duration = (performance.now() - startTime) / 1e3;
            const roundedDuration = Math.round(duration * 1e3) / 1e3;
            histogram.record(roundedDuration, labels);
            break;
          }
        }
      } catch {
      }
    });
    return response;
  }
  return response;
}

// src/middleware/index.ts
var tracer = trace.getTracer(
  "astro-opentelemetry-integration-request-tracer",
  OTEL_SERVICE_VERSION
);
var currentExporter = getCurrentExporter();
var metricsInstruments = createMetricsForExporter(currentExporter);
var { httpRequestsTotal, httpRequestDuration, httpServerDurationSeconds } = metricsInstruments;
async function onRequest(ctx, next) {
  const { request, url } = ctx;
  const spanName = `HTTP ${request.method} ${url.pathname}`;
  const startTime = performance.now();
  const path = url.pathname || "/";
  return tracer.startActiveSpan(spanName, async (span) => {
    span.setAttributes({
      [ATTR_HTTP_REQUEST_METHOD]: request.method,
      [ATTR_URL_SCHEME]: url.protocol.replace(":", ""),
      [ATTR_NETWORK_LOCAL_ADDRESS]: url.hostname,
      [ATTR_URL_PATH]: url.pathname,
      // Note: Astro doesn't provide route pattern in APIContext, using pathname instead
      [ATTR_HTTP_ROUTE]: url.pathname,
      [ATTR_URL_FULL]: url.toString()
    });
    try {
      const response = await next();
      span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, response.status);
      if (response.status >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP error ${response.status}`
        });
      }
      const duration = (performance.now() - startTime) / 1e3;
      const labels = {
        method: request.method,
        path,
        status: response.status.toString()
      };
      if (httpRequestDuration) {
        httpRequestDuration.record(duration, labels);
      }
      if (httpRequestsTotal) {
        httpRequestsTotal.add(1, labels);
      }
      if (response.body instanceof ReadableStream && httpServerDurationSeconds) {
        const timingOptions = {
          startTime,
          labels,
          histogram: httpServerDurationSeconds
        };
        const useOptimized = globalThis.__OTEL_PRESETS__?.experimental?.useOptimizedTTLBMeasurement;
        if (useOptimized) {
          return measureTTLBWithAsyncTiming(response, timingOptions);
        }
        return measureTTLBWithStreamWrapping(response, timingOptions);
      }
      if (httpServerDurationSeconds) {
        httpServerDurationSeconds.record(duration, labels);
      }
      return response;
    } catch (error) {
      const duration = (performance.now() - startTime) / 1e3;
      const errorLabels = {
        method: request.method,
        path,
        status: "500"
      };
      if (httpRequestDuration) {
        httpRequestDuration.record(duration, errorLabels);
      }
      if (httpRequestsTotal) {
        httpRequestsTotal.add(1, errorLabels);
      }
      if (httpServerDurationSeconds) {
        httpServerDurationSeconds.record(duration, errorLabels);
      }
      if (error instanceof Error) {
        span.recordException(error);
      }
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error?.message
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
export {
  onRequest
};
//# sourceMappingURL=index.js.map