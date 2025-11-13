import type { PerformanceResourceTiming } from "node:perf_hooks";

export type ResourceEntry = PerformanceResourceTiming & {
	initiatorType: string;
	deliveryType?: string | undefined;
	responseStatus?: number | undefined;
	responseStart: number;
};

export type ObservedEntry = ResourceEntry;

export interface ResourceEntrySnapshot {
	name: string;
	entryType: "resource";
	initiatorType: string;
	duration: number;
	startTime: number;
	workerStart: number;
	redirectStart: number;
	redirectEnd: number;
	fetchStart: number;
	domainLookupStart: number;
	domainLookupEnd: number;
	connectStart: number;
	connectEnd: number;
	secureConnectionStart: number;
	requestStart: number;
	responseStart: number;
	responseEnd: number;
	transferSize: number;
	encodedBodySize: number;
	decodedBodySize: number;
	deliveryType?: string | undefined;
	responseStatus?: number | undefined;
}

export interface OutboundMetricContext {
	entry: ResourceEntry;
	url?: URL;
	defaultEndpoint: string;
	method: string;
	host: string;
	status: string;
}

export type EndpointLabelFn = (context: OutboundMetricContext) => string;
export type AppLabelFn = (context: OutboundMetricContext) => string;
export type ShouldObserveFn = (entry: ResourceEntry) => boolean;
