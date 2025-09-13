import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("middleware/index", () => {
	beforeEach(() => {
		// Clear all mocks
		vi.clearAllMocks();

		// Reset global presets
		globalThis.__OTEL_PRESETS__ = {
			experimental: {
				useOptimizedTTLBMeasurement: false,
			},
		};
	});

	afterEach(() => {
		// Clear all mocks
		vi.clearAllMocks();
	});

	it("should export onRequest function", async () => {
		const middleware = await import("./index.js");
		expect(typeof middleware.onRequest).toBe("function");
	});

	it("should handle basic request flow", async () => {
		// Mock the dependencies
		vi.doMock("@opentelemetry/api", () => ({
			SpanStatusCode: {
				ERROR: 2,
				OK: 1,
			},
			trace: {
				getTracer: vi.fn(() => ({
					startActiveSpan: vi.fn((name, callback) => {
						const mockSpan = {
							setAttributes: vi.fn(),
							setAttribute: vi.fn(),
							setStatus: vi.fn(),
							recordException: vi.fn(),
							end: vi.fn(),
						};
						return callback(mockSpan);
					}),
				})),
			},
		}));

		vi.doMock("../utils/getAttributes.js", () => ({
			OTEL_SERVICE_VERSION: "1.0.0",
		}));

		vi.doMock("../utils/metrics-manager.js", () => ({
			getCurrentExporter: vi.fn(() => "prometheus"),
			createMetricsForExporter: vi.fn(() => ({
				httpRequestsTotal: { add: vi.fn() },
				httpRequestDuration: { record: vi.fn() },
				httpServerDurationSeconds: { record: vi.fn() },
			})),
		}));

		vi.doMock("./timing-utils.js", () => ({
			measureTTLBWithAsyncTiming: vi.fn((response) => response),
			measureTTLBWithStreamWrapping: vi.fn((response) => response),
		}));

		// Mock performance.now
		const mockPerformanceNow = vi.fn(() => 1000);
		vi.stubGlobal("performance", { now: mockPerformanceNow });

		// Import the middleware after mocks are set up
		const middleware = await import("./index.js");
		const onRequest = middleware.onRequest;

		// Mock context and next function
		const mockContext = {
			request: { method: "GET" },
			url: {
				pathname: "/test",
				protocol: "https:",
				hostname: "example.com",
				toString: () => "https://example.com/test",
			},
		};

		const mockResponse = new Response("test", { status: 200 });
		const mockNext = vi.fn().mockResolvedValue(mockResponse);

		// Call the middleware
		const result = await onRequest(mockContext, mockNext);

		// Verify the response is returned
		expect(result).toBe(mockResponse);
		expect(mockNext).toHaveBeenCalled();
	});

	it("should handle error responses", async () => {
		// Mock the dependencies
		vi.doMock("@opentelemetry/api", () => ({
			SpanStatusCode: {
				ERROR: 2,
				OK: 1,
			},
			trace: {
				getTracer: vi.fn(() => ({
					startActiveSpan: vi.fn((name, callback) => {
						const mockSpan = {
							setAttributes: vi.fn(),
							setAttribute: vi.fn(),
							setStatus: vi.fn(),
							recordException: vi.fn(),
							end: vi.fn(),
						};
						return callback(mockSpan);
					}),
				})),
			},
		}));

		vi.doMock("../utils/getAttributes.js", () => ({
			OTEL_SERVICE_VERSION: "1.0.0",
		}));

		vi.doMock("../utils/metrics-manager.js", () => ({
			getCurrentExporter: vi.fn(() => "prometheus"),
			createMetricsForExporter: vi.fn(() => ({
				httpRequestsTotal: { add: vi.fn() },
				httpRequestDuration: { record: vi.fn() },
				httpServerDurationSeconds: { record: vi.fn() },
			})),
		}));

		vi.doMock("./timing-utils.js", () => ({
			measureTTLBWithAsyncTiming: vi.fn((response) => response),
			measureTTLBWithStreamWrapping: vi.fn((response) => response),
		}));

		// Mock performance.now
		const mockPerformanceNow = vi.fn(() => 1000);
		vi.stubGlobal("performance", { now: mockPerformanceNow });

		// Import the middleware after mocks are set up
		const middleware = await import("./index.js");
		const onRequest = middleware.onRequest;

		// Mock context and next function
		const mockContext = {
			request: { method: "GET" },
			url: {
				pathname: "/test",
				protocol: "https:",
				hostname: "example.com",
				toString: () => "https://example.com/test",
			},
		};

		const mockResponse = new Response("Not Found", { status: 404 });
		const mockNext = vi.fn().mockResolvedValue(mockResponse);

		// Call the middleware
		const result = await onRequest(mockContext, mockNext);

		// Verify the response is returned
		expect(result).toBe(mockResponse);
		expect(mockNext).toHaveBeenCalled();
	});

	it("should handle request errors", async () => {
		// Mock the dependencies
		vi.doMock("@opentelemetry/api", () => ({
			SpanStatusCode: {
				ERROR: 2,
				OK: 1,
			},
			trace: {
				getTracer: vi.fn(() => ({
					startActiveSpan: vi.fn((name, callback) => {
						const mockSpan = {
							setAttributes: vi.fn(),
							setAttribute: vi.fn(),
							setStatus: vi.fn(),
							recordException: vi.fn(),
							end: vi.fn(),
						};
						return callback(mockSpan);
					}),
				})),
			},
		}));

		vi.doMock("../utils/getAttributes.js", () => ({
			OTEL_SERVICE_VERSION: "1.0.0",
		}));

		vi.doMock("../utils/metrics-manager.js", () => ({
			getCurrentExporter: vi.fn(() => "prometheus"),
			createMetricsForExporter: vi.fn(() => ({
				httpRequestsTotal: { add: vi.fn() },
				httpRequestDuration: { record: vi.fn() },
				httpServerDurationSeconds: { record: vi.fn() },
			})),
		}));

		vi.doMock("./timing-utils.js", () => ({
			measureTTLBWithAsyncTiming: vi.fn((response) => response),
			measureTTLBWithStreamWrapping: vi.fn((response) => response),
		}));

		// Mock performance.now
		const mockPerformanceNow = vi.fn(() => 1000);
		vi.stubGlobal("performance", { now: mockPerformanceNow });

		// Import the middleware after mocks are set up
		const middleware = await import("./index.js");
		const onRequest = middleware.onRequest;

		// Mock context and next function
		const mockContext = {
			request: { method: "GET" },
			url: {
				pathname: "/test",
				protocol: "https:",
				hostname: "example.com",
				toString: () => "https://example.com/test",
			},
		};

		const error = new Error("Request failed");
		const mockNext = vi.fn().mockRejectedValue(error);

		// Call the middleware and expect it to throw
		await expect(onRequest(mockContext, mockNext)).rejects.toThrow(
			"Request failed",
		);
		expect(mockNext).toHaveBeenCalled();
	});
});
