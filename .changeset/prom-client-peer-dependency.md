---
"astro-prometheus-node-integration": major
---

**Breaking:** Move `prom-client` from a direct dependency to a required peer dependency (`^15.0.0`).

Your app must install `prom-client` so the integration and host share a single instance. This avoids broken cluster aggregation (`AggregatorRegistry`) when pnpm or the SSR bundler resolve multiple copies.

See the [v1 → v2 migration guide](https://github.com/dvelasquez/astro-prometheus-integration/blob/main/packages/astro-prometheus-node-integration/MIGRATION.md).

`astro add` installs this peer automatically for new setups.
