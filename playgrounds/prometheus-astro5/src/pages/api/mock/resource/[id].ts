import type { APIRoute } from "astro";

export const prerender = false;

const sleep = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

export const GET: APIRoute = async ({ params, url }) => {
	const id = params.id ?? "unknown";
	const source = url.searchParams.get("source") ?? "unknown";
	const delay = Number(url.searchParams.get("delay") ?? "0");

	if (Number.isFinite(delay) && delay > 0) {
		await sleep(Math.min(delay, 500));
	}

	return new Response(
		JSON.stringify({
			id,
			source,
			timestamp: Date.now(),
		}),
		{
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
};
