// Configuration accessors for Prometheus integration
// Provides type-safe access to global configuration state

import type { z } from "astro/zod";
import type { integrationSchema } from "../integration.js";
import type { OutboundRequestsOptions } from "../outbound/schema.js";

export type IntegrationOptions = z.infer<typeof integrationSchema>;

// biome-ignore lint/suspicious/noExplicitAny: value is injected at build time by Vite define
declare const __PROMETHEUS_OPTIONS__: any;

interface GetPrometheusOptionsParams {
	override?: Partial<IntegrationOptions>;
}

const readBaseOptions = (): IntegrationOptions | undefined => {
	// 1) Prefer runtime overrides on globalThis (used in tests and dev tooling)
	const globalValue = (globalThis as typeof globalThis & {
		__PROMETHEUS_OPTIONS__?: IntegrationOptions;
	}).__PROMETHEUS_OPTIONS__;

	if (globalValue) {
		return globalValue;
	}

	// 2) Fallback to build-time injected constant from Vite define
	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const constantValue: IntegrationOptions | undefined = __PROMETHEUS_OPTIONS__;
		if (constantValue) {
			return constantValue;
		}
	} catch {
		// In non-Vite environments the constant may not exist; silently ignore
	}

	return undefined;
};

/**
 * Get Prometheus integration options with optional override.
 * Resolves configuration from either globalThis or Vite's define constant.
 */
export const getPrometheusOptions = ({
	override,
}: GetPrometheusOptionsParams = {}): IntegrationOptions | undefined => {
	const base = readBaseOptions();
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
