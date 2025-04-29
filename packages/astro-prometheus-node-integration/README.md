# Astro Prometheus Node Integration

[![npm version](https://img.shields.io/npm/v/astro-prometheus-node-integration.svg)](https://www.npmjs.com/package/astro-prometheus-node-integration)

An [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) that exposes [Prometheus](https://prometheus.io/) metrics for your Astro site running on Node.js. This integration provides out-of-the-box HTTP request metrics, including request counts and durations, and exposes them at a configurable endpoint for scraping by Prometheus.

---

## Features

- **Automatic HTTP metrics**: Tracks request count, request duration, and server response duration.
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

2. Add the integration as the first one to your `astro.config.mjs` or `astro.config.mts`:

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

#### `collectDefaultMetricsConfig` fields
- `prefix` (string): Prefix for all metric names.
- `labels` (object): Key-value pairs to add as default labels to all metrics.
- `gcDurationBuckets` (number[]): Buckets for GC duration histogram.
- `eventLoopMonitoringPrecision` (number): Precision for event loop monitoring.

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

- **`http_server_duration_seconds`**
  - **Type:** Histogram
  - **Labels:** `method`, `path`, `status`
  - **Description:** Measures the total time from request start to the last byte sent to the client (TTLB).

All metrics can be prefixed and labeled globally using the `collectDefaultMetricsConfig` option.

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

[MIT Licensed](https://github.com/dvelasquez/astro-prometheus-integration/blob/main/LICENSE). Made with ❤️ by [Danilo Velasquez](https://github.com/dvelasquez).

## Acknowledgements

- Built with [astro-integration-template](https://github.com/florian-lefebvre/astro-integration-template).
- Uses [prom-client](https://github.com/siimon/prom-client) for metrics collection.
