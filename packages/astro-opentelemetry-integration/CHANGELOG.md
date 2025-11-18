# astro-opentelemetry-integration

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
