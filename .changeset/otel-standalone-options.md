---
"astro-opentelemetry-integration": patch
---

Fix standalone Node startup by baking OTel options into the server entry before loading the SDK. Previously options only lived on `globalThis` during Astro config, so `node dist/server/entry.mjs` crashed with `Cannot read properties of undefined (reading 'serviceName')` (#354).
