import type { PerformanceObserverEntryList } from "node:perf_hooks";
import parsePrometheusTextFormat from "parse-prometheus-text-format";
import { Registry } from "prom-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearRegistryMetrics } from "../metrics/index.js";
import {
	initializeOutboundObserver,
	resetOutboundObserver,
} from "./observer.js";
import type { ObservedEntry } from "./types.js";

const observerCallbacks: Array<
	(entries: PerformanceObserverEntryList) => void
> = [];

vi.mock("node:perf_hooks", () => {
	class MockPerformanceObserver {
		private callback: (entries: PerformanceObserverEntryList) => void;

		constructor(callback: (entries: PerformanceObserverEntryList) => void) {
			this.callback = callback;
			observerCallbacks.push(callback);
		}

		observe() {}
		disconnect() {}
	}

	return { PerformanceObserver: MockPerformanceObserver };
});

const createEntryList = (entries: ObservedEntry[]) =>
	({
		getEntries: () => entries,
	}) as PerformanceObserverEntryList;

describe("initializeOutboundObserver", () => {
	let registry: Registry;

	beforeEach(() => {
		registry = new Registry();
		registry.clear();
		registry.resetMetrics();
		observerCallbacks.length = 0;
		// Provide minimal options for prefix detection
		globalThis.__PROMETHEUS_OPTIONS__ = {
			collectDefaultMetricsConfig: { prefix: "" },
		} as any;
	});

	afterEach(() => {
		resetOutboundObserver();
		clearRegistryMetrics(registry);
		registry.clear();
		registry.resetMetrics();
		observerCallbacks.length = 0;
	});

	it("records metrics for resource entries", async () => {
		initializeOutboundObserver({
			config: {
				enabled: true,
				includeErrors: true,
				labels: {},
			},
			register: registry,
		});

		expect(observerCallbacks).toHaveLength(1);
		const [callback] = observerCallbacks;

		const resourceEntry = {
			entryType: "resource",
			name: "https://api.example.com/v1/users",
			duration: 150,
			startTime: 1,
			responseStart: 0,
			responseEnd: 150,
			workerStart: 0,
			redirectStart: 0,
			redirectEnd: 0,
			fetchStart: 0,
			domainLookupStart: 0,
			domainLookupEnd: 0,
			connectStart: 0,
			connectEnd: 0,
			secureConnectionStart: 0,
			requestStart: 0,
			transferSize: 0,
			encodedBodySize: 0,
			decodedBodySize: 0,
			initiatorType: "fetch",
			responseStatus: 200,
		} as ObservedEntry;

		callback(createEntryList([resourceEntry]));

		const metricsText = await registry.metrics();
		expect(metricsText).toContain(
			'http_responses_total{method="GET",host="api.example.com",status="200",endpoint="/v1/users",app="astro"} 1',
		);
		expect(metricsText).toContain(
			'http_response_duration_seconds_sum{method="GET",host="api.example.com",status="200",endpoint="/v1/users",app="astro"} 0.15',
		);
	});

	it("records errors without observing duration when includeErrors is false", async () => {
		initializeOutboundObserver({
			config: {
				enabled: true,
				includeErrors: false,
				labels: {
					endpoint: ({ defaultEndpoint }) =>
						defaultEndpoint.replace(/\/\d+/g, "/:id"),
					app: () => "checkout",
				},
			},
			register: registry,
		});

		expect(observerCallbacks).toHaveLength(1);
		const [callback] = observerCallbacks;

		const resourceEntry = {
			entryType: "resource",
			name: "https://api.example.com/v1/orders/42",
			duration: 75,
			startTime: 2,
			responseStart: 0,
			responseEnd: 75,
			workerStart: 0,
			redirectStart: 0,
			redirectEnd: 0,
			fetchStart: 0,
			domainLookupStart: 0,
			domainLookupEnd: 0,
			connectStart: 0,
			connectEnd: 0,
			secureConnectionStart: 0,
			requestStart: 0,
			transferSize: 0,
			encodedBodySize: 0,
			decodedBodySize: 0,
			initiatorType: "fetch",
			responseStatus: 500,
			method: "POST",
		} as ObservedEntry;

		callback(createEntryList([resourceEntry]));

		const metrics = parsePrometheusTextFormat(
			await registry.metrics(),
		) as any[];

		const responsesMetric = metrics.find(
			(metric) => metric.name === "http_responses_total",
		);
		expect(responsesMetric?.metrics?.[0]?.labels).toMatchObject({
			method: "POST",
			host: "api.example.com",
			status: "500",
			endpoint: "/v1/orders/:id",
			app: "checkout",
		});

		const errorMetric = metrics.find(
			(metric) => metric.name === "http_response_error_total",
		);
		expect(errorMetric?.metrics?.[0]?.labels).toMatchObject({
			error_reason: "HTTP_500",
		});

		const durationMetric = metrics.find(
			(metric) => metric.name === "http_response_duration_seconds",
		);
		expect(durationMetric?.metrics ?? []).toHaveLength(0);
	});

	it("respects shouldObserve to skip entries", async () => {
		initializeOutboundObserver({
			config: {
				enabled: true,
				includeErrors: true,
				labels: {},
				shouldObserve: () => false,
			},
			register: registry,
		});

		expect(observerCallbacks).toHaveLength(1);
		const [callback] = observerCallbacks;

		const resourceEntry = {
			entryType: "resource",
			name: "https://api.example.com/v1/payments",
			duration: 50,
			startTime: 5,
			responseStart: 0,
			responseEnd: 50,
			workerStart: 0,
			redirectStart: 0,
			redirectEnd: 0,
			fetchStart: 0,
			domainLookupStart: 0,
			domainLookupEnd: 0,
			connectStart: 0,
			connectEnd: 0,
			secureConnectionStart: 0,
			requestStart: 0,
			transferSize: 0,
			encodedBodySize: 0,
			decodedBodySize: 0,
			initiatorType: "fetch",
			responseStatus: 200,
		} as ObservedEntry;

		callback(createEntryList([resourceEntry]));

		const metrics = parsePrometheusTextFormat(
			await registry.metrics(),
		) as any[];
		for (const metric of metrics) {
			expect(metric.metrics?.length ?? 0).toBe(0);
		}
	});
});
