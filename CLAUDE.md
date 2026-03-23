# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Package manager:** pnpm (v10.22.0). Node >=22 required.

### Building packages

```bash
# Build a specific package (watch mode for development)
pnpm prometheus:dev          # watch-builds astro-prometheus-node-integration
pnpm otel:dev                # watch-builds astro-opentelemetry-integration

# Build for production
pnpm --filter astro-prometheus-node-integration build
pnpm --filter astro-opentelemetry-integration build
```

### Running tests

```bash
# Unit tests (run from inside a package directory, or use filter)
pnpm --filter astro-prometheus-node-integration test
pnpm --filter astro-opentelemetry-integration test

# Run a single test file
cd packages/astro-prometheus-node-integration && pnpm vitest run src/middleware/prometheus-middleware.test.ts

# E2E tests (require playground to be built first)
pnpm prometheus:playground:build    # builds package + playground
pnpm test:e2e:prometheus            # runs Playwright tests for prometheus playground
pnpm test:e2e:otel                  # runs Playwright tests for otel playground
pnpm test:e2e:build                 # build all + run all e2e tests
```

### Linting

```bash
pnpm lint          # biome check
pnpm lint:fix      # biome check --write (auto-fix)
```

### Playground development

```bash
pnpm prometheus:playground:dev   # starts prometheus playground (with nodemon watching dist/)
pnpm otel:playground:dev         # starts otel playground
```

## Architecture

This is a pnpm monorepo with workspaces in `packages/*`, `playgrounds/*`, and `demo/`.

### Packages

**`packages/astro-prometheus-node-integration`** — The main published package (`astro-prometheus-node-integration` on npm). Provides Prometheus metrics for Astro apps running on Node.js (`@astrojs/node` adapter only).

**`packages/astro-opentelemetry-integration`** — A second published package (`astro-opentelemetry-integration`) providing OpenTelemetry tracing/metrics for Astro.

Both packages are built with `tsup` (ESM only, targeting Node 18+), peer-depending on `astro` and `@astrojs/node`.

### How astro-prometheus-node-integration works

The integration is defined via `astro-integration-kit`'s `defineIntegration` in `src/integration.ts`. On `astro:config:setup` it:

1. Injects options into the Vite build as `__PROMETHEUS_OPTIONS__` (a build-time constant read at runtime via `src/config/accessors.ts`).
2. Registers two Astro middlewares (both run server-side, `order: "pre"`):
   - `src/middleware/prometheus-middleware.ts` — tracks inbound HTTP metrics (counter + two histograms) using `prom-client`.
   - `src/middleware/outbound-metrics.ts` — optionally initializes a `PerformanceObserver` (`src/outbound/observer.ts`) to capture outbound fetch/HTTP timings via Node.js resource performance entries.
3. Injects a `/metrics` route (`src/routes/metrics.ts`) **or**, if `standaloneMetrics.enabled`, starts a separate Node.js HTTP server (`src/routes/standalone-metrics-server.ts`).

**Metrics are stored per `prom-client` Registry** in module-level Maps (`src/metrics/index.ts`). This avoids duplicate-metric errors and supports isolated registries in tests. The middleware lazily initializes the registry/metrics on the first request (`metricsCache` Map in prometheus-middleware).

**Outbound tracking** uses Node.js `PerformanceObserver` on `"resource"` entry type (Undici/fetch). It deduplicates entries with a TTL cache (`processedEntries` Map) and runs user-provided `shouldObserve` / label functions safely via `safeInvoke`.

**TTLB measurement** for `http_server_duration_seconds` has two modes: legacy stream wrapping (default) vs. optimized async via `setImmediate` (experimental flag `useOptimizedTTLBMeasurement`).

**Outbound config** is passed to globalThis at config setup time as `globalThis.__ASTRO_PROMETHEUS_OUTBOUND_CONFIG` (set in `integration.ts`, read via `src/config/accessors.ts`).

### How astro-opentelemetry-integration works

Defined similarly via `defineIntegration`. At build time, a Vite plugin prepends `import 'astro-opentelemetry-integration/sdk'` to the server entry file, which bootstraps the OTel SDK before any other code runs. Supports configurable metric/trace exporters (proto, http, grpc, prometheus, console) via `src/exporters/`.

### Playgrounds

- `playgrounds/prometheus/` — Astro app using `astro-prometheus-node-integration` via `workspace:*`, with Playwright e2e tests under `e2e/`.
- `playgrounds/otel/` — Astro app using `astro-opentelemetry-integration`, with Playwright e2e tests.

The prometheus playground's `dev` script uses `nodemon` to watch the package `dist/` folder, so changes rebuild automatically after running `pnpm prometheus:dev` in parallel.

### Release management

Changesets is used for versioning and publishing:
```bash
pnpm changeset          # create a changeset
pnpm ci:version         # bump versions
pnpm ci:publish         # publish to npm + push tags
```
