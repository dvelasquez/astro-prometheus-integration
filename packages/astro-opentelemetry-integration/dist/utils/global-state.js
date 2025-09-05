// src/utils/global-state.ts
function isSDKInitialized() {
  return globalThis.__OTEL_SDK_INITIALIZED__ === true;
}
function isSDKInitializing() {
  return globalThis.__OTEL_SDK_INITIALIZING__ === true;
}
function setSDKInitializing(initializing) {
  globalThis.__OTEL_SDK_INITIALIZING__ = initializing;
}
function setSDKInitialized(initialized) {
  globalThis.__OTEL_SDK_INITIALIZED__ = initialized;
}
function getSDKPromise() {
  return globalThis.__OTEL_SDK_PROMISE__;
}
function setSDKPromise(promise) {
  globalThis.__OTEL_SDK_PROMISE__ = promise;
}
function isHostMetricsInitialized() {
  return globalThis.__OTEL_HOST_METRICS_INITIALIZED__ === true;
}
function setHostMetricsInitialized(initialized) {
  globalThis.__OTEL_HOST_METRICS_INITIALIZED__ = initialized;
}
function isShutdownHandlerSet() {
  return globalThis.__OTEL_SHUTDOWN_HANDLER_SET__ === true;
}
function setShutdownHandlerSet(set) {
  globalThis.__OTEL_SHUTDOWN_HANDLER_SET__ = set;
}
function getGlobalSDK() {
  return globalThis.__OTEL_SDK__;
}
function setGlobalSDK(sdk) {
  globalThis.__OTEL_SDK__ = sdk;
}
function resetGlobalState() {
  globalThis.__OTEL_SDK__ = void 0;
  globalThis.__OTEL_SDK_INITIALIZED__ = false;
  globalThis.__OTEL_SDK_INITIALIZING__ = false;
  globalThis.__OTEL_SDK_PROMISE__ = void 0;
  globalThis.__OTEL_HOST_METRICS_INITIALIZED__ = false;
  globalThis.__OTEL_SHUTDOWN_HANDLER_SET__ = false;
}
export {
  getGlobalSDK,
  getSDKPromise,
  isHostMetricsInitialized,
  isSDKInitialized,
  isSDKInitializing,
  isShutdownHandlerSet,
  resetGlobalState,
  setGlobalSDK,
  setHostMetricsInitialized,
  setSDKInitialized,
  setSDKInitializing,
  setSDKPromise,
  setShutdownHandlerSet
};
//# sourceMappingURL=global-state.js.map