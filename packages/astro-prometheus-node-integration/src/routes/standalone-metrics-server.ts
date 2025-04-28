import { createServer } from "node:http";
import type { AstroIntegrationLogger } from "astro";
import type { Registry } from "prom-client";
interface StandaloneMetricsServerOptions {
	register: Registry;
	port: number;
	metricsUrl: string;
	logger: AstroIntegrationLogger;
}

/**
 * Starts a standalone HTTP server exposing Prometheus metrics at /metrics.
 * @param options - Configuration for the server (register, port, content type)
 */
export function startStandaloneMetricsServer({
	register,
	port,
	metricsUrl,
	logger,
}: StandaloneMetricsServerOptions) {
	// Only start one server per process
	if ((globalThis as any).__astroPromStandaloneServerStarted) {
		return;
	}
	(globalThis as any).__astroPromStandaloneServerStarted = true;

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
		// eslint-disable-next-line no-console
		logger.info(`Standalone metrics server listening on port ${port}`);
	});
}
