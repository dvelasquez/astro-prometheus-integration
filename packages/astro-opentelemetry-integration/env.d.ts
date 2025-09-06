import type { z } from "astro/zod";
/// <reference types="astro/client" />
import type { integrationSchema } from "./src/integration.ts";

declare global {
	var __astroOtelStandaloneServerStarted: boolean;
	var __OTEL_OPTIONS__: z.infer<typeof integrationSchema>;
}
