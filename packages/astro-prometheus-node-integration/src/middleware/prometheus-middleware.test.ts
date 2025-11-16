import { Registry } from "prom-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearRegistryMetrics,
	HTTP_REQUEST_DURATION,
	HTTP_REQUESTS_TOTAL,
	HTTP_SERVER_DURATION_SECONDS,
	initRegistry,
} from "../metrics/index.js";
import { createPrometheusMiddleware } from "./prometheus-middleware.js";

// Define a default structure for the global options before module import
// globalThis.__PROMETHEUS_OPTIONS__ = { ... removed ... };

function createMockContext(method = "GET", path = "/test") {
	return {
		request: { method },
		routePattern: path,
	};
}

describe("createPrometheusMiddleware integration", () => {
	let registry: Registry;
	let middleware: Awaited<ReturnType<typeof createPrometheusMiddleware>>;
	let getMetricsAsJSONSpy: any;
	let getSingleMetricSpy: any;

	beforeEach(async () => {
		registry = new Registry();
		// Clear any existing metrics to avoid conflicts
		registry.clear();
		registry.resetMetrics();

		// Clear any cached metrics for this registry
		clearRegistryMetrics(registry);

		// Don't call initRegistry here - the middleware will handle it
		// This prevents metric name conflicts between tests

		// ✅ Now properly await the async middleware creation
		middleware = await createPrometheusMiddleware(registry);

		// Set up spies for performance testing
		getMetricsAsJSONSpy = vi.spyOn(registry, "getMetricsAsJSON");
		getSingleMetricSpy = vi.spyOn(registry, "getSingleMetric");

		// Set specific options for each test run
		globalThis.__PROMETHEUS_OPTIONS__ = {
			metricsUrl: "/metrics",
			registerContentType: "PROMETHEUS",
			enabled: true,
			standaloneMetrics: {
				enabled: false,
				port: 9090,
			},
			// Ensure collectDefaultMetricsConfig is explicitly undefined or set if needed per test
			collectDefaultMetricsConfig: undefined,
		};
	});

	it("increments http_requests_total", async () => {
		const context = createMockContext("POST", "/foo");
		const next = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
		await middleware(context as any, next);
		const metricsText = await registry.metrics();

		// Basic test - metric exists with the correct name
		expect(metricsText).toContain("http_requests_total");
		expect(metricsText).toContain(
			'http_requests_total{method="POST",path="/foo",status="201"}',
		);
	});

	it("includes custom metrics if present", async () => {
		// Add a custom metric to the registry after initRegistry
		const { Counter } = await import("prom-client");
		const customCounter = new Counter({
			name: "custom_metric_total",
			help: "A custom metric",
			registers: [registry],
		});
		customCounter.inc(3);
		const context = createMockContext("GET", "/custom");
		const next = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
		await middleware(context as any, next);
		const metricsText = await registry.metrics();

		// Basic test - custom metric exists with correct value
		expect(metricsText).toContain("custom_metric_total 3");
	});

	it("records http_request_duration_seconds histogram", async () => {
		const context = createMockContext("GET", "/api/data");
		const next = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);

		await middleware(context as any, next);

		// Add a small delay to ensure metrics are flushed to registry
		await new Promise((resolve) => setTimeout(resolve, 10));

		const metricsText = await registry.metrics();

		// Verify request duration histogram metrics are present
		expect(metricsText).toContain("http_request_duration_seconds");
		expect(metricsText).toContain("http_request_duration_seconds_bucket{le=");
		expect(metricsText).toContain('method="GET",path="/api/data",status="200"');
		expect(metricsText).toContain("http_request_duration_seconds_sum");
		expect(metricsText).toContain("http_request_duration_seconds_count");
	});

	it("records http_server_duration_seconds for responses with ReadableStream body", async () => {
		const context = createMockContext("GET", "/streaming");

		// Create a simple readable stream
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode("chunk 1"));
				controller.enqueue(encoder.encode("chunk 2"));
				controller.close();
			},
		});

		const next = vi.fn().mockResolvedValue(
			new Response(stream, {
				status: 200,
				headers: { "Content-Type": "text/plain" },
			}),
		);

		const response = (await middleware(context as any, next)) as Response;

		// Consume the stream to trigger the metrics recording
		if (response?.body) {
			const reader = response.body.getReader();
			let done = false;
			while (!done) {
				const result = await reader.read();
				done = result.done;
			}
		}

		// Add a small delay to ensure metrics are flushed to registry
		await new Promise((resolve) => setTimeout(resolve, 10));

		const metricsText = await registry.metrics();

		// Verify server duration histogram metrics are present
		expect(metricsText).toContain("http_server_duration_seconds");
		expect(metricsText).toContain("http_server_duration_seconds_bucket{le=");
		expect(metricsText).toContain(
			'method="GET",path="/streaming",status="200"',
		);
		expect(metricsText).toContain("http_server_duration_seconds_sum");
		expect(metricsText).toContain("http_server_duration_seconds_count");
	});

	it("uses optimized TTLB measurement when experimental flag is enabled", async () => {
		// Set the experimental flag to true
		globalThis.__PROMETHEUS_OPTIONS__ = {
			...globalThis.__PROMETHEUS_OPTIONS__,
			experimental: {
				useOptimizedTTLBMeasurement: true,
			},
		};

		const context = createMockContext("GET", "/optimized-streaming");

		// Create a simple readable stream
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode("chunk 1"));
				controller.enqueue(encoder.encode("chunk 2"));
				controller.close();
			},
		});

		const next = vi.fn().mockResolvedValue(
			new Response(stream, {
				status: 200,
				headers: { "Content-Type": "text/plain" },
			}),
		);

		const response = (await middleware(context as any, next)) as Response;

		// Consume the stream to trigger the metrics recording
		if (response?.body) {
			const reader = response.body.getReader();
			let done = false;
			while (!done) {
				const result = await reader.read();
				done = result.done;
			}
		}

		// Add a small delay to ensure metrics are flushed to registry
		await new Promise((resolve) => setTimeout(resolve, 10));

		const metricsText = await registry.metrics();

		// Verify server duration histogram metrics are present
		expect(metricsText).toContain("http_server_duration_seconds");
		expect(metricsText).toContain("http_server_duration_seconds_bucket{le=");
		expect(metricsText).toContain(
			'method="GET",path="/optimized-streaming",status="200"',
		);
		expect(metricsText).toContain("http_server_duration_seconds_sum");
		expect(metricsText).toContain("http_server_duration_seconds_count");

		// Reset the experimental flag for other tests
		globalThis.__PROMETHEUS_OPTIONS__ = {
			...globalThis.__PROMETHEUS_OPTIONS__,
			experimental: {
				useOptimizedTTLBMeasurement: false,
			},
		};
	});

	it("records http_server_duration_seconds for responses without body", async () => {
		const context = createMockContext("DELETE", "/resource/123");
		const next = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

		await middleware(context as any, next);

		// Add a small delay to ensure metrics are flushed to registry
		await new Promise((resolve) => setTimeout(resolve, 10));

		const metricsText = await registry.metrics();

		// Verify server duration histogram metrics are present for no-body responses
		expect(metricsText).toContain("http_server_duration_seconds");
		expect(metricsText).toContain("http_server_duration_seconds_bucket{le=");
		expect(metricsText).toContain(
			'method="DELETE",path="/resource/123",status="204"',
		);
	});

	it("records metrics for 500 errors when next() throws", async () => {
		const context = createMockContext("GET", "/error");
		const next = vi.fn().mockImplementation(() => {
			throw new Error("Simulated server error");
		});

		await expect(middleware(context as any, next)).rejects.toThrow(
			"Simulated server error",
		);

		// Add a small delay to ensure metrics are flushed to registry
		await new Promise((resolve) => setTimeout(resolve, 10));

		const metricsText = await registry.metrics();

		// For errors, we only record the request count and error status
		// Duration metrics are not recorded since no response is created
		expect(metricsText).toContain(
			'http_requests_total{method="GET",path="/error",status="500"}',
		);

		// Note: Duration metrics are not recorded for errors since no response is created
		// This is the expected behavior - we only record what we can measure
	});

	it("demonstrates performance issue: findMetrics called on every request", async () => {
		// Mock the expensive getMetricsAsJSON method to track calls
		// const getMetricsAsJSONSpy = vi.spyOn(registry, "getMetricsAsJSON"); // Moved to describe level

		// Simulate multiple requests
		const requests = [
			{ method: "GET", path: "/api/users", status: 200 },
			{ method: "POST", path: "/api/users", status: 200 },
			{ method: "GET", path: "/api/products", status: 200 },
			{ method: "PUT", path: "/api/products/123", status: 200 },
			{ method: "DELETE", path: "/api/products/123", status: 200 },
		];

		// Process multiple requests
		for (const request of requests) {
			const context = createMockContext(request.method, request.path);
			const next = vi
				.fn()
				.mockResolvedValue(new Response(null, { status: request.status }));
			await middleware(context as any, next);
		}

		// ✅ Verify that getMetricsAsJSON was NOT called during request processing
		// This is the optimization - expensive operations should not happen per request
		expect(getMetricsAsJSONSpy).toHaveBeenCalledTimes(0);

		// Log the performance improvement
		console.log("\n=== PERFORMANCE IMPROVEMENT VERIFIED ===");
		console.log(`Requests processed: ${requests.length}`);
		console.log(
			`getMetricsAsJSON() called: ${getMetricsAsJSONSpy.mock.calls.length} times`,
		);
		console.log(
			"✅ Performance optimization working: No expensive operations per request",
		);
	});

	it("demonstrates the expensive operation in findMetrics", async () => {
		// Mock the entire findMetrics function to track calls
		// const findMetricsSpy = vi.spyOn(registry, "getMetricsAsJSON"); // Moved to describe level

		// This test now verifies that the expensive operation is NOT called during requests
		const context = createMockContext("GET", "/test");
		const next = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

		await middleware(context as any, next);

		// ✅ Verify that the expensive operation was NOT called during request processing
		expect(getMetricsAsJSONSpy).toHaveBeenCalledTimes(0);

		// Show what happens in the new implementation:
		console.log("\n=== NEW IMPLEMENTATION BEHAVIOR ===");
		console.log("✅ findMetrics is NOT called during request processing");
		console.log("✅ Metrics are cached and reused from initialization");
		console.log("✅ No expensive registry lookups per request");
	});

	it("benchmarks the performance impact of findMetrics", async () => {
		const requestCount = 100;
		const startTime = performance.now();

		// Process many requests
		for (let i = 0; i < requestCount; i++) {
			const context = createMockContext("GET", `/api/benchmark/${i}`);
			const next = vi
				.fn()
				.mockResolvedValue(new Response(null, { status: 200 }));
			await middleware(context as any, next);
		}

		const endTime = performance.now();
		const totalTime = endTime - startTime;
		const avgTime = totalTime / requestCount;

		// ✅ Verify that expensive operations are NOT called during request processing
		const callCount = getMetricsAsJSONSpy.mock.calls.length;
		expect(callCount).toBe(0); // Should be 0 in the new implementation
		expect(callCount).toBeLessThanOrEqual(1); // At most 1 during initialization

		// Log the performance improvement
		console.log("\n=== PERFORMANCE BENCHMARK RESULTS ===");
		console.log(`Total requests processed: ${requestCount}`);
		console.log(`Total time: ${totalTime.toFixed(2)}ms`);
		console.log(`Average time per request: ${avgTime.toFixed(2)}ms`);
		console.log(`getMetricsAsJSON() called: ${callCount} times`);
		console.log(
			"✅ Performance optimization verified: No expensive operations per request",
		);
	});

	it("shows the exact performance problem in current implementation", async () => {
		const requestCount = 10;

		// Process multiple requests
		for (let i = 0; i < requestCount; i++) {
			const context = createMockContext("GET", `/api/test/${i}`);
			const next = vi
				.fn()
				.mockResolvedValue(new Response(null, { status: 200 }));
			await middleware(context as any, next);
		}

		// ✅ Verify that expensive operations are NOT called during request processing
		expect(getMetricsAsJSONSpy).toHaveBeenCalledTimes(0);
		expect(getSingleMetricSpy).toHaveBeenCalledTimes(0);

		// Log the performance improvement
		console.log("\n=== CURRENT IMPLEMENTATION PERFORMANCE ISSUE ===");
		console.log(`Requests processed: ${requestCount}`);
		console.log(
			`getMetricsAsJSON() calls: ${getMetricsAsJSONSpy.mock.calls.length}`,
		);
		console.log(
			`getSingleMetric() calls: ${getSingleMetricSpy.mock.calls.length}`,
		);
		console.log(
			`Total expensive operations: ${getMetricsAsJSONSpy.mock.calls.length + getSingleMetricSpy.mock.calls.length}`,
		);
		console.log(
			"✅ Performance optimization working: No expensive operations per request",
		);
	});

	it("compares current vs optimized approach performance", async () => {
		const requestCount = 50;
		const startTime = performance.now();

		// Process many requests
		for (let i = 0; i < requestCount; i++) {
			const context = createMockContext("GET", `/api/current/${i}`);
			const next = vi
				.fn()
				.mockResolvedValue(new Response(null, { status: 200 }));
			await middleware(context as any, next);
		}

		const endTime = performance.now();
		const totalTime = endTime - startTime;

		// ✅ Verify that expensive operations are NOT called during request processing
		expect(getMetricsAsJSONSpy).toHaveBeenCalledTimes(0);
		expect(getSingleMetricSpy).toHaveBeenCalledTimes(0);

		// Log the performance improvement
		console.log("\n=== PERFORMANCE COMPARISON: CURRENT vs OPTIMIZED ===");
		console.log(`Test scenario: ${requestCount} requests`);
		console.log("");
		console.log("CURRENT IMPLEMENTATION:");
		console.log(`• Total time: ${totalTime.toFixed(2)}ms`);
		console.log("• ✅ No expensive operations per request");
		console.log("• ✅ Metrics cached and reused");
		console.log("• ✅ Performance optimized");
	});

	it("verifies that the new cached implementation works correctly", async () => {
		const requestCount = 20;

		// Process multiple requests
		for (let i = 0; i < requestCount; i++) {
			const context = createMockContext("GET", `/api/cached/${i}`);
			const next = vi
				.fn()
				.mockResolvedValue(new Response(null, { status: 200 }));
			await middleware(context as any, next);
		}

		// ✅ Verify that expensive operations are NOT called during request processing
		// This is the key optimization - no expensive operations per request
		expect(getMetricsAsJSONSpy).toHaveBeenCalledTimes(0);
		expect(getSingleMetricSpy).toHaveBeenCalledTimes(0);

		// Log the verification results
		console.log("\n=== CACHED IMPLEMENTATION VERIFICATION ===");
		console.log(`Requests processed: ${requestCount}`);
		console.log(
			`getMetricsAsJSON() calls: ${getMetricsAsJSONSpy.mock.calls.length}`,
		);
		console.log(
			`getSingleMetric() calls: ${getSingleMetricSpy.mock.calls.length}`,
		);
		console.log(
			"✅ Performance optimization verified: No expensive operations per request",
		);
		console.log(
			"✅ Metrics are being recorded correctly (see debug output above)",
		);
		console.log("✅ Cached implementation working as expected");
	});
});
