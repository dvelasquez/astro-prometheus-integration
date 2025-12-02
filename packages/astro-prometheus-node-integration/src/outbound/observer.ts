import { PerformanceObserver } from "node:perf_hooks";
import client from "prom-client";
import {
	getOutboundConfig,
	getPrometheusOptions,
} from "../config/accessors.js";
import { createOutboundMetricsForRegistry } from "../metrics/index.js";
import type { OutboundRequestsOptions } from "./schema.js";
import type {
	ObservedEntry,
	OutboundMetricContext,
	ResourceEntry,
} from "./types.js";

interface NormalizedEntry {
	cacheKey: string;
	url?: URL;
	method: string;
	host: string;
	statusCode: number;
	status: string;
	defaultEndpoint: string;
	durationSeconds: number;
	isError: boolean;
	errorReason?: string;
	entry: ObservedEntry;
}

const processedEntries = new Map<string, number>();
const PROCESSED_ENTRY_TTL_MS = 60_000;

let observer: PerformanceObserver | undefined;

interface OutboundMetrics {
	httpResponsesTotal: client.Counter;
	httpResponseDuration: client.Histogram;
	httpResponseErrorTotal: client.Counter;
}

interface ObserverCallbacks {
	endpointFn: (ctx: OutboundMetricContext) => string;
	appFn: (ctx: OutboundMetricContext) => string;
	includeErrors: () => boolean;
	shouldObserve?: (entry: ObservedEntry) => boolean;
}

const defaultEndpoint = (url?: URL) => {
	if (!url) {
		return "unknown";
	}
	return url.pathname || "/";
};

const defaultAppLabel = () => "astro";

const resolveUrl = (rawUrl: string | undefined, host?: string) => {
	if (!rawUrl && !host) {
		return undefined;
	}

	const attempt = safeInvoke(() =>
		rawUrl ? new URL(rawUrl) : host ? new URL(`http://${host}`) : undefined,
	);

	if (attempt) {
		return attempt;
	}

	if (!rawUrl || !host) {
		return undefined;
	}

	return safeInvoke(() => new URL(rawUrl, `http://${host}`));
};

const safeInvoke = <T>(fn: () => T): T | undefined => {
	try {
		return fn();
	} catch {
		return undefined;
	}
};

const pruneProcessedEntries = (now: number) => {
	for (const [key, seenAt] of processedEntries.entries()) {
		if (now - seenAt > PROCESSED_ENTRY_TTL_MS) {
			processedEntries.delete(key);
		}
	}
};

const extractMethodFromResource = (entry: ResourceEntry) => {
	const extra = entry as unknown as {
		method?: string;
		requestMethod?: string;
	};
	return extra.method ?? extra.requestMethod ?? "GET";
};

const normalizeResourceEntry = (entry: ResourceEntry): NormalizedEntry => {
	const url = resolveUrl(entry.name);

	const statusCode =
		typeof entry.responseStatus === "number" ? entry.responseStatus : 0;
	const status = statusCode > 0 ? String(statusCode) : "0";

	const host = url?.host ?? "unknown";
	const durationSeconds = entry.duration / 1000;

	const isError = statusCode === 0 || statusCode >= 400;

	const errorReason =
		statusCode === 0 ? "network_error" : isError ? `HTTP_${status}` : undefined;

	return {
		cacheKey: `resource:${entry.name}:${entry.startTime}:${status}`,
		...(url ? { url } : {}),
		method: extractMethodFromResource(entry),
		host,
		statusCode,
		status,
		defaultEndpoint: defaultEndpoint(url),
		durationSeconds,
		isError,
		...(errorReason ? { errorReason } : {}),
		entry,
	};
};

const normalizeEntry = (entry: ObservedEntry): NormalizedEntry | undefined => {
	return normalizeResourceEntry(entry);
};

const invokeShouldObserve = (
	shouldObserve: ((entry: ObservedEntry) => boolean) | undefined,
	entry: ObservedEntry,
) => {
	if (!shouldObserve) {
		return true;
	}
	return safeInvoke(() => shouldObserve(entry)) ?? false;
};

const buildContext = (normalized: NormalizedEntry): OutboundMetricContext => ({
	entry: normalized.entry,
	...(normalized.url ? { url: normalized.url } : {}),
	defaultEndpoint: normalized.defaultEndpoint,
	method: normalized.method,
	host: normalized.host,
	status: normalized.status,
});

interface BuildObserverCallbacksParams {
	config: OutboundRequestsOptions;
}

const buildObserverCallbacks = ({
	config,
}: BuildObserverCallbacksParams): ObserverCallbacks => {
	const endpointFn =
		config.labels?.endpoint ??
		((ctx: OutboundMetricContext) => ctx.defaultEndpoint);
	const appFn = config.labels?.app ?? (() => defaultAppLabel());

	const includeErrors = () => config.includeErrors ?? true;
	const shouldObserve = config.shouldObserve ?? (() => true);

	return {
		endpointFn,
		appFn,
		includeErrors,
		shouldObserve,
	};
};

interface ProcessObservedEntryParams {
	entry: ObservedEntry;
	now: number;
	metrics: OutboundMetrics;
	callbacks: ObserverCallbacks;
}

const processObservedEntry = ({
	entry,
	now,
	metrics,
	callbacks,
}: ProcessObservedEntryParams) => {
	const { endpointFn, appFn, includeErrors, shouldObserve } = callbacks;

	if (!invokeShouldObserve(shouldObserve, entry)) {
		return;
	}

	const normalized = normalizeEntry(entry);
	if (!normalized) {
		return;
	}

	if (processedEntries.has(normalized.cacheKey)) {
		return;
	}

	const context = buildContext(normalized);
	const endpoint =
		safeInvoke(() => endpointFn(context)) ?? normalized.defaultEndpoint;
	const app = safeInvoke(() => appFn(context)) ?? defaultAppLabel();

	const labels = {
		method: normalized.method,
		host: normalized.host,
		status: normalized.status,
		endpoint,
		app,
	};

	metrics.httpResponsesTotal.inc(labels);

	if (normalized.isError) {
		metrics.httpResponseErrorTotal.inc({
			...labels,
			error_reason: normalized.errorReason ?? "unknown",
		});
		if (!includeErrors()) {
			processedEntries.set(normalized.cacheKey, now);
			return;
		}
	}

	metrics.httpResponseDuration.observe(labels, normalized.durationSeconds);

	processedEntries.set(normalized.cacheKey, now);
};

interface InitializeOptions {
	config?: OutboundRequestsOptions;
	register?: client.Registry;
}

export const initializeOutboundObserver = ({
	config = getOutboundConfig(),
	register = client.register,
}: InitializeOptions = {}) => {
	if (!config?.enabled) {
		return;
	}

	if (observer) {
		return;
	}

	const options = getPrometheusOptions();
	const prefix = options?.collectDefaultMetricsConfig?.prefix ?? "";
	const outboundBuckets = options?.histogramBuckets?.outbound;

	const metrics = createOutboundMetricsForRegistry({
		register,
		prefix,
		...(outboundBuckets ? { buckets: outboundBuckets } : {}),
	});
	const callbacks = buildObserverCallbacks({ config });

	observer = new PerformanceObserver((entries) => {
		const now = Date.now();
		pruneProcessedEntries(now);

		for (const entry of entries.getEntries() as ObservedEntry[]) {
			processObservedEntry({
				entry,
				now,
				metrics,
				callbacks,
			});
		}
	});

	observer.observe({ entryTypes: ["resource"], buffered: true });
};

export const resetOutboundObserver = () => {
	if (observer) {
		try {
			observer.disconnect();
		} catch {
			// ignore disconnect errors
		}
	}
	observer = undefined;
	processedEntries.clear();
};
