// Prometheus metrics middleware for Astro
import type { APIContext } from "astro";
import { defineMiddleware } from "astro/middleware";
import client from "prom-client";
import { getPrometheusOptions } from "../config/accessors.js";
import { createMetricsForRegistry, initRegistry } from "../metrics/index.js";
import { startStandaloneMetricsServer } from "../routes/standalone-metrics-server.js";
import { measureTimeToLastByte } from "./timing-utils.js";

interface MiddlewareMetrics {
	httpRequestsTotal: client.Counter;
	httpRequestDuration: client.Histogram;
	httpServerDurationSeconds: client.Histogram;
}

type MiddlewareMode = "factory" | "main";

interface HandleRequestParams {
	context: APIContext;
	next: () => Promise<Response>;
	metrics: MiddlewareMetrics;
	mode: MiddlewareMode;
}

interface HandleSuccessParams extends HandleRequestParams {
	response: Response;
	start: [number, number];
	options: ReturnType<typeof getPrometheusOptions>;
}

interface HandleErrorParams {
	context: APIContext;
	error: unknown;
	start: [number, number];
	metrics: MiddlewareMetrics;
	mode: MiddlewareMode;
}

// Cache metrics per registry to avoid conflicts between different test registries
const metricsCache = new Map<client.Registry, MiddlewareMetrics>();

// Initialize metrics cache (called once per registry)
const initializeMetricsCache = async (register: client.Registry) => {
	if (!metricsCache.has(register)) {
		const options = getPrometheusOptions();

		// Initialize the registry with default metrics and content type
		initRegistry({
			register,
			collectDefaultMetricsConfig: options?.collectDefaultMetricsConfig || null,
			registerContentType: options?.registerContentType || "PROMETHEUS",
		});

		const cachedMetrics = createMetricsForRegistry({
			register,
			prefix: options?.collectDefaultMetricsConfig?.prefix || "",
		});

		metricsCache.set(register, cachedMetrics);

		if (options?.standaloneMetrics?.enabled) {
			startStandaloneMetricsServer({
				register,
				port: options.standaloneMetrics.port,
				metricsUrl: options.metricsUrl,
			});
		}
	}
	return metricsCache.get(register)!;
};

const getRequestPath = (context: APIContext) => {
	return context.routePattern ?? (new URL(context.request.url).pathname || "/");
};

const buildLabels = ({
	context,
	path,
	status,
}: {
	context: APIContext;
	path: string;
	status: string;
}) => {
	return {
		method: context.request.method,
		path,
		status,
	};
};

const handleErrorMetrics = ({
	context,
	start,
	metrics,
	mode,
}: HandleErrorParams) => {
	const { httpRequestsTotal, httpRequestDuration, httpServerDurationSeconds } =
		metrics;

	const [seconds, nanoseconds] = process.hrtime(start);
	const duration = seconds + nanoseconds / 1e9;
	const path = getRequestPath(context);
	const labels = buildLabels({ context, path, status: "500" });

	if (mode === "factory") {
		if (httpRequestsTotal instanceof client.Counter) {
			httpRequestsTotal.inc(labels);
		}
		return;
	}

	if (httpRequestDuration instanceof client.Histogram) {
		httpRequestDuration.observe(labels, duration);
	}
	if (httpRequestsTotal instanceof client.Counter) {
		httpRequestsTotal.inc(labels);
	}
	if (httpServerDurationSeconds instanceof client.Histogram) {
		httpServerDurationSeconds.observe(labels, duration);
	}
};

const handleSuccessMetrics = ({
	context,
	response,
	start,
	metrics,
	mode,
	options,
}: HandleSuccessParams) => {
	const { httpRequestsTotal, httpRequestDuration, httpServerDurationSeconds } =
		metrics;

	const [seconds, nanoseconds] = process.hrtime(start);
	const duration = seconds + nanoseconds / 1e9;
	const path = getRequestPath(context);

	const labels = buildLabels({
		context,
		path,
		status: response.status.toString(),
	});

	if (httpRequestDuration instanceof client.Histogram) {
		httpRequestDuration.observe(labels, duration);
	}
	if (httpRequestsTotal instanceof client.Counter) {
		httpRequestsTotal.inc(labels);
	}

	// Server duration / TTLB handling
	if (
		httpServerDurationSeconds instanceof client.Histogram &&
		response.body instanceof ReadableStream
	) {
		const useOptimized =
			options?.experimental?.useOptimizedTTLBMeasurement ?? false;

		return measureTimeToLastByte({
			response,
			start,
			labels,
			histogram: httpServerDurationSeconds,
			useOptimized,
		});
	}

	// Mode-specific non-streaming behavior for http_server_duration_seconds
	if (httpServerDurationSeconds instanceof client.Histogram) {
		if (mode === "factory") {
			// In factory mode we always record server duration for non-streaming responses
			httpServerDurationSeconds.observe(labels, duration);
		} else if (!response.body) {
			// In main mode we only record TTLB when there is no body (matches existing behavior)
			const [s, ns] = process.hrtime(start);
			const ttlbDuration = s + ns / 1e9;
			httpServerDurationSeconds.observe(labels, ttlbDuration);
		}
	}

	return response;
};

const handleRequest = async ({
	context,
	next,
	metrics,
	mode,
}: HandleRequestParams): Promise<Response> => {
	const start = process.hrtime();

	try {
		const response = await next();
		const options = getPrometheusOptions();

		return handleSuccessMetrics({
			context,
			next,
			response,
			start,
			metrics,
			mode,
			options,
		});
	} catch (error) {
		handleErrorMetrics({ context, error, start, metrics, mode });
		throw error;
	}
};

// Factory function for creating middleware (for testing purposes)
export const createPrometheusMiddleware = async (
	register: client.Registry,
	optionsOverride?: any,
) => {
	const cachedMetrics = await initializeMetricsCache(register);

	// optionsOverride is currently unused but kept for backward compatibility
	void optionsOverride;

	return defineMiddleware(async (context, next) => {
		return handleRequest({
			context,
			next,
			metrics: cachedMetrics,
			mode: "factory",
		});
	});
};

// Main middleware export for Astro (synchronous)
export const onRequest = defineMiddleware(async (context, next) => {
	const metrics = await initializeMetricsCache(client.register);

	return handleRequest({
		context,
		next,
		metrics,
		mode: "main",
	});
});
