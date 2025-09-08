import { SpanStatusCode, trace } from "@opentelemetry/api";
import {
	ATTR_HTTP_REQUEST_METHOD,
	ATTR_HTTP_RESPONSE_STATUS_CODE,
	ATTR_HTTP_ROUTE,
	ATTR_NETWORK_LOCAL_ADDRESS,
	ATTR_URL_FULL,
	ATTR_URL_PATH,
	ATTR_URL_SCHEME,
} from "@opentelemetry/semantic-conventions";
import type { APIContext, MiddlewareNext } from "astro";
import { OTEL_SERVICE_VERSION } from "../utils/getAttributes.js";
import {
	createMetricsForExporter,
	getCurrentExporter,
} from "../utils/metrics-manager.js";
import {
	measureTTLBWithAsyncTiming,
	measureTTLBWithStreamWrapping,
	type TimingOptions,
} from "./timing-utils.js";

const tracer = trace.getTracer(
	"astro-opentelemetry-integration-request-tracer",
	OTEL_SERVICE_VERSION,
);

// Create metrics conditionally based on exporter type (OpenTelemetry best practice)
const currentExporter = getCurrentExporter();
const metricsInstruments = createMetricsForExporter(currentExporter);

// Extract metrics for easier access
const { httpRequestsTotal, httpRequestDuration, httpServerDurationSeconds } =
	metricsInstruments;

export async function onRequest(ctx: APIContext, next: MiddlewareNext) {
	const { request, url } = ctx;

	const spanName = `HTTP ${request.method} ${url.pathname}`;

	// Start timer for metrics using performance.now()
	const startTime = performance.now();
	const path = url.pathname || "/";

	// `startActiveSpan` creates a new span and sets it as the active span
	// for the duration of the callback. This is crucial for parent-child
	// relationships between spans.
	return tracer.startActiveSpan(spanName, async (span) => {
		// Set standard HTTP attributes on the span.
		span.setAttributes({
			[ATTR_HTTP_REQUEST_METHOD]: request.method,
			[ATTR_URL_SCHEME]: url.protocol.replace(":", ""),
			[ATTR_NETWORK_LOCAL_ADDRESS]: url.hostname,
			[ATTR_URL_PATH]: url.pathname,
			// Note: Astro doesn't provide route pattern in APIContext, using pathname instead
			[ATTR_HTTP_ROUTE]: url.pathname,
			[ATTR_URL_FULL]: url.toString(),
		});

		try {
			const response = await next();

			// Record the status code on the span.
			span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, response.status);

			// If status is 4xx or 5xx, set the span status to ERROR.
			if (response.status >= 400) {
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: `HTTP error ${response.status}`,
				});
			}

			// Calculate duration for metrics using performance.now()
			const duration = (performance.now() - startTime) / 1000; // Convert to seconds

			// Record metrics with same labels as Prometheus implementation
			const labels = {
				method: request.method,
				path: path,
				status: response.status.toString(),
			};

			// Record request duration histogram (if enabled)
			if (httpRequestDuration) {
				httpRequestDuration.record(duration, labels);
			}

			// Record request counter (only for Prometheus)
			if (httpRequestsTotal) {
				httpRequestsTotal.add(1, labels);
			}

			// Handle streaming responses for http_server_duration_seconds (TTLB)
			if (
				response.body instanceof ReadableStream &&
				httpServerDurationSeconds
			) {
				const timingOptions: TimingOptions = {
					startTime,
					labels,
					histogram: httpServerDurationSeconds,
				};

				// Check for experimental optimized TTLB measurement
				const useOptimized =
					globalThis.__OTEL_PRESETS__?.experimental
						?.useOptimizedTTLBMeasurement;

				if (useOptimized) {
					return measureTTLBWithAsyncTiming(response, timingOptions);
				}
				return measureTTLBWithStreamWrapping(response, timingOptions);
			}

			// For non-streaming responses, record server duration immediately (if enabled)
			if (httpServerDurationSeconds) {
				httpServerDurationSeconds.record(duration, labels);
			}

			return response;
		} catch (error) {
			// Calculate duration for error metrics using performance.now()
			const duration = (performance.now() - startTime) / 1000; // Convert to seconds
			const errorLabels = {
				method: request.method,
				path: path,
				status: "500",
			};

			// Record error metrics (if enabled)
			if (httpRequestDuration) {
				httpRequestDuration.record(duration, errorLabels);
			}
			if (httpRequestsTotal) {
				httpRequestsTotal.add(1, errorLabels);
			}
			if (httpServerDurationSeconds) {
				httpServerDurationSeconds.record(duration, errorLabels);
			}

			// If an unhandled error occurs, record it on the span and re-throw.
			if (error instanceof Error) {
				span.recordException(error);
			}
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: (error as Error)?.message,
			});
			throw error;
		} finally {
			// End the span when the request is done.
			span.end();
		}
	});
}
