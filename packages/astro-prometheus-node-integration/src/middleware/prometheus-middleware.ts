// Prometheus metrics middleware for Astro
import { defineMiddleware } from "astro/middleware";
import client from "prom-client";
import { createMetricsForRegistry, initRegistry } from "../metrics/index.js";
import { startStandaloneMetricsServer } from "../routes/standalone-metrics-server.js";

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
export const createPrometheusMiddleware = async (register: client.Registry) => {
	const cachedMetrics = await initializeMetricsCache(register);

	return defineMiddleware(async (context, next) => {
		const {
			httpRequestsTotal,
			httpRequestDuration,
			httpServerDurationSeconds,
		} = cachedMetrics;

		// Start timer
		const start = process.hrtime();
		let response: Response | undefined;
		try {
			response = await next();
		} catch (err) {
			// Record error metrics
			const errorLabels = {
				method: context.request.method,
				path: context.routePattern,
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
		const path = context.routePattern;

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
			const streamStart = process.hrtime();
			const originalBody = response.body;
			const newBody = new ReadableStream({
				start(controller) {
					const reader = originalBody.getReader();
					function pump(): Promise<void> {
						return reader.read().then(({ done, value }) => {
							if (done) {
								controller.close();
								// Record server duration when stream ends
								const [streamSeconds, streamNanoseconds] =
									process.hrtime(streamStart);
								const streamDuration = streamSeconds + streamNanoseconds / 1e9;
								if (httpServerDurationSeconds instanceof client.Histogram) {
									httpServerDurationSeconds.observe(labels, streamDuration);
								}
								return;
							}
							controller.enqueue(value);
							return pump();
						});
					}
					return pump();
				},
			});
			response = new Response(newBody, response);
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

	// Start timer
	const start = process.hrtime();
	let response: Response | undefined;
	try {
		response = await next();
	} catch (err) {
		// Calculate duration
		const [seconds, nanoseconds] = process.hrtime(start);
		const duration = seconds + nanoseconds / 1e9;
		const path = context.routePattern;
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
	const path = context.routePattern;

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
		const originalBody = response.body;
		const wrappedBody = new ReadableStream({
			start(controller) {
				const reader = originalBody.getReader();
				function push() {
					reader
						.read()
						.then(({ done, value }) => {
							if (done) {
								const [s, ns] = process.hrtime(start);
								const ttlbDuration = s + ns / 1e9;
								if (httpServerDurationSeconds instanceof client.Histogram) {
									httpServerDurationSeconds.observe(labels, ttlbDuration);
								}
								controller.close();
								return;
							}
							controller.enqueue(value);
							push();
						})
						.catch((error) => {
							const [s, ns] = process.hrtime(start);
							const ttlbDuration = s + ns / 1e9;
							if (httpServerDurationSeconds instanceof client.Histogram) {
								httpServerDurationSeconds.observe(
									{
										method: context.request.method,
										path: path,
										status: "500",
									},
									ttlbDuration,
								);
							}
							throw error;
						});
				}
				push();
			},
		});
		return new Response(wrappedBody, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	}

	// If no body, record TTLB immediately
	if (httpServerDurationSeconds instanceof client.Histogram && !response.body) {
		const [s, ns] = process.hrtime(start);
		const ttlbDuration = s + ns / 1e9;
		httpServerDurationSeconds.observe(labels, ttlbDuration);
	}

	return response;
});
