---
"astro-prometheus-node-integration": patch
---

Fix Prometheus metrics not recording 500 server errors

- The middleware now properly records metrics for requests that result in unhandled exceptions (HTTP 500 errors).
- Added a try/catch around the request handler to ensure that error responses increment the appropriate counters and histograms.
- Improved the streaming response handler to also record 500 errors if a streaming failure occurs.
- Added a unit test to verify that metrics are correctly recorded for 500 error cases.
