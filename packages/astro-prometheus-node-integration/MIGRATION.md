# Migration guide: v1 → v2

Version 2 makes `prom-client` a **peer dependency** instead of bundling it as a direct dependency of `astro-prometheus-node-integration`.

## Why this changed

`prom-client` keeps process-wide state (default registry, Node.js `cluster` aggregation via `AggregatorRegistry`). When the integration, your app, and other libraries each resolve a different physical copy of `prom-client` (common with pnpm), cluster metrics aggregation silently fails.

Declaring `prom-client` as a peer dependency means your application owns a single shared instance.

## What you need to do

### 1. Upgrade the integration

```bash
pnpm add astro-prometheus-node-integration@^2
# or
npm install astro-prometheus-node-integration@^2
# or
yarn add astro-prometheus-node-integration@^2
```

### 2. Install `prom-client` in your app

Add `prom-client` as a direct dependency of your Astro project (same major as the peer range, currently `^15`):

```bash
pnpm add prom-client@^15
# or
npm install prom-client@^15
# or
yarn add prom-client@^15
```

Or install both together:

```bash
pnpm add astro-prometheus-node-integration@^2 prom-client@^15
```

If you use `astro add` for a fresh install, it installs non-optional peer dependencies for you (including `prom-client`):

```bash
pnpm astro add astro-prometheus-node-integration @astrojs/node
```

### 3. No config API changes

Integration options and the public API are unchanged. You do not need to update `astro.config.*` for this migration.

## Optional: keep a single instance under SSR

If your Astro SSR bundle embeds `prom-client`, mark it external so Node resolves the app-owned copy:

```js
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import prometheusNodeIntegration from "astro-prometheus-node-integration";

export default defineConfig({
  integrations: [prometheusNodeIntegration()],
  adapter: node({ mode: "standalone" }),
  vite: {
    ssr: {
      external: ["prom-client"],
    },
  },
});
```

## Checklist

- [ ] Bump `astro-prometheus-node-integration` to v2
- [ ] Add `prom-client@^15` to your app `dependencies`
- [ ] Run install and confirm there is only one `prom-client` in the lockfile / `node_modules` resolution
- [ ] If you use Node.js `cluster` + `AggregatorRegistry`, verify aggregated `/metrics` after deploy
- [ ] (Optional) Set `vite.ssr.external: ["prom-client"]` for Astro SSR
