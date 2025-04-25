import client, { Counter, Histogram } from "prom-client";

const register = client.register;

// Create a metrics object to hold our metrics
const metrics = {
	httpRequestsTotal: null as Counter | null,
	httpRequestDuration: null as Histogram | null,
};

const initRegistry = () => {
	console.log("initRegistry is called");
	if (register) {
		register.clear();
	}

	const collectDefaultMetrics = client.collectDefaultMetrics;

	collectDefaultMetrics({ register });
	initMetrics({ register });

	return register;
};

const initMetrics = ({ register }: { register: client.Registry }) => {
	metrics.httpRequestsTotal = new Counter({
		name: "http_requests_total",
		help: "Total number of HTTP requests made to astro",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});

	metrics.httpRequestDuration = new Histogram({
		name: "http_request_duration_seconds",
		help: "Duration of HTTP requests made to astro in seconds",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});
};

export { register, initRegistry, initMetrics, metrics };
