---
"astro-prometheus-node-integration": minor
---

Add optional outbound HTTP metrics instrumentation. Enable it with `outboundRequests.enabled = true` in your Astro config to capture client-side `fetch` calls via Node’s performance observer. When enabled, the integration exports:
• `http_responses_total` (counter)
• `http_response_duration_seconds` (histogram)
• `http_response_error_total` (counter with `error_reason`)
All metrics share the `/outboundRequests` label map so you can customize `endpoint`/`app` labels or filter entries with `shouldObserve`.
