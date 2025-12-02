# Astro Prometheus Node Integration

[![npm version](https://img.shields.io/npm/v/astro-prometheus-node-integration.svg)](https://www.npmjs.com/package/astro-prometheus-node-integration)

An [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) that exposes [Prometheus](https://prometheus.io/) metrics for your Astro site running on Node.js. This integration provides out-of-the-box HTTP request metrics, including request counts and durations, and exposes them at a configurable endpoint for scraping by Prometheus.

---

## Features

- **Automatic HTTP metrics**: Tracks request count, request duration, and server response duration.
- **Outbound HTTP instrumentation**: Optionally capture latency and error metrics for all server-side HTTP/fetch calls.
- **Customizable endpoint**: Expose metrics at any URL (default: `/metrics`).
- **Prometheus/OpenMetrics support**: Choose the content type for your metrics endpoint.
- **Custom labels and prefix**: Add global labels and prefix all metrics for multi-service setups.
- **Zero-config defaults**: Works out of the box, but fully configurable.

---

## Requirements

- This integration requires the `@astrojs/node` adapter. Prometheus metrics require a persistent Node.js server process to aggregate and expose metrics.
- **Not supported:** Serverless adapters (such as Vercel, Netlify, Cloudflare, etc.) are not compatible with this integration. In serverless environments, each request runs in isolation, so metrics cannot be aggregated across requests.

> **Note:** If you deploy to a serverless platform, metrics will not be accurate or useful, as each request is handled by a separate, stateless server instance.

---

## Installation

### Automatic (Recommended)

```bash
pnpm astro add astro-prometheus-node-integration @astrojs/node
# or
npx astro add astro-prometheus-node-integration @astrojs/node
# or
yarn astro add astro-prometheus-node-integration @astrojs/node
```

### Manual

1. Install the packages:

```bash
pnpm add astro-prometheus-node-integration @astrojs/node
# or
npm install astro-prometheus-node-integration @astrojs/node
# or
yarn add astro-prometheus-node-integration @astrojs/node
```

1. Add the integration as the first one to your `astro.config.mjs` or `astro.config.mts`:

```js
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import prometheusNodeIntegration from "astro-prometheus-node-integration";

export default defineConfig({
  integrations: [
    prometheusNodeIntegration(),
  ],
  adapter: node({
    mode: "standalone",
  }),
});
```

---

## Usage

### Minimal Example

```js
// astro.config.mjs or astro.config.mts
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import prometheusNodeIntegration from "astro-prometheus-node-integration";

export default defineConfig({
  integrations: [
    prometheusNodeIntegration(),
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
import prometheusNodeIntegration from "astro-prometheus-node-integration";

export default defineConfig({
  integrations: [
    prometheusNodeIntegration({
      enabled: true, // Enable/disable integration
      metricsUrl: "/metrics", // URL for metrics endpoint
      registerContentType: "PROMETHEUS", // or "OPENMETRICS"
      collectDefaultMetricsConfig: {
        prefix: "myapp_", // Prefix for all metrics
        labels: {
          env: "production",
          version: "1.0.0",
        },
      },
      histogramBuckets: {
        inbound: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],  // Custom inbound buckets
        outbound: [0.1, 0.5, 1, 2, 5, 10, 20, 50],       // Custom outbound buckets
      },
    }),
  ],
  adapter: node({
    mode: "standalone",
  }),
});
```

---

## Configuration Options

| Option                      | Type      | Default        | Description                                                                                 |
|-----------------------------|-----------|----------------|---------------------------------------------------------------------------------------------|
| `enabled`                   | boolean   | `true`         | Enable or disable the integration. Useful for disabling in development.                      |
| `metricsUrl`                | string    | `/metrics`     | The URL path where metrics are exposed.                                                      |
| `registerContentType`       | string    | `PROMETHEUS`   | Content type for the metrics endpoint. Use `PROMETHEUS` or `OPENMETRICS`.                    |
| `collectDefaultMetricsConfig` | object  | `{}`           | Configuration for [prom-client collectDefaultMetrics](https://github.com/siimon/prom-client#collectdefaultmetricsconfig). Supports `prefix`, `labels`, etc. |
| `standaloneMetrics`         | object    | `{ enabled: false, port: 7080 }` | Expose metrics on a standalone HTTP server. If enabled, disables the default Astro route and starts a Node.js server on the specified port. |
| `outboundRequests`          | object    | _disabled_     | Track outbound HTTP/fetch calls made by the Node process. Enable to collect latency, totals, and error counts for external requests. |
| `histogramBuckets`          | object    | _not set_      | Custom histogram buckets for inbound and outbound metrics. If not provided, prom-client defaults `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]` are used. |

### `collectDefaultMetricsConfig` fields

- `prefix` (string): Prefix for all metric names.
- `labels` (object): Key-value pairs to add as default labels to all metrics.
- `gcDurationBuckets` (number[]): Buckets for GC duration histogram.
- `eventLoopMonitoringPrecision` (number): Precision for event loop monitoring.

### `histogramBuckets` fields

- `inbound` (number[]): Custom bucket boundaries for inbound HTTP metrics (`http_request_duration_seconds` and `http_server_duration_seconds`). Values are in seconds.
- `outbound` (number[]): Custom bucket boundaries for outbound HTTP metrics (`http_response_duration_seconds`). Values are in seconds.

**Default Behavior:** When `histogramBuckets` is not provided, the integration uses prom-client's default buckets: `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]` seconds.

**Why Customize Buckets?** The default buckets start at 5ms (`0.005` seconds), which may be too granular for server-side HTTP metrics. Customizing buckets allows you to:
- Optimize for your application's typical latency ranges
- Reduce memory overhead by using fewer, more relevant buckets
- Improve query performance in Prometheus by having fewer bucket series

**Example Configuration:**

```js
prometheusNodeIntegration({
  histogramBuckets: {
    inbound: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],  // Custom inbound buckets
    outbound: [0.1, 0.5, 1, 2, 5, 10, 20, 50],      // Custom outbound buckets
  },
})
```

### `outboundRequests` fields

- `enabled` (boolean): Set to `true` to start observing outbound HTTP client calls (requires Node.js 18.13+, recommended 22+).
- `includeErrors` (boolean, default `true`): When `false`, failed requests still increment counters but are skipped by the latency histogram.
- `labels.endpoint(context)` (function): Customize the `endpoint` label given a rich context (`entry`, resolved `URL`, method, host, status, and a default path).
- `labels.app(context)` (function): Override the `app` label for each outbound request. Defaults to `"astro"`.
- `shouldObserve(entry)` (function): Return `false` to filter specific performance entries (e.g. ignore health checks or third-party hosts).
- All functions run inside the Node.js runtime, so you can safely reference environment variables or helper utilities.

### Track outbound HTTP calls

```js
prometheusNodeIntegration({
  outboundRequests: {
    enabled: true,
    includeErrors: false,
    labels: {
      endpoint: ({ defaultEndpoint }) =>
        defaultEndpoint.replace(/\/\d+/g, "/:id"),
      app: () => process.env.SERVICE_NAME ?? "checkout",
    },
    shouldObserve: (entry) => {
      // Ignore health checks and internal telemetry calls
      return !entry.name.includes("/health");
    },
  },
});
```

Once enabled, the integration uses Node.js' `PerformanceObserver` to tap into Undici/fetch resource timings, so every outbound request made via `fetch`, `http`, or libraries built on top of them is recorded automatically without wrapping client code.

### Experimental Features

> **⚠️ Warning:** These features are experimental and may change in future releases. Use with caution in production environments.

#### `experimental.useOptimizedTTLBMeasurement`

**Type:** `boolean`  
**Default:** `false`

This experimental feature allows you to choose between two different methods for measuring Time To Last Byte (TTLB) for streaming responses:

- **`false` (default)**: Uses the legacy stream wrapping method that provides maximum accuracy but higher CPU usage due to stream processing overhead.

- **`true`**: Uses the optimized async timing method that provides millisecond accuracy with minimal CPU overhead by deferring timing work and avoiding stream wrapping.

**Use Cases:**

- Set to `true` for high-concurrency applications where CPU efficiency is critical
- Set to `false` when maximum timing accuracy is required and CPU usage is not a concern

**Performance Impact:**

- **Legacy method**: Higher accuracy, higher CPU usage, more memory overhead
- **Optimized method**: Millisecond accuracy, lower CPU usage, minimal memory overhead

**Example Configuration:**

```js
prometheusNodeIntegration({
  experimental: {
    useOptimizedTTLBMeasurement: true, // Enable optimized TTLB measurement
  },
}),
```

---

## Custom Metrics Provided

The integration provides the following Prometheus metrics:

| Metric Name                        | Type      | Labels (`method`, `path`, `status`) | Description                                                                                 |
|-------------------------------------|-----------|-------------------------------------|---------------------------------------------------------------------------------------------|
| `http_requests_total`               | Counter   | Yes                                 | Total number of HTTP requests received.                                                     |
| `http_request_duration_seconds`     | Histogram | Yes                                 | Duration (in seconds) of server-side request processing (until response is ready to send).  |
| `http_server_duration_seconds`      | Histogram | Yes                                 | Full server-side HTTP request duration, including response streaming (time to last byte).    |

### Metric Details

- **`http_requests_total`**
  - **Type:** Counter
  - **Labels:** `method`, `path`, `status`
  - **Description:** Increments for every HTTP request received by the server.

- **`http_request_duration_seconds`**
  - **Type:** Histogram
  - **Labels:** `method`, `path`, `status`
  - **Description:** Measures the time taken to process a request on the server, including middleware and Astro frontmatter, until the response is ready to send or stream.
  - **Buckets:** Uses `histogramBuckets.inbound` if configured, otherwise prom-client defaults.

- **`http_server_duration_seconds`**
  - **Type:** Histogram
  - **Labels:** `method`, `path`, `status`
  - **Description:** Measures the total time from request start to the last byte sent to the client (TTLB).
  - **Buckets:** Uses `histogramBuckets.inbound` if configured, otherwise prom-client defaults.

All metrics can be prefixed and labeled globally using the `collectDefaultMetricsConfig` option.

### TTLB Measurement Methods

The `http_server_duration_seconds` metric measures Time To Last Byte (TTLB) using different methods depending on your configuration:

#### Legacy Stream Wrapping Method (Default)

- **Accuracy**: Maximum precision (nanosecond level)
- **CPU Usage**: Higher due to stream processing overhead
- **Memory**: Additional overhead from stream wrapping
- **Use Case**: When maximum timing accuracy is critical

#### Optimized Async Timing Method (Experimental)

- **Accuracy**: Millisecond precision (sufficient for most use cases)
- **CPU Usage**: Minimal overhead using `setImmediate()` and deferred work
- **Memory**: Minimal overhead, no stream wrapping
- **Use Case**: High-concurrency applications where CPU efficiency matters

The optimized method is particularly beneficial for:

- Applications handling thousands of concurrent requests
- Microservices where resource efficiency is critical
- Environments with limited CPU resources
- Production deployments where performance is prioritized over maximum precision

### Outbound HTTP Metrics (optional)

When `outboundRequests.enabled` is `true`, the integration registers three additional metrics that mirror the counter/histogram set many teams already use when wrapping Undici:

| Metric Name                     | Type      | Labels (`method`, `host`, `status`, `endpoint`, `app`) | Description |
|---------------------------------|-----------|--------------------------------------------------------|-------------|
| `http_responses_total`          | Counter   | Yes                                                    | Total number of outbound HTTP responses observed. |
| `http_response_duration_seconds`| Histogram | Yes                                                    | Duration (seconds) from request start until the response completes. Buckets use `histogramBuckets.outbound` if configured, otherwise prom-client defaults. |
| `http_response_error_total`     | Counter   | Yes + `error_reason`                                   | Total number of outbound responses that failed (status ≥ 400 or network error). |

All three metrics share a cached registry entry, respect global prefixes, and automatically deduplicate performance entries emitted by Node.js/Undici.

Example Prometheus output (using the defaults and the test suite fixtures):

```text
http_responses_total{method="GET",host="api.example.com",status="200",endpoint="/v1/users",app="astro"} 1
http_response_duration_seconds_count{method="GET",host="api.example.com",status="200",endpoint="/v1/users",app="astro"} 1
http_response_duration_seconds_sum{method="GET",host="api.example.com",status="200",endpoint="/v1/users",app="astro"} 0.15
http_response_error_total{method="POST",host="api.example.com",status="500",endpoint="/v1/orders/:id",app="checkout",error_reason="Internal Server Error"} 1
```

---

## Metrics Endpoint

- The metrics are exposed at the URL specified by `metricsUrl` (default: `/metrics`).
- The endpoint returns metrics in Prometheus or OpenMetrics format, depending on the `registerContentType` option.
- Example:
  - [http://localhost:4321/metrics](http://localhost:4321/metrics)

---

## Standalone Metrics Server (New Feature)

Some organizations require exposing Prometheus metrics on a separate port, not on the main Astro application port. This integration supports this via the `standaloneMetrics` option.

### How It Works

- If `standaloneMetrics.enabled` is `true`, the integration will **not** inject the `/metrics` route into your Astro app.
- Instead, it will start a standalone HTTP server (using Node.js) on the configured port (default: `7080`).
- The metrics will be available at `http://<host>:<port>/metrics` (e.g., `http://localhost:7080/metrics`).
- This is useful for keeping metrics endpoints internal and not exposed to the public internet.

### Configuration Example

```js
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import prometheusNodeIntegration from "astro-prometheus-node-integration";

export default defineConfig({
  integrations: [
    prometheusNodeIntegration({
      metricsUrl: "/_/metrics",  // Metrics URL is also configurable in this mode
      standaloneMetrics: {
        enabled: true, // Enable standalone metrics server
        port: 8080,    // (Optional) Port for the metrics server (default: 7080)
      },
    }),
  ],
  adapter: node({
    mode: "standalone",
  }),
});
```

- To disable the standalone server and use the default Astro route, set `standaloneMetrics.enabled: false` (or omit the option).
- When enabled, the `/metrics` endpoint will **not** be available on your main Astro app port.

---

## Contributing

This project is a monorepo:

- `playground/`: Example Astro app for testing the integration.
- `packages/astro-prometheus-node-integration/`: The integration source code.

### Setup

```bash
pnpm install --frozen-lockfile
pnpm node-integration:dev
pnpm playground:dev
```

- Edit files in `packages/astro-prometheus-node-integration/`.
- The playground will reload on changes.

---

## License

[MIT Licensed](https://github.com/dvelasquez/astro-prometheus-integration/blob/main/LICENSE). Made with ❤️ by [Danilo Velasquez](https://d13z.dev/).

## Acknowledgements

- Built with [astro-integration-template](https://github.com/florian-lefebvre/astro-integration-template).
- Uses [prom-client](https://github.com/siimon/prom-client) for metrics collection.
