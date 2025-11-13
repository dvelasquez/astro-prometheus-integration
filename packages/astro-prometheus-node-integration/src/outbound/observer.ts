import { PerformanceObserver } from "node:perf_hooks";
import client from "prom-client";
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

interface InitializeOptions {
	config?: OutboundRequestsOptions;
	register?: client.Registry;
}

export const initializeOutboundObserver = ({
	config = globalThis.__ASTRO_PROMETHEUS_OUTBOUND_CONFIG,
	register = client.register,
}: InitializeOptions = {}) => {
	if (!config?.enabled) {
		return;
	}

	if (observer) {
		return;
	}

	const prefix =
		__PROMETHEUS_OPTIONS__?.collectDefaultMetricsConfig?.prefix ?? "";

	const metrics = createOutboundMetricsForRegistry({
		register,
		prefix,
	});

	const endpointFn =
		config.labels?.endpoint ??
		((ctx: OutboundMetricContext) => ctx.defaultEndpoint);
	const appFn = config.labels?.app ?? (() => defaultAppLabel());

	const includeErrors = () => config.includeErrors ?? true;
	const shouldObserve = config.shouldObserve;

	observer = new PerformanceObserver((entries) => {
		const now = Date.now();
		pruneProcessedEntries(now);

		for (const entry of entries.getEntries() as ObservedEntry[]) {
			if (!invokeShouldObserve(shouldObserve, entry)) {
				continue;
			}

			const normalized = normalizeEntry(entry);
			if (!normalized) {
				continue;
			}

			if (processedEntries.has(normalized.cacheKey)) {
				continue;
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
					continue;
				}
			}

			metrics.httpResponseDuration.observe(labels, normalized.durationSeconds);

			processedEntries.set(normalized.cacheKey, now);
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
