# Prometheus Playground

Main e2e playground for `astro-prometheus-node-integration`. Always tracks the **latest supported** Astro stack.

See [`../README.md`](../README.md) for the playground versioning policy.

## Stack

| Package | Version |
|---|---|
| `astro` | 7.x |
| `@astrojs/node` | 11.x |
| `astro-prometheus-node-integration` | workspace |

## Commands

From the repo root:

```bash
pnpm prometheus:playground:dev    # dev server (watches integration dist/)
pnpm prometheus:playground:build  # build integration + playground
pnpm test:e2e:prometheus          # run e2e tests
```
