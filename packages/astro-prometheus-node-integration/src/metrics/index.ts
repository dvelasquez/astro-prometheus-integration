// Metric registration and initialization for Astro Prometheus Node integration
import client, { Counter, Histogram } from "prom-client";
import type { MetricsConfig } from "./config.js";

const metrics = {
	httpRequestsTotal: null as Counter | null,
	httpRequestDuration: null as Histogram | null,
	httpServerDurationSeconds: null as Histogram | null,
};

const initRegistry = ({
	register,
	collectDefaultMetricsConfig,
	registerContentType,
}: {
	register: client.Registry;
	collectDefaultMetricsConfig?: MetricsConfig;
	registerContentType: string;
}) => {
	if (register) {
		clearRegistry(register);
	}
	if (registerContentType === "OPENMETRICS") {
		// OpenMetrics is not typed correctly, see https://github.com/siimon/prom-client/issues/653
		client.register.setContentType(
			// biome-ignore lint/suspicious/noExplicitAny: types at prom-client are not up to date
			client.Registry.OPENMETRICS_CONTENT_TYPE as any,
		);
	}
	const collectDefaultMetrics = client.collectDefaultMetrics;

	const baseConfig = collectDefaultMetricsConfig
		? { ...collectDefaultMetricsConfig }
		: {};
	const config = {
		register,
		...baseConfig,
	} as client.DefaultMetricsCollectorConfiguration<client.RegistryContentType>;

	collectDefaultMetrics(config);
	if (collectDefaultMetricsConfig?.labels) {
		register.setDefaultLabels(collectDefaultMetricsConfig.labels);
	}

	initMetrics({
		register,
		prefix: collectDefaultMetricsConfig?.prefix ?? "",
	});

	return register;
};

export const HTTP_REQUESTS_TOTAL = "http_requests_total";
export const HTTP_REQUEST_DURATION = "http_request_duration_seconds";
export const HTTP_SERVER_DURATION_SECONDS = "http_server_duration_seconds";

const initMetrics = ({
	register,
	prefix,
}: {
	register: client.Registry;
	prefix: string;
}) => {
	metrics.httpRequestsTotal = new Counter({
		name: `${prefix}${HTTP_REQUESTS_TOTAL}`,
		help: "Total number of HTTP requests",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});

	metrics.httpRequestDuration = new Histogram({
		name: `${prefix}${HTTP_REQUEST_DURATION}`,
		help: "Duration in seconds of initial server-side request processing, including middleware and Astro frontmatter, measured until the response is ready to send/stream.",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});

	metrics.httpServerDurationSeconds = new Histogram({
		name: `${prefix}${HTTP_SERVER_DURATION_SECONDS}`,
		help: "Full server-side HTTP request duration in seconds, including processing, Astro rendering, and response streaming.",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});
};

export const clearRegistry = (register: client.Registry) => {
	register.clear();
	register.resetMetrics();
}; 

export { initRegistry, initMetrics };
