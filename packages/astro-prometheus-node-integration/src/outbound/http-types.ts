import type { PerformanceEntry } from "node:perf_hooks";

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
