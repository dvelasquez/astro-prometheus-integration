// Metric registration and initialization for Astro Prometheus Node integration
import client from "prom-client";
import type { MetricsConfigWithUndefined } from "./config.js";

export const HTTP_REQUESTS_TOTAL = "http_requests_total";
export const HTTP_REQUEST_DURATION = "http_request_duration_seconds";
export const HTTP_SERVER_DURATION_SECONDS = "http_server_duration_seconds";
export const HTTP_RESPONSES_TOTAL = "http_responses_total";
export const HTTP_RESPONSE_DURATION_SECONDS = "http_response_duration_seconds";
export const HTTP_RESPONSE_ERROR_TOTAL = "http_response_error_total";

// Registry-first approach: Store metrics per registry to avoid conflicts
const registryMetrics = new Map<
	client.Registry,
	{
		httpRequestsTotal: client.Counter;
		httpRequestDuration: client.Histogram;
		httpServerDurationSeconds: client.Histogram;
	}
>();

const outboundRegistryMetrics = new Map<
	client.Registry,
	{
		httpResponsesTotal: client.Counter;
		httpResponseDuration: client.Histogram;
		httpResponseErrorTotal: client.Counter;
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

export const createOutboundMetricsForRegistry = ({
	register,
	prefix = "",
}: {
	register: client.Registry;
	prefix?: string;
}) => {
	if (outboundRegistryMetrics.has(register)) {
		return outboundRegistryMetrics.get(register)!;
	}

	const httpResponsesTotal = new client.Counter({
		name: `${prefix}${HTTP_RESPONSES_TOTAL}`,
		help: "Total number of outbound HTTP responses",
		labelNames: ["method", "host", "status", "endpoint", "app"],
		registers: [register],
	});

	const httpResponseDuration = new client.Histogram({
		name: `${prefix}${HTTP_RESPONSE_DURATION_SECONDS}`,
		help: "Duration in seconds of outbound HTTP responses to other services.",
		labelNames: ["method", "host", "status", "endpoint", "app"],
		buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 25, 50, 100],
		registers: [register],
	});

	const httpResponseErrorTotal = new client.Counter({
		name: `${prefix}${HTTP_RESPONSE_ERROR_TOTAL}`,
		help: "Total number of outbound HTTP response errors",
		labelNames: ["method", "host", "status", "endpoint", "error_reason", "app"],
		registers: [register],
	});

	const metrics = {
		httpResponsesTotal,
		httpResponseDuration,
		httpResponseErrorTotal,
	};

	outboundRegistryMetrics.set(register, metrics);

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
	outboundRegistryMetrics.delete(register);
};
