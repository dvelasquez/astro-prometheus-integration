// Integration for Astro Prometheus Node: defines the integration and its options schema using Zod
import { defineIntegration } from "astro-integration-kit";
import { z } from "astro/zod";
import { metricsConfigSchema } from "./metrics/config.js";

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

					if (!options.standaloneMetrics?.enabled) {
						injectRoute({
							prerender: false,
							pattern: options.metricsUrl,
							entrypoint: new URL("./routes/metrics.js", import.meta.url),
						});
					}
					updateConfig({
						vite: {
							define: {
								__PROMETHEUS_OPTIONS__: options,
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
					logger.info("integration setup complete");
				},
			},
		};
	},
});
