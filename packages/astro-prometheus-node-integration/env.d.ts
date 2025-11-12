import type { z } from "astro/zod";
/// <reference types="astro/client" />
import type { integrationSchema } from "./src/integration.ts";
import type { OutboundRequestsOptions } from "./src/outbound/schema.ts";

declare global {
	var __astroPromStandaloneServerStarted: boolean;
	var __PROMETHEUS_OPTIONS__: z.infer<typeof integrationSchema>;
	var __ASTRO_PROMETHEUS_OUTBOUND_CONFIG: OutboundRequestsOptions | undefined;
}
