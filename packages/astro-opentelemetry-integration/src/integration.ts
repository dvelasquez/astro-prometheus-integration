// Integration for Astro OpenTelemetry: defines the integration and its options schema using Zod

import { z } from "astro/zod";
import { defineIntegration } from "astro-integration-kit";

export const integrationSchema = z
	.object({
		enabled: z
			.boolean()
			.default(true)
			.describe(
				"Enable the integration. You might want to disable it in dev  mode.",
			),
	})
	.default({});

const ALLOWED_ADAPTERS = ["@astrojs/node"];

export const integration = defineIntegration({
	name: "astro-opentelemetry-integration",
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
					addMiddleware,
					logger,
					updateConfig,
					config,
					command,
				}) => {
					logger.info("setting up integration");

					if (
						!config.adapter ||
						!ALLOWED_ADAPTERS.includes(config.adapter.name)
					) {
						throw new Error(
							`astro-opentelemetry-integration currently only works with one of the following adapters: ${ALLOWED_ADAPTERS.join(", ")}`,
						);
					}

					if (command === "dev") {
						logger.info("prepending OpenTelemetry SDK to dev mode");
						import("./sdk.js");
					}

					const serverEntry = config.build.serverEntry;

					// Inject OpenTelemetry SDK as the first module in the Vite build
					// This achieves the same effect as `node --import=./sdk.js`
					updateConfig({
						vite: {
							plugins: [
								{
									name: "otel-sdk-prepend",
									enforce: "pre",
									generateBundle(_options, bundle) {
										const entryFileName = serverEntry || "entry.mjs";

										for (const [fileName, chunk] of Object.entries(bundle)) {
											if (
												fileName === entryFileName &&
												chunk.type === "chunk"
											) {
												logger.info(
													`Prepending OpenTelemetry SDK to output file: ${fileName}`,
												);
												chunk.code = `import 'astro-opentelemetry-integration/sdk';\n${chunk.code}`;
												break;
											}
										}
									},
								},
							],
						},
					});

					addMiddleware({
						order: "pre",
						entrypoint: new URL("./middleware/index.js", import.meta.url),
					});

					logger.info("integration setup complete");
				},
			},
		};
	},
});
