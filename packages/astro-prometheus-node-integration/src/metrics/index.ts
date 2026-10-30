// Metric registration and initialization for Astro Prometheus Node integration
import client from "prom-client";
import {
	getGlobalState,
	type InboundMetrics,
	type OutboundMetrics,
} from "../state/global-state.js";
import type { MetricsConfigWithUndefined } from "./config.js";

export const HTTP_REQUESTS_TOTAL = "http_requests_total";
export const HTTP_REQUEST_DURATION = "http_request_duration_seconds";
export const HTTP_SERVER_DURATION_SECONDS = "http_server_duration_seconds";
export const HTTP_RESPONSES_TOTAL = "http_responses_total";
export const HTTP_RESPONSE_DURATION_SECONDS = "http_response_duration_seconds";
export const HTTP_RESPONSE_ERROR_TOTAL = "http_response_error_total";

// Returns the metric already registered under `name`, or creates it. Guards
// against "already registered" errors when caches are lost but the registry
// keeps its metrics (e.g. module re-evaluation on Vite HMR).
const getOrCreateMetric = <T extends client.Metric>(
	register: client.Registry,
	name: string,
	create: () => T,
): T => (register.getSingleMetric(name) as T | undefined) ?? create();

interface CreateMetricsForRegistryParams {
	register: client.Registry;
	prefix?: string;
	buckets?: number[];
}

// Private helper: Create inbound HTTP metrics
const createInboundMetrics = ({
	register,
	prefix,
	buckets,
}: CreateMetricsForRegistryParams): InboundMetrics => {
	const httpRequestsTotalName = `${prefix}${HTTP_REQUESTS_TOTAL}`;
	const httpRequestsTotal = getOrCreateMetric(
		register,
		httpRequestsTotalName,
		() =>
			new client.Counter({
				name: httpRequestsTotalName,
				help: "Total number of HTTP requests",
				labelNames: ["method", "path", "status"],
				registers: [register],
			}),
	);

	const httpRequestDurationName = `${prefix}${HTTP_REQUEST_DURATION}`;
	const httpRequestDuration = getOrCreateMetric(
		register,
		httpRequestDurationName,
		() =>
			new client.Histogram({
				name: httpRequestDurationName,
				help: "Duration in seconds of initial server-side request processing, including middleware and Astro frontmatter, measured until the response is ready to send/stream.",
				labelNames: ["method", "path", "status"],
				registers: [register],
				...(buckets ? { buckets } : {}),
			}),
	);

	const httpServerDurationSecondsName = `${prefix}${HTTP_SERVER_DURATION_SECONDS}`;
	const httpServerDurationSeconds = getOrCreateMetric(
		register,
		httpServerDurationSecondsName,
		() =>
			new client.Histogram({
				name: httpServerDurationSecondsName,
				help: "Full server-side HTTP request duration in seconds, including processing, Astro rendering, and response streaming.",
				labelNames: ["method", "path", "status"],
				registers: [register],
				...(buckets ? { buckets } : {}),
			}),
	);

	return {
		httpRequestsTotal,
		httpRequestDuration,
		httpServerDurationSeconds,
	};
};

export const createMetricsForRegistry = ({
	register,
	prefix = "",
	buckets,
}: CreateMetricsForRegistryParams) => {
	// Guard clause: return cached metrics if they exist
	const { inboundMetrics } = getGlobalState();
	const existing = inboundMetrics.get(register);
	if (existing) {
		return existing;
	}

	// Create fresh metrics for this specific registry
	const metrics = createInboundMetrics({
		register,
		prefix,
		...(buckets ? { buckets } : {}),
	});

	// Store metrics for this registry
	inboundMetrics.set(register, metrics);

	return metrics;
};

interface CreateOutboundMetricsForRegistryParams {
	register: client.Registry;
	prefix?: string;
	buckets?: number[];
}

// Private helper: Create outbound HTTP metrics
const createOutboundMetrics = ({
	register,
	prefix,
	buckets,
}: CreateOutboundMetricsForRegistryParams): OutboundMetrics => {
	const httpResponsesTotalName = `${prefix}${HTTP_RESPONSES_TOTAL}`;
	const httpResponsesTotal = getOrCreateMetric(
		register,
		httpResponsesTotalName,
		() =>
			new client.Counter({
				name: httpResponsesTotalName,
				help: "Total number of outbound HTTP responses",
				labelNames: ["method", "host", "status", "endpoint", "app"],
				registers: [register],
			}),
	);

	const httpResponseDurationName = `${prefix}${HTTP_RESPONSE_DURATION_SECONDS}`;
	const httpResponseDuration = getOrCreateMetric(
		register,
		httpResponseDurationName,
		() =>
			new client.Histogram({
				name: httpResponseDurationName,
				help: "Duration in seconds of outbound HTTP responses to other services.",
				labelNames: ["method", "host", "status", "endpoint", "app"],
				registers: [register],
				...(buckets ? { buckets } : {}),
			}),
	);

	const httpResponseErrorTotalName = `${prefix}${HTTP_RESPONSE_ERROR_TOTAL}`;
	const httpResponseErrorTotal = getOrCreateMetric(
		register,
		httpResponseErrorTotalName,
		() =>
			new client.Counter({
				name: httpResponseErrorTotalName,
				help: "Total number of outbound HTTP response errors",
				labelNames: [
					"method",
					"host",
					"status",
					"endpoint",
					"error_reason",
					"app",
				],
				registers: [register],
			}),
	);

	return {
		httpResponsesTotal,
		httpResponseDuration,
		httpResponseErrorTotal,
	};
};

export const createOutboundMetricsForRegistry = ({
	register,
	prefix = "",
	buckets,
}: CreateOutboundMetricsForRegistryParams) => {
	// Guard clause: return cached metrics if they exist
	const { outboundMetrics } = getGlobalState();
	const existingOutbound = outboundMetrics.get(register);
	if (existingOutbound) {
		return existingOutbound;
	}

	// Create fresh metrics for this specific registry
	const metrics = createOutboundMetrics({
		register,
		prefix,
		...(buckets ? { buckets } : {}),
	});

	outboundMetrics.set(register, metrics);

	return metrics;
};

interface InitRegistryParams {
	register: client.Registry;
	collectDefaultMetricsConfig?: MetricsConfigWithUndefined | null | undefined;
	registerContentType: string;
	inboundBuckets?: number[];
}

// Private helper: Configure content type for registry
const configureRegistryContentType = ({
	register,
	registerContentType,
}: {
	register: client.Registry;
	registerContentType: string;
}) => {
	if (registerContentType === "OPENMETRICS") {
		// OpenMetrics is not typed correctly, see https://github.com/siimon/prom-client/issues/653
		register.setContentType(
			// biome-ignore lint/suspicious/noExplicitAny: types at prom-client are not up to date
			client.Registry.OPENMETRICS_CONTENT_TYPE as any,
		);
	}
};

// Private helper: Collect default metrics if enabled
const collectDefaultMetricsIfEnabled = ({
	register,
	collectDefaultMetricsConfig,
}: {
	register: client.Registry;
	collectDefaultMetricsConfig?: MetricsConfigWithUndefined | null | undefined;
}) => {
	// Guard clause: skip if explicitly disabled
	if (collectDefaultMetricsConfig === null) {
		return;
	}

	const baseConfig = collectDefaultMetricsConfig
		? { ...collectDefaultMetricsConfig }
		: {};
	const config = {
		register,
		...baseConfig,
	} as client.DefaultMetricsCollectorConfiguration<client.RegistryContentType>;

	// Default metrics are already registered (e.g. module re-evaluated on HMR)
	const prefix = collectDefaultMetricsConfig?.prefix ?? "";
	if (register.getSingleMetric(`${prefix}process_cpu_user_seconds_total`)) {
		return;
	}

	client.collectDefaultMetrics(config);
};

// Private helper: Set default labels if provided
const setDefaultLabelsIfProvided = ({
	register,
	collectDefaultMetricsConfig,
}: {
	register: client.Registry;
	collectDefaultMetricsConfig?: MetricsConfigWithUndefined | null | undefined;
}) => {
	if (collectDefaultMetricsConfig?.labels) {
		register.setDefaultLabels(collectDefaultMetricsConfig.labels);
	}
};

export const initRegistry = ({
	register,
	collectDefaultMetricsConfig,
	registerContentType,
	inboundBuckets,
}: InitRegistryParams) => {
	configureRegistryContentType({ register, registerContentType });
	collectDefaultMetricsIfEnabled({ register, collectDefaultMetricsConfig });
	setDefaultLabelsIfProvided({ register, collectDefaultMetricsConfig });

	// Create and register metrics for this specific registry
	const prefix = collectDefaultMetricsConfig?.prefix ?? "";
	createMetricsForRegistry({
		register,
		prefix,
		...(inboundBuckets ? { buckets: inboundBuckets } : {}),
	});

	return register;
};

interface ClearRegistryParams {
	register: client.Registry;
}

export const clearRegistry = ({ register }: ClearRegistryParams) => {
	register.clear();
	register.resetMetrics();
};

// Function to clear metrics for a specific registry (useful for testing)
export const clearRegistryMetrics = ({ register }: ClearRegistryParams) => {
	const { middlewareMetrics, inboundMetrics, outboundMetrics } =
		getGlobalState();
	middlewareMetrics.delete(register);
	inboundMetrics.delete(register);
	outboundMetrics.delete(register);
};
