import { createServer } from "node:http";
import type { Registry } from "prom-client";

interface StandaloneMetricsServerOptions {
	register: Registry;
	port: number;
	metricsUrl: string;
}

/**
 * Starts a standalone HTTP server exposing Prometheus metrics at /metrics.
 * @param options - Configuration for the server (register, port, content type)
 */
export function startStandaloneMetricsServer({
	register,
	port,
	metricsUrl,
}: StandaloneMetricsServerOptions) {
	// Only start one server per process
	if (globalThis.__astroPromStandaloneServerStarted) {
		return;
	}
	globalThis.__astroPromStandaloneServerStarted = true;

	const server = createServer(async (req, res) => {
		if (req.method === "GET" && req.url === metricsUrl) {
			try {
				const metrics = await register.metrics();
				res.writeHead(200, {
					"Content-Type": register.contentType || "text/plain",
				});
				res.end(metrics);
			} catch (err) {
				res.writeHead(500);
				res.end("Error generating metrics");
			}
			return;
		}
		res.writeHead(404);
		res.end("Not found");
	});

	server.listen(port, () => {
		const formattedTime = new Date().toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});

		console.info(
			`\x1b[90m${formattedTime}\x1b[0m \x1b[34m[astro-prometheus-node-integration]\x1b[0m Standalone metrics server listening on port ${port}`,
		);
	});
}
