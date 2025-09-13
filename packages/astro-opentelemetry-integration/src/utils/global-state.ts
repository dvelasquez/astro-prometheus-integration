/**
 * Global state management utilities for OpenTelemetry SDK initialization
 * Provides safe guards against multiple initializations
 */

import type { NodeSDK } from "@opentelemetry/sdk-node";

declare global {
	var __OTEL_SDK__: NodeSDK | undefined;
	var __OTEL_SDK_INITIALIZED__: boolean | undefined;
	var __OTEL_SDK_INITIALIZING__: boolean | undefined;
	var __OTEL_SDK_PROMISE__: Promise<void> | undefined;
	var __OTEL_HOST_METRICS_INITIALIZED__: boolean | undefined;
	var __OTEL_SHUTDOWN_HANDLER_SET__: boolean | undefined;
}

/**
 * Check if the SDK has been initialized
 */
export function isSDKInitialized(): boolean {
	return globalThis.__OTEL_SDK_INITIALIZED__ === true;
}

/**
 * Check if the SDK is currently initializing
 */
export function isSDKInitializing(): boolean {
	return globalThis.__OTEL_SDK_INITIALIZING__ === true;
}

/**
 * Set the SDK initialization state
 */
export function setSDKInitializing(initializing: boolean): void {
	globalThis.__OTEL_SDK_INITIALIZING__ = initializing;
}

/**
 * Set the SDK initialized state
 */
export function setSDKInitialized(initialized: boolean): void {
	globalThis.__OTEL_SDK_INITIALIZED__ = initialized;
}

/**
 * Get the current SDK initialization promise
 */
export function getSDKPromise(): Promise<void> | undefined {
	return globalThis.__OTEL_SDK_PROMISE__;
}

/**
 * Set the SDK initialization promise
 */
export function setSDKPromise(promise: Promise<void>): void {
	globalThis.__OTEL_SDK_PROMISE__ = promise;
}

/**
 * Check if host metrics have been initialized
 */
export function isHostMetricsInitialized(): boolean {
	return globalThis.__OTEL_HOST_METRICS_INITIALIZED__ === true;
}

/**
 * Set host metrics initialization state
 */
export function setHostMetricsInitialized(initialized: boolean): void {
	globalThis.__OTEL_HOST_METRICS_INITIALIZED__ = initialized;
}

/**
 * Check if shutdown handler has been set
 */
export function isShutdownHandlerSet(): boolean {
	return globalThis.__OTEL_SHUTDOWN_HANDLER_SET__ === true;
}

/**
 * Set shutdown handler state
 */
export function setShutdownHandlerSet(set: boolean): void {
	globalThis.__OTEL_SHUTDOWN_HANDLER_SET__ = set;
}

/**
 * Get the global SDK instance
 */
export function getGlobalSDK(): NodeSDK | undefined {
	return globalThis.__OTEL_SDK__;
}

/**
 * Set the global SDK instance
 */
export function setGlobalSDK(sdk: NodeSDK): void {
	globalThis.__OTEL_SDK__ = sdk;
}

/**
 * Reset all global state (useful for testing)
 */
export function resetGlobalState(): void {
	globalThis.__OTEL_SDK__ = undefined;
	globalThis.__OTEL_SDK_INITIALIZED__ = false;
	globalThis.__OTEL_SDK_INITIALIZING__ = false;
	globalThis.__OTEL_SDK_PROMISE__ = undefined;
	globalThis.__OTEL_HOST_METRICS_INITIALIZED__ = false;
	globalThis.__OTEL_SHUTDOWN_HANDLER_SET__ = false;
}
