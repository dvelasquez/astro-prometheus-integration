---
"astro-prometheus-node-integration": minor
---

Move standalone metrics server execution to middleware

The logic for starting the standalone Prometheus metrics server was moved from the integration setup to the middleware. This ensures the standalone server is started when running Astro in standalone Node.js mode, not just during dev, preview, or build. Type definitions and tests were updated accordingly. This change ensures metrics are always available in standalone deployments and prevents multiple server instances from being started.
