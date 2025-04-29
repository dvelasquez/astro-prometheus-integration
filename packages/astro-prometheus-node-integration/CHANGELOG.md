# astro-prometheus-node-integration

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
