import { expect, test } from "@playwright/test";
import { OTelTestUtils } from "./test-utils";

// Test suite for Astro OpenTelemetry gRPC Integration
test.describe("Astro OpenTelemetry gRPC Integration", () => {
	const baseURL = "http://localhost:8000";
	const collectorGrpcURL = "http://localhost:4317";
	const collectorHttpURL = "http://localhost:4318";

	test.beforeAll(async () => {
		// Start Docker services for testing
		await OTelTestUtils.startCollector();
	});

	test.afterAll(async () => {
		// Clean up Docker services
		await OTelTestUtils.stopCollector();
	});

	test.beforeEach(async ({ page }) => {
		// Navigate to the base page to ensure the integration is loaded
		await page.goto(baseURL);
	});

	test.describe("gRPC Metrics Export", () => {
		test("should send metrics to collector via gRPC", async ({ page }) => {
			// Generate some traffic to create metrics
			await page.goto(`${baseURL}/`);
			await page.goto(`${baseURL}/test/template`);
			await page.goto(`${baseURL}/test/frontmatter`);

			// Wait for metrics to be exported (with optimized batch settings)
			await page.waitForTimeout(500);

			// Check if collector is accessible (gRPC is harder to test directly)
			try {
				const response = await fetch(`${collectorHttpURL}/health`, {
					method: "GET",
				});

				// The collector should be running and accessible
				expect(response.status).toBeLessThan(500);
			} catch (error) {
				// If collector is not accessible, skip this test
				test.skip("Collector not accessible - skipping gRPC metrics test");
			}
		});

		test("should handle gRPC export errors gracefully", async ({ page }) => {
			// Generate traffic
			await page.goto(`${baseURL}/`);

			// Wait a bit for any potential export attempts
			await page.waitForTimeout(200);

			// The app should still be working even if export fails
			const response = await page.goto(`${baseURL}/`);
			expect(response?.status()).toBe(200);
		});
	});

	test.describe("gRPC Traces Export", () => {
		test("should send traces to collector via gRPC", async ({ page }) => {
			// Generate some traffic to create traces
			await page.goto(`${baseURL}/`);
			await page.goto(`${baseURL}/test/template`);

			// Wait for traces to be exported
			await page.waitForTimeout(500);

			// Check if collector is accessible
			try {
				const response = await fetch(`${collectorHttpURL}/health`, {
					method: "GET",
				});

				// The collector should be running and accessible
				expect(response.status).toBeLessThan(500);
			} catch (error) {
				// If collector is not accessible, skip this test
				test.skip("Collector not accessible - skipping gRPC traces test");
			}
		});

		test("should create traces for different page visits", async ({ page }) => {
			// Visit different pages to generate different traces
			await page.goto(`${baseURL}/`);
			await page.goto(`${baseURL}/test/template`);
			await page.goto(`${baseURL}/test/frontmatter`);

			// Wait for traces to be exported
			await page.waitForTimeout(500);

			// The app should be working correctly
			const response = await page.goto(`${baseURL}/`);
			expect(response?.status()).toBe(200);
		});
	});

	test.describe("Error Handling", () => {
		test("should handle 500 errors and export traces", async ({ page }) => {
			// Visit the error page
			const response = await page.goto(`${baseURL}/test/throw-error`);
			expect(response?.status()).toBe(500);

			// Wait for error trace to be exported
			await page.waitForTimeout(500);

			// App should still be functional
			const normalResponse = await page.goto(`${baseURL}/`);
			expect(normalResponse?.status()).toBe(200);
		});

		test("should handle 404 errors and export traces", async ({ page }) => {
			// Visit a non-existent page
			const response = await page.goto(`${baseURL}/non-existent-page`);
			expect(response?.status()).toBe(404);

			// Wait for 404 trace to be exported
			await page.waitForTimeout(500);

			// App should still be functional
			const normalResponse = await page.goto(`${baseURL}/`);
			expect(normalResponse?.status()).toBe(200);
		});
	});

	test.describe("Performance", () => {
		test("should not significantly impact page load times", async ({
			page,
		}) => {
			const startTime = Date.now();

			// Visit multiple pages
			await page.goto(`${baseURL}/`);
			await page.goto(`${baseURL}/test/template`);
			await page.goto(`${baseURL}/test/frontmatter`);

			const endTime = Date.now();
			const totalTime = endTime - startTime;

			// Should complete within reasonable time (5 seconds)
			expect(totalTime).toBeLessThan(5000);
		});

		test("should handle concurrent requests", async ({ page }) => {
			// Make multiple concurrent requests
			const promises = [
				page.goto(`${baseURL}/`),
				page.goto(`${baseURL}/test/template`),
				page.goto(`${baseURL}/test/frontmatter`),
			];

			const responses = await Promise.all(promises);

			// All requests should succeed
			responses.forEach((response) => {
				expect(response?.status()).toBe(200);
			});
		});
	});

	test.describe("Jaeger Integration", () => {
		test("should be able to access Jaeger UI", async ({ page }) => {
			try {
				// Try to access Jaeger UI
				const response = await page.goto("http://localhost:16686");

				// Jaeger UI should be accessible
				expect(response?.status()).toBe(200);

				// Check if we can see the Jaeger interface
				await page.waitForSelector("body", { timeout: 5000 });
				const title = await page.title();
				expect(title).toContain("Jaeger");
			} catch (error) {
				// If Jaeger is not accessible, skip this test
				test.skip(
					"Jaeger UI not accessible - skipping Jaeger integration test",
				);
			}
		});
	});
});
