import { z } from "astro/zod";

export const integrationSchema = z
	.object({
		enabled: z
			.boolean()
			.default(true)
			.describe(
				"Enable the integration. You might want to disable it in dev mode.",
			),
		otel: z
			.object({
				serviceName: z
					.string()
					.default("unknown_service")
					.describe("The name of the service."),
				serviceVersion: z
					.string()
					.default("unknown_version")
					.describe("The version of the service."),
			})
			.default({}),
		presets: z
			.object({
				metricExporter: z
					.enum(["proto", "http", "grpc", "prometheus", "none"])
					.default("none")
					.describe("The metric exporter to use.")
					.optional(),
				traceExporter: z
					.enum(["proto", "http", "grpc", "console"])
					.default("console")
					.describe("The trace exporter to use.")
					.optional(),
				prometheusConfig: z
					.object({
						host: z
							.string()
							.default("0.0.0.0")
							.describe("The host to listen on.")
							.optional(),
						port: z
							.number()
							.default(9464)
							.describe("The port to listen on.")
							.optional(),
						endpoint: z
							.string()
							.default("/metrics")
							.describe("The endpoint to use for the metrics.")
							.optional(),
						prefix: z
							.string()
							.default("metrics")
							.describe("The prefix to use for the metrics.")
							.optional(),
						appendTimestamp: z
							.boolean()
							.default(true)
							.describe("Whether to append the timestamp to the metrics.")
							.optional(),
						withResourceConstantLabels: z
							.string()
							.describe(
								"The regular expression to match the resource constant labels.",
							)
							.optional()
							.default("/service/"),
					})
					.describe(
						"The configuration for the Prometheus exporter, more info here https://www.npmjs.com/package/@opentelemetry/exporter-prometheus.",
					)
					.optional(),
			})
			.optional(),
	})
	.default({});

export type IntegrationSchema = z.infer<typeof integrationSchema>;
