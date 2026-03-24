---
"astro-prometheus-node-integration": minor
"astro-opentelemetry-integration": minor
---

Add support for Astro 6 and `@astrojs/node` v10

Both packages now declare `astro: "^5.0.0 || ^6.0.0"` and `@astrojs/node: "^9.0.0 || ^10.0.0"` as peer dependencies.

**`astro-prometheus-node-integration`** additionally includes:

- Fix Zod v4 compatibility: Astro 6 bundles Zod v4, which removed the `.args().returns()` chain on `z.function()`. All function schemas now use the new `z.function({ input, output })` API.
- Fix Zod v4 `.default({})` behaviour: explicit default objects are now passed to satisfy the output type, avoiding runtime errors when optional nested fields are absent.
- Export `ObservedEntry` and `OutboundMetricContext` types from the main package entry point, so consumers can annotate outbound-metrics callbacks without importing from internal paths.
