# Astro OpenTelemetry Integration

[![npm version](https://img.shields.io/npm/v/astro-opentelemetry-integration.svg)](https://www.npmjs.com/package/astro-opentelemetry-integration)

An [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) that provides comprehensive [OpenTelemetry](https://opentelemetry.io/) observability for your Astro site running on Node.js. This integration automatically instruments your application with metrics, traces, and logs, supporting multiple exporters including Prometheus, OTLP (HTTP/gRPC), and console output.

---

## Features

- **Automatic HTTP instrumentation**: Tracks request count, duration, and server response metrics
- **Multiple exporter support**: Prometheus, OTLP (HTTP/gRPC/Proto), and console exporters
- **Comprehensive metrics**: HTTP requests, durations, and host-level system metrics
- **Distributed tracing**: Full request tracing with automatic span creation
- **Flexible configuration**: Environment variables and programmatic configuration
- **Zero-config defaults**: Works out of the box with sensible defaults
- **Auto-instrumentation**: Automatic Node.js instrumentation for comprehensive observability

---

## Requirements

- This integration currently requires the `@astrojs/node` adapter. OpenTelemetry metrics and traces require a persistent Node.js server process to aggregate and export telemetry data.
- **Not supported:** Serverless adapters (such as Vercel, Netlify, Cloudflare, etc.) are not compatible with this integration. In serverless environments, each request runs in isolation, so telemetry cannot be aggregated across requests.

> **Note:** If you deploy to a serverless platform, telemetry will not be accurate or useful, as each request is handled by a separate, stateless server instance.

### Future Support

Future versions of this integration will add support for:
- **Deno adapter**: Full OpenTelemetry support for Deno-based Astro applications
- **Serverless environments**: Optimized telemetry collection for serverless deployments

---

## Installation

### Automatic (Recommended)

```bash
pnpm astro add astro-opentelemetry-integration @astrojs/node
# or
npx astro add astro-opentelemetry-integration @astrojs/node
# or
yarn astro add astro-opentelemetry-integration @astrojs/node
```

### Manual

1. Install the packages:

```bash
pnpm add astro-opentelemetry-integration @astrojs/node
# or
npm install astro-opentelemetry-integration @astrojs/node
# or
yarn add astro-opentelemetry-integration @astrojs/node
```

2. Add the integration to your `astro.config.mjs` or `astro.config.mts`:

```js
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import otelIntegration from "astro-opentelemetry-integration";

export default defineConfig({
  integrations: [
    otelIntegration(),
  ],
  adapter: node({
    mode: "standalone",
  }),
});
```

---

## Usage

### Prerequisite

Configure the SDK to send metrics to your collector with the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable.

```bash
OTEL_EXPORTER_OTLP_ENDPOINT="http://your-collector.example.com:4317" node ./dist/server/entry.mjs"
```

or in your package.json
```json
"scripts": {
  "dev": "OTEL_EXPORTER_OTLP_ENDPOINT=\"http://your-collector.example.com:4317\" astro dev",
}
```

More information https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/

### Minimal Example

```js
// astro.config.mjs or astro.config.mts
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import otelIntegration from "astro-opentelemetry-integration";

export default defineConfig({
  integrations: [
    otelIntegration(),
  ],
  adapter: node({
    mode: "standalone",
  }),
});
```

### Advanced Example

```js
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import otelIntegration from "astro-opentelemetry-integration";

export default defineConfig({
  integrations: [
    otelIntegration({
      enabled: true, // Enable/disable integration
      otel: {
        serviceName: "my-astro-app",
        serviceVersion: "1.0.0",
      },
      presets: {
        metricExporter: "prometheus", // or "http", "grpc", "proto", "none"
        traceExporter: "http", // or "grpc", "proto", "console"
        prometheusConfig: {
          host: "0.0.0.0",
          port: 9464,
          endpoint: "/metrics",
          prefix: "myapp_",
          appendTimestamp: true,
          withResourceConstantLabels: "/service/",
        },
      },
    }),
  ],
  adapter: node({
    mode: "standalone",
  }),
});
```

---

## Default Configuration

When you set up the integration with an empty configuration (`otelIntegration()`), it uses these defaults:

```js
{
  enabled: true,
  otel: {
    serviceName: "unknown_service",
    serviceVersion: "unknown_version"
  },
  presets: {
    metricExporter: "none",        // No metrics exported by default
    traceExporter: "console",      // Traces output to console
    prometheusConfig: {
      host: "0.0.0.0",
      port: 9464,
      endpoint: "/metrics",
      prefix: "metrics",
      appendTimestamp: true,
      withResourceConstantLabels: "/service/"
    }
  }
}
```

This means:
- **Metrics**: Disabled by default (no metrics collection)
- **Traces**: Enabled with console output (visible in your terminal)
- **Service Info**: Uses generic service name and version
- **Prometheus**: Ready to use but not active until `metricExporter: "prometheus"` is set

To enable metrics collection, you need to explicitly configure an exporter:

```js
otelIntegration({
  presets: {
    metricExporter: "prometheus"  // Enable Prometheus metrics
  }
})
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable or disable the integration. Useful for disabling in development. |
| `otel` | object | `{}` | OpenTelemetry service configuration. |
| `presets` | object | `{}` | Exporter and instrumentation presets. |

### `otel` Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serviceName` | string | `"unknown_service"` | The name of the service for telemetry identification. |
| `serviceVersion` | string | `"unknown_version"` | The version of the service. |

### `presets` Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `metricExporter` | string | `"none"` | The metric exporter to use. Options: `"prometheus"`, `"http"`, `"grpc"`, `"proto"`, `"none"`. |
| `traceExporter` | string | `"console"` | The trace exporter to use. Options: `"http"`, `"grpc"`, `"proto"`, `"console"`. |
| `prometheusConfig` | object | `{}` | Configuration for the Prometheus exporter. |

### `prometheusConfig` Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | string | `"0.0.0.0"` | The host to listen on for the Prometheus metrics server. |
| `port` | number | `9464` | The port to listen on for the Prometheus metrics server. |
| `endpoint` | string | `"/metrics"` | The endpoint path for metrics exposure. |
| `prefix` | string | `"metrics"` | The prefix to use for all metric names. |
| `appendTimestamp` | boolean | `true` | Whether to append timestamps to metrics. |
| `withResourceConstantLabels` | string | `"/service/"` | Regular expression for resource constant labels. |

---

## Environment Variables

You can configure the integration using environment variables instead of or in addition to the configuration object. This integration supports both custom environment variables and standard OpenTelemetry environment variables.

### Integration-Specific Variables

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `OTEL_SERVICE_NAME` | Service name for telemetry | `"unknown_service"` |
| `OTEL_SERVICE_VERSION` | Service version | `"unknown_version"` |
| `OTEL_PROMETHEUS_PORT` | Prometheus exporter port | `9464` |
| `OTEL_PROMETHEUS_ENDPOINT` | Prometheus metrics endpoint | `"/metrics"` |
| `OTEL_PROMETHEUS_HOST` | Prometheus exporter host | `"0.0.0.0"` |
| `OTEL_PROMETHEUS_PREFIX` | Prometheus metrics prefix | `"metrics"` |
| `OTEL_PROMETHEUS_APPEND_TIMESTAMP` | Append timestamp to metrics | `"true"` |
| `OTEL_PROMETHEUS_RESOURCE_LABELS` | Resource constant labels regex | `"/service/"` |

### Standard OpenTelemetry Variables

The integration also supports standard OpenTelemetry environment variables:

#### General Configuration
| Environment Variable | Description | Default | Example |
|---------------------|-------------|---------|---------|
| `OTEL_RESOURCE_ATTRIBUTES` | Key-value pairs as resource attributes | - | `"key1=value1,key2=value2"` |

#### Tracing Configuration
| Environment Variable | Description | Default | Accepted Values |
|---------------------|-------------|---------|-----------------|
| `OTEL_TRACES_SAMPLER` | Sampler used to sample traces | `"parentbased_always_on"` | `"always_on"`, `"always_off"`, `"traceidratio"`, `"parentbased_always_on"`, `"parentbased_always_off"`, `"parentbased_traceidratio"` |
| `OTEL_TRACES_SAMPLER_ARG` | Arguments for the sampler (e.g., sampling rate) | - | `"0.1"` (for traceidratio) |
| `OTEL_PROPAGATORS` | Propagators to be used (comma-separated) | `"tracecontext,baggage"` | `"tracecontext"`, `"baggage"`, `"b3"`, `"b3multi"`, `"jaeger"`, `"xray"`, `"ottrace"`, `"none"` |

#### OTLP Endpoint Configuration
| Environment Variable | Description | Default | Example |
|---------------------|-------------|---------|---------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | General OTLP endpoint for both traces and metrics | `"http://localhost:4317"` (gRPC), `"http://localhost:4318"` (HTTP) | `"https://api.honeycomb.io:443"` |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | Specific endpoint for trace data | `"http://localhost:4317"` (gRPC), `"http://localhost:4318/v1/traces"` (HTTP) | `"https://api.honeycomb.io:443/v1/traces"` |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | Specific endpoint for metric data | `"http://localhost:4317"` (gRPC), `"http://localhost:4318/v1/metrics"` (HTTP) | `"https://api.honeycomb.io:443/v1/metrics"` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | Protocol to use for OTLP export | `"grpc"` | `"http/protobuf"`, `"grpc"` |

#### Metrics Configuration
| Environment Variable | Description | Default | Accepted Values |
|---------------------|-------------|---------|-----------------|
| `OTEL_METRICS_EXEMPLAR_FILTER` | Determines which measurements can become exemplars | `"trace_based"` | `"always_on"`, `"always_off"`, `"trace_based"` |
| `OTEL_METRIC_EXPORT_INTERVAL` | Time interval (ms) between export attempts | `60000` | `"30000"` |
| `OTEL_METRIC_EXPORT_TIMEOUT` | Maximum time (ms) to export data | `30000` | `"15000"` |

#### Advanced Configuration
| Environment Variable | Description | Example |
|---------------------|-------------|---------|
| `OTEL_EXPERIMENTAL_CONFIG_FILE` | Path to configuration file | `"/path/to/config.yaml"` |

For more details, see the [OpenTelemetry Environment Variable Specification](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/).

---

## Metrics Provided

The integration provides the following OpenTelemetry metrics:

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `http_requests_total` | Counter | `method`, `path`, `status` | Total number of HTTP requests received. |
| `http_request_duration` | Histogram | `method`, `path`, `status` | Duration of server-side request processing. |
| `http_server_duration_seconds` | Histogram | `method`, `path`, `status` | Full server-side HTTP request duration (TTLB). |

### Host Metrics

When using Prometheus exporter, the integration also provides comprehensive host-level metrics:

- **CPU metrics**: Usage, load averages, and core counts
- **Memory metrics**: Usage, available, and swap information
- **Disk metrics**: Read/write operations and space usage
- **Network metrics**: Interface statistics and connection counts
- **Process metrics**: Memory usage, file descriptors, and uptime

---

## Exporter Types

### Prometheus Exporter

Exposes metrics in Prometheus format on a dedicated HTTP server:

```js
otelIntegration({
  presets: {
    metricExporter: "prometheus",
    prometheusConfig: {
      port: 9464,
      endpoint: "/metrics",
    },
  },
})
```

**Access metrics at:** `http://localhost:9464/metrics`

### OTLP Exporters

Send telemetry data to OpenTelemetry collectors or backends:

#### HTTP Exporter
```js
otelIntegration({
  presets: {
    metricExporter: "http",
    traceExporter: "http",
  },
})
```

**Environment variables:**
```bash
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
# Or specify separate endpoints:
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://localhost:4318/v1/traces"
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT="http://localhost:4318/v1/metrics"
```

#### gRPC Exporter
```js
otelIntegration({
  presets: {
    metricExporter: "grpc",
    traceExporter: "grpc",
  },
})
```

**Environment variables:**
```bash
export OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
# Or specify separate endpoints:
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://localhost:4317"
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT="http://localhost:4317"
```

#### Proto Exporter
```js
otelIntegration({
  presets: {
    metricExporter: "proto",
    traceExporter: "proto",
  },
})
```

**Environment variables:**
```bash
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
export OTEL_EXPORTER_OTLP_ENDPOINT="https://api.honeycomb.io:443"
```

### Console Exporter

Output telemetry data to the console (useful for development):

```js
otelIntegration({
  presets: {
    traceExporter: "console",
  },
})
```

---

## Tracing

The integration automatically creates traces for HTTP requests with the following features:

- **Automatic span creation**: Each request gets a root span
- **Nested spans**: Automatic instrumentation creates child spans for various operations
- **Custom attributes**: Request method, URL, status code, and response details
- **Error tracking**: Exceptions are automatically recorded in spans
- **Performance timing**: Request duration and TTLB measurements

### Trace Attributes

Each span includes these attributes:

- `http.request.method`: HTTP method (GET, POST, etc.)
- `http.request.url`: Full request URL
- `http.response.status_code`: HTTP status code
- `http.response.status_text`: HTTP status text
- `service.name`: Service name from configuration
- `service.version`: Service version from configuration

---

## Auto-Instrumentation

When using Prometheus metrics, the integration automatically enables comprehensive Node.js auto-instrumentation:

- **HTTP/HTTPS**: Request/response instrumentation
- **File System**: File operations monitoring
- **DNS**: DNS resolution tracking
- **Network**: Socket and connection monitoring
- **Express**: Express.js middleware instrumentation
- **Connect**: Connect middleware instrumentation

This provides deep observability into your application's behavior without additional configuration.

---

## Development vs Production

### Development Mode

In development (`astro dev`), the integration:
- Automatically imports the OpenTelemetry SDK
- Uses console exporter for traces by default
- Provides detailed logging for debugging

### Production Mode

In production (`astro build`), the integration:
- Prepends the OpenTelemetry SDK to your built application
- Uses configured exporters for telemetry export
- Optimizes for performance and minimal overhead

---

## Contributing

This project is a monorepo:
- `playgrounds/`: Example Astro apps for testing the integration
- `packages/astro-opentelemetry-integration/`: The integration source code

### Setup

```bash
pnpm install --frozen-lockfile
pnpm otel-integration:dev
pnpm playground:dev
```

- Edit files in `packages/astro-opentelemetry-integration/`
- The playground will reload on changes

---

## License

[MIT Licensed](https://github.com/dvelasquez/astro-prometheus-integration/blob/main/LICENSE). Made with ❤️ by [Danilo Velasquez](https://d13z.dev/).

## Acknowledgements

- Built with [astro-integration-template](https://github.com/florian-lefebvre/astro-integration-template)
- Uses [OpenTelemetry](https://opentelemetry.io/docs/languages/js/) for comprehensive observability
- Inspired by the [OpenTelemetry Node.js SDK](https://github.com/open-telemetry/opentelemetry-js)