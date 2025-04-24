import client, { Counter, Histogram } from "prom-client";

// Create a singleton registry
const register = client.register;

// Clear any existing metrics (important for hot reloading scenarios)
register.clear();

const collectDefaultMetrics = client.collectDefaultMetrics;

// Collect default metrics
collectDefaultMetrics({ register });

export const httpRequestsTotal = new Counter({
	name: "http_requests_total",
	help: "Total number of HTTP requests made to astro",
	labelNames: ["method", "path", "status"],
	registers: [register],
});

export const httpRequestDuration = new Histogram({
	name: "http_request_duration_seconds",
	help: "Duration of HTTP requests made to astro in seconds",
	labelNames: ["method", "path", "status"],
	registers: [register],
});

export default register;
