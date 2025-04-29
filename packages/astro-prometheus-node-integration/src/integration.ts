// Integration for Astro Prometheus Node: defines the integration and its options schema using Zod
import { defineIntegration } from "astro-integration-kit";
import { z } from "astro/zod";
import Prometheus from "prom-client";
import { metricsConfigSchema } from "./metrics/config.js";
import { initRegistry } from "./metrics/index.js";

const integrationSchema = z
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
				"astro:config:setup": ({ injectRoute, addMiddleware, logger }) => {
					logger.info("setting up integration");
					// Get the global register instance
					const register = Prometheus.register;

					initRegistry({
						register,
						...(options.collectDefaultMetricsConfig
							? {
									collectDefaultMetricsConfig:
										options.collectDefaultMetricsConfig,
								}
							: {}),
						registerContentType: options.registerContentType,
					});

					if (options.standaloneMetrics?.enabled) {
						// Start standalone metrics server
						import("./routes/standalone-metrics-server.ts").then(
							({ startStandaloneMetricsServer }) => {
								startStandaloneMetricsServer({
									register,
									port: options.standaloneMetrics.port,
									metricsUrl: options.metricsUrl,
									logger,
								});
							},
						);
					} else {
						injectRoute({
							pattern: options.metricsUrl,
							entrypoint: new URL("./routes/metrics.js", import.meta.url),
						});
					}
					addMiddleware({
						order: "pre",
						entrypoint: new URL(
							"./middleware/prometheus-middleware.js",
							import.meta.url,
						),
					});
					logger.info("integration setup complete");
				},
			},
		};
	},
});
