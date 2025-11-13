import type { PerformanceEntry } from "node:perf_hooks";

/**
 * The detail object for the HTTP performance entry.
 * We are keeping this interface because it will be used in the future
 * to possibly replace the middleware implementation of inbound requests.
 */
export interface HttpRequestDetail {
	req: {
		method: string;
		url: string;
		headers: Record<string, string>;
	};
	res: {
		statusCode: number;
		statusMessage: string;
		headers: Record<string, string>;
	};
}

export type HttpPerformanceEntry = PerformanceEntry & {
	entryType: "http";
	name: "HttpRequest";
	detail: HttpRequestDetail;
};
