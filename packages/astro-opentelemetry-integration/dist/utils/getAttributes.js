// src/utils/getAttributes.ts
var OTEL_SERVICE_NAME = globalThis.__OTEL_OPTIONS__.serviceName || process.env.OTEL_SERVICE_NAME;
var OTEL_SERVICE_VERSION = globalThis.__OTEL_OPTIONS__.serviceVersion || process.env.OTEL_SERVICE_VERSION;
export {
  OTEL_SERVICE_NAME,
  OTEL_SERVICE_VERSION
};
//# sourceMappingURL=getAttributes.js.map