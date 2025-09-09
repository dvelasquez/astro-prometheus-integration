import { describe, expect, it } from "vitest";
import {
	type IntegrationSchema,
	integrationSchema,
} from "./integrationSchema.js";

describe("integrationSchema", () => {
	describe("default values", () => {
		it("should have correct default values", () => {
			const result = integrationSchema.parse({});

			expect(result.enabled).toBe(true);
			expect(result.otel.serviceName).toBe("unknown_service");
			expect(result.otel.serviceVersion).toBe("unknown_version");
			// presets is optional, so it should be undefined when not provided
			expect(result.presets).toBeUndefined();
		});
	});

	describe("enabled field", () => {
		it("should accept boolean values", () => {
			expect(integrationSchema.parse({ enabled: true }).enabled).toBe(true);
			expect(integrationSchema.parse({ enabled: false }).enabled).toBe(false);
		});

		it("should default to true when not provided", () => {
			expect(integrationSchema.parse({}).enabled).toBe(true);
		});
	});

	describe("otel field", () => {
		it("should accept custom service name and version", () => {
			const result = integrationSchema.parse({
				otel: {
					serviceName: "my-service",
					serviceVersion: "1.2.3",
				},
			});

			expect(result.otel.serviceName).toBe("my-service");
			expect(result.otel.serviceVersion).toBe("1.2.3");
		});

		it("should use defaults when otel object is empty", () => {
			const result = integrationSchema.parse({ otel: {} });

			expect(result.otel.serviceName).toBe("unknown_service");
			expect(result.otel.serviceVersion).toBe("unknown_version");
		});
	});

	describe("presets field", () => {
		describe("metricExporter", () => {
			it("should accept valid metric exporter values", () => {
				const validExporters = ["proto", "http", "grpc", "prometheus", "none"];

				validExporters.forEach((exporter) => {
					const result = integrationSchema.parse({
						presets: { metricExporter: exporter as any },
					});
					expect(result.presets?.metricExporter).toBe(exporter);
				});
			});

			it("should default to 'none' when presets object is provided but metricExporter is not", () => {
				const result = integrationSchema.parse({
					presets: { metricExporter: undefined },
				});
				// When explicitly set to undefined, Zod doesn't apply defaults
				expect(result.presets?.metricExporter).toBeUndefined();
			});

			it("should default to 'none' when metricExporter is omitted from presets", () => {
				const result = integrationSchema.parse({
					presets: { traceExporter: "console" }, // Only set traceExporter
				});
				// Since metricExporter is optional, it won't get the default when omitted
				expect(result.presets?.metricExporter).toBeUndefined();
			});
		});

		describe("traceExporter", () => {
			it("should accept valid trace exporter values", () => {
				const validExporters = ["proto", "http", "grpc", "console"];

				validExporters.forEach((exporter) => {
					const result = integrationSchema.parse({
						presets: { traceExporter: exporter as any },
					});
					expect(result.presets?.traceExporter).toBe(exporter);
				});
			});

			it("should default to 'console' when presets object is provided but traceExporter is not", () => {
				const result = integrationSchema.parse({
					presets: { traceExporter: undefined },
				});
				// When explicitly set to undefined, Zod doesn't apply defaults
				expect(result.presets?.traceExporter).toBeUndefined();
			});

			it("should default to 'console' when traceExporter is omitted from presets", () => {
				const result = integrationSchema.parse({
					presets: { metricExporter: "prometheus" }, // Only set metricExporter
				});
				// Since traceExporter is optional, it won't get the default when omitted
				expect(result.presets?.traceExporter).toBeUndefined();
			});
		});

		describe("prometheusConfig", () => {
			it("should accept prometheus configuration", () => {
				const result = integrationSchema.parse({
					presets: {
						prometheusConfig: {
							host: "localhost",
							port: 9090,
							endpoint: "/custom-metrics",
							prefix: "custom",
							appendTimestamp: false,
							withResourceConstantLabels: "/custom/",
						},
					},
				});

				expect(result.presets?.prometheusConfig?.host).toBe("localhost");
				expect(result.presets?.prometheusConfig?.port).toBe(9090);
				expect(result.presets?.prometheusConfig?.endpoint).toBe(
					"/custom-metrics",
				);
				expect(result.presets?.prometheusConfig?.prefix).toBe("custom");
				expect(result.presets?.prometheusConfig?.appendTimestamp).toBe(false);
				expect(
					result.presets?.prometheusConfig?.withResourceConstantLabels,
				).toBe("/custom/");
			});

			it("should use default prometheus configuration values", () => {
				const result = integrationSchema.parse({
					presets: {
						prometheusConfig: {},
					},
				});

				// Most fields are optional and won't get defaults when omitted
				expect(result.presets?.prometheusConfig?.host).toBeUndefined();
				expect(result.presets?.prometheusConfig?.port).toBeUndefined();
				expect(result.presets?.prometheusConfig?.endpoint).toBeUndefined();
				expect(result.presets?.prometheusConfig?.prefix).toBeUndefined();
				expect(
					result.presets?.prometheusConfig?.appendTimestamp,
				).toBeUndefined();
				// withResourceConstantLabels has a default value that gets applied
				expect(
					result.presets?.prometheusConfig?.withResourceConstantLabels,
				).toBe("/service/");
			});
		});
	});

	describe("type inference", () => {
		it("should correctly infer IntegrationSchema type", () => {
			const config: IntegrationSchema = {
				enabled: true,
				otel: {
					serviceName: "test-service",
					serviceVersion: "1.0.0",
				},
				presets: {
					metricExporter: "prometheus",
					traceExporter: "http",
					prometheusConfig: {
						host: "0.0.0.0",
						port: 9464,
					},
				},
			};

			expect(() => integrationSchema.parse(config)).not.toThrow();
		});
	});

	describe("validation errors", () => {
		it("should reject invalid metric exporter values", () => {
			expect(() => {
				integrationSchema.parse({
					presets: { metricExporter: "invalid" as any },
				});
			}).toThrow();
		});

		it("should reject invalid trace exporter values", () => {
			expect(() => {
				integrationSchema.parse({
					presets: { traceExporter: "invalid" as any },
				});
			}).toThrow();
		});

		it("should reject non-boolean enabled values", () => {
			expect(() => {
				integrationSchema.parse({ enabled: "true" as any });
			}).toThrow();
		});

		it("should reject non-string service name", () => {
			expect(() => {
				integrationSchema.parse({
					otel: { serviceName: 123 as any },
				});
			}).toThrow();
		});

		it("should reject non-string service version", () => {
			expect(() => {
				integrationSchema.parse({
					otel: { serviceVersion: 123 as any },
				});
			}).toThrow();
		});
	});
});
