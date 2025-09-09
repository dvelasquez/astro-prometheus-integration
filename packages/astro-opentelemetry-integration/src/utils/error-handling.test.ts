import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	isMetricsExportHealthy,
	setupMetricsErrorHandling,
} from "./error-handling.js";

// Mock OpenTelemetry API
vi.mock("@opentelemetry/api", () => ({
	metrics: {
		getMeter: vi.fn(() => ({
			createCounter: vi.fn(() => ({
				add: vi.fn(),
			})),
		})),
		getMeterProvider: vi.fn(() => ({
			name: "mock-provider",
		})),
	},
}));

describe("error-handling", () => {
	let originalConsoleWarn: typeof console.warn;
	let originalProcessOn: typeof process.on;

	beforeEach(() => {
		// Store original methods
		originalConsoleWarn = console.warn;
		originalProcessOn = process.on;

		// Mock console methods to avoid noise in tests
		console.warn = vi.fn();
		console.log = vi.fn();

		// Mock process.on to capture event listeners
		process.on = vi.fn();
	});

	afterEach(() => {
		// Restore original methods
		console.warn = originalConsoleWarn;
		process.on = originalProcessOn;

		// Clear all mocks
		vi.clearAllMocks();
	});

	describe("setupMetricsErrorHandling", () => {
		it("should set up error handling for metrics export failures", async () => {
			const { metrics } = await import("@opentelemetry/api");

			setupMetricsErrorHandling();

			// Verify that getMeter was called with correct parameters
			expect(metrics.getMeter).toHaveBeenCalledWith(
				"astro-opentelemetry-integration-error-handler",
			);

			// Verify that process.on was called for unhandledRejection and uncaughtException
			expect(process.on).toHaveBeenCalledWith(
				"unhandledRejection",
				expect.any(Function),
			);
			expect(process.on).toHaveBeenCalledWith(
				"uncaughtException",
				expect.any(Function),
			);

			// Verify that console.log was called
			expect(console.log).toHaveBeenCalledWith(
				"OpenTelemetry error handling initialized",
			);
		});

		it("should create a counter for tracking export failures", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockMeter = {
				createCounter: vi.fn(() => ({
					add: vi.fn(),
				})),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			setupMetricsErrorHandling();

			expect(mockMeter.createCounter).toHaveBeenCalledWith(
				"otel_export_failures_total",
				{
					description: "Total number of OpenTelemetry export failures",
				},
			);
		});

		it("should handle unhandled promise rejections with OTLP errors", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockCounter = { add: vi.fn() };
			const mockMeter = {
				createCounter: vi.fn(() => mockCounter),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			setupMetricsErrorHandling();

			// Get the unhandledRejection handler
			const unhandledRejectionHandler = vi
				.mocked(process.on)
				.mock.calls.find(
					([event]) => event === "unhandledRejection",
				)?.[1] as Function;

			expect(unhandledRejectionHandler).toBeDefined();

			// Test with OTLP error
			const otlpError = new Error("OTLP export failed");
			unhandledRejectionHandler(otlpError);

			expect(console.warn).toHaveBeenCalledWith(
				"OpenTelemetry export failed:",
				"OTLP export failed",
			);
			expect(mockCounter.add).toHaveBeenCalledWith(1, {
				error_type: "unhandled_rejection",
				exporter: "unknown",
			});
		});

		it("should handle unhandled promise rejections with export errors", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockCounter = { add: vi.fn() };
			const mockMeter = {
				createCounter: vi.fn(() => mockCounter),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			setupMetricsErrorHandling();

			// Get the unhandledRejection handler
			const unhandledRejectionHandler = vi
				.mocked(process.on)
				.mock.calls.find(
					([event]) => event === "unhandledRejection",
				)?.[1] as Function;

			// Test with export error
			const exportError = new Error("export connection failed");
			unhandledRejectionHandler(exportError);

			expect(console.warn).toHaveBeenCalledWith(
				"OpenTelemetry export failed:",
				"export connection failed",
			);
			expect(mockCounter.add).toHaveBeenCalledWith(1, {
				error_type: "unhandled_rejection",
				exporter: "unknown",
			});
		});

		it("should not handle non-OTLP/export errors in unhandled promise rejections", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockCounter = { add: vi.fn() };
			const mockMeter = {
				createCounter: vi.fn(() => mockCounter),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			setupMetricsErrorHandling();

			// Get the unhandledRejection handler
			const unhandledRejectionHandler = vi
				.mocked(process.on)
				.mock.calls.find(
					([event]) => event === "unhandledRejection",
				)?.[1] as Function;

			// Test with non-OTLP/export error
			const otherError = new Error("Database connection failed");
			unhandledRejectionHandler(otherError);

			expect(console.warn).not.toHaveBeenCalled();
			expect(mockCounter.add).not.toHaveBeenCalled();
		});

		it("should handle uncaught exceptions with OTLP errors", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockCounter = { add: vi.fn() };
			const mockMeter = {
				createCounter: vi.fn(() => mockCounter),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			setupMetricsErrorHandling();

			// Get the uncaughtException handler
			const uncaughtExceptionHandler = vi
				.mocked(process.on)
				.mock.calls.find(
					([event]) => event === "uncaughtException",
				)?.[1] as Function;

			expect(uncaughtExceptionHandler).toBeDefined();

			// Test with OTLP error
			const otlpError = new Error("OTLP connection failed");
			uncaughtExceptionHandler(otlpError);

			expect(console.warn).toHaveBeenCalledWith(
				"OpenTelemetry export failed:",
				"OTLP connection failed",
			);
			expect(mockCounter.add).toHaveBeenCalledWith(1, {
				error_type: "uncaught_exception",
				exporter: "unknown",
			});
		});

		it("should handle uncaught exceptions with export errors", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockCounter = { add: vi.fn() };
			const mockMeter = {
				createCounter: vi.fn(() => mockCounter),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			setupMetricsErrorHandling();

			// Get the uncaughtException handler
			const uncaughtExceptionHandler = vi
				.mocked(process.on)
				.mock.calls.find(
					([event]) => event === "uncaughtException",
				)?.[1] as Function;

			// Test with export error
			const exportError = new Error("export timeout");
			uncaughtExceptionHandler(exportError);

			expect(console.warn).toHaveBeenCalledWith(
				"OpenTelemetry export failed:",
				"export timeout",
			);
			expect(mockCounter.add).toHaveBeenCalledWith(1, {
				error_type: "uncaught_exception",
				exporter: "unknown",
			});
		});

		it("should not handle non-OTLP/export errors in uncaught exceptions", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockCounter = { add: vi.fn() };
			const mockMeter = {
				createCounter: vi.fn(() => mockCounter),
			};
			vi.mocked(metrics.getMeter).mockReturnValue(mockMeter as any);

			setupMetricsErrorHandling();

			// Get the uncaughtException handler
			const uncaughtExceptionHandler = vi
				.mocked(process.on)
				.mock.calls.find(
					([event]) => event === "uncaughtException",
				)?.[1] as Function;

			// Test with non-OTLP/export error
			const otherError = new Error("File system error");
			uncaughtExceptionHandler(otherError);

			expect(console.warn).not.toHaveBeenCalled();
			expect(mockCounter.add).not.toHaveBeenCalled();
		});
	});

	describe("isMetricsExportHealthy", () => {
		it("should return true when meter provider is available", async () => {
			const { metrics } = await import("@opentelemetry/api");
			const mockProvider = { name: "mock-provider" };
			vi.mocked(metrics.getMeterProvider).mockReturnValue(mockProvider as any);

			const result = isMetricsExportHealthy();

			expect(result).toBe(true);
			expect(metrics.getMeterProvider).toHaveBeenCalled();
		});

		it("should return false when meter provider throws an error", async () => {
			const { metrics } = await import("@opentelemetry/api");
			vi.mocked(metrics.getMeterProvider).mockImplementation(() => {
				throw new Error("Provider not available");
			});

			const result = isMetricsExportHealthy();

			expect(result).toBe(false);
			expect(console.warn).toHaveBeenCalledWith(
				"Metrics export health check failed:",
				expect.any(Error),
			);
		});

		it("should return false when meter provider is undefined", async () => {
			const { metrics } = await import("@opentelemetry/api");
			vi.mocked(metrics.getMeterProvider).mockReturnValue(undefined as any);

			const result = isMetricsExportHealthy();

			expect(result).toBe(false);
		});

		it("should handle unexpected errors gracefully", async () => {
			const { metrics } = await import("@opentelemetry/api");
			vi.mocked(metrics.getMeterProvider).mockImplementation(() => {
				throw "Unexpected error type";
			});

			const result = isMetricsExportHealthy();

			expect(result).toBe(false);
			expect(console.warn).toHaveBeenCalledWith(
				"Metrics export health check failed:",
				"Unexpected error type",
			);
		});
	});
});
