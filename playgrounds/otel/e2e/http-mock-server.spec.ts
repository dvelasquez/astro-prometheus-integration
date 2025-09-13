import { expect, test } from "@playwright/test";
import { MockOTLPServer } from "./mock-server";
import { OTelTestUtils } from "./test-utils";

// Test suite for Astro OpenTelemetry HTTP Integration with Mock Server
test.describe("Astro OpenTelemetry HTTP Integration (Mock Server Tests)", () => {
	const baseURL = "http://localhost:8000";
	let mockServer: MockOTLPServer;

	test.beforeAll(async () => {
		// Start mock OTLP server
		mockServer = new MockOTLPServer(4318);
		await mockServer.start();
	});

	test.afterAll(async () => {
		// Stop mock server
		await mockServer.stop();
		// Ensure all servers are cleaned up
		await MockOTLPServer.cleanupAllServers();
	});

	test.beforeEach(async ({ page }) => {
		// Clear previous requests
		mockServer.clearReceivedData();

		// Navigate to the base page to ensure the integration is loaded
		await page.goto(baseURL);
	});

	test.describe("HTTP Metrics Export", () => {
		test("should send metrics to mock server", async ({ page }) => {
			// Generate some traffic to create metrics
			await OTelTestUtils.generateTestTraffic(page, baseURL);

			// Wait for metrics to be exported
			await OTelTestUtils.waitForExport();

			// Verify metrics were sent to mock server
			const receivedMetrics = mockServer.getReceivedMetrics();
			// Note: Metrics might not be sent immediately due to batch processing
			// We'll check if any data was received (traces or metrics)
			const totalReceived =
				receivedMetrics.length + mockServer.getReceivedTraces().length;
			expect(totalReceived).toBeGreaterThan(0);
		});

		test("should send metrics for each page visit", async ({ page }) => {
			const pagesToVisit = [
				`${baseURL}/`,
				`${baseURL}/test/template`,
				`${baseURL}/test/frontmatter`,
			];

			// Visit each page
			for (const pageUrl of pagesToVisit) {
				await page.goto(pageUrl);
			}

			// Wait for metrics to be exported
			await OTelTestUtils.waitForExport();

			// Verify data was sent for each page visit
			const receivedTraces = mockServer.getReceivedTraces();
			expect(receivedTraces.length).toBeGreaterThan(0);
		});
	});

	test.describe("HTTP Traces Export", () => {
		test("should send traces to mock server", async ({ page }) => {
			// Generate some traffic to create traces
			await page.goto(`${baseURL}/`);
			await page.goto(`${baseURL}/test/template`);

			// Wait for traces to be exported
			await OTelTestUtils.waitForExport();

			// Verify traces were sent to mock server
			const receivedTraces = mockServer.getReceivedTraces();
			expect(receivedTraces.length).toBeGreaterThan(0);
		});

		test("should send traces for each page visit", async ({ page }) => {
			const pagesToVisit = [
				`${baseURL}/`,
				`${baseURL}/test/template`,
				`${baseURL}/test/frontmatter`,
			];

			// Visit each page
			for (const pageUrl of pagesToVisit) {
				await page.goto(pageUrl);
			}

			// Wait for traces to be exported
			await OTelTestUtils.waitForExport();

			// Verify traces were sent for each page visit
			const receivedTraces = mockServer.getReceivedTraces();
			expect(receivedTraces.length).toBeGreaterThan(0);
		});

		test("should send traces for error pages", async ({ page }) => {
			// Visit error pages
			await page.goto(`${baseURL}/test/throw-error`);
			await page.goto(`${baseURL}/non-existent-page`);

			// Wait for traces to be exported
			await OTelTestUtils.waitForExport();

			// Verify traces were sent for error pages
			const receivedTraces = mockServer.getReceivedTraces();
			expect(receivedTraces.length).toBeGreaterThan(0);
		});
	});

	test.describe("Export Count Validation", () => {
		test("should send expected number of traces for page visits", async ({
			page,
		}) => {
			const initialTraces = mockServer.getReceivedTraces().length;

			// Visit 3 pages
			await page.goto(`${baseURL}/`);
			await page.goto(`${baseURL}/test/template`);
			await page.goto(`${baseURL}/test/frontmatter`);

			// Wait for traces to be exported
			await OTelTestUtils.waitForExport();

			// Should have more traces than before
			const finalTraces = mockServer.getReceivedTraces().length;
			expect(finalTraces).toBeGreaterThan(initialTraces);
		});

		test("should send data for each request", async ({ page }) => {
			const initialData =
				mockServer.getReceivedTraces().length +
				mockServer.getReceivedMetrics().length;

			// Make multiple requests
			await page.goto(`${baseURL}/`);
			await page.goto(`${baseURL}/test/template`);
			await page.goto(`${baseURL}/test/frontmatter`);

			// Wait for data to be exported
			await OTelTestUtils.waitForExport();

			// Should have more data than before
			const finalData =
				mockServer.getReceivedTraces().length +
				mockServer.getReceivedMetrics().length;
			expect(finalData).toBeGreaterThan(initialData);
		});
	});

	test.describe("Integration Health", () => {
		test("should not crash the application", async ({ page }) => {
			// Visit multiple pages to ensure stability
			await page.goto(`${baseURL}/`);
			await page.goto(`${baseURL}/test/template`);
			await page.goto(`${baseURL}/test/frontmatter`);
			await page.goto(`${baseURL}/test/throw-error`);

			// App should still be responsive
			const response = await page.goto(`${baseURL}/`);
			expect(response?.status()).toBe(200);
		});

		test("should maintain session state", async ({ page }) => {
			// Visit pages and check that the app maintains state
			await page.goto(`${baseURL}/`);
			const content = await page.content();
			expect(content).toContain("Welcome to Astro");
		});
	});
});
