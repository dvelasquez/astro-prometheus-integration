import client, { Counter, Histogram } from "prom-client";

const register = client.register;

const metrics = {
	httpRequestsTotal: null as Counter | null,
	httpRequestDuration: null as Histogram | null,
};

const initRegistry = (prometheusConfig?: { prefix: string }) => {
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

export const HTTP_REQUESTS_TOTAL = "http_requests_total";
export const HTTP_REQUEST_DURATION = "http_request_duration_seconds";

const initMetrics = ({
	register,
	prefix,
}: { register: client.Registry; prefix: string }) => {
	metrics.httpRequestsTotal = new Counter({
		name: `${prefix}${HTTP_REQUESTS_TOTAL}`,
		help: "Total number of HTTP requests",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});

	metrics.httpRequestDuration = new Histogram({
		name: `${prefix}${HTTP_REQUEST_DURATION}`,
		help: "Duration of HTTP requests in seconds",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});
};

export { register, initRegistry };
