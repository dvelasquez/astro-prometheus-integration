import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	measureTTLBWithAsyncTiming,
	measureTTLBWithStreamWrapping,
	type TimingLabels,
	type TimingOptions,
} from "./timing-utils.js";

describe("timing-utils", () => {
	let mockHistogram: any;
	let mockLabels: TimingLabels;
	let mockOptions: TimingOptions;

	beforeEach(() => {
		// Mock histogram
		mockHistogram = {
			record: vi.fn(),
		};

		// Mock labels
		mockLabels = {
			method: "GET",
			path: "/test",
			status: "200",
		};

		// Mock options
		mockOptions = {
			startTime: 1000,
			labels: mockLabels,
			histogram: mockHistogram,
		};

		// Mock performance.now
		vi.stubGlobal("performance", {
			now: vi.fn(() => 2000), // 1 second later
		});

		// Mock setImmediate
		vi.stubGlobal(
			"setImmediate",
			vi.fn((callback) => {
				// Execute immediately for testing
				callback();
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	describe("measureTTLBWithStreamWrapping", () => {
		it("should return the response unchanged when body is not a ReadableStream", () => {
			// Create a response without a body to test the non-streaming path
			const response = new Response(null, {
				status: 200,
				headers: { "content-type": "text/plain" },
			});

			const result = measureTTLBWithStreamWrapping(response, mockOptions);

			expect(result).toBe(response);
			expect(mockHistogram.record).not.toHaveBeenCalled();
		});

		it("should wrap ReadableStream and record timing", async () => {
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(new TextEncoder().encode("chunk1"));
					controller.enqueue(new TextEncoder().encode("chunk2"));
					controller.close();
				},
			});

			const response = new Response(stream, {
				status: 200,
				headers: { "content-type": "text/plain" },
			});

			const result = measureTTLBWithStreamWrapping(response, mockOptions);

			expect(result).not.toBe(response);
			expect(result.status).toBe(200);
			expect(result.headers.get("content-type")).toBe("text/plain");

			// Read the stream to trigger timing
			const reader = result.body?.getReader();
			expect(reader).toBeDefined();

			if (reader) {
				const chunks = [];
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					chunks.push(value);
				}

				expect(chunks).toHaveLength(2);
				expect(mockHistogram.record).toHaveBeenCalledWith(1, mockLabels); // 1 second duration
			}
		});

		it("should handle stream errors gracefully", async () => {
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(new TextEncoder().encode("chunk1"));
					controller.error(new Error("Stream error"));
				},
			});

			const response = new Response(stream, {
				status: 200,
				headers: { "content-type": "text/plain" },
			});

			const result = measureTTLBWithStreamWrapping(response, mockOptions);

			expect(result).not.toBe(response);

			// Read the stream to trigger error
			const reader = result.body?.getReader();
			expect(reader).toBeDefined();

			if (reader) {
				try {
					await reader.read();
					await reader.read(); // This should throw
				} catch (error) {
					expect(error).toBeInstanceOf(Error);
					expect((error as Error).message).toBe("Stream error");
				}
			}
		});

		it("should preserve response properties", () => {
			const stream = new ReadableStream({
				start(controller) {
					controller.close();
				},
			});

			const response = new Response(stream, {
				status: 404,
				statusText: "Not Found",
				headers: {
					"content-type": "application/json",
					"custom-header": "custom-value",
				},
			});

			const result = measureTTLBWithStreamWrapping(response, mockOptions);

			expect(result.status).toBe(404);
			expect(result.statusText).toBe("Not Found");
			expect(result.headers.get("content-type")).toBe("application/json");
			expect(result.headers.get("custom-header")).toBe("custom-value");
		});
	});

	describe("measureTTLBWithAsyncTiming", () => {
		it("should return the response unchanged when body is not a ReadableStream", () => {
			// Create a response without a body to test the non-streaming path
			const response = new Response(null, {
				status: 200,
				headers: { "content-type": "text/plain" },
			});

			const result = measureTTLBWithAsyncTiming(response, mockOptions);

			expect(result).toBe(response);
			expect(mockHistogram.record).not.toHaveBeenCalled();
		});

		it("should record timing asynchronously for ReadableStream", async () => {
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(new TextEncoder().encode("chunk1"));
					controller.enqueue(new TextEncoder().encode("chunk2"));
					controller.close();
				},
			});

			const response = new Response(stream, {
				status: 200,
				headers: { "content-type": "text/plain" },
			});

			const result = measureTTLBWithAsyncTiming(response, mockOptions);

			expect(result).toBe(response); // Original response is returned immediately

			// Wait for async timing to complete
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockHistogram.record).toHaveBeenCalledWith(1, mockLabels); // 1 second duration, rounded to 3 decimal places
		});

		it("should handle stream reading errors silently", async () => {
			const stream = new ReadableStream({
				start(controller) {
					controller.error(new Error("Stream error"));
				},
			});

			const response = new Response(stream, {
				status: 200,
				headers: { "content-type": "text/plain" },
			});

			const result = measureTTLBWithAsyncTiming(response, mockOptions);

			expect(result).toBe(response);

			// Wait for async timing to complete
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Should not record timing due to error
			expect(mockHistogram.record).not.toHaveBeenCalled();
		});

		it("should handle missing response body gracefully", async () => {
			const response = new Response(null, {
				status: 200,
				headers: { "content-type": "text/plain" },
			});

			// Manually set body to null to test edge case
			Object.defineProperty(response, "body", {
				value: null,
				writable: true,
			});

			const result = measureTTLBWithAsyncTiming(response, mockOptions);

			expect(result).toBe(response);

			// Wait for async timing to complete
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Should not record timing due to missing body
			expect(mockHistogram.record).not.toHaveBeenCalled();
		});

		it("should round duration to millisecond precision", async () => {
			// Mock performance.now to return a precise time
			// Use a startTime that will result in a duration that needs rounding
			const startTime = 1000;
			const endTime = 1000.123456;

			vi.stubGlobal("performance", {
				now: vi.fn(() => endTime),
			});

			const options = {
				startTime,
				labels: mockLabels,
				histogram: mockHistogram,
			};

			const stream = new ReadableStream({
				start(controller) {
					controller.close();
				},
			});

			const response = new Response(stream, {
				status: 200,
				headers: { "content-type": "text/plain" },
			});

			const result = measureTTLBWithAsyncTiming(response, options);

			expect(result).toBe(response);

			// Wait for async timing to complete
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Calculate expected duration: (1000.123456 - 1000) / 1000 = 0.123456
			// Rounded to 3 decimal places: Math.round(0.123456 * 1000) / 1000 = 0.123
			const expectedDuration =
				Math.round(((endTime - startTime) / 1000) * 1000) / 1000;
			expect(mockHistogram.record).toHaveBeenCalledWith(
				expectedDuration,
				mockLabels,
			);
		});

		it("should return original response immediately", () => {
			const stream = new ReadableStream({
				start(controller) {
					// Don't close immediately to test that response is returned before stream processing
					controller.enqueue(new TextEncoder().encode("chunk1"));
				},
			});

			const response = new Response(stream, {
				status: 200,
				headers: { "content-type": "text/plain" },
			});

			const result = measureTTLBWithAsyncTiming(response, mockOptions);

			// Response should be returned immediately, not after stream processing
			expect(result).toBe(response);
			expect(mockHistogram.record).not.toHaveBeenCalled();
		});
	});

	describe("TimingLabels interface", () => {
		it("should accept valid timing labels", () => {
			const labels: TimingLabels = {
				method: "POST",
				path: "/api/users",
				status: "201",
				customLabel: "customValue",
			};

			expect(labels.method).toBe("POST");
			expect(labels.path).toBe("/api/users");
			expect(labels.status).toBe("201");
			expect(labels.customLabel).toBe("customValue");
		});

		it("should accept numeric values for custom labels", () => {
			const labels: TimingLabels = {
				method: "GET",
				path: "/api/metrics",
				status: "200",
				responseSize: 1024,
			};

			expect(labels.responseSize).toBe(1024);
		});
	});

	describe("TimingOptions interface", () => {
		it("should accept valid timing options", () => {
			const options: TimingOptions = {
				startTime: 1000,
				labels: mockLabels,
				histogram: mockHistogram,
			};

			expect(options.startTime).toBe(1000);
			expect(options.labels).toBe(mockLabels);
			expect(options.histogram).toBe(mockHistogram);
		});
	});

	describe("performance.now integration", () => {
		it("should use performance.now for timing calculations", async () => {
			const mockPerformanceNow = vi.fn(() => 1500);
			vi.stubGlobal("performance", {
				now: mockPerformanceNow,
			});

			const stream = new ReadableStream({
				start(controller) {
					controller.close();
				},
			});

			const response = new Response(stream, {
				status: 200,
				headers: { "content-type": "text/plain" },
			});

			measureTTLBWithAsyncTiming(response, mockOptions);

			// Wait for async timing to complete
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockPerformanceNow).toHaveBeenCalled();
		});
	});
});
