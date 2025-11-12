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
					// Get the global register instance

					const outboundRequests =
						options.outboundRequests?.enabled === true
							? ({
									enabled: true,
									includeErrors: options.outboundRequests.includeErrors ?? true,
									labels: options.outboundRequests.labels ?? {},
									shouldObserve: options.outboundRequests.shouldObserve,
								} satisfies OutboundRequestsOptions)
							: undefined;

					if (outboundRequests) {
						globalThis.__ASTRO_PROMETHEUS_OUTBOUND_CONFIG = outboundRequests;
					}

					const sanitizedOptions = {
						...options,
						outboundRequests: outboundRequests
							? {
									enabled: outboundRequests.enabled,
									includeErrors: outboundRequests.includeErrors,
								}
							: undefined,
					};

					if (!options.standaloneMetrics?.enabled) {
						injectRoute({
							pattern: options.metricsUrl,
							entrypoint: new URL("./routes/metrics.js", import.meta.url),
							prerender: false,
						});
					}
					updateConfig({
						vite: {
							define: {
								__PROMETHEUS_OPTIONS__: sanitizedOptions,
							},
						},
					});
					addMiddleware({
						order: "pre",
						entrypoint: new URL(
							"./middleware/prometheus-middleware.js",
							import.meta.url,
						),
					});
					if (outboundRequests) {
						addMiddleware({
							order: "pre",
							entrypoint: new URL(
								"./middleware/outbound-metrics.js",
								import.meta.url,
							),
						});
					}
					logger.info("integration setup complete");
				},
			},
		};
	},
});
