// Configuration accessors for Prometheus integration
// Provides type-safe access to global configuration state

import type { z } from "astro/zod";
import type { integrationSchema } from "../integration.js";
import type { OutboundRequestsOptions } from "../outbound/schema.js";

export type IntegrationOptions = z.infer<typeof integrationSchema>;

interface GetPrometheusOptionsParams {
	override?: Partial<IntegrationOptions>;
}

/**
 * Get Prometheus integration options with optional override.
 * Provides type-safe access to global __PROMETHEUS_OPTIONS__.
 */
export const getPrometheusOptions = ({
	override,
}: GetPrometheusOptionsParams = {}): IntegrationOptions | undefined => {
	const base = globalThis.__PROMETHEUS_OPTIONS__;
	if (!base) {
		return undefined;
	}

	if (!override) {
		return base;
	}

	return { ...base, ...override };
};

/**
 * Get outbound requests configuration.
 * Provides type-safe access to global __ASTRO_PROMETHEUS_OUTBOUND_CONFIG.
 */
export const getOutboundConfig = (): OutboundRequestsOptions | undefined => {
	return globalThis.__ASTRO_PROMETHEUS_OUTBOUND_CONFIG;
};
