import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Test utilities for OpenTelemetry e2e tests
 */
export class OTelTestUtils {
	private static collectorStarted = false;

	/**
	 * Start Docker services for testing
	 */
	static async startCollector(): Promise<void> {
		if (OTelTestUtils.collectorStarted) {
			return;
		}

		console.log("Starting OpenTelemetry collector services...");
		try {
			await execAsync(
				"cd ../../packages/astro-opentelemetry-integration/collector && docker compose up -d",
			);

			// Wait for services to be ready
			await OTelTestUtils.waitForService("http://localhost:4318/health", 30000);
			await OTelTestUtils.waitForService("http://localhost:16686", 10000); // Jaeger UI

			OTelTestUtils.collectorStarted = true;
			console.log("OpenTelemetry collector services started successfully");
		} catch (error) {
			console.warn("Failed to start collector services:", error);
			throw error;
		}
	}

	/**
	 * Stop Docker services
	 */
	static async stopCollector(): Promise<void> {
		if (!OTelTestUtils.collectorStarted) {
			return;
		}

		console.log("Stopping OpenTelemetry collector services...");
		try {
			await execAsync(
				"cd ../../packages/astro-opentelemetry-integration/collector && docker compose down",
			);
			OTelTestUtils.collectorStarted = false;
			console.log("OpenTelemetry collector services stopped");
		} catch (error) {
			console.warn("Failed to stop collector services:", error);
		}
	}

	/**
	 * Wait for a service to be ready
	 */
	static async waitForService(url: string, timeoutMs = 10000): Promise<void> {
		const startTime = Date.now();

		while (Date.now() - startTime < timeoutMs) {
			try {
				const response = await fetch(url, { method: "GET" });
				if (response.status < 500) {
					return;
				}
			} catch (error) {
				// Service not ready yet, continue waiting
			}

			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		throw new Error(
			`Service at ${url} did not become ready within ${timeoutMs}ms`,
		);
	}

	/**
	 * Check if collector is accessible
	 */
	static async isCollectorAccessible(): Promise<boolean> {
		try {
			const response = await fetch("http://localhost:4318/health", {
				method: "GET",
			});
			return response.status < 500;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Check if Jaeger UI is accessible
	 */
	static async isJaegerAccessible(): Promise<boolean> {
		try {
			const response = await fetch("http://localhost:16686", { method: "GET" });
			return response.status < 500;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Generate test traffic to create metrics and traces
	 */
	static async generateTestTraffic(page: any, baseURL: string): Promise<void> {
		await page.goto(`${baseURL}/`);
		await page.goto(`${baseURL}/test/template`);
		await page.goto(`${baseURL}/test/frontmatter`);
	}

	/**
	 * Wait for metrics/traces to be exported with optimized timing
	 */
	static async waitForExport(): Promise<void> {
		// Optimized wait time for batch exports
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	/**
	 * Get optimized environment variables for testing
	 */
	static getTestEnvVars(): Record<string, string> {
		return {
			// Optimize batch settings for faster testing
			OTEL_BSP_SCHEDULE_DELAY: "100", // 100ms batch delay instead of default 5s
			OTEL_BSP_MAX_EXPORT_BATCH_SIZE: "10", // Smaller batch size
			OTEL_BSP_EXPORT_TIMEOUT: "1000", // 1s timeout instead of default 30s

			// Metrics batch settings
			OTEL_METRIC_EXPORT_INTERVAL: "100", // 100ms interval instead of default 60s
			OTEL_METRIC_EXPORT_TIMEOUT: "1000", // 1s timeout

			// Collector endpoints
			OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318",
			OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "http://localhost:4318/v1/traces",
			OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: "http://localhost:4318/v1/metrics",

			// gRPC endpoints
			OTEL_EXPORTER_OTLP_TRACES_ENDPOINT_GRPC: "http://localhost:4317",
			OTEL_EXPORTER_OTLP_METRICS_ENDPOINT_GRPC: "http://localhost:4317",
		};
	}
}

/**
 * Mock OTLP server for unit testing
 */
export class MockOTLPServer {
	private server: any;
	private receivedMetrics: any[] = [];
	private receivedTraces: any[] = [];

	constructor(private port = 4321) {}

	async start(): Promise<void> {
		// This would be implemented with a real HTTP server
		// For now, we'll use a simple mock
		console.log(`Mock OTLP server started on port ${this.port}`);
	}

	async stop(): Promise<void> {
		console.log("Mock OTLP server stopped");
	}

	getReceivedMetrics(): any[] {
		return this.receivedMetrics;
	}

	getReceivedTraces(): any[] {
		return this.receivedTraces;
	}

	clearReceivedData(): void {
		this.receivedMetrics = [];
		this.receivedTraces = [];
	}
}
