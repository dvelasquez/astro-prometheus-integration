import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock OpenTelemetry modules
vi.doMock("@opentelemetry/auto-instrumentations-node", () => ({
	getNodeAutoInstrumentations: vi.fn(() => []),
}));

vi.doMock("@opentelemetry/instrumentation-http", () => ({
	HttpInstrumentation: vi.fn(),
}));

vi.doMock("@opentelemetry/resources", () => ({
	resourceFromAttributes: vi.fn(() => ({ attributes: {} })),
}));

vi.doMock("@opentelemetry/semantic-conventions", () => ({
	ATTR_SERVICE_NAME: "service.name",
	ATTR_SERVICE_VERSION: "service.version",
}));

vi.doMock("../exporters/metrics.js", () => ({
	getMetricsExporter: vi.fn(),
}));

vi.doMock("../exporters/traces.js", () => ({
	getTraceExporter: vi.fn(),
}));

vi.doMock("../utils/getAttributes.js", () => ({
	OTEL_SERVICE_NAME: "test-service",
	OTEL_SERVICE_VERSION: "1.0.0",
}));

describe("config/sdk-config", () => {
	let originalGlobalPresets: typeof globalThis.__OTEL_PRESETS__;

	beforeEach(() => {
		// Store original global presets
		originalGlobalPresets = globalThis.__OTEL_PRESETS__;

		// Clear all mocks
		vi.clearAllMocks();

		// Reset global presets
		globalThis.__OTEL_PRESETS__ = {
			metricExporter: "none",
			traceExporter: "console",
			experimental: {
				useOptimizedTTLBMeasurement: false,
			},
		};
	});

	afterEach(() => {
		// Restore original global presets
		globalThis.__OTEL_PRESETS__ = originalGlobalPresets;

		// Clear all mocks
		vi.clearAllMocks();
	});

	describe("createHttpInstrumentation", () => {
		it("should create HTTP instrumentation with default configuration", async () => {
			const { HttpInstrumentation } = await import(
				"@opentelemetry/instrumentation-http"
			);
			const mockInstrumentation = {};
			HttpInstrumentation.mockReturnValue(mockInstrumentation);

			const { createHttpInstrumentation } = await import("./sdk-config.js");
			const result = createHttpInstrumentation();

			expect(HttpInstrumentation).toHaveBeenCalledWith({
				enabled: true,
				requestHook: expect.any(Function),
				responseHook: expect.any(Function),
				ignoreIncomingRequestHook: expect.any(Function),
				ignoreOutgoingRequestHook: expect.any(Function),
			});
			expect(result).toBe(mockInstrumentation);
		});

		it("should configure request hook correctly", async () => {
			const { HttpInstrumentation } = await import(
				"@opentelemetry/instrumentation-http"
			);
			HttpInstrumentation.mockImplementation((config) => config);

			const { createHttpInstrumentation } = await import("./sdk-config.js");
			const config = createHttpInstrumentation();
			const mockSpan = {
				setAttributes: vi.fn(),
			};
			const mockRequest = {
				method: "GET",
				url: "https://example.com/test",
			};

			config.requestHook(mockSpan, mockRequest);

			expect(mockSpan.setAttributes).toHaveBeenCalledWith({
				"http.request.method": "GET",
				"http.request.url": "https://example.com/test",
			});
		});

		it("should configure request hook with default values for missing properties", async () => {
			const { HttpInstrumentation } = await import(
				"@opentelemetry/instrumentation-http"
			);
			HttpInstrumentation.mockImplementation((config) => config);

			const { createHttpInstrumentation } = await import("./sdk-config.js");
			const config = createHttpInstrumentation();
			const mockSpan = {
				setAttributes: vi.fn(),
			};
			const mockRequest = {};

			config.requestHook(mockSpan, mockRequest);

			expect(mockSpan.setAttributes).toHaveBeenCalledWith({
				"http.request.method": "UNKNOWN",
				"http.request.url": "",
			});
		});

		it("should configure response hook correctly", async () => {
			const { HttpInstrumentation } = await import(
				"@opentelemetry/instrumentation-http"
			);
			HttpInstrumentation.mockImplementation((config) => config);

			const { createHttpInstrumentation } = await import("./sdk-config.js");
			const config = createHttpInstrumentation();
			const mockSpan = {
				setAttributes: vi.fn(),
			};
			const mockResponse = {
				statusCode: 200,
				statusMessage: "OK",
			};

			config.responseHook(mockSpan, mockResponse);

			expect(mockSpan.setAttributes).toHaveBeenCalledWith({
				"http.response.status_code": 200,
				"http.response.status_text": "OK",
			});
		});

		it("should configure response hook with default values for missing properties", async () => {
			const { HttpInstrumentation } = await import(
				"@opentelemetry/instrumentation-http"
			);
			HttpInstrumentation.mockImplementation((config) => config);

			const { createHttpInstrumentation } = await import("./sdk-config.js");
			const config = createHttpInstrumentation();
			const mockSpan = {
				setAttributes: vi.fn(),
			};
			const mockResponse = {};

			config.responseHook(mockSpan, mockResponse);

			expect(mockSpan.setAttributes).toHaveBeenCalledWith({
				"http.response.status_code": 0,
				"http.response.status_text": "",
			});
		});

		it("should ignore health check endpoints for incoming requests", async () => {
			const { HttpInstrumentation } = await import(
				"@opentelemetry/instrumentation-http"
			);
			HttpInstrumentation.mockImplementation((config) => config);

			const { createHttpInstrumentation } = await import("./sdk-config.js");
			const config = createHttpInstrumentation();

			expect(config.ignoreIncomingRequestHook({ url: "/health" })).toBe(true);
			expect(config.ignoreIncomingRequestHook({ url: "/ping" })).toBe(true);
			expect(config.ignoreIncomingRequestHook({ url: "/api/test" })).toBe(
				false,
			);
			expect(config.ignoreIncomingRequestHook({})).toBe(false);
		});

		it("should ignore OpenTelemetry endpoints for outgoing requests", async () => {
			const { HttpInstrumentation } = await import(
				"@opentelemetry/instrumentation-http"
			);
			HttpInstrumentation.mockImplementation((config) => config);

			const { createHttpInstrumentation } = await import("./sdk-config.js");
			const config = createHttpInstrumentation();

			expect(config.ignoreOutgoingRequestHook({ url: "/v1/traces" })).toBe(
				true,
			);
			expect(config.ignoreOutgoingRequestHook({ url: "/v1/metrics" })).toBe(
				true,
			);
			expect(config.ignoreOutgoingRequestHook({ url: "/api/test" })).toBe(
				false,
			);
			expect(config.ignoreOutgoingRequestHook({})).toBe(false);
		});
	});

	describe("isPrometheusEnabled", () => {
		it("should return true when metric exporter is prometheus", async () => {
			globalThis.__OTEL_PRESETS__ = {
				metricExporter: "prometheus",
			};

			const { isPrometheusEnabled } = await import("./sdk-config.js");
			expect(isPrometheusEnabled()).toBe(true);
		});

		it("should return false when metric exporter is not prometheus", async () => {
			globalThis.__OTEL_PRESETS__ = {
				metricExporter: "console",
			};

			const { isPrometheusEnabled } = await import("./sdk-config.js");
			expect(isPrometheusEnabled()).toBe(false);
		});

		it("should return false when metric exporter is undefined", async () => {
			globalThis.__OTEL_PRESETS__ = {};

			const { isPrometheusEnabled } = await import("./sdk-config.js");
			expect(isPrometheusEnabled()).toBe(false);
		});

		it("should return false when global presets are undefined", async () => {
			globalThis.__OTEL_PRESETS__ = undefined;

			const { isPrometheusEnabled } = await import("./sdk-config.js");
			expect(isPrometheusEnabled()).toBe(false);
		});
	});

	describe("buildSDKConfig", () => {
		let getMetricsExporter: any;
		let getTraceExporter: any;
		let resourceFromAttributes: any;
		let HttpInstrumentation: any;

		beforeEach(async () => {
			getMetricsExporter = (await import("../exporters/metrics.js"))
				.getMetricsExporter;
			getTraceExporter = (await import("../exporters/traces.js"))
				.getTraceExporter;
			resourceFromAttributes = (await import("@opentelemetry/resources"))
				.resourceFromAttributes;
			HttpInstrumentation = (
				await import("@opentelemetry/instrumentation-http")
			).HttpInstrumentation;

			const mockResource = { attributes: { "service.name": "test-service" } };
			resourceFromAttributes.mockReturnValue(mockResource);

			const mockHttpInstrumentation = { name: "http-instrumentation" };
			HttpInstrumentation.mockReturnValue(mockHttpInstrumentation);
		});

		it("should build basic SDK configuration", async () => {
			getMetricsExporter.mockReturnValue(null);
			getTraceExporter.mockReturnValue(null);

			const { buildSDKConfig } = await import("./sdk-config.js");
			const result = buildSDKConfig({});

			expect(result).toEqual({
				resource: { attributes: { "service.name": "test-service" } },
				instrumentations: [{ name: "http-instrumentation" }],
			});

			expect(resourceFromAttributes).toHaveBeenCalledWith({
				"service.name": "test-service",
				"service.version": "1.0.0",
			});
		});

		it("should include trace exporter when available", async () => {
			const mockTraceExporter = { name: "trace-exporter" };
			getTraceExporter.mockReturnValue(mockTraceExporter);
			getMetricsExporter.mockReturnValue(null);

			const { buildSDKConfig } = await import("./sdk-config.js");
			const result = buildSDKConfig({
				traceExporter: "console",
			});

			expect(result.traceExporter).toBe(mockTraceExporter);
			expect(getTraceExporter).toHaveBeenCalledWith("console");
		});

		it("should include metrics exporter when available", async () => {
			const mockMetricsExporter = { name: "metrics-exporter" };
			getMetricsExporter.mockReturnValue(mockMetricsExporter);
			getTraceExporter.mockReturnValue(null);

			const { buildSDKConfig } = await import("./sdk-config.js");
			const result = buildSDKConfig({
				metricExporter: "http",
			});

			expect(result.metricReaders).toEqual([mockMetricsExporter]);
			expect(getMetricsExporter).toHaveBeenCalledWith("http");
		});

		it("should add auto instrumentations for Prometheus", async () => {
			const mockMetricsExporter = { name: "prometheus-exporter" };
			getMetricsExporter.mockReturnValue(mockMetricsExporter);
			getTraceExporter.mockReturnValue(null);

			globalThis.__OTEL_PRESETS__ = {
				metricExporter: "prometheus",
			};

			const { getNodeAutoInstrumentations } = await import(
				"@opentelemetry/auto-instrumentations-node"
			);
			const mockAutoInstrumentations = [{ name: "auto-instrumentation" }];
			getNodeAutoInstrumentations.mockReturnValue(mockAutoInstrumentations);

			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const { buildSDKConfig } = await import("./sdk-config.js");
			const result = buildSDKConfig({
				metricExporter: "prometheus",
			});

			expect(result.instrumentations).toEqual([
				{ name: "http-instrumentation" },
				mockAutoInstrumentations,
			]);

			expect(getNodeAutoInstrumentations).toHaveBeenCalledWith({
				"@opentelemetry/instrumentation-http": {
					enabled: false,
				},
				"@opentelemetry/instrumentation-fs": {
					enabled: true,
				},
				"@opentelemetry/instrumentation-dns": {
					enabled: true,
				},
				"@opentelemetry/instrumentation-net": {
					enabled: true,
				},
				"@opentelemetry/instrumentation-express": {
					enabled: true,
				},
				"@opentelemetry/instrumentation-connect": {
					enabled: true,
				},
			});

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.any(String),
				expect.stringContaining(
					"Prometheus metrics enabled - adding comprehensive auto instrumentations",
				),
			);

			consoleSpy.mockRestore();
		});

		it("should not add auto instrumentations for non-Prometheus metrics", async () => {
			const mockMetricsExporter = { name: "http-exporter" };
			getMetricsExporter.mockReturnValue(mockMetricsExporter);
			getTraceExporter.mockReturnValue(null);

			globalThis.__OTEL_PRESETS__ = {
				metricExporter: "http",
			};

			const { getNodeAutoInstrumentations } = await import(
				"@opentelemetry/auto-instrumentations-node"
			);
			getNodeAutoInstrumentations.mockClear();

			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const { buildSDKConfig } = await import("./sdk-config.js");
			const result = buildSDKConfig({
				metricExporter: "http",
			});

			expect(result.instrumentations).toEqual([
				{ name: "http-instrumentation" },
			]);
			expect(getNodeAutoInstrumentations).not.toHaveBeenCalled();

			expect(consoleSpy).toHaveBeenCalledWith(
				"Prometheus metrics disabled - using basic HTTP instrumentation only",
			);

			consoleSpy.mockRestore();
		});

		it("should handle undefined presets", async () => {
			getMetricsExporter.mockReturnValue(null);
			getTraceExporter.mockReturnValue(null);

			const { buildSDKConfig } = await import("./sdk-config.js");
			const result = buildSDKConfig(undefined);

			expect(result).toEqual({
				resource: { attributes: { "service.name": "test-service" } },
				instrumentations: [{ name: "http-instrumentation" }],
			});

			expect(getTraceExporter).toHaveBeenCalledWith(undefined);
			expect(getMetricsExporter).toHaveBeenCalledWith(undefined);
		});

		it("should handle both trace and metrics exporters", async () => {
			const mockTraceExporter = { name: "trace-exporter" };
			const mockMetricsExporter = { name: "metrics-exporter" };
			getTraceExporter.mockReturnValue(mockTraceExporter);
			getMetricsExporter.mockReturnValue(mockMetricsExporter);

			const { buildSDKConfig } = await import("./sdk-config.js");
			const result = buildSDKConfig({
				traceExporter: "console",
				metricExporter: "http",
			});

			expect(result.traceExporter).toBe(mockTraceExporter);
			expect(result.metricReaders).toEqual([mockMetricsExporter]);
		});
	});
});
