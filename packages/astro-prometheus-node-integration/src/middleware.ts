import { defineMiddleware } from "astro/middleware";
import client from "prom-client";

export const onRequest = defineMiddleware(async (context, next) => {
	const metricsJson = await client.register.getMetricsAsJSON();
	const httpRequestName = metricsJson.find((metric) =>
		metric.name.includes("http_requests_total"),
	);
	const httpRequestDurationName = metricsJson.find((metric) =>
		metric.name.includes("http_request_duration_seconds"),
	);
	const httpRequestsTotal = client.register.getSingleMetric(
		httpRequestName?.name ?? "",
	);
	const httpRequestDuration = client.register.getSingleMetric(
		httpRequestDurationName?.name ?? "",
	);

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
