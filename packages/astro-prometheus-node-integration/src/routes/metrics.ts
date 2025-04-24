import type { APIRoute } from "astro";
import register from "../register.ts";

export const GET: APIRoute = async () => {
	try {
		const metrics = await register.metrics();
		return new Response(metrics, {
			status: 200,
			headers: {
				"Content-Type": register.contentType,
			},
		});
	} catch (error) {
		console.error("Error generating metrics:", error);
		return new Response("Error generating metrics", {
			status: 500,
		});
	}
};
