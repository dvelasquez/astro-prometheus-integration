import { defineMiddleware } from "astro/middleware";
import { metrics } from "./register.js";

export const onRequest = defineMiddleware(async (context, next) => {
	console.log("onRequest is called");
	console.log("httpRequestsTotal", metrics.httpRequestsTotal);
	console.log("httpRequestDuration", metrics.httpRequestDuration);
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

	metrics.httpRequestsTotal?.inc(labels);
	metrics.httpRequestDuration?.observe(labels, duration);

	return response;
});
