import client, { Counter, Histogram } from "prom-client";

const register = client.register;

// Create a metrics object to hold our metrics
const metrics = {
	httpRequestsTotal: null as Counter | null,
	httpRequestDuration: null as Histogram | null,
};

const initRegistry = (prometheusConfig?: { prefix: string }) => {
	console.log("initRegistry is called");
	if (register) {
		register.clear();
	}

	const collectDefaultMetrics = client.collectDefaultMetrics;

	const config: client.DefaultMetricsCollectorConfiguration<client.RegistryContentType> =
		{
			register,
		};
	if (prometheusConfig?.prefix) {
		config.prefix = prometheusConfig.prefix;
	}

	collectDefaultMetrics(config);
	initMetrics({ register, prefix: prometheusConfig?.prefix ?? "" });

	return register;
};

const initMetrics = ({
	register,
	prefix,
}: { register: client.Registry; prefix: string }) => {
	metrics.httpRequestsTotal = new Counter({
		name: `${prefix}http_requests_total`,
		help: "Total number of HTTP requests made to astro",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});

	metrics.httpRequestDuration = new Histogram({
		name: `${prefix}http_request_duration_seconds`,
		help: "Duration of HTTP requests made to astro in seconds",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});
};

export { register, initRegistry, initMetrics, metrics };
