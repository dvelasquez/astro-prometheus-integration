# Prometheus Playground (Astro 7)

E2E playground for `astro-prometheus-node-integration` running on **Astro 7** with **`@astrojs/node` v11**.

## Stack

| Package | Version |
|---|---|
| `astro` | 7.x |
| `@astrojs/node` | 11.x |
| `astro-prometheus-node-integration` | workspace |

## Commands

From the repo root:

```bash
# Build package + playground
pnpm prometheus-astro7:playground:build

# Dev server with hot reload on integration dist changes
pnpm prometheus-astro7:playground:dev

# Run E2E tests (builds first, starts preview server)
pnpm test:e2e:prometheus-astro7
```

From this directory:

```bash
pnpm build:all   # build integration + playground
pnpm test:e2e:ci # run all e2e specs against preview server
```
