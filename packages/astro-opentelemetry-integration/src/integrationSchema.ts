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
					.enum(["proto", "http", "grpc", "none"])
					.default("none")
					.describe("The metric exporter to use.")
					.optional(),
				traceExporter: z
					.enum(["proto", "http", "grpc", "console"])
					.default("console")
					.describe("The trace exporter to use.")
					.optional(),
			})
			.optional(),
	})
	.default({});

export type IntegrationSchema = z.infer<typeof integrationSchema>;
