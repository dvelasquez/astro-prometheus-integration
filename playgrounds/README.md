# Playgrounds

This monorepo uses Astro playgrounds to run e2e tests against real integration builds.

## Prometheus playground versioning

When a new major Astro release is supported, follow this pattern:

1. **Pin the previous major** — copy the current `playgrounds/prometheus/` app into `playgrounds/prometheus-astro{N}/` (where `{N}` is the major version being replaced) and lock its `astro` / `@astrojs/node` versions.
2. **Upgrade the main playground** — bump `playgrounds/prometheus/` to the latest supported Astro stack.
3. **Wire CI** — add or rename the pinned playground job in `.github/workflows/ci.yml` and root `package.json` scripts.

The main playground always tracks the **latest supported** Astro version. Pinned playgrounds exist only for **older majors** we still test in CI.

### Current layout

| Directory | Role | Astro | `@astrojs/node` |
|---|---|---|---|
| `prometheus/` | Main playground (latest) | 7.x | 11.x |
| `prometheus-astro6/` | Pinned compatibility | 6.x | 10.x |
| `prometheus-astro5/` | Pinned compatibility | 5.x | 9.x |
| `otel/` | OpenTelemetry integration | (see package.json) | — |

### Example: upgrading from Astro 6 → 7

```bash
# 1. Snapshot Astro 6 before upgrading main
cp -r playgrounds/prometheus playgrounds/prometheus-astro6
# Edit prometheus-astro6/package.json → name, pinned versions

# 2. Upgrade main playground
# Edit playgrounds/prometheus/package.json → astro 7, @astrojs/node 11

# 3. Update root scripts, CI jobs, and this README
```

### Commands

From the repo root:

```bash
pnpm prometheus:playground:dev           # main (Astro 7)
pnpm prometheus-astro6:playground:dev    # pinned Astro 6
pnpm prometheus-astro5:playground:dev    # pinned Astro 5

pnpm test:e2e:prometheus                 # e2e on main playground
pnpm test:e2e:prometheus-astro6
pnpm test:e2e:prometheus-astro5
```

Pinned playground versions are frozen in Renovate via `matchFileNames` + `enabled: false` in [`renovate.json`](../renovate.json). Only bump them manually when following the major-upgrade workflow above.

Each pinned playground also pins `vite` in `devDependencies` to the major version its Astro release expects. This prevents Vite 8 (from the Astro 7 main playground) from being hoisted into older stacks.
