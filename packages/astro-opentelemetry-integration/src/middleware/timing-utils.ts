import type { Histogram } from "@opentelemetry/api";

export interface TimingLabels {
	[key: string]: string | number;
	method: string;
	path: string;
	status: string;
}

export interface TimingOptions {
	startTime: number; // performance.now() result
	labels: TimingLabels;
	histogram: Histogram;
}

/**
 * Legacy TTLB measurement method that wraps the response stream
 * Provides high accuracy but higher CPU usage due to stream processing
 */
export function measureTTLBWithStreamWrapping(
	response: Response,
	options: TimingOptions,
): Response {
	const { startTime, labels, histogram } = options;

	if (response.body instanceof ReadableStream) {
		const originalBody = response.body;
		const wrappedBody = new ReadableStream({
			start(controller) {
				const reader = originalBody.getReader();
				function pump(): Promise<void> {
					return reader.read().then((result) => {
						if (result.done) {
							const duration = (performance.now() - startTime) / 1000; // Convert to seconds
							histogram.record(duration, labels);
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
	}

	return response;
}

/**
 * Optimized TTLB measurement method using async timing with response cloning
 * Provides millisecond accuracy with minimal CPU overhead
 */
export function measureTTLBWithAsyncTiming(
	response: Response,
	options: TimingOptions,
): Response {
	const { startTime, labels, histogram } = options;

	if (response.body instanceof ReadableStream) {
		// Clone the response to avoid modifying the original
		const clonedResponse = response.clone();

		// Track completion asynchronously without blocking
		// Use setImmediate to defer timing work and reduce CPU pressure
		setImmediate(async () => {
			try {
				const reader = clonedResponse.body?.getReader();
				if (!reader) return;

				while (true) {
					const { done } = await reader.read();
					if (done) {
						const duration = (performance.now() - startTime) / 1000; // Convert to seconds
						// Round to millisecond precision for efficiency
						const roundedDuration = Math.round(duration * 1000) / 1000;
						histogram.record(roundedDuration, labels);
						break;
					}
				}
			} catch {
				// Silent fail for timing - don't break the response
				// Optionally log at debug level if needed
			}
		});

		// Return original response immediately
		return response;
	}

	return response;
}
