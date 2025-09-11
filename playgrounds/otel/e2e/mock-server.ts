import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { URL } from "url";

/**
 * Mock OTLP server that captures HTTP requests and parses OTLP data
 */
export class MockOTLPServer {
	private server: any;
	private receivedMetrics: any[] = [];
	private receivedTraces: any[] = [];
	private port: number;
	private static usedPorts = new Set<number>();
	private static activeServers = new Set<MockOTLPServer>();

	constructor(port = 4318) {
		// Use the specified port - single worker ensures no conflicts
		this.port = port;
		MockOTLPServer.activeServers.add(this);
		console.log(`Mock server will use port ${port}`);
	}

	async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.server = createServer(
				(req: IncomingMessage, res: ServerResponse) => {
					this.handleRequest(req, res);
				},
			);

			this.server.listen(this.port, (err?: Error) => {
				if (err) {
					reject(err);
				} else {
					console.log(`Mock OTLP server started on port ${this.port}`);
					resolve();
				}
			});
		});
	}

	async stop(): Promise<void> {
		return new Promise((resolve) => {
			if (this.server) {
				// Force close all connections
				this.server.closeAllConnections?.();

				this.server.close(() => {
					console.log(`Mock OTLP server stopped on port ${this.port}`);
					MockOTLPServer.usedPorts.delete(this.port);
					MockOTLPServer.activeServers.delete(this);
					this.server = null;
					// Small delay to ensure port is fully released
					setTimeout(resolve, 100);
				});

				// Force resolve after timeout to prevent hanging
				setTimeout(() => {
					if (this.server) {
						console.log(`Force stopping mock server on port ${this.port}`);
						this.server = null;
						MockOTLPServer.usedPorts.delete(this.port);
						MockOTLPServer.activeServers.delete(this);
						resolve();
					}
				}, 1000);
			} else {
				resolve();
			}
		});
	}

	private async handleRequest(
		req: IncomingMessage,
		res: ServerResponse,
	): Promise<void> {
		const url = new URL(req.url || "", `http://localhost:${this.port}`);
		const pathname = url.pathname;

		// Set CORS headers
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS",
		);
		res.setHeader(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization",
		);

		if (req.method === "OPTIONS") {
			res.writeHead(200);
			res.end();
			return;
		}

		try {
			// Handle different OTLP endpoints
			if (pathname === "/v1/metrics") {
				await this.handleMetricsRequest(req, res);
			} else if (pathname === "/v1/traces") {
				await this.handleTracesRequest(req, res);
			} else if (pathname === "/health") {
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ status: "healthy" }));
			} else {
				res.writeHead(404, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ error: "Not found" }));
			}
		} catch (error) {
			console.error("Error handling request:", error);
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Internal server error" }));
		}
	}

	private async handleMetricsRequest(
		req: IncomingMessage,
		res: ServerResponse,
	): Promise<void> {
		if (req.method === "POST") {
			// Capture metrics data
			const body = await this.readRequestBody(req);
			try {
				// Try to parse as JSON first
				const metricsData = JSON.parse(body);
				this.receivedMetrics.push(metricsData);
				console.log(
					`Received metrics (JSON): ${JSON.stringify(metricsData).substring(0, 100)}...`,
				);
			} catch (error) {
				// If not JSON, store as raw data
				this.receivedMetrics.push({ raw: body, timestamp: Date.now() });
				console.log(`Received metrics (raw): ${body.substring(0, 100)}...`);
			}
		}

		// Return mock response
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				status: "success",
				receivedMetrics: this.receivedMetrics.length,
			}),
		);
	}

	private async handleTracesRequest(
		req: IncomingMessage,
		res: ServerResponse,
	): Promise<void> {
		if (req.method === "POST") {
			// Capture traces data
			const body = await this.readRequestBody(req);
			try {
				// Try to parse as JSON first
				const tracesData = JSON.parse(body);
				this.receivedTraces.push(tracesData);
				console.log(
					`Received traces (JSON): ${JSON.stringify(tracesData).substring(0, 100)}...`,
				);
			} catch (error) {
				// If not JSON, store as raw data
				this.receivedTraces.push({ raw: body, timestamp: Date.now() });
				console.log(`Received traces (raw): ${body.substring(0, 100)}...`);
			}
		}

		// Return mock response
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				status: "success",
				receivedTraces: this.receivedTraces.length,
			}),
		);
	}

	private async readRequestBody(req: IncomingMessage): Promise<string> {
		return new Promise((resolve, reject) => {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk.toString();
			});
			req.on("end", () => {
				resolve(body);
			});
			req.on("error", (error) => {
				reject(error);
			});
		});
	}

	getReceivedMetrics(): any[] {
		return [...this.receivedMetrics];
	}

	getReceivedTraces(): any[] {
		return [...this.receivedTraces];
	}

	clearReceivedData(): void {
		this.receivedMetrics = [];
		this.receivedTraces = [];
		console.log("Cleared received data");
	}

	getMetricsCount(): number {
		return this.receivedMetrics.length;
	}

	getTracesCount(): number {
		return this.receivedTraces.length;
	}

	// Helper methods for test assertions
	hasMetricsForPath(path: string): boolean {
		return this.receivedMetrics.some((metric) =>
			metric.resourceMetrics?.some((rm: any) =>
				rm.resource?.attributes?.some(
					(attr: any) =>
						attr.key === "http.route" && attr.value?.stringValue === path,
				),
			),
		);
	}

	hasTracesForPath(path: string): boolean {
		return this.receivedTraces.some((trace) =>
			trace.resourceSpans?.some((rs: any) =>
				rs.scopeSpans?.some((ss: any) =>
					ss.spans?.some((span: any) =>
						span.attributes?.some(
							(attr: any) =>
								attr.key === "http.route" && attr.value?.stringValue === path,
						),
					),
				),
			),
		);
	}

	hasTracesForStatusCode(statusCode: number): boolean {
		return this.receivedTraces.some((trace) =>
			trace.resourceSpans?.some((rs: any) =>
				rs.scopeSpans?.some((ss: any) =>
					ss.spans?.some((span: any) =>
						span.attributes?.some(
							(attr: any) =>
								attr.key === "http.status_code" &&
								attr.value?.intValue === statusCode,
						),
					),
				),
			),
		);
	}

	// Static method to cleanup all active servers
	static async cleanupAllServers(): Promise<void> {
		const servers = Array.from(MockOTLPServer.activeServers);
		await Promise.all(servers.map((server) => server.stop()));
		MockOTLPServer.activeServers.clear();
		MockOTLPServer.usedPorts.clear();
	}
}
