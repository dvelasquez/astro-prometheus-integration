import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMetricsExporter, initializeHostMetrics } from "./metrics.js";

// Mock OpenTelemetry exporters
vi.mock("@opentelemetry/exporter-metrics-otlp-grpc", () => ({
	// Vitest 4 requires constructor mocks to use function/class implementations
	OTLPMetricExporter: vi.fn(function MockGrpcMetricExporter(this: unknown) {
		return {
			export: vi.fn(),
			shutdown: vi.fn(),
		};
	}),
}));

vi.mock("@opentelemetry/exporter-metrics-otlp-http", () => ({
	OTLPMetricExporter: vi.fn(function MockHttpMetricExporter(this: unknown) {
		return {
			export: vi.fn(),
			shutdown: vi.fn(),
		};
	}),
}));

vi.mock("@opentelemetry/exporter-metrics-otlp-proto", () => ({
	OTLPMetricExporter: vi.fn(function MockProtoMetricExporter(this: unknown) {
		return {
			export: vi.fn(),
			shutdown: vi.fn(),
		};
	}),
}));

vi.mock("@opentelemetry/exporter-prometheus", () => ({
	PrometheusExporter: vi.fn(function MockPrometheusExporter(this: unknown) {
		return {
			export: vi.fn(),
			shutdown: vi.fn(),
		};
	}),
}));

vi.mock("@opentelemetry/host-metrics", () => ({
	HostMetrics: vi.fn(function MockHostMetrics(this: unknown) {
		return {
			start: vi.fn(),
			shutdown: vi.fn(),
		};
	}),
}));

vi.mock("@opentelemetry/sdk-metrics", () => ({
	PeriodicExportingMetricReader: vi.fn(
		function MockPeriodicExportingMetricReader(this: unknown) {
			return {
				export: vi.fn(),
				shutdown: vi.fn(),
			};
		},
	),
}));

describe("exporters/metrics", () => {
	let originalProcessEnv: NodeJS.ProcessEnv;
	let originalGlobalPresets: any;

	beforeEach(() => {
		// Store original values
		originalProcessEnv = { ...process.env };
		originalGlobalPresets = globalThis.__OTEL_PRESETS__;

		// Reset environment variables
		process.env = { ...originalProcessEnv };
		delete process.env.OTEL_PROMETHEUS_PORT;
		delete process.env.OTEL_PROMETHEUS_ENDPOINT;
		delete process.env.OTEL_PROMETHEUS_HOST;
		delete process.env.OTEL_PROMETHEUS_PREFIX;
		delete process.env.OTEL_PROMETHEUS_APPEND_TIMESTAMP;
		delete process.env.OTEL_PROMETHEUS_RESOURCE_LABELS;

		// Reset global presets
		globalThis.__OTEL_PRESETS__ = {
			prometheusConfig: {
				port: 9464,
				endpoint: "/metrics",
				host: "0.0.0.0",
				prefix: "metrics",
				appendTimestamp: true,
				withResourceConstantLabels: "/service/",
			},
		};

		// Clear all mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Restore original values
		process.env = originalProcessEnv;
		globalThis.__OTEL_PRESETS__ = originalGlobalPresets;

		// Clear all mocks
		vi.clearAllMocks();
	});

	describe("getMetricsExporter", () => {
		it("should return PeriodicExportingMetricReader with ProtoExporter for 'proto'", () => {
			const result = getMetricsExporter("proto");
			expect(result).toBeDefined();
			expect(result).not.toBeNull();
		});

		it("should return PeriodicExportingMetricReader with HttpExporter for 'http'", () => {
			const result = getMetricsExporter("http");
			expect(result).toBeDefined();
			expect(result).not.toBeNull();
		});

		it("should return PeriodicExportingMetricReader with GrpcExporter for 'grpc'", () => {
			const result = getMetricsExporter("grpc");
			expect(result).toBeDefined();
			expect(result).not.toBeNull();
		});

		it("should return PrometheusExporter for 'prometheus'", () => {
			const result = getMetricsExporter("prometheus");
			expect(result).toBeDefined();
			expect(result).not.toBeNull();
		});

		it("should return null for 'none'", () => {
			const result = getMetricsExporter("none");
			expect(result).toBeNull();
		});

		it("should return null for undefined", () => {
			const result = getMetricsExporter(undefined as any);
			expect(result).toBeNull();
		});

		it("should return null for invalid preset", () => {
			const result = getMetricsExporter("invalid" as any);
			expect(result).toBeNull();
		});

		describe("Prometheus configuration", () => {
			it("should use environment variables for Prometheus configuration", async () => {
				process.env.OTEL_PROMETHEUS_PORT = "8080";
				process.env.OTEL_PROMETHEUS_ENDPOINT = "/custom-metrics";
				process.env.OTEL_PROMETHEUS_HOST = "localhost";
				process.env.OTEL_PROMETHEUS_PREFIX = "custom";
				process.env.OTEL_PROMETHEUS_APPEND_TIMESTAMP = "false";
				process.env.OTEL_PROMETHEUS_RESOURCE_LABELS = "/custom/";

				const result = getMetricsExporter("prometheus");
				expect(result).toBeDefined();
				expect(result).not.toBeNull();
			});

			it("should use global presets for Prometheus configuration when env vars are not set", async () => {
				globalThis.__OTEL_PRESETS__ = {
					prometheusConfig: {
						port: 9090,
						endpoint: "/custom-metrics",
						host: "127.0.0.1",
						prefix: "custom",
						appendTimestamp: false,
						withResourceConstantLabels: "/custom/",
					},
				};

				const result = getMetricsExporter("prometheus");
				expect(result).toBeDefined();
				expect(result).not.toBeNull();
			});

			it("should use default values when neither env vars nor global presets are set", async () => {
				globalThis.__OTEL_PRESETS__ = {};

				const result = getMetricsExporter("prometheus");
				expect(result).toBeDefined();
				expect(result).not.toBeNull();
			});

			it("should handle string port conversion", async () => {
				process.env.OTEL_PROMETHEUS_PORT = "8080";

				const result = getMetricsExporter("prometheus");
				expect(result).toBeDefined();
				expect(result).not.toBeNull();
			});

			it("should handle boolean appendTimestamp conversion", async () => {
				process.env.OTEL_PROMETHEUS_APPEND_TIMESTAMP = "true";

				const result = getMetricsExporter("prometheus");
				expect(result).toBeDefined();
				expect(result).not.toBeNull();
			});

			it("should handle false appendTimestamp from environment", async () => {
				process.env.OTEL_PROMETHEUS_APPEND_TIMESTAMP = "false";

				const result = getMetricsExporter("prometheus");
				expect(result).toBeDefined();
				expect(result).not.toBeNull();
			});

			it("should handle undefined appendTimestamp from global presets", async () => {
				globalThis.__OTEL_PRESETS__ = {
					prometheusConfig: {
						appendTimestamp: undefined,
					},
				};

				const result = getMetricsExporter("prometheus");
				expect(result).toBeDefined();
				expect(result).not.toBeNull();
			});
		});
	});

	describe("initializeHostMetrics", () => {
		let mockMeterProvider: any;

		beforeEach(() => {
			mockMeterProvider = {
				addMetricReader: vi.fn(),
				shutdown: vi.fn(),
			};
		});

		it("should initialize host metrics on first call", async () => {
			// Mock console.log to avoid noise in tests
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			initializeHostMetrics(mockMeterProvider);

			expect(consoleSpy).toHaveBeenCalledWith(
				"Host metrics initialized for Astro",
			);

			consoleSpy.mockRestore();
		});

		it("should handle multiple meter providers", async () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const meterProvider1 = {
				addMetricReader: vi.fn(),
				shutdown: vi.fn(),
			} as any;
			const meterProvider2 = {
				addMetricReader: vi.fn(),
				shutdown: vi.fn(),
			} as any;

			// The function should not throw errors when called with different providers
			expect(() => initializeHostMetrics(meterProvider1)).not.toThrow();
			expect(() => initializeHostMetrics(meterProvider2)).not.toThrow();

			consoleSpy.mockRestore();
		});
	});
});
