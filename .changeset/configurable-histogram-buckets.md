---
"astro-prometheus-node-integration": minor
---

Add configurable histogram buckets for inbound and outbound metrics

Users can now customize histogram bucket boundaries for better performance and query optimization. The new `histogramBuckets` configuration option allows separate bucket configuration for inbound (`http_request_duration_seconds`, `http_server_duration_seconds`) and outbound (`http_response_duration_seconds`) metrics.

When not configured, the integration uses prom-client's default buckets `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]` seconds.

**Example:**
```js
prometheusNodeIntegration({
  histogramBuckets: {
    inbound: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    outbound: [0.1, 0.5, 1, 2, 5, 10, 20, 50],
  },
})
```

This change removes the hardcoded buckets from outbound metrics and makes all histogram buckets configurable, allowing users to optimize for their application's typical latency ranges.
