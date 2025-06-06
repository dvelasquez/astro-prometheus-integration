// Prometheus metrics middleware for Astro
import { defineMiddleware } from "astro/middleware";
import client from "prom-client";
import {
	HTTP_REQUESTS_TOTAL,
	HTTP_REQUEST_DURATION,
	HTTP_SERVER_DURATION_SECONDS,
	initRegistry,
} from "../metrics/index.js";
import { startStandaloneMetricsServer } from "../routes/standalone-metrics-server.ts";

const findMetrics = async (register: client.Registry) => {
	const metricsJson = await register.getMetricsAsJSON();
	const httpRequestName = metricsJson.find((metric) =>
		metric.name.endsWith(HTTP_REQUESTS_TOTAL),
	);
	const httpRequestDurationName = metricsJson.find((metric) =>
		metric.name.endsWith(HTTP_REQUEST_DURATION),
	);
	const httpServerDurationSecondsName = metricsJson.find((metric) =>
		metric.name.endsWith(HTTP_SERVER_DURATION_SECONDS),
	);
	const httpRequestsTotal = register.getSingleMetric(
		httpRequestName?.name ?? "",
	);
	const httpRequestDuration = register.getSingleMetric(
		httpRequestDurationName?.name ?? "",
	);
	const httpServerDurationSeconds = register.getSingleMetric(
		httpServerDurationSecondsName?.name ?? "",
	);
	if (!(httpRequestDuration instanceof client.Histogram)) {
		console.warn("httpRequestDuration is not a Histogram");
	}
	if (!(httpRequestsTotal instanceof client.Counter)) {
		console.warn("httpRequestsTotal is not a Counter");
	}
	if (!(httpServerDurationSeconds instanceof client.Histogram)) {
		console.warn("httpServerDurationSeconds is not a Histogram");
	}

	return { httpRequestsTotal, httpRequestDuration, httpServerDurationSeconds };
};

export const createPrometheusMiddleware = (register: client.Registry) => {
	const options = __PROMETHEUS_OPTIONS__;
	initRegistry({
		register,
		...(options?.collectDefaultMetricsConfig
			? {
					collectDefaultMetricsConfig: options.collectDefaultMetricsConfig,
				}
			: {}),
		registerContentType: options?.registerContentType || "PROMETHEUS",
	});

	if (options?.standaloneMetrics?.enabled) {
		startStandaloneMetricsServer({
			register,
			port: options.standaloneMetrics.port,
			metricsUrl: options.metricsUrl,
		});
	}

	return defineMiddleware(async (context, next) => {
		const {
			httpRequestsTotal,
			httpRequestDuration,
			httpServerDurationSeconds,
		} = await findMetrics(register);

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
		if (
			httpServerDurationSeconds instanceof client.Histogram &&
			!response.body
		) {
			const [s, ns] = process.hrtime(start);
			const ttlbDuration = s + ns / 1e9;
			httpServerDurationSeconds.observe(labels, ttlbDuration);
		}

		return response;
	});
};

export const onRequest = createPrometheusMiddleware(client.register);
