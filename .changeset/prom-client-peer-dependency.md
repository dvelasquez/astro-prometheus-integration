---
"astro-prometheus-node-integration": minor
---

Move `prom-client` from a direct dependency to a peer dependency (`^15.0.0`) so the host app owns a single shared instance. This avoids broken cluster aggregation (`AggregatorRegistry`) when pnpm or the SSR bundler resolve multiple copies of `prom-client`. Install `prom-client` alongside the integration.
