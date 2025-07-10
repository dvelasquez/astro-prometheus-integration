import type { APIRoute } from "astro";
import client from "prom-client";

export const prerender = false;

// Prometheus metrics endpoint for Astro
export const GET: APIRoute = async () => {
	try {
		const metrics = await client.register.metrics();
		return new Response(metrics, {
			status: 200,
			headers: {
				"Content-Type": client.register.contentType ?? "text/plain",
			},
		});
	} catch (error) {
		console.error("Error generating metrics:", error);
		return new Response("Error generating metrics", {
			status: 500,
		});
	}
};
