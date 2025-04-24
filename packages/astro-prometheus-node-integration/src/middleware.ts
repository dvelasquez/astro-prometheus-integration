import { defineMiddleware } from "astro/middleware";
import { httpRequestDuration, httpRequestsTotal } from "./register.ts";

export const onRequest = defineMiddleware(async (context, next) => {
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

	httpRequestsTotal.inc(labels);
	httpRequestDuration.observe(labels, duration);

	return response;
});
