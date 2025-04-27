// Integration for Astro Prometheus Node: defines the integration and its options schema using Zod
import { defineIntegration } from "astro-integration-kit";
import { z } from "astro/zod";
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
})
.default({})

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
				"astro:config:setup": ({ injectRoute, addMiddleware }) => {
					initRegistry({
						...(options.collectDefaultMetricsConfig
							? {
									collectDefaultMetricsConfig:
										options.collectDefaultMetricsConfig,
								}
							: {}),
						registerContentType: options.registerContentType,
					});
					injectRoute({
						pattern: options.metricsUrl,
						entrypoint: new URL("./routes/metrics.js", import.meta.url),
					});
					addMiddleware({
						order: "pre",
						entrypoint: new URL("./middleware/prometheus-middleware.js", import.meta.url),
					});
				},
			},
		};
	},
});
