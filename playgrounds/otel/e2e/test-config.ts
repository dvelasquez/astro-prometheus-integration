// Test configuration for optimized OpenTelemetry batch settings
export const TEST_CONFIG = {
	// Optimized batch settings for faster testing
	OTEL_BSP_SCHEDULE_DELAY: "100", // 100ms batch delay instead of default 5s
	OTEL_BSP_MAX_EXPORT_BATCH_SIZE: "10", // Smaller batch size
	OTEL_BSP_EXPORT_TIMEOUT: "1000", // 1s timeout instead of default 30s

	// Metrics batch settings
	OTEL_METRIC_EXPORT_INTERVAL: "100", // 100ms interval instead of default 60s
	OTEL_METRIC_EXPORT_TIMEOUT: "1000", // 1s timeout

	// Collector endpoints
	OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318",
	OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "http://localhost:4318/v1/traces",
	OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: "http://localhost:4318/v1/metrics",

	// gRPC endpoints
	OTEL_EXPORTER_OTLP_TRACES_ENDPOINT_GRPC: "http://localhost:4317",
	OTEL_EXPORTER_OTLP_METRICS_ENDPOINT_GRPC: "http://localhost:4317",

	// Service configuration
	OTEL_SERVICE_NAME: "otel-playground-test",
	OTEL_SERVICE_VERSION: "test-1.0.0",
};

/**
 * Apply test configuration to environment variables
 */
export function applyTestConfig(): void {
	Object.entries(TEST_CONFIG).forEach(([key, value]) => {
		process.env[key] = value;
	});
}

/**
 * Get test configuration as environment variables object
 */
export function getTestEnvVars(): Record<string, string> {
	return { ...TEST_CONFIG };
}
