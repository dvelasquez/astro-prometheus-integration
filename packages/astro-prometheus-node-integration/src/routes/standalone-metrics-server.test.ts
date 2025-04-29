import http from "node:http";
import { Counter, Registry } from "prom-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { startStandaloneMetricsServer } from "./standalone-metrics-server.js";

function getFreePort(): Promise<number> {
	return new Promise((resolve) => {
		const srv = http.createServer();
		srv.listen(0, () => {
			const port = (srv.address() as any).port;
			srv.close(() => resolve(port));
		});
	});
}

describe("startStandaloneMetricsServer", () => {
	let registry: Registry;
	let port: number;
	let metricsUrl: string;
	let logger: any;

	beforeEach(async () => {
		registry = new Registry();
		// Add a test metric
		const counter = new Counter({
			name: "test_counter",
			help: "A test counter",
			registers: [registry],
		});
		counter.inc(42);

		port = await getFreePort();
		metricsUrl = "/test-metrics";
		logger = {
			info: vi.fn(),
			warn: () => {},
			error: () => {},
			debug: () => {},
			options: {},
			label: "test",
			fork: () => logger,
		};

		// Reset global flag for each test
		globalThis.__astroPromStandaloneServerStarted = false;
	});

	it("responds with metrics at the configured URL and port", async () => {
		startStandaloneMetricsServer({
			register: registry,
			port,
			metricsUrl,
			logger,
		});

		// Wait a bit for the server to start
		await new Promise((r) => setTimeout(r, 100));

		const res = await fetch(`http://localhost:${port}${metricsUrl}`);
		expect(res.status).toBe(200);
		const text = await res.text();
		expect(text).toContain("test_counter");
		expect(text).toContain("42");
		expect(logger.info).toHaveBeenCalledWith(
			expect.stringContaining(
				`Standalone metrics server listening on port ${port}`,
			),
		);
	});

	it("returns 404 for non-metrics URLs", async () => {
		startStandaloneMetricsServer({
			register: registry,
			port,
			metricsUrl,
			logger,
		});

		await new Promise((r) => setTimeout(r, 100));

		const res = await fetch(`http://localhost:${port}/not-metrics`);
		expect(res.status).toBe(404);
		const text = await res.text();
		expect(text).toBe("Not found");
	});

	it("does not start multiple servers", async () => {
		startStandaloneMetricsServer({
			register: registry,
			port,
			metricsUrl,
			logger,
		});
		startStandaloneMetricsServer({
			register: registry,
			port,
			metricsUrl,
			logger,
		});

		await new Promise((r) => setTimeout(r, 100));

		expect(logger.info).toHaveBeenCalledTimes(1);
	});
});
