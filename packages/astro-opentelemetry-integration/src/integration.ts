import { defineIntegration } from "astro-integration-kit";
import { integrationSchema } from "./integrationSchema.js";
import { ALLOWED_ADAPTERS, INTEGRATION_NAME } from "./utils/constants.js";

export const integration = defineIntegration({
	name: INTEGRATION_NAME,
	optionsSchema: integrationSchema,
	setup({ options }) {
		if (!options.enabled) {
			return {
				hooks: {},
			};
		}

		globalThis.__OTEL_OPTIONS__ = options.otel;

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
							`${INTEGRATION_NAME} currently only works with one of the following adapters: ${ALLOWED_ADAPTERS.join(", ")}`,
						);
					}

					if (command === "dev") {
						logger.info(
							`prepending ${INTEGRATION_NAME} OpenTelemetry SDK to dev mode`,
						);
						import("./sdk.js");
					}

					const serverEntry = config.build.serverEntry;

					// Inject OpenTelemetry SDK as the first module in the Vite build
					// This achieves the same effect as `node --import=./sdk.js`
					updateConfig({
						vite: {
							plugins: [
								{
									name: `${INTEGRATION_NAME}-sdk-prepend`,
									enforce: "pre",
									generateBundle(_options, bundle) {
										const entryFileName = serverEntry || "entry.mjs";

										for (const [fileName, chunk] of Object.entries(bundle)) {
											if (
												fileName === entryFileName &&
												chunk.type === "chunk"
											) {
												logger.info(
													`Prepending ${INTEGRATION_NAME} OpenTelemetry SDK to output file: ${fileName}`,
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
