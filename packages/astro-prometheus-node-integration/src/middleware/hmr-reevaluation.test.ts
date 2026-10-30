// Simulates Vite HMR in `astro dev`: Vite inlines the middleware modules and
// re-evaluates them after an edit, while prom-client (externalized CJS) keeps
// its global `register` with every metric already registered.
import client from "prom-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createMockContext = (path = "/hmr") => ({
	request: { method: "GET", url: `http://localhost${path}` },
	routePattern: path,
});

const okNext = () => Promise.resolve(new Response(null, { status: 200 }));

const loadMiddleware = async () => {
	const mod = await import("./prometheus-middleware.js");
	return mod.onRequest as unknown as (
		context: unknown,
		next: () => Promise<Response>,
	) => Promise<Response>;
};

const countMetric = async (name: string) => {
	const metrics = await client.register.getMetricsAsJSON();
	return metrics.filter((metric) => metric.name === name).length;
};

const requestsTotal = async (name: string) => {
	const metric = client.register.getSingleMetric(name);
	const { values } = await (metric as client.Counter).get();
	return values.reduce((sum, value) => sum + value.value, 0);
};

describe.each([
	{ label: "without prefix", prefix: "" },
	{ label: "with prefix", prefix: "hmr_" },
])("middleware re-evaluation after HMR ($label)", ({ prefix }) => {
	beforeEach(() => {
		client.register.clear();
		globalThis.__PROMETHEUS_OPTIONS__ = {
			metricsUrl: "/metrics",
			registerContentType: "PROMETHEUS",
			enabled: true,
			standaloneMetrics: { enabled: false, port: 9090 },
			collectDefaultMetricsConfig: prefix ? { prefix } : {},
		};
	});

	afterEach(async () => {
		const { clearRegistryMetrics } = await import("../metrics/index.js");
		clearRegistryMetrics({ register: client.register });
		client.register.clear();
		vi.resetModules();
	});

	it("keeps serving requests on the same register after the module is re-evaluated", async () => {
		const firstOnRequest = await loadMiddleware();
		await firstOnRequest(createMockContext(), okNext);

		vi.resetModules();
		const secondOnRequest = await loadMiddleware();
		expect(secondOnRequest).not.toBe(firstOnRequest);

		const response = await secondOnRequest(createMockContext(), okNext);
		expect(response.status).toBe(200);

		expect(await countMetric(`${prefix}process_cpu_user_seconds_total`)).toBe(
			1,
		);
		expect(await countMetric(`${prefix}http_requests_total`)).toBe(1);
		expect(await requestsTotal(`${prefix}http_requests_total`)).toBe(2);
	});
});

describe("outbound observer re-evaluation after HMR", () => {
	beforeEach(() => {
		client.register.clear();
		globalThis.__PROMETHEUS_OPTIONS__ = {
			metricsUrl: "/metrics",
			registerContentType: "PROMETHEUS",
			enabled: true,
			standaloneMetrics: { enabled: false, port: 9090 },
			collectDefaultMetricsConfig: {},
		};
	});

	afterEach(async () => {
		const { resetOutboundObserver } = await import("../outbound/observer.js");
		const { clearRegistryMetrics } = await import("../metrics/index.js");
		resetOutboundObserver();
		clearRegistryMetrics({ register: client.register });
		client.register.clear();
		vi.resetModules();
	});

	it("reuses the running observer and outbound metrics", async () => {
		const config = { enabled: true } as never;

		const first = await import("../outbound/observer.js");
		first.initializeOutboundObserver({ config });

		vi.resetModules();
		const second = await import("../outbound/observer.js");
		expect(second).not.toBe(first);
		expect(() => second.initializeOutboundObserver({ config })).not.toThrow();

		expect(await countMetric("http_responses_total")).toBe(1);
	});
});

describe("global state and registry guards", () => {
	afterEach(() => {
		client.register.clear();
		vi.resetModules();
	});

	it("fills in fields missing from state created by another package copy", async () => {
		const key = Symbol.for("astro-prometheus-node-integration.state");
		const store = globalThis as Record<symbol, unknown>;
		const previous = store[key];
		store[key] = { inboundMetrics: new Map() };
		try {
			const { getGlobalState } = await import("../state/global-state.js");
			const state = getGlobalState();
			expect(state.middlewareMetrics).toBeInstanceOf(Map);
			expect(state.outboundMetrics).toBeInstanceOf(Map);
			expect(state.processedEntries).toBeInstanceOf(Map);
		} finally {
			store[key] = previous;
		}
	});

	it("does not reuse a same-named metric of another type", async () => {
		const { createMetricsForRegistry } = await import("../metrics/index.js");
		const register = new client.Registry();
		new client.Histogram({
			name: "http_requests_total",
			help: "not a counter",
			registers: [register],
		});
		expect(() => createMetricsForRegistry({ register })).toThrow(
			/already been registered/,
		);
	});

	it("clearRegistry drops cached metrics for that registry", async () => {
		const { clearRegistry, createMetricsForRegistry } = await import(
			"../metrics/index.js"
		);
		const register = new client.Registry();
		const first = createMetricsForRegistry({ register });
		clearRegistry({ register });
		const second = createMetricsForRegistry({ register });
		expect(second.httpRequestsTotal).not.toBe(first.httpRequestsTotal);
		expect(register.getSingleMetric("http_requests_total")).toBe(
			second.httpRequestsTotal,
		);
	});
});
