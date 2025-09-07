# Open Telemetry Collector test

Run a simple test OTEL collector locally, [based on this documentation.](https://opentelemetry.io/docs/languages/js/exporters/#collector-setup)

```bash
docker run -p 4317:4317 -p 4318:4318 --rm -v $(pwd)/collector-config.yaml:/etc/otelcol/config.yaml otel/opentelemetry-collector
```