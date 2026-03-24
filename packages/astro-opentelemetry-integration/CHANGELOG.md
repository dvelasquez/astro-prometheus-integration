# astro-opentelemetry-integration

## 0.2.0

### Minor Changes

- [`06e64c7`](https://github.com/dvelasquez/astro-prometheus-integration/commit/06e64c74a27d337235e2a7d769115a4e25fdc5fa) Thanks [@dvelasquez](https://github.com/dvelasquez)! - Add support for Astro 6 and `@astrojs/node` v10

  Both packages now declare `astro: "^5.0.0 || ^6.0.0"` and `@astrojs/node: "^9.0.0 || ^10.0.0"` as peer dependencies.

  **`astro-prometheus-node-integration`** additionally includes:
  - Fix Zod v4 compatibility: Astro 6 bundles Zod v4, which removed the `.args().returns()` chain on `z.function()`. All function schemas now use the new `z.function({ input, output })` API.
  - Fix Zod v4 `.default({})` behaviour: explicit default objects are now passed to satisfy the output type, avoiding runtime errors when optional nested fields are absent.
  - Export `ObservedEntry` and `OutboundMetricContext` types from the main package entry point, so consumers can annotate outbound-metrics callbacks without importing from internal paths.

## 0.1.1

### Patch Changes

- [`99d8c76`](https://github.com/dvelasquez/astro-prometheus-integration/commit/99d8c76ff3341d890bb891b232ef1b0860d72a6d) Thanks [@dvelasquez](https://github.com/dvelasquez)! - Updated link to author site: https://d13z.dev

## 0.1.0

### Minor Changes

- [#85](https://github.com/dvelasquez/astro-prometheus-integration/pull/85) [`3f9ed72`](https://github.com/dvelasquez/astro-prometheus-integration/commit/3f9ed7212500cc7411ff37d8f3bff9d00d7420aa) Thanks [@dvelasquez](https://github.com/dvelasquez)! - Add comprehensive OpenTelemetry integration for Astro applications

  ## Features
  - **Automatic HTTP instrumentation**: Tracks request count, duration, and server response metrics
  - **Multiple exporter support**: Prometheus, OTLP (HTTP/gRPC/Proto), and console exporters
  - **Distributed tracing**: Full request tracing with automatic span creation
  - **Zero-config defaults**: Works out of the box with sensible defaults
  - **Flexible configuration**: Environment variables and programmatic configuration
  - **Auto-instrumentation**: Automatic Node.js instrumentation for comprehensive observability

  ## Installation

  ```bash
  pnpm astro add astro-opentelemetry-integration @astrojs/node
  ```

  ## Quick Start

  ```js
  import { defineConfig } from "astro/config";
  import node from "@astrojs/node";
  import otelIntegration from "astro-opentelemetry-integration";

  export default defineConfig({
    integrations: [otelIntegration()],
    adapter: node({ mode: "standalone" }),
  });
  ```

  ## Requirements
  - Node.js >= 22.0.0
  - Astro ^5.0.0
  - @astrojs/node adapter (serverless adapters not supported)

  This integration provides production-ready observability for Astro applications with minimal setup.
