import { Registry } from "prom-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initRegistry } from "../metrics/index.js";
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
	let middleware: ReturnType<typeof createPrometheusMiddleware>;

	beforeEach(() => {
		registry = new Registry();
		// Initialize the registry and metrics as in index.test.ts
		initRegistry({
			register: registry,
			registerContentType: "PROMETHEUS",
		});
		middleware = createPrometheusMiddleware(registry);
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

	it("records http_server_duration_seconds for responses without body", async () => {
		const context = createMockContext("DELETE", "/resource/123");
		const next = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

		await middleware(context as any, next);
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
		const metricsText = await registry.metrics();

		expect(metricsText).toContain(
			'http_requests_total{method="GET",path="/error",status="500"}',
		);
		expect(metricsText).toContain("http_request_duration_seconds_bucket{le=");
		expect(metricsText).toContain('method="GET",path="/error",status="500"');
	});
});
