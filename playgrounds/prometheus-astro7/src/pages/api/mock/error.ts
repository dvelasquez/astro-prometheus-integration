import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const source = url.searchParams.get("source") ?? "unknown";

	return new Response(
		JSON.stringify({
			error: "forced-error",
			source,
		}),
		{
			status: 500,
			statusText: "Internal Server Error",
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
};
