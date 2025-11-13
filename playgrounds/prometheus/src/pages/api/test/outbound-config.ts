import type { APIRoute } from "astro";

export const prerender = false;

type OutboundConfigRequest = {
	includeErrors?: boolean;
};

type MutableOutboundConfig = {
	includeErrors: boolean;
};

export const POST: APIRoute = async ({ request }) => {
	let payload: OutboundConfigRequest;

	try {
		payload = (await request.json()) as OutboundConfigRequest;
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: "invalid-json",
				message: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	if (typeof payload.includeErrors !== "boolean") {
		return new Response(
			JSON.stringify({
				error: "invalid-payload",
				message: "`includeErrors` must be a boolean",
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	const config = (globalThis as typeof globalThis & {
		__ASTRO_PROMETHEUS_OUTBOUND_CONFIG?: MutableOutboundConfig;
	}).__ASTRO_PROMETHEUS_OUTBOUND_CONFIG;
	if (config) {
		config.includeErrors = payload.includeErrors;

		return new Response(
			JSON.stringify({
				includeErrors: config.includeErrors,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	return new Response(
		JSON.stringify({
			error: "config-not-initialized",
		}),
		{
			status: 503,
			headers: { "Content-Type": "application/json" },
		},
	);
};

