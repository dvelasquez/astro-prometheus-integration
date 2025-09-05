var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

// src/exporters/metrics.ts
import { OTLPMetricExporter as GrpcExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPMetricExporter as HttpExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPMetricExporter as ProtoExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { HostMetrics } from "@opentelemetry/host-metrics";
import {
  PeriodicExportingMetricReader
} from "@opentelemetry/sdk-metrics";
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
var prometheusConfig, hostMetricsInitialized;
var init_metrics = __esm({
  "src/exporters/metrics.ts"() {
    "use strict";
    prometheusConfig = globalThis.__OTEL_PRESETS__?.prometheusConfig;
    hostMetricsInitialized = false;
  }
});

// src/exporters/traces.ts
import { OTLPTraceExporter as GrpcExporter2 } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPTraceExporter as HttpExporter2 } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPTraceExporter as ProtoExporter2 } from "@opentelemetry/exporter-trace-otlp-proto";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
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
var traceConsoleExporter;
var init_traces = __esm({
  "src/exporters/traces.ts"() {
    "use strict";
    traceConsoleExporter = new ConsoleSpanExporter();
  }
});

// src/utils/getAttributes.ts
var OTEL_SERVICE_NAME, OTEL_SERVICE_VERSION;
var init_getAttributes = __esm({
  "src/utils/getAttributes.ts"() {
    "use strict";
    OTEL_SERVICE_NAME = globalThis.__OTEL_OPTIONS__.serviceName || process.env.OTEL_SERVICE_NAME;
    OTEL_SERVICE_VERSION = globalThis.__OTEL_OPTIONS__.serviceVersion || process.env.OTEL_SERVICE_VERSION;
  }
});

// src/config/sdk-config.ts
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION
} from "@opentelemetry/semantic-conventions";
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
var init_sdk_config = __esm({
  "src/config/sdk-config.ts"() {
    "use strict";
    init_metrics();
    init_traces();
    init_getAttributes();
  }
});

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
var init_error_handling = __esm({
  "src/utils/error-handling.ts"() {
    "use strict";
  }
});

// src/utils/global-state.ts
function isSDKInitialized() {
  return globalThis.__OTEL_SDK_INITIALIZED__ === true;
}
function isSDKInitializing() {
  return globalThis.__OTEL_SDK_INITIALIZING__ === true;
}
function setSDKInitializing(initializing) {
  globalThis.__OTEL_SDK_INITIALIZING__ = initializing;
}
function setSDKInitialized(initialized) {
  globalThis.__OTEL_SDK_INITIALIZED__ = initialized;
}
function getSDKPromise() {
  return globalThis.__OTEL_SDK_PROMISE__;
}
function setSDKPromise(promise) {
  globalThis.__OTEL_SDK_PROMISE__ = promise;
}
function isHostMetricsInitialized() {
  return globalThis.__OTEL_HOST_METRICS_INITIALIZED__ === true;
}
function setHostMetricsInitialized(initialized) {
  globalThis.__OTEL_HOST_METRICS_INITIALIZED__ = initialized;
}
function isShutdownHandlerSet() {
  return globalThis.__OTEL_SHUTDOWN_HANDLER_SET__ === true;
}
function setShutdownHandlerSet(set) {
  globalThis.__OTEL_SHUTDOWN_HANDLER_SET__ = set;
}
function getGlobalSDK() {
  return globalThis.__OTEL_SDK__;
}
function setGlobalSDK(sdk) {
  globalThis.__OTEL_SDK__ = sdk;
}
var init_global_state = __esm({
  "src/utils/global-state.ts"() {
    "use strict";
  }
});

// src/sdk.ts
var sdk_exports = {};
import { metrics as metrics2 } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
async function initializeHostMetricsSafely() {
  if (isHostMetricsInitialized()) {
    console.log("Host metrics already initialized");
    return;
  }
  console.log("Initializing host metrics for Prometheus");
  const meterProvider = metrics2.getMeterProvider();
  if (meterProvider) {
    initializeHostMetrics(meterProvider);
    setHostMetricsInitialized(true);
  }
}
function setupGracefulShutdown(sdk) {
  if (isShutdownHandlerSet()) {
    return;
  }
  process.on("SIGTERM", () => {
    sdk.shutdown().then(() => console.log("Telemetry terminated")).catch((error) => console.log("Error terminating telemetry", error)).finally(() => process.exit(0));
  });
  setShutdownHandlerSet(true);
}
async function initializeSDKSafely() {
  if (isSDKInitialized()) {
    console.log("OpenTelemetry SDK already initialized, skipping...");
    return;
  }
  if (isSDKInitializing()) {
    console.log("OpenTelemetry SDK is initializing, waiting...");
    const existingPromise = getSDKPromise();
    if (existingPromise) {
      return existingPromise;
    }
  }
  setSDKInitializing(true);
  const initPromise = (async () => {
    try {
      console.log("Initializing OpenTelemetry for Astro...");
      if (getGlobalSDK()) {
        console.log(
          "OpenTelemetry SDK already exists globally, skipping initialization"
        );
        return;
      }
      const config = buildSDKConfig(globalThis.__OTEL_PRESETS__);
      const sdk = new NodeSDK(config);
      sdk.start();
      setGlobalSDK(sdk);
      await initializeHostMetricsSafely();
      setupMetricsErrorHandling();
      setupGracefulShutdown(sdk);
      setSDKInitialized(true);
      console.log("OpenTelemetry for Astro initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize OpenTelemetry SDK:", error);
      throw error;
    } finally {
      setSDKInitializing(false);
    }
  })();
  setSDKPromise(initPromise);
  return initPromise;
}
var init_sdk = __esm({
  "src/sdk.ts"() {
    "use strict";
    init_sdk_config();
    init_metrics();
    init_error_handling();
    init_global_state();
    initializeSDKSafely().catch(console.error);
  }
});

// src/integration.ts
import { defineIntegration } from "astro-integration-kit";

// src/integrationSchema.ts
import { z } from "astro/zod";
var integrationSchema = z.object({
  enabled: z.boolean().default(true).describe(
    "Enable the integration. You might want to disable it in dev mode."
  ),
  otel: z.object({
    serviceName: z.string().default("unknown_service").describe("The name of the service."),
    serviceVersion: z.string().default("unknown_version").describe("The version of the service.")
  }).default({}),
  presets: z.object({
    metricExporter: z.enum(["proto", "http", "grpc", "prometheus", "none"]).default("none").describe("The metric exporter to use.").optional(),
    traceExporter: z.enum(["proto", "http", "grpc", "console"]).default("console").describe("The trace exporter to use.").optional(),
    prometheusConfig: z.object({
      host: z.string().default("0.0.0.0").describe("The host to listen on.").optional(),
      port: z.number().default(9464).describe("The port to listen on.").optional(),
      endpoint: z.string().default("/metrics").describe("The endpoint to use for the metrics.").optional(),
      prefix: z.string().default("metrics").describe("The prefix to use for the metrics.").optional(),
      appendTimestamp: z.boolean().default(true).describe("Whether to append the timestamp to the metrics.").optional(),
      withResourceConstantLabels: z.string().describe(
        "The regular expression to match the resource constant labels."
      ).optional().default("/service/")
    }).describe(
      "The configuration for the Prometheus exporter, more info here https://www.npmjs.com/package/@opentelemetry/exporter-prometheus."
    ).optional()
  }).optional()
}).default({});

// src/utils/constants.ts
var ALLOWED_ADAPTERS = ["@astrojs/node"];
var INTEGRATION_NAME = "astro-opentelemetry-integration";

// src/integration.ts
var integration = defineIntegration({
  name: INTEGRATION_NAME,
  optionsSchema: integrationSchema,
  setup({ options }) {
    if (!options.enabled) {
      return {
        hooks: {}
      };
    }
    globalThis.__OTEL_OPTIONS__ = options.otel;
    globalThis.__OTEL_PRESETS__ = options.presets;
    return {
      hooks: {
        "astro:config:setup": ({
          addMiddleware,
          logger,
          updateConfig,
          config,
          command
        }) => {
          logger.info("setting up integration");
          if (!config.adapter || !ALLOWED_ADAPTERS.includes(config.adapter.name)) {
            throw new Error(
              `${INTEGRATION_NAME} currently only works with one of the following adapters: ${ALLOWED_ADAPTERS.join(", ")}`
            );
          }
          if (command === "dev") {
            logger.info(
              `prepending ${INTEGRATION_NAME} OpenTelemetry SDK to dev mode`
            );
            Promise.resolve().then(() => init_sdk());
          }
          const serverEntry = config.build.serverEntry;
          updateConfig({
            vite: {
              plugins: [
                {
                  name: `${INTEGRATION_NAME}-sdk-prepend`,
                  enforce: "pre",
                  generateBundle(_options, bundle) {
                    const entryFileName = serverEntry || "entry.mjs";
                    for (const [fileName, chunk] of Object.entries(bundle)) {
                      if (fileName === entryFileName && chunk.type === "chunk") {
                        logger.info(
                          `Prepending ${INTEGRATION_NAME} OpenTelemetry SDK to output file: ${fileName}`
                        );
                        chunk.code = `import 'astro-opentelemetry-integration/sdk';
${chunk.code}`;
                        break;
                      }
                    }
                  }
                }
              ]
            }
          });
          addMiddleware({
            order: "pre",
            entrypoint: new URL("./middleware/index.js", import.meta.url)
          });
          logger.info("integration setup complete");
        }
      }
    };
  }
});
export {
  integration
};
//# sourceMappingURL=integration.js.map