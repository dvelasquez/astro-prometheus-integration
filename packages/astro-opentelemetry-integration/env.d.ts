/// <reference types="astro/client" />
import type { IntegrationSchema } from "./src/integration.ts";

declare global {
	var __astroOtelStandaloneServerStarted: boolean;
	var __OTEL_OPTIONS__: IntegrationSchema["otel"];
	var __OTEL_PRESETS__: IntegrationSchema["presets"];
}
