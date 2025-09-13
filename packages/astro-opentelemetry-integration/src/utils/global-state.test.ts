import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
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
	setShutdownHandlerSet,
} from "./global-state.js";

describe("global-state", () => {
	beforeEach(() => {
		// Reset global state before each test
		resetGlobalState();
	});

	afterEach(() => {
		// Clean up after each test
		resetGlobalState();
	});

	describe("SDK initialization state", () => {
		describe("isSDKInitialized", () => {
			it("should return false by default", () => {
				expect(isSDKInitialized()).toBe(false);
			});

			it("should return true when SDK is initialized", () => {
				setSDKInitialized(true);
				expect(isSDKInitialized()).toBe(true);
			});

			it("should return false when SDK is not initialized", () => {
				setSDKInitialized(false);
				expect(isSDKInitialized()).toBe(false);
			});
		});

		describe("setSDKInitialized", () => {
			it("should set the SDK initialized state", () => {
				setSDKInitialized(true);
				expect(globalThis.__OTEL_SDK_INITIALIZED__).toBe(true);
			});

			it("should unset the SDK initialized state", () => {
				setSDKInitialized(false);
				expect(globalThis.__OTEL_SDK_INITIALIZED__).toBe(false);
			});
		});

		describe("isSDKInitializing", () => {
			it("should return false by default", () => {
				expect(isSDKInitializing()).toBe(false);
			});

			it("should return true when SDK is initializing", () => {
				setSDKInitializing(true);
				expect(isSDKInitializing()).toBe(true);
			});

			it("should return false when SDK is not initializing", () => {
				setSDKInitializing(false);
				expect(isSDKInitializing()).toBe(false);
			});
		});

		describe("setSDKInitializing", () => {
			it("should set the SDK initializing state", () => {
				setSDKInitializing(true);
				expect(globalThis.__OTEL_SDK_INITIALIZING__).toBe(true);
			});

			it("should unset the SDK initializing state", () => {
				setSDKInitializing(false);
				expect(globalThis.__OTEL_SDK_INITIALIZING__).toBe(false);
			});
		});
	});

	describe("SDK promise management", () => {
		describe("getSDKPromise", () => {
			it("should return undefined by default", () => {
				expect(getSDKPromise()).toBeUndefined();
			});

			it("should return the set promise", () => {
				const promise = Promise.resolve();
				setSDKPromise(promise);
				expect(getSDKPromise()).toBe(promise);
			});
		});

		describe("setSDKPromise", () => {
			it("should set the SDK promise", () => {
				const promise = Promise.resolve();
				setSDKPromise(promise);
				expect(globalThis.__OTEL_SDK_PROMISE__).toBe(promise);
			});
		});
	});

	describe("host metrics state", () => {
		describe("isHostMetricsInitialized", () => {
			it("should return false by default", () => {
				expect(isHostMetricsInitialized()).toBe(false);
			});

			it("should return true when host metrics are initialized", () => {
				setHostMetricsInitialized(true);
				expect(isHostMetricsInitialized()).toBe(true);
			});

			it("should return false when host metrics are not initialized", () => {
				setHostMetricsInitialized(false);
				expect(isHostMetricsInitialized()).toBe(false);
			});
		});

		describe("setHostMetricsInitialized", () => {
			it("should set the host metrics initialized state", () => {
				setHostMetricsInitialized(true);
				expect(globalThis.__OTEL_HOST_METRICS_INITIALIZED__).toBe(true);
			});

			it("should unset the host metrics initialized state", () => {
				setHostMetricsInitialized(false);
				expect(globalThis.__OTEL_HOST_METRICS_INITIALIZED__).toBe(false);
			});
		});
	});

	describe("shutdown handler state", () => {
		describe("isShutdownHandlerSet", () => {
			it("should return false by default", () => {
				expect(isShutdownHandlerSet()).toBe(false);
			});

			it("should return true when shutdown handler is set", () => {
				setShutdownHandlerSet(true);
				expect(isShutdownHandlerSet()).toBe(true);
			});

			it("should return false when shutdown handler is not set", () => {
				setShutdownHandlerSet(false);
				expect(isShutdownHandlerSet()).toBe(false);
			});
		});

		describe("setShutdownHandlerSet", () => {
			it("should set the shutdown handler state", () => {
				setShutdownHandlerSet(true);
				expect(globalThis.__OTEL_SHUTDOWN_HANDLER_SET__).toBe(true);
			});

			it("should unset the shutdown handler state", () => {
				setShutdownHandlerSet(false);
				expect(globalThis.__OTEL_SHUTDOWN_HANDLER_SET__).toBe(false);
			});
		});
	});

	describe("global SDK management", () => {
		describe("getGlobalSDK", () => {
			it("should return undefined by default", () => {
				expect(getGlobalSDK()).toBeUndefined();
			});

			it("should return the set SDK", () => {
				const mockSDK = { name: "test-sdk" } as any;
				setGlobalSDK(mockSDK);
				expect(getGlobalSDK()).toBe(mockSDK);
			});
		});

		describe("setGlobalSDK", () => {
			it("should set the global SDK", () => {
				const mockSDK = { name: "test-sdk" } as any;
				setGlobalSDK(mockSDK);
				expect(globalThis.__OTEL_SDK__).toBe(mockSDK);
			});
		});
	});

	describe("resetGlobalState", () => {
		it("should reset all global state to initial values", () => {
			// Set all states to non-default values
			setSDKInitialized(true);
			setSDKInitializing(true);
			setSDKPromise(Promise.resolve());
			setHostMetricsInitialized(true);
			setShutdownHandlerSet(true);
			setGlobalSDK({ name: "test-sdk" } as any);

			// Reset the state
			resetGlobalState();

			// Verify all states are reset
			expect(isSDKInitialized()).toBe(false);
			expect(isSDKInitializing()).toBe(false);
			expect(getSDKPromise()).toBeUndefined();
			expect(isHostMetricsInitialized()).toBe(false);
			expect(isShutdownHandlerSet()).toBe(false);
			expect(getGlobalSDK()).toBeUndefined();
		});

		it("should be safe to call multiple times", () => {
			expect(() => {
				resetGlobalState();
				resetGlobalState();
				resetGlobalState();
			}).not.toThrow();
		});
	});

	describe("state interactions", () => {
		it("should allow independent state management", () => {
			// Test that different states can be set independently
			setSDKInitialized(true);
			setSDKInitializing(false);
			setHostMetricsInitialized(true);
			setShutdownHandlerSet(false);

			expect(isSDKInitialized()).toBe(true);
			expect(isSDKInitializing()).toBe(false);
			expect(isHostMetricsInitialized()).toBe(true);
			expect(isShutdownHandlerSet()).toBe(false);
		});

		it("should maintain state consistency", () => {
			// Test that state changes are consistent
			const promise = Promise.resolve();
			setSDKPromise(promise);
			expect(getSDKPromise()).toBe(promise);

			const mockSDK = { name: "test-sdk" } as any;
			setGlobalSDK(mockSDK);
			expect(getGlobalSDK()).toBe(mockSDK);
		});
	});
});
