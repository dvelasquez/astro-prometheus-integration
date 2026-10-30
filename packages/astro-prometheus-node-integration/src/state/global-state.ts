// Process-wide state that must survive module re-evaluation.
//
// In `astro dev`, Vite inlines the middleware modules and re-evaluates them on
// HMR, so module-level caches come back empty. prom-client is externalized and
// keeps its registries, so an empty cache would re-register existing metrics
// and throw. Keeping the caches on globalThis ties them to the process instead.
import type { PerformanceObserver } from "node:perf_hooks";
import type client from "prom-client";

export interface InboundMetrics {
	httpRequestsTotal: client.Counter;
	httpRequestDuration: client.Histogram;
	httpServerDurationSeconds: client.Histogram;
}

export interface OutboundMetrics {
	httpResponsesTotal: client.Counter;
	httpResponseDuration: client.Histogram;
	httpResponseErrorTotal: client.Counter;
}

interface GlobalState {
	middlewareMetrics: Map<client.Registry, InboundMetrics>;
	inboundMetrics: Map<client.Registry, InboundMetrics>;
	outboundMetrics: Map<client.Registry, OutboundMetrics>;
	outboundObserver: PerformanceObserver | undefined;
	processedEntries: Map<string, number>;
}

const GLOBAL_STATE_KEY: unique symbol = Symbol.for(
	"astro-prometheus-node-integration.state",
);

export const getGlobalState = (): GlobalState => {
	const store = globalThis as typeof globalThis & {
		[GLOBAL_STATE_KEY]?: GlobalState;
	};
	store[GLOBAL_STATE_KEY] ??= {
		middlewareMetrics: new Map(),
		inboundMetrics: new Map(),
		outboundMetrics: new Map(),
		outboundObserver: undefined,
		processedEntries: new Map(),
	};
	return store[GLOBAL_STATE_KEY];
};
