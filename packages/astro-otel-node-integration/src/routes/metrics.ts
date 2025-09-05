import type { APIRoute } from "astro";

export const prerender = false;

// Prometheus metrics endpoint for Astro
export const GET: APIRoute = async () => {
	try {
		return new Response("Open Telemetry metrics", {
			status: 200,
			headers: {
				"Content-Type": "text/plain",
			},
		});
	} catch (error) {
		console.error("Error generating metrics:", error);
		return new Response("Error generating metrics", {
			status: 500,
		});
	}
};
