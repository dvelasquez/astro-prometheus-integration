// src/utils/error-handling.ts
import { metrics } from "@opentelemetry/api";
function setupMetricsErrorHandling() {
  const meter = metrics.getMeter(
    "astro-opentelemetry-integration-error-handler"
  );
  const exportFailureCounter = meter.createCounter(
    "otel_export_failures_total",
    {
      description: "Total number of OpenTelemetry export failures"
    }
  );
  process.on("unhandledRejection", (reason) => {
    if (reason && typeof reason === "object" && "message" in reason) {
      const errorMessage = reason.message;
      if (errorMessage.includes("OTLP") || errorMessage.includes("export")) {
        console.warn("OpenTelemetry export failed:", errorMessage);
        exportFailureCounter.add(1, {
          error_type: "unhandled_rejection",
          exporter: "unknown"
        });
      }
    }
  });
  process.on("uncaughtException", (error) => {
    if (error.message.includes("OTLP") || error.message.includes("export")) {
      console.warn("OpenTelemetry export failed:", error.message);
      exportFailureCounter.add(1, {
        error_type: "uncaught_exception",
        exporter: "unknown"
      });
    }
  });
  console.log("OpenTelemetry error handling initialized");
}
function isMetricsExportHealthy() {
  try {
    const meterProvider = metrics.getMeterProvider();
    return meterProvider !== void 0;
  } catch (error) {
    console.warn("Metrics export health check failed:", error);
    return false;
  }
}
export {
  isMetricsExportHealthy,
  setupMetricsErrorHandling
};
//# sourceMappingURL=error-handling.js.map