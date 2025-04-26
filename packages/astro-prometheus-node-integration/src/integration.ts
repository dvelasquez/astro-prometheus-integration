import { defineIntegration } from "astro-integration-kit";
import { z } from "astro/zod";
import { metricsConfigSchema } from "./metrics-config.js";
import { initRegistry } from "./register.js";

export const integration = defineIntegration({
	name: "astro-prometheus-node-integration",
	optionsSchema: z
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
			collectDefaultMetricsConfig: metricsConfigSchema.optional(),
		})
		.default({}),
	setup({ options }) {
		if (!options.enabled) {
			return {
				hooks: {},
			};
		}

		return {
			hooks: {
				"astro:config:setup": ({ injectRoute, addMiddleware }) => {
					initRegistry(options.collectDefaultMetricsConfig);
					injectRoute({
						pattern: options.metricsUrl,
						entrypoint: new URL("./routes/metrics.js", import.meta.url),
					});
					addMiddleware({
						order: "pre",
						entrypoint: new URL("./middleware.js", import.meta.url),
					});
				},
			},
		};
	},
});
