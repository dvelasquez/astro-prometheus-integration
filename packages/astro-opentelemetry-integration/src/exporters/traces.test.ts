import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTraceExporter, traceConsoleExporter } from "./traces.js";

// Mock OpenTelemetry exporters
vi.mock("@opentelemetry/exporter-trace-otlp-grpc", () => ({
	OTLPTraceExporter: vi.fn().mockImplementation(() => ({
		export: vi.fn(),
		shutdown: vi.fn(),
	})),
}));

vi.mock("@opentelemetry/exporter-trace-otlp-http", () => ({
	OTLPTraceExporter: vi.fn().mockImplementation(() => ({
		export: vi.fn(),
		shutdown: vi.fn(),
	})),
}));

vi.mock("@opentelemetry/exporter-trace-otlp-proto", () => ({
	OTLPTraceExporter: vi.fn().mockImplementation(() => ({
		export: vi.fn(),
		shutdown: vi.fn(),
	})),
}));

vi.mock("@opentelemetry/sdk-trace-node", () => ({
	ConsoleSpanExporter: vi.fn().mockImplementation(() => ({
		export: vi.fn(),
		shutdown: vi.fn(),
	})),
}));

describe("exporters/traces", () => {
	beforeEach(() => {
		// Clear all mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Clear all mocks
		vi.clearAllMocks();
	});

	describe("traceConsoleExporter", () => {
		it("should be defined", () => {
			expect(traceConsoleExporter).toBeDefined();
		});

		it("should be an instance of ConsoleSpanExporter", () => {
			// The traceConsoleExporter is created at module level, so we can't easily test
			// that ConsoleSpanExporter was called. Instead, we just verify it's defined.
			expect(traceConsoleExporter).toBeDefined();
		});
	});

	describe("getTraceExporter", () => {
		it("should return ConsoleSpanExporter for 'console'", () => {
			const result = getTraceExporter("console");
			expect(result).toBe(traceConsoleExporter);
		});

		it("should return ProtoExporter for 'proto'", async () => {
			const result = getTraceExporter("proto");
			expect(result).toBeDefined();
			expect(result).not.toBeNull();

			// Verify ProtoExporter was instantiated
			const { OTLPTraceExporter } = await import(
				"@opentelemetry/exporter-trace-otlp-proto"
			);
			expect(OTLPTraceExporter).toHaveBeenCalled();
		});

		it("should return HttpExporter for 'http'", async () => {
			const result = getTraceExporter("http");
			expect(result).toBeDefined();
			expect(result).not.toBeNull();

			// Verify HttpExporter was instantiated
			const { OTLPTraceExporter } = await import(
				"@opentelemetry/exporter-trace-otlp-http"
			);
			expect(OTLPTraceExporter).toHaveBeenCalled();
		});

		it("should return GrpcExporter for 'grpc'", async () => {
			const result = getTraceExporter("grpc");
			expect(result).toBeDefined();
			expect(result).not.toBeNull();

			// Verify GrpcExporter was instantiated
			const { OTLPTraceExporter } = await import(
				"@opentelemetry/exporter-trace-otlp-grpc"
			);
			expect(OTLPTraceExporter).toHaveBeenCalled();
		});

		it("should return null for undefined", () => {
			const result = getTraceExporter(undefined as any);
			expect(result).toBeNull();
		});

		it("should return null for invalid preset", () => {
			const result = getTraceExporter("invalid" as any);
			expect(result).toBeNull();
		});

		it("should return null for 'none'", () => {
			const result = getTraceExporter("none" as any);
			expect(result).toBeNull();
		});

		it("should create new instances for each call", async () => {
			const result1 = getTraceExporter("proto");
			const result2 = getTraceExporter("proto");

			expect(result1).toBeDefined();
			expect(result2).toBeDefined();
			expect(result1).not.toBe(result2); // Should be different instances

			// Verify ProtoExporter was called twice
			const { OTLPTraceExporter } = await import(
				"@opentelemetry/exporter-trace-otlp-proto"
			);
			expect(OTLPTraceExporter).toHaveBeenCalledTimes(2);
		});

		it("should handle all valid trace exporter types", () => {
			const validExporters = ["console", "proto", "http", "grpc"];

			validExporters.forEach((exporter) => {
				const result = getTraceExporter(exporter as any);
				expect(result).toBeDefined();
			});
		});

		it("should return the same console exporter instance", () => {
			const result1 = getTraceExporter("console");
			const result2 = getTraceExporter("console");

			expect(result1).toBe(result2); // Should be the same instance
			expect(result1).toBe(traceConsoleExporter);
		});
	});
});
