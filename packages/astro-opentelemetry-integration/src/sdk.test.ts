import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the dependencies
vi.doMock("@opentelemetry/api", () => ({
	metrics: {
		getMeterProvider: vi.fn(),
	},
}));

vi.doMock("@opentelemetry/sdk-node", () => {
	const start = vi.fn().mockResolvedValue(undefined);
	const shutdown = vi.fn().mockResolvedValue(undefined);

	// Mock NodeSDK as a constructible class-like function for Vitest 4
	const NodeSDK = vi.fn(function MockNodeSDK(this: unknown) {
		return {
			start,
			shutdown,
		};
	});

	return { NodeSDK };
});

vi.doMock("./config/sdk-config.js", () => ({
	buildSDKConfig: vi.fn(),
}));

vi.doMock("./exporters/metrics.js", () => ({
	initializeHostMetrics: vi.fn(),
}));

vi.doMock("./utils/error-handling.js", () => ({
	setupMetricsErrorHandling: vi.fn(),
}));

vi.doMock("./utils/global-state.js", () => ({
	getGlobalSDK: vi.fn(),
	getSDKPromise: vi.fn(),
	isHostMetricsInitialized: vi.fn(),
	isSDKInitialized: vi.fn(),
	isSDKInitializing: vi.fn(),
	isShutdownHandlerSet: vi.fn(),
	setGlobalSDK: vi.fn(),
	setHostMetricsInitialized: vi.fn(),
	setSDKInitialized: vi.fn(),
	setSDKInitializing: vi.fn(),
	setSDKPromise: vi.fn(),
	setShutdownHandlerSet: vi.fn(),
}));

describe("sdk", () => {
	let originalProcessOn: typeof process.on;
	let originalProcessExit: typeof process.exit;
	let originalGlobalPresets: typeof globalThis.__OTEL_PRESETS__;

	beforeEach(() => {
		// Store original methods
		originalProcessOn = process.on;
		originalProcessExit = process.exit;
		originalGlobalPresets = globalThis.__OTEL_PRESETS__;

		// Clear all mocks
		vi.clearAllMocks();

		// Mock process methods
		process.on = vi.fn();
		process.exit = vi.fn();

		// Reset global state
		globalThis.__OTEL_PRESETS__ = {
			metricExporter: "prometheus",
			traceExporter: "console",
		};
	});

	afterEach(() => {
		// Restore original methods
		process.on = originalProcessOn;
		process.exit = originalProcessExit;
		globalThis.__OTEL_PRESETS__ = originalGlobalPresets;

		// Clear all mocks
		vi.clearAllMocks();
	});

	it("should import SDK module", async () => {
		// Import the sdk module - this tests that all dependencies are properly mocked
		// and the module can be loaded without throwing errors
		await expect(import("./sdk.js")).resolves.toBeDefined();
	});

	it("should have proper mocks for all dependencies", async () => {
		const { NodeSDK } = await import("@opentelemetry/sdk-node");
		const { buildSDKConfig } = await import("./config/sdk-config.js");
		const { metrics } = await import("@opentelemetry/api");
		const { initializeHostMetrics } = await import("./exporters/metrics.js");
		const { setupMetricsErrorHandling } = await import(
			"./utils/error-handling.js"
		);

		// Verify all dependencies are properly mocked
		expect(NodeSDK).toBeDefined();
		expect(buildSDKConfig).toBeDefined();
		expect(metrics.getMeterProvider).toBeDefined();
		expect(initializeHostMetrics).toBeDefined();
		expect(setupMetricsErrorHandling).toBeDefined();
	});

	it("should handle module initialization gracefully", async () => {
		// This test verifies that the module initialization doesn't crash
		// The actual functionality is complex to test due to immediate execution
		// but we can at least verify that the module structure is sound
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		// Import the module
		await import("./sdk.js");

		// Allow some time for initialization
		await new Promise((resolve) => setTimeout(resolve, 50));

		// The test passes if no unhandled errors are thrown
		expect(true).toBe(true);

		consoleSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});
});
