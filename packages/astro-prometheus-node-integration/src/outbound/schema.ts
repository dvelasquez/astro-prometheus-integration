import { z } from "astro/zod";
import type {
	AppLabelFn,
	EndpointLabelFn,
	ObservedEntry,
	OutboundMetricContext,
	ShouldObserveFn,
} from "./types.js";

const observedEntrySchema: z.ZodType<ObservedEntry> = z.any();
const metricContextSchema: z.ZodType<OutboundMetricContext> = z.any();

const endpointFnSchema: z.ZodType<EndpointLabelFn> = z
	.function()
	.args(metricContextSchema)
	.returns(z.string());

const appFnSchema: z.ZodType<AppLabelFn> = z
	.function()
	.args(metricContextSchema)
	.returns(z.string());

const shouldObserveFnSchema: z.ZodType<ShouldObserveFn> = z
	.function()
	.args(observedEntrySchema)
	.returns(z.boolean());

const labelsSchema = z
	.object({
		endpoint: endpointFnSchema.optional(),
		app: appFnSchema.optional(),
	})
	.default({})
	.describe("Customize label values derived from outbound requests.");

export const outboundRequestsSchema = z
	.object({
		enabled: z.boolean().default(false),
		includeErrors: z
			.boolean()
			.default(true)
			.describe("Include errored responses in latency histograms."),
		labels: labelsSchema,
		shouldObserve: shouldObserveFnSchema
			.optional()
			.describe("Optional filter to skip recording a given entry."),
	})
	.describe("Configuration for outbound HTTP metrics.");

export type OutboundRequestsOptions = z.infer<typeof outboundRequestsSchema>;
