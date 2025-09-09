# Open Telemetry Collector test

Run a simple test OTEL collector locally, [based on this documentation.](https://opentelemetry.io/docs/languages/js/exporters/#collector-setup)

## Quick Start with Docker Compose (Recommended)

**Start everything with one command:**
```bash
docker-compose up -d
```

**Stop everything:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f
```

> **Note**: If you're using Podman instead of Docker, use `podman-compose` instead of `docker-compose`

## Manual Setup (Alternative)

1. **Start Jaeger UI** (for trace visualization):
   ```bash
   docker run -d --name jaeger -p 16686:16686 -p 14250:14250 jaegertracing/all-in-one:latest
   ```

2. **Start the OTEL Collector**:
   ```bash
   docker run -p 4317:4317 -p 4318:4318 -p 55679:55679 --rm --link jaeger -v $(pwd)/collector-config.yaml:/etc/otelcol/config.yaml otel/opentelemetry-collector
   ```

## UI Access

### Collector Debug Interface (zpages)
- **URL**: http://localhost:55679
- **Features**: Collector status, configuration, and pipeline information

### Jaeger Trace Visualization
- **URL**: http://localhost:16686
- **Features**: 
  - View detailed traces with spans and timing
  - Search and filter traces
  - Trace dependency graphs
  - Performance analysis