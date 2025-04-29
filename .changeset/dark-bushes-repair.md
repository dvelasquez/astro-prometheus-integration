---
"astro-prometheus-node-integration": minor
---

Added standalone metrics server option that allows running the Prometheus metrics endpoint on a separate server instance. This feature enables better separation of concerns and more flexible deployment options.

- Added standalone metrics server configuration option
- Added integration tests for standalone metrics functionality
- Added default metrics test coverage
- Improved package exports by removing test files from npm package
