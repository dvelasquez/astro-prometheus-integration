---
"astro-prometheus-node-integration": minor
---

- Added support for configurable metrics content type and global default labels.
- Unified metrics config and improved support for global default labels.
- Added SSR test pages in playground for metrics delay with parameter support.
- Fixed path to routePattern.
- Added measurement and recording of time to last byte (TTLB) in middleware.
- Improved type safety and added metric validation warnings.
- Added support for prefixed custom metrics.
- Added nodemon for server restarts and prefix configuration option to Prometheus. 