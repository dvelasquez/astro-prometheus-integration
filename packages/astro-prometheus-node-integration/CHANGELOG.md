# astro-prometheus-node-integration

## 0.3.4

### Patch Changes

- [`e132a8a`](https://github.com/dvelasquez/astro-prometheus-integration/commit/e132a8acd499adb8619eeae749626c68ad43fba3) - Small bump to trigger release.

## 0.3.3

### Patch Changes

- [`6eb6c74`](https://github.com/dvelasquez/astro-prometheus-integration/commit/6eb6c7405003fffe69a3eca443018c08e1720168) - Added prerender:false to metric endpoint so is always dynamic and not prerendered.

## 0.3.2

### Patch Changes

- [#22](https://github.com/dvelasquez/astro-prometheus-integration/pull/22) [`a088f4d`](https://github.com/dvelasquez/astro-prometheus-integration/commit/a088f4dba80bdd34f0055f027840f7b8cbae0e56) Thanks [@dvelasquez](https://github.com/dvelasquez)! - Fix Prometheus metrics not recording 500 server errors

  - The middleware now properly records metrics for requests that result in unhandled exceptions (HTTP 500 errors).
  - Added a try/catch around the request handler to ensure that error responses increment the appropriate counters and histograms.
  - Improved the streaming response handler to also record 500 errors if a streaming failure occurs.
  - Added a unit test to verify that metrics are correctly recorded for 500 error cases.

## 0.3.1

### Patch Changes

- [`4459990`](https://github.com/dvelasquez/astro-prometheus-integration/commit/4459990a7d73588717df517060dae76cda2eff71) - Exported integrationSchema type.

## 0.3.0

### Minor Changes

- [#16](https://github.com/dvelasquez/astro-prometheus-integration/pull/16) [`6571174`](https://github.com/dvelasquez/astro-prometheus-integration/commit/657117462b498f864537403462fd4cbe86a569c1) Thanks [@dvelasquez](https://github.com/dvelasquez)! - Move standalone metrics server execution to middleware

  The logic for starting the standalone Prometheus metrics server was moved from the integration setup to the middleware. This ensures the standalone server is started when running Astro in standalone Node.js mode, not just during dev, preview, or build. Type definitions and tests were updated accordingly. This change ensures metrics are always available in standalone deployments and prevents multiple server instances from being started.

## 0.2.2

### Patch Changes

- [`08af088`](https://github.com/dvelasquez/astro-prometheus-integration/commit/08af088b33c833bc5e321f66f70b33fbe2f3bf45) - Updated peer dependencies versions for compatibility

## 0.2.1

### Patch Changes

- [`51828b3`](https://github.com/dvelasquez/astro-prometheus-integration/commit/51828b35b10523591359e2bf94ddf0951c8c8f9d) - Updated tsup configuration to exclude tests.

## 0.2.0

### Minor Changes

- [`55fc2aa`](https://github.com/dvelasquez/astro-prometheus-integration/commit/55fc2aabe871363258040f1c469e37df8a2f1897) - Added standalone metrics server option that allows running the Prometheus metrics endpoint on a separate server instance. This feature enables better separation of concerns and more flexible deployment options.

  - Added standalone metrics server configuration option
  - Added integration tests for standalone metrics functionality
  - Added default metrics test coverage
  - Improved package exports by removing test files from npm package

## 0.1.1

### Patch Changes

- [`d54c8d9`](https://github.com/dvelasquez/astro-prometheus-integration/commit/d54c8d9309bf4a8a33569be2e34672465a75f081) - This release includes several improvements to the codebase:

  - Refactored middleware to accept a provided register for better testability
  - Added unit tests for the middleware and metrics initialization
  - Updated Biome configuration for better developer experience
  - Fixed code organization for improved comprehension and maintainability
  - Added proper type checking for test files

## 0.1.0

### Minor Changes

- [`aa29376`](https://github.com/dvelasquez/astro-prometheus-integration/commit/aa29376ec1448b9a526664c784e4142480be6ea1) - feat: Add Prometheus metrics integration

  - Added prom-client as a dependency for metrics collection
  - Implemented middleware for tracking HTTP request metrics
  - Added /metrics endpoint for Prometheus scraping
  - Added configuration options for enabling/disabling integration and customizing metrics URL
  - Tracks total HTTP requests and request duration with method, path, and status labels
  - Collects default Node.js metrics through prom-client

- [`62abe6c`](https://github.com/dvelasquez/astro-prometheus-integration/commit/62abe6c0fa0bb380925f4f5bf6a17d68feea5459) - - Added support for configurable metrics content type and global default labels.
  - Unified metrics config and improved support for global default labels.
  - Added SSR test pages in playground for metrics delay with parameter support.
  - Fixed path to routePattern.
  - Added measurement and recording of time to last byte (TTLB) in middleware.
  - Improved type safety and added metric validation warnings.
  - Added support for prefixed custom metrics.
  - Added nodemon for server restarts and prefix configuration option to Prometheus.

## 0.0.1

### Patch Changes

- [`87f989d`](https://github.com/dvelasquez/astro-prometheus-integration/commit/87f989d459e8ed3e72c17d09b58551c111cad30c) - Initial commit for the new package name.
