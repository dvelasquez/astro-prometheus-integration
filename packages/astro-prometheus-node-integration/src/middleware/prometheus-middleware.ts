// Prometheus metrics middleware for Astro
import { defineMiddleware } from "astro/middleware";
import client from "prom-client";
import { createMetricsForRegistry, initRegistry } from "../metrics/index.js";
import { startStandaloneMetricsServer } from "../routes/standalone-metrics-server.js";
import {
	measureTTLBWithAsyncTiming,
	measureTTLBWithStreamWrapping,
	type TimingOptions,
} from "./timing-utils.js";

// Cache metrics per registry to avoid conflicts between different test registries
const metricsCache = new Map<
	client.Registry,
	{
		httpRequestsTotal: client.Counter;
		httpRequestDuration: client.Histogram;
		httpServerDurationSeconds: client.Histogram;
	}
>();

// Initialize metrics cache (called once per registry)
const initializeMetricsCache = async (register: client.Registry) => {
	if (!metricsCache.has(register)) {
		const options = __PROMETHEUS_OPTIONS__;

		// Initialize the registry with default metrics and content type
		initRegistry({
			register,
			collectDefaultMetricsConfig: options?.collectDefaultMetricsConfig || null,
			registerContentType: options?.registerContentType || "PROMETHEUS",
		});

		// Create fresh metrics for this specific registry
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

// Factory function for creating middleware (for testing purposes)
export const createPrometheusMiddleware = async (
	register: client.Registry,
	optionsOverride?: any,
) => {
	const cachedMetrics = await initializeMetricsCache(register);
	const options = optionsOverride ?? __PROMETHEUS_OPTIONS__;

	return defineMiddleware(async (context, next) => {
		const {
			httpRequestsTotal,
			httpRequestDuration,
			httpServerDurationSeconds,
		} = cachedMetrics;

		// Start timer
		const start = process.hrtime();
		let response: Response;
		try {
			response = await next();
		} catch (err) {
			// Record error metrics
			const errorLabels = {
				method: context.request.method,
				path:
					context.routePattern ??
					(new URL(context.request.url).pathname || "/"),
				status: "500",
			};
			if (httpRequestsTotal instanceof client.Counter) {
				httpRequestsTotal.inc(errorLabels);
			}
			throw err;
		}

		// Calculate duration
		const [seconds, nanoseconds] = process.hrtime(start);
		const duration = seconds + nanoseconds / 1e9;
		const path =
			context.routePattern ?? (new URL(context.request.url).pathname || "/");

		// Record metrics
		const labels = {
			method: context.request.method,
			path: path,
			status: response.status.toString(),
		};

		if (httpRequestDuration instanceof client.Histogram) {
			httpRequestDuration.observe(labels, duration);
		}

		if (httpRequestsTotal instanceof client.Counter) {
			httpRequestsTotal.inc(labels);
		}

		// Handle streaming responses for http_server_duration_seconds
		if (response.body instanceof ReadableStream) {
			const timingOptions: TimingOptions = {
				start,
				labels,
				histogram: httpServerDurationSeconds,
			};

			const useOptimized = options?.experimental?.useOptimizedTTLBMeasurement;

			if (
				useOptimized &&
				httpServerDurationSeconds instanceof client.Histogram
			) {
				response = measureTTLBWithAsyncTiming(response, timingOptions);
			} else if (httpServerDurationSeconds instanceof client.Histogram) {
				response = measureTTLBWithStreamWrapping(response, timingOptions);
			}
		} else {
			// For non-streaming responses, record server duration immediately
			if (httpServerDurationSeconds instanceof client.Histogram) {
				httpServerDurationSeconds.observe(labels, duration);
			}
		}

		return response;
	});
};

// Main middleware export for Astro (synchronous)
export const onRequest = defineMiddleware(async (context, next) => {
	// Initialize metrics cache if not already done
	if (!metricsCache.has(client.register)) {
		await initializeMetricsCache(client.register);
	}

	// ✅ Use cached metrics directly (no lookup overhead)
	const { httpRequestsTotal, httpRequestDuration, httpServerDurationSeconds } =
		metricsCache.get(client.register)!;
	const options = __PROMETHEUS_OPTIONS__;

	// Start timer
	const start = process.hrtime();
	let response: Response;
	try {
		response = await next();
	} catch (err) {
		// Calculate duration
		const [seconds, nanoseconds] = process.hrtime(start);
		const duration = seconds + nanoseconds / 1e9;
		const path =
			context.routePattern ?? (new URL(context.request.url).pathname || "/");
		const labels = {
			method: context.request.method,
			path: path,
			status: "500",
		};
		if (httpRequestDuration instanceof client.Histogram) {
			httpRequestDuration.observe(labels, duration);
		}
		if (httpRequestsTotal instanceof client.Counter) {
			httpRequestsTotal.inc(labels);
		}
		if (httpServerDurationSeconds instanceof client.Histogram) {
			httpServerDurationSeconds.observe(labels, duration);
		}
		throw err;
	}

	// Calculate duration
	const [seconds, nanoseconds] = process.hrtime(start);
	const duration = seconds + nanoseconds / 1e9;
	const path =
		context.routePattern ?? (new URL(context.request.url).pathname || "/");

	// Record metrics
	const labels = {
		method: context.request.method,
		path: path,
		status: response.status.toString(),
	};

	if (httpRequestDuration instanceof client.Histogram) {
		httpRequestDuration.observe(labels, duration);
	}
	if (httpRequestsTotal instanceof client.Counter) {
		httpRequestsTotal.inc(labels);
	}

	// Measure time to last byte (TTLB) and record in httpServerDurationSeconds
	if (
		httpServerDurationSeconds instanceof client.Histogram &&
		response.body instanceof ReadableStream
	) {
		const timingOptions: TimingOptions = {
			start,
			labels,
			histogram: httpServerDurationSeconds,
		};

		const useOptimized = options?.experimental?.useOptimizedTTLBMeasurement;

		if (useOptimized) {
			response = measureTTLBWithAsyncTiming(response, timingOptions);
		} else {
			response = measureTTLBWithStreamWrapping(response, timingOptions);
		}
	}

	// If no body, record TTLB immediately
	if (httpServerDurationSeconds instanceof client.Histogram && !response.body) {
		const [s, ns] = process.hrtime(start);
		const ttlbDuration = s + ns / 1e9;
		httpServerDurationSeconds.observe(labels, ttlbDuration);
	}

	return response;
});
