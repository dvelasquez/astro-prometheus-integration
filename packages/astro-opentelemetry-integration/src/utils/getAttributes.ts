export const OTEL_SERVICE_NAME =
	process.env.OTEL_SERVICE_NAME || globalThis["__OTEL_OPTIONS__"].serviceName;
export const OTEL_SERVICE_VERSION =
	process.env.OTEL_SERVICE_VERSION ||
	globalThis["__OTEL_OPTIONS__"].serviceVersion;
