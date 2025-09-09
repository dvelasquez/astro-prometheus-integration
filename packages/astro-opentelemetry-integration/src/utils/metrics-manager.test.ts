import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMetricsForExporter,
	getCurrentExporter,
	getMetricsMeter,
	shouldCreateMetrics,
} from "./metrics-manager.js";

// Mock OpenTelemetry API
vi.mock("@opentelemetry/api", () => ({
	metrics: {
		getMeter: vi.fn(() => ({
			createCounter: vi.fn(() => ({ add: vi.fn() })),
			createHistogram: vi.fn(() => ({ record: vi.fn() })),
		})),
	},
}));

// Mock getAttributes
vi.mock("./getAttributes.js", () => ({
	OTEL_SERVICE_VERSION: "1.0.0",
}));

describe("metrics-manager", () => {
	let originalGlobalPresets: any;

	beforeEach(() => {
		// Store original global presets
		originalGlobalPresets = globalThis.__OTEL_PRESETS__;

		// Set up default global presets
		globalThis.__OTEL_PRESETS__ = {
			metricExporter: "none",
		};
	});

	afterEach(() => {
		// Restore original global presets
		globalThis.__OTEL_PRESETS__ = originalGlobalPresets;

		// Clear all mocks
		vi.clearAllMocks();
	});

	describe("shouldCreateMetrics", () => {
		it("should return true for prometheus exporter", () => {
			expect(shouldCreateMetrics("prometheus")).toBe(true);
		});

		it("should return true for http exporter", () => {
			expect(shouldCreateMetrics("http")).toBe(true);
		});

		it("should return true for grpc exporter", () => {
			expect(shouldCreateMetrics("grpc")).toBe(true);
		});

		it("should return true for proto exporter", () => {
			expect(shouldCreateMetrics("proto")).toBe(true);
		});

		it("should return false for none exporter", () => {
			expect(shouldCreateMetrics("none")).toBe(false);
		});

		it("should return false for undefined exporter", () => {
			expect(shouldCreateMetrics(undefined as any)).toBe(false);
		});
	});

	describe("getMetricsMeter", () => {
		it("should call metrics.getMeter with correct parameters", async () => {
			const { metrics } = await import("@opentelemetry/api");

			getMetricsMeter();

			expect(metrics.getMeter).toHaveBeenCalledWith(
				"astro-opentelemetry-integration-metrics",
				"1.0.0",
			);
		});

		it("should return the meter from OpenTelemetry API", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockMeter = { name: "test-meter" };
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			const result = getMetricsMeter();

			expect(result).toBe(mockMeter);
		});
	});

	describe("createMetricsForExporter", () => {
		it("should return null metrics for none exporter", () => {
			const result = createMetricsForExporter("none");

			expect(result.httpRequestsTotal).toBeNull();
			expect(result.httpRequestDuration).toBeNull();
			expect(result.httpServerDurationSeconds).toBeNull();
		});

		it("should return null metrics for undefined exporter", () => {
			const result = createMetricsForExporter(undefined as any);

			expect(result.httpRequestsTotal).toBeNull();
			expect(result.httpRequestDuration).toBeNull();
			expect(result.httpServerDurationSeconds).toBeNull();
		});

		it("should create detailed metrics for prometheus exporter", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockCounter = { add: vi.fn() };
			const mockHistogram = { record: vi.fn() };
			const mockMeter = {
				createCounter: vi.fn(() => mockCounter),
				createHistogram: vi.fn(() => mockHistogram),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			const result = createMetricsForExporter("prometheus");

			expect(result.httpRequestsTotal).toBe(mockCounter);
			expect(result.httpRequestDuration).toBe(mockHistogram);
			expect(result.httpServerDurationSeconds).toBe(mockHistogram);

			// Verify counter creation
			expect(mockMeter.createCounter).toHaveBeenCalledWith(
				"http_requests_total",
				{
					description: "Total number of HTTP requests",
				},
			);

			// Verify histogram creation
			expect(mockMeter.createHistogram).toHaveBeenCalledTimes(2);
			expect(mockMeter.createHistogram).toHaveBeenCalledWith(
				"http_request_duration_seconds",
				{
					description:
						"Duration in seconds of initial server-side request processing, including middleware and Astro frontmatter, measured until the response is ready to send/stream.",
				},
			);
			expect(mockMeter.createHistogram).toHaveBeenCalledWith(
				"http_server_duration_seconds",
				{
					description:
						"Full server-side HTTP request duration in seconds, including processing, Astro rendering, and response streaming.",
				},
			);
		});

		it("should create essential metrics for http exporter", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockHistogram = { record: vi.fn() };
			const mockMeter = {
				createCounter: vi.fn(),
				createHistogram: vi.fn(() => mockHistogram),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			const result = createMetricsForExporter("http");

			expect(result.httpRequestsTotal).toBeNull();
			expect(result.httpRequestDuration).toBe(mockHistogram);
			expect(result.httpServerDurationSeconds).toBe(mockHistogram);

			// Verify only histograms are created
			expect(mockMeter.createCounter).not.toHaveBeenCalled();
			expect(mockMeter.createHistogram).toHaveBeenCalledTimes(2);
		});

		it("should create essential metrics for grpc exporter", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockHistogram = { record: vi.fn() };
			const mockMeter = {
				createCounter: vi.fn(),
				createHistogram: vi.fn(() => mockHistogram),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			const result = createMetricsForExporter("grpc");

			expect(result.httpRequestsTotal).toBeNull();
			expect(result.httpRequestDuration).toBe(mockHistogram);
			expect(result.httpServerDurationSeconds).toBe(mockHistogram);

			// Verify only histograms are created
			expect(mockMeter.createCounter).not.toHaveBeenCalled();
			expect(mockMeter.createHistogram).toHaveBeenCalledTimes(2);
		});

		it("should create essential metrics for proto exporter", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockHistogram = { record: vi.fn() };
			const mockMeter = {
				createCounter: vi.fn(),
				createHistogram: vi.fn(() => mockHistogram),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			const result = createMetricsForExporter("proto");

			expect(result.httpRequestsTotal).toBeNull();
			expect(result.httpRequestDuration).toBe(mockHistogram);
			expect(result.httpServerDurationSeconds).toBe(mockHistogram);

			// Verify only histograms are created
			expect(mockMeter.createCounter).not.toHaveBeenCalled();
			expect(mockMeter.createHistogram).toHaveBeenCalledTimes(2);
		});
	});

	describe("getCurrentExporter", () => {
		it("should return the current exporter from global presets", () => {
			globalThis.__OTEL_PRESETS__ = {
				metricExporter: "prometheus",
			};

			const result = getCurrentExporter();

			expect(result).toBe("prometheus");
		});

		it("should return 'none' when global presets is undefined", () => {
			globalThis.__OTEL_PRESETS__ = undefined;

			const result = getCurrentExporter();

			expect(result).toBe("none");
		});

		it("should return 'none' when metricExporter is not set", () => {
			globalThis.__OTEL_PRESETS__ = {};

			const result = getCurrentExporter();

			expect(result).toBe("none");
		});

		it("should return 'none' when metricExporter is undefined", () => {
			globalThis.__OTEL_PRESETS__ = {
				metricExporter: undefined,
			};

			const result = getCurrentExporter();

			expect(result).toBe("none");
		});
	});

	describe("integration with OpenTelemetry API", () => {
		it("should handle meter creation errors gracefully", async () => {
			const { metrics } = await import("@opentelemetry/api");
			vi.mocked(metrics.getMeter).mockImplementation(() => {
				throw new Error("Meter creation failed");
			});

			expect(() => {
				createMetricsForExporter("prometheus");
			}).toThrow("Meter creation failed");
		});

		it("should handle counter creation errors gracefully", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockMeter = {
				createCounter: vi.fn(() => {
					throw new Error("Counter creation failed");
				}),
				createHistogram: vi.fn(() => ({ record: vi.fn() })),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			expect(() => {
				createMetricsForExporter("prometheus");
			}).toThrow("Counter creation failed");
		});

		it("should handle histogram creation errors gracefully", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockMeter = {
				createCounter: vi.fn(() => ({ add: vi.fn() })),
				createHistogram: vi.fn(() => {
					throw new Error("Histogram creation failed");
				}),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			expect(() => {
				createMetricsForExporter("prometheus");
			}).toThrow("Histogram creation failed");
		});
	});
});
