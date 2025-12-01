// Integration for Astro Prometheus Node: defines the integration and its options schema using Zod

import { z } from "astro/zod";
import { defineIntegration } from "astro-integration-kit";
import { metricsConfigSchema } from "./metrics/config.js";
import {
	type OutboundRequestsOptions,
	outboundRequestsSchema,
} from "./outbound/schema.js";

export const integrationSchema = z
	.object({
		enabled: z
			.boolean()
			.default(true)
			.describe(
				"Enable the integration. You might want to disable it in dev  mode.",
			),
		metricsUrl: z
			.string()
			.default("/metrics")
			.describe("The URL to the metrics endpoint."),
		registerContentType: z
			.string()
			.default("PROMETHEUS")
			.describe("The content type of the metrics endpoint."),
		collectDefaultMetricsConfig: metricsConfigSchema.optional(),
		standaloneMetrics: z
			.object({
				enabled: z
					.boolean()
					.default(false)
					.describe("Expose metrics on a standalone HTTP server."),
				port: z
					.number()
					.default(7080)
					.describe("Port for standalone metrics server."),
			})
			.default({ enabled: false, port: 7080 })
			.describe("Standalone metrics server configuration."),
		experimental: z
			.object({
				useOptimizedTTLBMeasurement: z
					.boolean()
					.default(false)
					.describe(
						"Use the optimized TTLB measurement method that provides millisecond accuracy with minimal CPU overhead. When false, uses the legacy stream wrapping method for maximum accuracy but higher CPU usage.",
					),
			})
			.default({ useOptimizedTTLBMeasurement: false })
			.describe("Experimental features that may change in future releases."),
		outboundRequests: outboundRequestsSchema
			.optional()
			.describe("Track outbound HTTP requests made by the server."),
	})
	.default({});

type IntegrationOptions = z.infer<typeof integrationSchema>;

interface PrepareOutboundConfigParams {
	options: IntegrationOptions;
}

const prepareOutboundConfig = ({
	options,
}: PrepareOutboundConfigParams): OutboundRequestsOptions | undefined => {
	if (options.outboundRequests?.enabled !== true) {
		return undefined;
	}

	const outboundRequests: OutboundRequestsOptions = {
		enabled: true,
		includeErrors: options.outboundRequests.includeErrors ?? true,
		labels: options.outboundRequests.labels ?? {},
		shouldObserve: options.outboundRequests.shouldObserve,
	};

	return outboundRequests;
};

interface ApplyOutboundGlobalConfigParams {
	outboundRequests: OutboundRequestsOptions | undefined;
}

const applyOutboundGlobalConfig = ({
	outboundRequests,
}: ApplyOutboundGlobalConfigParams) => {
	if (!outboundRequests) {
		return;
	}

	globalThis.__ASTRO_PROMETHEUS_OUTBOUND_CONFIG = outboundRequests;
};

interface BuildSanitizedOptionsParams {
	options: IntegrationOptions;
	outboundRequests: OutboundRequestsOptions | undefined;
}

const buildSanitizedOptions = ({
	options,
	outboundRequests,
}: BuildSanitizedOptionsParams): IntegrationOptions => {
	if (!outboundRequests) {
		return options;
	}

	return {
		...options,
		outboundRequests: {
			...outboundRequests,
		},
	};
};

interface SetupMetricsRouteParams {
	options: IntegrationOptions;
	injectRoute: (input: {
		pattern: string;
		entrypoint: URL;
		prerender: boolean;
	}) => void;
}

const setupMetricsRoute = ({
	options,
	injectRoute,
}: SetupMetricsRouteParams) => {
	if (options.standaloneMetrics?.enabled) {
		return;
	}

	injectRoute({
		pattern: options.metricsUrl,
		entrypoint: new URL("./routes/metrics.js", import.meta.url),
		prerender: false,
	});
};

interface UpdateViteConfigParams {
	sanitizedOptions: IntegrationOptions;
	updateConfig: (input: { vite: { define: Record<string, unknown> } }) => void;
}

const updateViteConfig = ({
	sanitizedOptions,
	updateConfig,
}: UpdateViteConfigParams) => {
	updateConfig({
		vite: {
			define: {
				__PROMETHEUS_OPTIONS__: sanitizedOptions,
			},
		},
	});
};

interface RegisterMiddlewareParams {
	addMiddleware: (input: { order: "pre"; entrypoint: URL }) => void;
	outboundRequests: OutboundRequestsOptions | undefined;
}

const registerMiddleware = ({
	addMiddleware,
	outboundRequests,
}: RegisterMiddlewareParams) => {
	addMiddleware({
		order: "pre",
		entrypoint: new URL(
			"./middleware/prometheus-middleware.js",
			import.meta.url,
		),
	});

	if (!outboundRequests) {
		return;
	}

	addMiddleware({
		order: "pre",
		entrypoint: new URL("./middleware/outbound-metrics.js", import.meta.url),
	});
};

export const integration = defineIntegration({
	name: "astro-prometheus-node-integration",
	optionsSchema: integrationSchema,
	setup({ options }) {
		if (!options.enabled) {
			return {
				hooks: {},
			};
		}

		return {
			hooks: {
				"astro:config:setup": ({
					injectRoute,
					addMiddleware,
					logger,
					updateConfig,
				}) => {
					logger.info("setting up integration");

					const outboundRequests = prepareOutboundConfig({ options });
					applyOutboundGlobalConfig({ outboundRequests });

					const sanitizedOptions = buildSanitizedOptions({
						options,
						outboundRequests,
					});

					setupMetricsRoute({ options, injectRoute });
					updateViteConfig({ sanitizedOptions, updateConfig });
					registerMiddleware({ addMiddleware, outboundRequests });

					logger.info("integration setup complete");
				},
			},
		};
	},
});
