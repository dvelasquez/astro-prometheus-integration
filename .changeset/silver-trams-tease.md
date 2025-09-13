---
"astro-opentelemetry-integration": minor
---

Add comprehensive OpenTelemetry integration for Astro applications

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
