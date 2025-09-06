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
import {
	OTEL_SERVICE_NAME,
	OTEL_SERVICE_VERSION,
} from "../utils/getAttributes.js";

const tracer = trace.getTracer(OTEL_SERVICE_NAME, OTEL_SERVICE_VERSION);

export async function onRequest(ctx: APIContext, next: MiddlewareNext) {
	const { request, url } = ctx;

	const spanName = `HTTP ${request.method} ${url.pathname}`;

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

			return response;
		} catch (error) {
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
