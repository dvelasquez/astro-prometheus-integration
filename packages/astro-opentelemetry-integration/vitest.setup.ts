console.log("Vitest setup file loaded.");

// Define global variables needed for OpenTelemetry integration tests
declare global {
	var __OTEL_OPTIONS__: {
		serviceName?: string;
		serviceVersion?: string;
	};
	var __OTEL_PRESETS__: {
		metricExporter?: "proto" | "http" | "grpc" | "prometheus" | "none";
		traceExporter?: "proto" | "http" | "grpc" | "console";
		experimental?: {
			useOptimizedTTLBMeasurement?: boolean;
		};
	};
	var __OTEL_SDK__: any;
	var __OTEL_SDK_INITIALIZED__: boolean;
	var __OTEL_SDK_INITIALIZING__: boolean;
	var __OTEL_SDK_PROMISE__: Promise<void>;
	var __OTEL_HOST_METRICS_INITIALIZED__: boolean;
	var __OTEL_SHUTDOWN_HANDLER_SET__: boolean;
}

// Set up default global state for tests
globalThis.__OTEL_OPTIONS__ = {
	serviceName: "test-service",
	serviceVersion: "1.0.0",
};

globalThis.__OTEL_PRESETS__ = {
	metricExporter: "none",
	traceExporter: "console",
	experimental: {
		useOptimizedTTLBMeasurement: false,
	},
};

// Reset global state
globalThis.__OTEL_SDK__ = undefined;
globalThis.__OTEL_SDK_INITIALIZED__ = false;
globalThis.__OTEL_SDK_INITIALIZING__ = false;
globalThis.__OTEL_SDK_PROMISE__ = undefined;
globalThis.__OTEL_HOST_METRICS_INITIALIZED__ = false;
globalThis.__OTEL_SHUTDOWN_HANDLER_SET__ = false;

// Set up environment variables for tests
process.env.OTEL_SERVICE_NAME = "test-service";
process.env.OTEL_SERVICE_VERSION = "1.0.0";
