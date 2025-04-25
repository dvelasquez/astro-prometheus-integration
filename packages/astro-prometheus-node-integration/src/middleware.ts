import type { AstroSharedContext } from "astro";
import { defineMiddleware } from "astro/middleware";
import client from "prom-client";
import { HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION } from "./register.js";

const findMetrics = async (context: AstroSharedContext) => {
	const metricsJson = await client.register.getMetricsAsJSON();
	const httpRequestName = metricsJson.find((metric) =>
		metric.name.endsWith(HTTP_REQUESTS_TOTAL),
	);
	const httpRequestDurationName = metricsJson.find((metric) =>
		metric.name.endsWith(HTTP_REQUEST_DURATION),
	);
	const httpRequestsTotal = client.register.getSingleMetric(
		httpRequestName?.name ?? "",
	);
	const httpRequestDuration = client.register.getSingleMetric(
		httpRequestDurationName?.name ?? "",
	);
	if (!(httpRequestDuration instanceof client.Histogram)) {
		console.warn("httpRequestDuration is not a Histogram");
	}
	if (!(httpRequestsTotal instanceof client.Counter)) {
		console.warn("httpRequestsTotal is not a Counter");
	}

	return { httpRequestsTotal, httpRequestDuration };
};

export const onRequest = defineMiddleware(async (context, next) => {
	const { httpRequestsTotal, httpRequestDuration } = await findMetrics(context);

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

	return response;
});
