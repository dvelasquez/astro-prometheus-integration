import { z } from "astro/zod";
import type { DefaultMetricsCollectorConfiguration } from "prom-client";

// Zod schema and config types for Prometheus metrics configuration

/**
 * Zod schema for prom-client's DefaultMetricsCollectorConfiguration.
 * Only includes commonly used options for simplicity. Extend as needed.
 */
export const metricsConfigSchema = z.object({
	prefix: z.string().optional().describe("The prefix for the metrics."),
	labels: z
		.record(z.string(), z.string())
		.optional()
		.describe("The labels for the metrics."),
	register: z.any().optional().describe("[NOT USED] Additional registry."),
	gcDurationBuckets: z
		.array(z.number())
		.optional()
		.describe("The buckets for the gc duration."),
	eventLoopMonitoringPrecision: z
		.number()
		.optional()
		.describe("The precision for the event loop monitoring."),
	// Add more fields as needed from prom-client's config
});

// Export the inferred type that properly handles optional properties
export type MetricsConfig = z.infer<typeof metricsConfigSchema>;

// Also export a type that explicitly allows undefined for optional properties
export type MetricsConfigWithUndefined = {
	prefix?: string | undefined;
	labels?: Record<string, string> | undefined;
	register?: any | undefined;
	gcDurationBuckets?: number[] | undefined;
	eventLoopMonitoringPrecision?: number | undefined;
};

// For reference, also export the prom-client type
export type { DefaultMetricsCollectorConfiguration };
