---
"astro-prometheus-node-integration": minor
---

feat: Add experimental optimized TTLB measurement for high-concurrency applications

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

| Method | Accuracy | CPU Usage | Memory | Use Case |
|--------|----------|-----------|---------|----------|
| **Legacy** | Nanosecond | Higher | Higher | Maximum accuracy required |
| **Optimized** | Millisecond | Minimal | Minimal | High-concurrency apps |

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
