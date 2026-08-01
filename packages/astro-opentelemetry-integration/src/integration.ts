import { defineIntegration } from "astro-integration-kit";
import {
	type IntegrationSchema,
	integrationSchema,
} from "./integrationSchema.js";
import { ALLOWED_ADAPTERS, INTEGRATION_NAME } from "./utils/constants.js";

/**
 * Build server-entry bootstrap that sets runtime options before loading the SDK.
 * Uses a dynamic import so assignments run before SDK evaluation (static imports are hoisted).
 * Required for `node dist/server/entry.mjs` where Astro config never runs in-process.
 */
export const createSdkBootstrapCode = (
	options: Pick<IntegrationSchema, "otel" | "presets">,
): string => {
	const otel = JSON.stringify(options.otel);
	const presets = JSON.stringify(options.presets ?? {});
	return `globalThis.__OTEL_OPTIONS__=${otel};globalThis.__OTEL_PRESETS__=${presets};await import("astro-opentelemetry-integration/sdk");\n`;
};

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
		globalThis.__OTEL_PRESETS__ = options.presets;

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
					const sdkBootstrapCode = createSdkBootstrapCode(options);

					// Inject options + SDK load into the server entry.
					// The SDK package is external, so Vite `define` cannot reach it;
					// baking options into entry.mjs is what makes standalone Node work.
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
												chunk.code = `${sdkBootstrapCode}${chunk.code}`;
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
