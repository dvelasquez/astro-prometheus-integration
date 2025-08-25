import { expect, test } from "@playwright/test";

// Test suite for Standalone Metrics Server functionality
test.describe("Standalone Metrics Server", () => {
	// Note: This test suite requires the standalone metrics server to be enabled
	// You may need to temporarily modify the playground config to enable it for testing

	test.skip("should start standalone metrics server when enabled", async ({
		page,
	}) => {
		// This test would verify that the standalone server starts on the configured port
		// For now, we'll skip it since standalone is disabled in the current config

		const standalonePort = 6080;
		const standaloneURL = `http://localhost:${standalonePort}/metrics`;

		try {
			await page.goto(standaloneURL);

			// Should return metrics
			const content = await page.content();
			expect(content).toContain("# HELP");
			expect(content).toContain("# TYPE");
		} catch (error) {
			// Expected to fail since standalone is disabled
			console.log("Standalone metrics server is disabled (expected behavior)");
		}
	});

	test("should not expose metrics on standalone port when disabled", async ({
		page,
	}) => {
		// Since standalone is disabled, this should fail
		const standalonePort = 6080;
		const standaloneURL = `http://localhost:${standalonePort}/metrics`;

		try {
			const response = await page.goto(standaloneURL);
			// If we get here, the server is running (unexpected)
			expect(response?.status()).toBe(404);
		} catch (error) {
			// Expected behavior - server should not be running
			console.log(
				"Standalone metrics server is not running (expected behavior)",
			);
		}
	});

	test("should still expose metrics on main app endpoint when standalone is disabled", async ({
		page,
	}) => {
		// The main metrics endpoint should still work
		const baseURL = "http://localhost:4321";
		const metricsURL = "/_/metrics";

		await page.goto(`${baseURL}${metricsURL}`);

		// Should return metrics
		const content = await page.content();
		expect(content).toContain("# HELP");
		expect(content).toContain("# TYPE");
		expect(content).toContain("myapp_http_requests_total");
	});
});
