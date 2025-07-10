import http from "node:http";
import { Counter, Registry } from "prom-client";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
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
	let logSpy: MockInstance<typeof console.info>;
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

		// Reset global flag for each test
		globalThis.__astroPromStandaloneServerStarted = false;
		logSpy = vi.spyOn(console, "info");
	});
	afterEach(() => {
		logSpy.mockRestore();
	});

	it("responds with metrics at the configured URL and port", async () => {
		startStandaloneMetricsServer({
			register: registry,
			port,
			metricsUrl,
		});

		// Wait a bit for the server to start
		await new Promise((r) => setTimeout(r, 100));

		const res = await fetch(`http://localhost:${port}${metricsUrl}`);
		expect(res.status).toBe(200);
		const text = await res.text();
		expect(text).toContain("test_counter");
		expect(text).toContain("42");
		expect(logSpy).toHaveBeenCalledWith(
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
		});
		startStandaloneMetricsServer({
			register: registry,
			port,
			metricsUrl,
		});

		await new Promise((r) => setTimeout(r, 100));

		expect(logSpy).toHaveBeenCalledTimes(1);
	});
});
