export const OTEL_SERVICE_NAME =
	globalThis.__OTEL_OPTIONS__.serviceName || process.env.OTEL_SERVICE_NAME;
export const OTEL_SERVICE_VERSION =
	globalThis.__OTEL_OPTIONS__.serviceVersion ||
	process.env.OTEL_SERVICE_VERSION;
