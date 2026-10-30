---
"astro-prometheus-node-integration": patch
---

Fix a dev-only crash after Vite HMR: every request returned 500 with `A metric with the name process_cpu_user_seconds_total has already been registered` until the dev server was restarted.

Vite re-evaluates the middleware modules on hot reload, which emptied the per-registry metric caches while `prom-client`'s registry kept every metric. The caches and the outbound `PerformanceObserver` now live on `globalThis` (under `Symbol.for("astro-prometheus-node-integration.state")`), and metric registration is idempotent: default metrics and HTTP metrics already present in the registry are reused instead of re-registered. Production builds are not affected.
