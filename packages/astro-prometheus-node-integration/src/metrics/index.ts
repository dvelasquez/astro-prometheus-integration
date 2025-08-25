// Metric registration and initialization for Astro Prometheus Node integration
import client from "prom-client";
import type { MetricsConfigWithUndefined } from "./config.js";

export const HTTP_REQUESTS_TOTAL = "http_requests_total";
export const HTTP_REQUEST_DURATION = "http_request_duration_seconds";
export const HTTP_SERVER_DURATION_SECONDS = "http_server_duration_seconds";

// Registry-first approach: Store metrics per registry to avoid conflicts
const registryMetrics = new Map<
	client.Registry,
	{
		httpRequestsTotal: client.Counter;
		httpRequestDuration: client.Histogram;
		httpServerDurationSeconds: client.Histogram;
	}
>();

export const createMetricsForRegistry = ({
	register,
	prefix = "",
}: {
	register: client.Registry;
	prefix?: string;
}) => {
	// Check if metrics already exist for this registry
	if (registryMetrics.has(register)) {
		return registryMetrics.get(register)!;
	}

	// Create fresh metrics for this specific registry
	const httpRequestsTotal = new client.Counter({
		name: `${prefix}${HTTP_REQUESTS_TOTAL}`,
		help: "Total number of HTTP requests",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});

	const httpRequestDuration = new client.Histogram({
		name: `${prefix}${HTTP_REQUEST_DURATION}`,
		help: "Duration in seconds of initial server-side request processing, including middleware and Astro frontmatter, measured until the response is ready to send/stream.",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});

	const httpServerDurationSeconds = new client.Histogram({
		name: `${prefix}${HTTP_SERVER_DURATION_SECONDS}`,
		help: "Full server-side HTTP request duration in seconds, including processing, Astro rendering, and response streaming.",
		labelNames: ["method", "path", "status"],
		registers: [register],
	});

	const metrics = {
		httpRequestsTotal,
		httpRequestDuration,
		httpServerDurationSeconds,
	};

	// Store metrics for this registry
	registryMetrics.set(register, metrics);

	return metrics;
};

export const initRegistry = ({
	register,
	collectDefaultMetricsConfig,
	registerContentType,
}: {
	register: client.Registry;
	collectDefaultMetricsConfig?: MetricsConfigWithUndefined | null | undefined;
	registerContentType: string;
}) => {
	if (registerContentType === "OPENMETRICS") {
		// OpenMetrics is not typed correctly, see https://github.com/siimon/prom-client/issues/653
		register.setContentType(
			// biome-ignore lint/suspicious/noExplicitAny: types at prom-client are not up to date
			client.Registry.OPENMETRICS_CONTENT_TYPE as any,
		);
	}

	// Only collect default metrics if not explicitly disabled
	if (collectDefaultMetricsConfig !== null) {
		const collectDefaultMetrics = client.collectDefaultMetrics;

		const baseConfig = collectDefaultMetricsConfig
			? { ...collectDefaultMetricsConfig }
			: {};
		const config = {
			register,
			...baseConfig,
		} as client.DefaultMetricsCollectorConfiguration<client.RegistryContentType>;

		collectDefaultMetrics(config);
	}

	if (collectDefaultMetricsConfig?.labels) {
		register.setDefaultLabels(collectDefaultMetricsConfig.labels);
	}

	// Create and register metrics for this specific registry
	createMetricsForRegistry({
		register,
		prefix: collectDefaultMetricsConfig?.prefix ?? "",
	});

	return register;
};

export const clearRegistry = (register: client.Registry) => {
	register.clear();
	register.resetMetrics();
};

// Function to clear metrics for a specific registry (useful for testing)
export const clearRegistryMetrics = (register: client.Registry) => {
	registryMetrics.delete(register);
};
