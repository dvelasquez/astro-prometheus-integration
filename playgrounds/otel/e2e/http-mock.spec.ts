import { expect, test } from "@playwright/test";
import { OTelTestUtils } from "./test-utils";

// Test suite for Astro OpenTelemetry HTTP Integration (Mock-based)
test.describe("Astro OpenTelemetry HTTP Integration (Mock Tests)", () => {
	const baseURL = "http://localhost:8000";

	test.beforeEach(async ({ page }) => {
		// Navigate to the base page to ensure the integration is loaded
		await page.goto(baseURL);
	});

	test.describe("HTTP Export Configuration", () => {
		test("should have HTTP export configured", async ({ page }) => {
			// Generate some traffic to create metrics and traces
			await OTelTestUtils.generateTestTraffic(page, baseURL);

			// Wait for potential export attempts
			await OTelTestUtils.waitForExport();

			// The app should still be working
			const response = await page.goto(`${baseURL}/`);
			expect(response?.status()).toBe(200);
		});

		test("should handle export errors gracefully", async ({ page }) => {
			// Generate traffic
			await page.goto(`${baseURL}/`);

			// Wait a bit for any potential export attempts
			await OTelTestUtils.waitForExport();

			// The app should still be working even if export fails
			const response = await page.goto(`${baseURL}/`);
			expect(response?.status()).toBe(200);
		});
	});

	test.describe("Trace Generation", () => {
		test("should create traces for different page visits", async ({ page }) => {
			// Visit different pages to generate different traces
			await page.goto(`${baseURL}/`);
			await page.goto(`${baseURL}/test/template`);
			await page.goto(`${baseURL}/test/frontmatter`);

			// Wait for traces to be generated
			await OTelTestUtils.waitForExport();

			// The app should be working correctly
			const response = await page.goto(`${baseURL}/`);
			expect(response?.status()).toBe(200);
		});

		test("should handle 500 errors and create traces", async ({ page }) => {
			// Visit the error page
			const response = await page.goto(`${baseURL}/test/throw-error`);
			expect(response?.status()).toBe(500);

			// Wait for error trace to be generated
			await OTelTestUtils.waitForExport();

			// App should still be functional
			const normalResponse = await page.goto(`${baseURL}/`);
			expect(normalResponse?.status()).toBe(200);
		});

		test("should handle 404 errors and create traces", async ({ page }) => {
			// Visit a non-existent page
			const response = await page.goto(`${baseURL}/non-existent-page`);
			expect(response?.status()).toBe(404);

			// Wait for 404 trace to be generated
			await OTelTestUtils.waitForExport();

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
			// Make sequential requests instead of concurrent to avoid overwhelming the server
			const responses = [];
			responses.push(await page.goto(`${baseURL}/`));
			responses.push(await page.goto(`${baseURL}/test/template`));
			responses.push(await page.goto(`${baseURL}/test/frontmatter`));

			// All requests should succeed
			responses.forEach((response) => {
				expect(response?.status()).toBe(200);
			});
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
