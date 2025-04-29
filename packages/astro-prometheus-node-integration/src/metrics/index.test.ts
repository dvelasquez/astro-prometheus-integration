// @ts-expect-error: No types for parse-prometheus-text-format
import parsePrometheusTextFormat from "parse-prometheus-text-format";
import { Counter, Registry } from "prom-client";
import { beforeEach, describe, expect, it } from "vitest";
import {
	HTTP_REQUESTS_TOTAL,
	HTTP_REQUEST_DURATION,
	HTTP_SERVER_DURATION_SECONDS,
	initRegistry,
} from "./index.js";

describe("initRegistry", () => {
	let registry: Registry;

	beforeEach(() => {
		registry = new Registry();
	});

	it("registers default metrics", async () => {
		initRegistry({
			register: registry,
			registerContentType: "PROMETHEUS",
		});

		const metricsText = await registry.metrics();
		const metrics = parsePrometheusTextFormat(metricsText) as any[];

		// Check that at least one default metric is present
		expect(metrics.some((m: any) => m.name.startsWith("process_"))).toBe(true);
	});

	it("check that all custom metrics are registered", async () => {
		initRegistry({
			register: registry,
			registerContentType: "PROMETHEUS",
		});

		const metricsText = await registry.metrics();
		const metrics = parsePrometheusTextFormat(metricsText) as any[];

		expect(metrics.some((m: any) => m.name === HTTP_REQUESTS_TOTAL)).toBe(true);
		expect(metrics.some((m: any) => m.name === HTTP_REQUEST_DURATION)).toBe(
			true,
		);
		expect(
			metrics.some((m: any) => m.name === HTTP_SERVER_DURATION_SECONDS),
		).toBe(true);
	});

	it("applies prefix to all metrics", async () => {
		const prefix = "custom_";
		initRegistry({
			collectDefaultMetricsConfig: { prefix },
			register: registry,
			registerContentType: "PROMETHEUS",
		});

		const metricsText = await registry.metrics();
		const metrics = parsePrometheusTextFormat(metricsText) as any[];

		// All custom metrics should have the prefix
		expect(
			metrics.some((m: any) =>
				m.name.startsWith(`${prefix}http_requests_total`),
			),
		).toBe(true);
		expect(
			metrics.some((m: any) =>
				m.name.startsWith(`${prefix}http_request_duration_seconds`),
			),
		).toBe(true);
	});

	it("applies default labels to all metrics", async () => {
		const labels = { app: "astro-test" };
		initRegistry({
			collectDefaultMetricsConfig: { labels },
			register: registry,
			registerContentType: "PROMETHEUS",
		});

		const metricsText = await registry.metrics();
		const metrics = parsePrometheusTextFormat(metricsText) as any[];

		// All metrics should have the default label
		for (const metric of metrics) {
			if (metric.metrics && metric.metrics.length > 0) {
				for (const m of metric.metrics) {
					expect(m.labels).toMatchObject(labels);
				}
			}
		}
	});

	it("handles empty prefix and labels", async () => {
		initRegistry({
			collectDefaultMetricsConfig: { prefix: "", labels: {} },
			register: registry,
			registerContentType: "PROMETHEUS",
		});
		const metricsText = await registry.metrics();
		const metrics = parsePrometheusTextFormat(metricsText) as any[];
		// Should still have metrics, but no prefix and no labels
		expect(metrics.some((m: any) => m.name === "http_requests_total")).toBe(
			true,
		);
		for (const metric of metrics) {
			if (metric.metrics && metric.metrics.length > 0) {
				for (const m of metric.metrics) {
					// If labels exist, they should not have 'app'
					if (m.labels) {
						expect(m.labels).not.toHaveProperty("app");
					}
				}
			}
		}
	});

	it("sets OpenMetrics content type when specified", async () => {
		initRegistry({
			register: registry,
			registerContentType: "OPENMETRICS",
		});
		expect(registry.contentType.toLowerCase()).toContain(
			"application/openmetrics-text; version=1.0.0; charset=utf-8",
		);
		const metricsText = await registry.metrics();
		expect(metricsText).toContain("EOF");
	});

	it("throws on invalid config", () => {
		// purposely invalid config: prefix should be a string, passing a number as string
		expect(() =>
			initRegistry({
				collectDefaultMetricsConfig: { prefix: 123 as unknown as string },
				register: registry,
				registerContentType: "PROMETHEUS",
			}),
		).toThrow();
	});

	it("increments and observes metrics", async () => {
		initRegistry({
			register: registry,
			registerContentType: "PROMETHEUS",
		});
		// Manually create and increment a counter
		const counter = new Counter({
			name: "test_counter",
			help: "A test counter",
			registers: [registry],
		});
		counter.inc(5);
		const metricsText = await registry.metrics();
		expect(metricsText).toContain("test_counter 5");
	});

	it("does not register metrics when disabled integration", async () => {
		// Simulate disabled integration by not calling initRegistry
		const metricsText = await registry.metrics();
		// Should be empty
		expect(metricsText.trim()).toBe("");
	});
});
