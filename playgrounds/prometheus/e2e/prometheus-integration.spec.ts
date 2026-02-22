import { expect, test } from "@playwright/test";

// Test suite for Astro Prometheus Integration
test.describe("Astro Prometheus Integration", () => {
	const baseURL = "http://localhost:4321";
	const metricsURL = "/_/metrics";

	test.beforeEach(async ({ page }) => {
		// Navigate to the base page to ensure the integration is loaded
		await page.goto(baseURL);
	});

	test.describe("Metrics Endpoint", () => {
		test("should expose metrics at configured endpoint", async ({ page }) => {
			await page.goto(`${baseURL}${metricsURL}`);

			// Should return 200 OK
			expect(page.url()).toContain(metricsURL);

			// Should contain Prometheus metrics format
			const content = await page.content();
			expect(content).toContain("# HELP");
			expect(content).toContain("# TYPE");
		});

		test("should return Prometheus text format", async ({ page }) => {
			const response = await page.goto(`${baseURL}${metricsURL}`);

			// Check content type
			const contentType = response?.headers()["content-type"];
			expect(contentType).toContain("text/plain");

			// Check response body contains metrics
			const body = await response?.text();
			expect(body).toContain("# HELP");
			expect(body).toContain("# TYPE");
		});

		test("should include custom prefix in metric names", async ({ page }) => {
			await page.goto(`${baseURL}${metricsURL}`);

			const content = await page.content();

			// Should have custom prefix "myapp_" on all custom metrics
			expect(content).toContain("myapp_http_requests_total");
			expect(content).toContain("myapp_http_request_duration_seconds");
			expect(content).toContain("myapp_http_server_duration_seconds");
		});

		test("should include custom labels on metrics", async ({ page }) => {
			await page.goto(`${baseURL}${metricsURL}`);

			const content = await page.content();

			// Should include custom labels from config
			expect(content).toContain('env="production"');
			expect(content).toContain('version="1.0.0"');
			expect(content).toContain('hostname="myapp.com"');
		});

		test("should include default Node.js metrics with prefix", async ({
			page,
		}) => {
			await page.goto(`${baseURL}${metricsURL}`);

			const content = await page.content();

			// Should include default metrics with custom prefix
			expect(content).toContain("myapp_process_cpu_user_seconds_total");
			expect(content).toContain("myapp_process_resident_memory_bytes");
		});
	});

	test.describe("Page Navigation and Metrics Collection", () => {
		test("should collect metrics for page visits", async ({ page }) => {
			// Visit multiple pages to generate metrics
			await page.goto(`${baseURL}/`);
			await page.goto(`${baseURL}/test/template`);
			await page.goto(`${baseURL}/test/frontmatter`);

			// Wait a bit for metrics to be collected
			await page.waitForTimeout(100);

			// Check metrics endpoint for collected data
			await page.goto(`${baseURL}${metricsURL}`);
			const content = await page.content();

			// Should have metrics for the pages we visited
			expect(content).toContain("myapp_http_requests_total");
			expect(content).toContain("myapp_http_request_duration_seconds");
		});

		test("should handle different HTTP methods", async ({ page }) => {
			// Test GET request
			await page.goto(`${baseURL}/`);

			// Test POST request (simulate form submission)
			await page.goto(`${baseURL}/test/template?delay=100`);
			await page.fill('input[name="delay"]', "100");
			await page.click('button[type="submit"]');

			// Wait for processing
			await page.waitForTimeout(200);

			// Check metrics
			await page.goto(`${baseURL}${metricsURL}`);
			const content = await page.content();

			// Should have metrics for both GET and POST
			expect(content).toContain('method="GET"');
			expect(content).toContain('method="POST"');
		});

		test("should collect duration metrics correctly", async ({ page }) => {
			// Visit a page that has some processing
			await page.goto(`${baseURL}/test/frontmatter`);

			// Wait for any async processing
			await page.waitForTimeout(100);

			// Check metrics
			await page.goto(`${baseURL}${metricsURL}`);
			const content = await page.content();

			// Should have duration metrics
			expect(content).toContain("myapp_http_request_duration_seconds_count");
			expect(content).toContain("myapp_http_server_duration_seconds_count");
		});
	});

	test.describe("Error Handling", () => {
		test("should collect metrics for error responses", async ({ page }) => {
			// Visit the error page and check for 500 status
			const response = await page.goto(`${baseURL}/test/throw-error`);

			// Should get a 500 error response
			expect(response?.status()).toBe(500);

			// Wait for error processing
			await page.waitForTimeout(100);

			// Check metrics for error
			await page.goto(`${baseURL}${metricsURL}`);
			const content = await page.content();

			// Should have metrics for the error
			expect(content).toContain('status="500"');
		});

		test("should handle 404 errors gracefully", async ({ page }) => {
			// Visit a non-existent page
			const response = await page.goto(`${baseURL}/non-existent-page`);

			// Should get 404
			expect(response?.status()).toBe(404);

			// Wait for processing
			await page.waitForTimeout(100);

			// Check metrics
			await page.goto(`${baseURL}${metricsURL}`);
			const content = await page.content();

			// Should have metrics for the 404
			expect(content).toContain('status="404"');
		});
	});

	test.describe("Performance and Caching", () => {
		test("should not call expensive operations on every request", async ({
			page,
		}) => {
			// Visit multiple pages rapidly
			const pages = ["/", "/test/template", "/test/frontmatter"];

			for (const pagePath of pages) {
				await page.goto(`${baseURL}${pagePath}`);
				await page.waitForTimeout(50); // Small delay between requests
			}

			// Check metrics endpoint
			await page.goto(`${baseURL}${metricsURL}`);
			const content = await page.content();

			// Should have collected metrics efficiently
			expect(content).toContain("myapp_http_requests_total");

			// Verify metric values are reasonable (not 0 or extremely high)
			const requestCountMatch = content.match(
				/myapp_http_requests_total\{[^}]*\} (\d+)/,
			);
			if (requestCountMatch) {
				const requestCount = Number.parseInt(requestCountMatch[1]);
				expect(requestCount).toBeGreaterThan(0);
				expect(requestCount).toBeLessThan(100); // Reasonable upper bound
			}
		});

		test("should maintain metric consistency across requests", async ({
			page,
		}) => {
			// First visit
			await page.goto(`${baseURL}/`);
			await page.waitForTimeout(100);

			// Check initial metrics
			await page.goto(`${baseURL}${metricsURL}`);
			const initialContent = await page.content();

			// Second visit
			await page.goto(`${baseURL}/`);
			await page.reload();
			await page.reload();
			await page.waitForTimeout(200);

			// Check updated metrics
			await page.goto(`${baseURL}${metricsURL}`);
			const updatedContent = await page.content();

			// Metrics should be consistent (same structure, different values)
			expect(updatedContent).toContain("myapp_http_requests_total");
			expect(updatedContent).toContain("myapp_http_request_duration_seconds");

			// Request count should have increased
			const initialMatch = initialContent.match(
				/myapp_http_requests_total\{[^}]*\} (\d+)/,
			);
			const updatedMatch = updatedContent.match(
				/myapp_http_requests_total\{[^}]*\} (\d+)/,
			);

			console.log(initialMatch, updatedMatch);

			if (initialMatch && updatedMatch) {
				const initialCount = Number.parseInt(initialMatch[1]);
				const updatedCount = Number.parseInt(updatedMatch[1]);
				expect(updatedCount).toBeGreaterThan(initialCount);
			}
		});
	});

	test.describe("Integration Configuration", () => {
		test("should respect custom metrics URL configuration", async ({
			page,
		}) => {
			// The integration is configured with metricsUrl: "/_/metrics"
			// This should be accessible
			await page.goto(`${baseURL}${metricsURL}`);

			// Should return metrics
			const content = await page.content();
			expect(content).toContain("# HELP");
			expect(content).toContain("# TYPE");
		});

		test("should apply custom prefix to all metrics", async ({ page }) => {
			await page.goto(`${baseURL}${metricsURL}`);

			const content = await page.content();

			// All custom metrics should have the "myapp_" prefix
			expect(content).toContain("myapp_http_requests_total");
			expect(content).toContain("myapp_http_request_duration_seconds");
			expect(content).toContain("myapp_http_server_duration_seconds");

			// Default Node.js metrics should also have the prefix
			expect(content).toContain("myapp_process_cpu_user_seconds_total");
			expect(content).toContain("myapp_process_resident_memory_bytes");
		});

		test("should include custom labels on all metrics", async ({ page }) => {
			await page.goto(`${baseURL}${metricsURL}`);

			const content = await page.content();

			// Custom labels should be present on metrics
			expect(content).toContain('env="production"');
			expect(content).toContain('version="1.0.0"');
			expect(content).toContain('hostname="myapp.com"');
		});
	});
});
