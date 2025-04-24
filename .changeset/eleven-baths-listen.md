---
"astro-prometheus-node-integration": minor
---

feat: Add Prometheus metrics integration

- Added prom-client as a dependency for metrics collection
- Implemented middleware for tracking HTTP request metrics
- Added /metrics endpoint for Prometheus scraping
- Added configuration options for enabling/disabling integration and customizing metrics URL
- Tracks total HTTP requests and request duration with method, path, and status labels
- Collects default Node.js metrics through prom-client
