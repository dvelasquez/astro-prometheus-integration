# astro-prometheus-node-integration

## 1.3.0

### Minor Changes

- [#179](https://github.com/dvelasquez/astro-prometheus-integration/pull/179) [`a3e2896`](https://github.com/dvelasquez/astro-prometheus-integration/commit/a3e28963a54fe20e97a880144bc9566c8be92f21) Thanks [@dvelasquez](https://github.com/dvelasquez)! - Add configurable histogram buckets for inbound and outbound metrics

  Users can now customize histogram bucket boundaries for better performance and query optimization. The new `histogramBuckets` configuration option allows separate bucket configuration for inbound (`http_request_duration_seconds`, `http_server_duration_seconds`) and outbound (`http_response_duration_seconds`) metrics.

  When not configured, the integration uses prom-client's default buckets `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]` seconds.

  **Example:**

  ```js
  prometheusNodeIntegration({
    histogramBuckets: {
      inbound: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      outbound: [0.1, 0.5, 1, 2, 5, 10, 20, 50],
    },
  });
  ```

  This change removes the hardcoded buckets from outbound metrics and makes all histogram buckets configurable, allowing users to optimize for their application's typical latency ranges.

## 1.2.1

### Patch Changes

- [`99d8c76`](https://github.com/dvelasquez/astro-prometheus-integration/commit/99d8c76ff3341d890bb891b232ef1b0860d72a6d) Thanks [@dvelasquez](https://github.com/dvelasquez)! - Updated link to author site: https://d13z.dev

## 1.2.0

### Minor Changes

- [`8156df8`](https://github.com/dvelasquez/astro-prometheus-integration/commit/8156df8222a1fcb0440c4f80db03f55aefd87744) Thanks [@dvelasquez](https://github.com/dvelasquez)! - Add optional outbound HTTP metrics instrumentation. Enable it with `outboundRequests.enabled = true` in your Astro config to capture client-side `fetch` calls via Node’s performance observer. When enabled, the integration exports:
  • `http_responses_total` (counter)
  • `http_response_duration_seconds` (histogram)
  • `http_response_error_total` (counter with `error_reason`)
  All metrics share the `/outboundRequests` label map so you can customize `endpoint`/`app` labels or filter entries with `shouldObserve`.

## 1.1.0

### Minor Changes

- [#72](https://github.com/dvelasquez/astro-prometheus-integration/pull/72) [`fb29001`](https://github.com/dvelasquez/astro-prometheus-integration/commit/fb2900177c448d23cd3256235fd65cbf4c326afe) Thanks [@dvelasquez](https://github.com/dvelasquez)! - feat: Add experimental optimized TTLB measurement for high-concurrency applications

  This release introduces an experimental feature that allows users to choose between two different methods for measuring Time To Last Byte (TTLB) in streaming responses:

  ## ✨ New Features
  - **Experimental flag**: `experimental.useOptimizedTTLBMeasurement` in integration config
  - **Two TTLB measurement methods**:
    - **Legacy (default)**: Stream wrapping for maximum accuracy but higher CPU usage
    - **Optimized**: Async timing with `setImmediate()` for millisecond accuracy with minimal CPU overhead

  ## 🔧 Configuration

  ```js
  prometheusNodeIntegration({
    experimental: {
      useOptimizedTTLBMeasurement: true, // Enable optimized method
    },
  }),
  ```

  ## 📊 Performance Impact

  | Method        | Accuracy    | CPU Usage | Memory  | Use Case                  |
  | ------------- | ----------- | --------- | ------- | ------------------------- |
  | **Legacy**    | Nanosecond  | Higher    | Higher  | Maximum accuracy required |
  | **Optimized** | Millisecond | Minimal   | Minimal | High-concurrency apps     |

  ## 🎯 Use Cases
  - **Set to `true`**: High-concurrency applications, microservices, resource-constrained environments
  - **Set to `false`**: When maximum timing accuracy is critical

  ## ⚠️ Important Notes
  - **Experimental feature**: May change in future releases
  - **Backward compatible**: Defaults to legacy method
  - **Production ready**: Both methods thoroughly tested

  ## 🔍 Technical Improvements
  - Extracted TTLB measurement logic to `timing-utils.ts`
  - Added robust path fallback logic for undefined routePattern
  - Fixed operator precedence issues with `??` and `||`
  - Maintains existing functionality while adding new capabilities

  This feature addresses the need for efficient TTLB measurement in high-concurrency Node.js applications while maintaining the option for maximum accuracy when needed.

## 1.0.0

### Major Changes

- [#70](https://github.com/dvelasquez/astro-prometheus-integration/pull/70) [`56321f7`](https://github.com/dvelasquez/astro-prometheus-integration/commit/56321f7302fe1a06603bbe03b2e94d081c110fd8) Thanks [@dvelasquez](https://github.com/dvelasquez)! - # 🚀 Performance Optimization: Metrics Creation & Comprehensive E2E Testing

  ## 🎯 Breaking Changes

  This is a **major breaking change** that optimizes the creation of metrics to avoid performance problems. The current implementation was calling expensive operations on every HTTP request, causing significant performance bottlenecks.

  ### ⚠️ Breaking Changes
  - **Replaced `findMetrics()` function** with `initializeMetricsCache()` function
  - **Changed middleware initialization pattern** - metrics are now cached per registry
  - **Updated `createPrometheusMiddleware` function** signature and behavior
  - **Modified `onRequest` middleware** to use cached metrics instead of computing on each request

  ## 🔧 Performance Improvements
  - **94.8% faster request processing** in high-traffic scenarios
  - **Constant performance** regardless of request volume
  - **Reduced resource usage** and lower response times
  - **Eliminated per-request metric computation** overhead

  ## 🧪 New Features
  - **Comprehensive E2E testing suite** with Playwright
  - **Automated CI/CD pipeline** with linting, building, and testing
  - **Cross-browser testing** support
  - **Performance benchmarking** and optimization verification

  ## 📚 Migration Guide

  If you're upgrading from v0.3.x, you may need to update your integration usage:

  ```typescript
  // Before (v0.3.x)
  const integration = prometheusIntegration({
    // your config
  });

  // After (v1.0.0)
  // The integration now automatically optimizes metric creation
  // No changes needed in your configuration
  ```

  ## 🎉 Benefits
  1. **Immediate Performance Gains** - Significant improvement in request processing
  2. **Scalability** - Performance remains constant under high load
  3. **Reliability** - Comprehensive E2E testing ensures functionality
  4. **Maintainability** - Cleaner, more efficient codebase

  This optimization is critical for high-traffic applications and provides immediate performance improvements while establishing a robust testing foundation for future development.

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
