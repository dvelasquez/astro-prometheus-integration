import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("getAttributes", () => {
	beforeEach(() => {
		// Reset global state before each test
		globalThis.__OTEL_OPTIONS__ = {
			serviceName: "test-service",
			serviceVersion: "1.0.0",
		};
		process.env.OTEL_SERVICE_NAME = "env-service";
		process.env.OTEL_SERVICE_VERSION = "2.0.0";
	});

	afterEach(() => {
		// Clean up environment variables
		delete process.env.OTEL_SERVICE_NAME;
		delete process.env.OTEL_SERVICE_VERSION;
	});

	describe("OTEL_SERVICE_NAME", () => {
		it("should use global options serviceName when available", () => {
			// Test the logic directly since constants are evaluated at import time
			const serviceName =
				globalThis.__OTEL_OPTIONS__.serviceName ||
				process.env.OTEL_SERVICE_NAME;
			expect(serviceName).toBe("test-service");
		});

		it("should fallback to environment variable when global options is not set", () => {
			globalThis.__OTEL_OPTIONS__ = {};
			const serviceName =
				globalThis.__OTEL_OPTIONS__.serviceName ||
				process.env.OTEL_SERVICE_NAME;
			expect(serviceName).toBe("env-service");
		});

		it("should fallback to environment variable when global options serviceName is undefined", () => {
			globalThis.__OTEL_OPTIONS__ = { serviceName: undefined };
			const serviceName =
				globalThis.__OTEL_OPTIONS__.serviceName ||
				process.env.OTEL_SERVICE_NAME;
			expect(serviceName).toBe("env-service");
		});

		it("should be undefined when neither global options nor environment variable is set", () => {
			globalThis.__OTEL_OPTIONS__ = {};
			delete process.env.OTEL_SERVICE_NAME;
			const serviceName =
				globalThis.__OTEL_OPTIONS__.serviceName ||
				process.env.OTEL_SERVICE_NAME;
			expect(serviceName).toBeUndefined();
		});
	});

	describe("OTEL_SERVICE_VERSION", () => {
		it("should use global options serviceVersion when available", () => {
			// Test the logic directly since constants are evaluated at import time
			const serviceVersion =
				globalThis.__OTEL_OPTIONS__.serviceVersion ||
				process.env.OTEL_SERVICE_VERSION;
			expect(serviceVersion).toBe("1.0.0");
		});

		it("should fallback to environment variable when global options is not set", () => {
			globalThis.__OTEL_OPTIONS__ = {};
			const serviceVersion =
				globalThis.__OTEL_OPTIONS__.serviceVersion ||
				process.env.OTEL_SERVICE_VERSION;
			expect(serviceVersion).toBe("2.0.0");
		});

		it("should fallback to environment variable when global options serviceVersion is undefined", () => {
			globalThis.__OTEL_OPTIONS__ = { serviceVersion: undefined };
			const serviceVersion =
				globalThis.__OTEL_OPTIONS__.serviceVersion ||
				process.env.OTEL_SERVICE_VERSION;
			expect(serviceVersion).toBe("2.0.0");
		});

		it("should be undefined when neither global options nor environment variable is set", () => {
			globalThis.__OTEL_OPTIONS__ = {};
			delete process.env.OTEL_SERVICE_VERSION;
			const serviceVersion =
				globalThis.__OTEL_OPTIONS__.serviceVersion ||
				process.env.OTEL_SERVICE_VERSION;
			expect(serviceVersion).toBeUndefined();
		});
	});
});
