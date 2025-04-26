import type { AstroSharedContext } from "astro";
import { defineMiddleware } from "astro/middleware";
import client from "prom-client";
import {
	HTTP_REQUESTS_TOTAL,
	HTTP_REQUEST_DURATION,
	HTTP_SERVER_DURATION_SECONDS,
} from "./register.js";

const findMetrics = async (context: AstroSharedContext) => {
	const metricsJson = await client.register.getMetricsAsJSON();
	const httpRequestName = metricsJson.find((metric) =>
		metric.name.endsWith(HTTP_REQUESTS_TOTAL),
	);
	const httpRequestDurationName = metricsJson.find((metric) =>
		metric.name.endsWith(HTTP_REQUEST_DURATION),
	);
	const httpServerDurationSecondsName = metricsJson.find((metric) =>
		metric.name.endsWith(HTTP_SERVER_DURATION_SECONDS),
	);
	const httpRequestsTotal = client.register.getSingleMetric(
		httpRequestName?.name ?? "",
	);
	const httpRequestDuration = client.register.getSingleMetric(
		httpRequestDurationName?.name ?? "",
	);
	const httpServerDurationSeconds = client.register.getSingleMetric(
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

export const onRequest = defineMiddleware(async (context, next) => {
	const { httpRequestsTotal, httpRequestDuration, httpServerDurationSeconds } =
		await findMetrics(context);

	// Start timer
	const start = process.hrtime();

	// Process the request
	const response = await next();

	// Calculate duration
	const [seconds, nanoseconds] = process.hrtime(start);
	const duration = seconds + nanoseconds / 1e9;
	const path = context.url.pathname;

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
		const ttlbStart = process.hrtime();
		const originalBody = response.body;
		const wrappedBody = new ReadableStream({
			start(controller) {
				const reader = originalBody.getReader();
				function push() {
					reader.read().then(({ done, value }) => {
						if (done) {
							const [s, ns] = process.hrtime(ttlbStart);
							const ttlbDuration = s + ns / 1e9;
							if (httpServerDurationSeconds instanceof client.Histogram) {
								httpServerDurationSeconds.observe(labels, ttlbDuration);
							}
							controller.close();
							return;
						}
						controller.enqueue(value);
						push();
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
