import type { Histogram } from "prom-client";

export interface TimingLabels {
	[key: string]: string | number;
	method: string;
	path: string;
	status: string;
}

export interface TimingOptions {
	start: [number, number]; // process.hrtime() result
	labels: TimingLabels;
	histogram: Histogram;
}

interface MeasureTTLBParams {
	response: Response;
	start: [number, number];
	labels: TimingLabels;
	histogram: Histogram;
	useOptimized: boolean;
}

interface MeasureTTLBWithOptionsParams {
	response: Response;
	options: TimingOptions;
}

/**
 * Unified function to measure Time To Last Byte (TTLB) for streaming responses.
 * Automatically selects the appropriate measurement method based on useOptimized flag.
 */
export const measureTimeToLastByte = ({
	response,
	start,
	labels,
	histogram,
	useOptimized,
}: MeasureTTLBParams): Response => {
	// Guard clause: return unchanged if not a streaming response
	if (!(response.body instanceof ReadableStream)) {
		return response;
	}

	const timingOptions: TimingOptions = { start, labels, histogram };

	return useOptimized
		? measureTTLBWithAsyncTimingInternal({ response, options: timingOptions })
		: measureTTLBWithStreamWrappingInternal({
				response,
				options: timingOptions,
			});
};

/**
 * Private helper: Legacy TTLB measurement method that wraps the response stream.
 * Provides high accuracy but higher CPU usage due to stream processing.
 */
const measureTTLBWithStreamWrappingInternal = ({
	response,
	options,
}: MeasureTTLBWithOptionsParams): Response => {
	// Guard clause: return unchanged if not a streaming response
	if (!(response.body instanceof ReadableStream)) {
		return response;
	}

	const { start, labels, histogram } = options;
	const originalBody = response.body;

	const wrappedBody = new ReadableStream({
		start(controller) {
			const reader = originalBody.getReader();
			function pump(): Promise<void> {
				return reader.read().then((result) => {
					if (result.done) {
						const [s, ns] = process.hrtime(start);
						const ttlbDuration = s + ns / 1e9;
						histogram.observe(labels, ttlbDuration);
						controller.close();
						return;
					}
					controller.enqueue(result.value);
					return pump();
				});
			}
			return pump();
		},
	});

	return new Response(wrappedBody, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	});
};

/**
 * Private helper: Optimized TTLB measurement method using async timing with response cloning.
 * Provides millisecond accuracy with minimal CPU overhead.
 */
const measureTTLBWithAsyncTimingInternal = ({
	response,
	options,
}: MeasureTTLBWithOptionsParams): Response => {
	// Guard clause: return unchanged if not a streaming response
	if (!(response.body instanceof ReadableStream)) {
		return response;
	}

	const { start, labels, histogram } = options;

	// Clone the response to avoid modifying the original
	const clonedResponse = response.clone();

	// Track completion asynchronously without blocking
	// Use setImmediate to defer timing work and reduce CPU pressure
	setImmediate(async () => {
		try {
			const reader = clonedResponse.body!.getReader();
			while (true) {
				const { done } = await reader.read();
				if (done) {
					const [s, ns] = process.hrtime(start);
					const ttlbDuration = s + ns / 1e9;
					// Round to millisecond precision for efficiency
					const roundedDuration = Math.round(ttlbDuration * 1000) / 1000;
					histogram.observe(labels, roundedDuration);
					break;
				}
			}
		} catch (_error: unknown) {
			// Silent fail for timing - don't break the response
			// Optionally log at debug level if needed
		}
	});

	// Return original response immediately
	return response;
};

/**
 * Legacy TTLB measurement method that wraps the response stream.
 * Provides high accuracy but higher CPU usage due to stream processing.
 * @deprecated Use measureTimeToLastByte for new code
 */
export const measureTTLBWithStreamWrapping = (
	response: Response,
	options: TimingOptions,
): Response => {
	return measureTTLBWithStreamWrappingInternal({ response, options });
};

/**
 * Optimized TTLB measurement method using async timing with response cloning.
 * Provides millisecond accuracy with minimal CPU overhead.
 * @deprecated Use measureTimeToLastByte for new code
 */
export const measureTTLBWithAsyncTiming = (
	response: Response,
	options: TimingOptions,
): Response => {
	return measureTTLBWithAsyncTimingInternal({ response, options });
};
