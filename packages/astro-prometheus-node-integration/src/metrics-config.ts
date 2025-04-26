import { z } from "astro/zod";
import type { DefaultMetricsCollectorConfiguration } from "prom-client";

/**
 * Zod schema for prom-client's DefaultMetricsCollectorConfiguration.
 * Only includes commonly used options for simplicity. Extend as needed.
 */
export const metricsConfigSchema = z.object({
	prefix: z.string().optional(),
	labels: z.record(z.string(), z.string()).optional(),
	register: z.any().optional(), // Registry instance, not validated here
	gcDurationBuckets: z.array(z.number()).optional(),
	eventLoopMonitoringPrecision: z.number().optional(),
	// Add more fields as needed from prom-client's config
});

export type MetricsConfig = z.infer<typeof metricsConfigSchema>;

// For reference, also export the prom-client type
export type { DefaultMetricsCollectorConfiguration };
