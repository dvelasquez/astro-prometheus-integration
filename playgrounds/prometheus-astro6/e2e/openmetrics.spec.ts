import { expect, test } from "@playwright/test";

// Test suite for OpenMetrics content type functionality
test.describe("OpenMetrics Content Type", () => {
	// Note: This test suite would require temporarily modifying the playground config
	// to use registerContentType: "OPENMETRICS" instead of "PROMETHEUS"

	test.skip("should return OpenMetrics format when configured", async ({
		page,
	}) => {
		// This test would verify OpenMetrics content type
		// For now, we'll skip it since the config uses PROMETHEUS

		const baseURL = "http://localhost:4321";
		const metricsURL = "/_/metrics";

		const response = await page.goto(`${baseURL}${metricsURL}`);

		// Should return OpenMetrics content type
		const contentType = response?.headers()["content-type"];
		expect(contentType).toContain("application/openmetrics-text");

		// Should contain OpenMetrics format
		const body = await response?.text();
		expect(body).toContain("# HELP");
		expect(body).toContain("# TYPE");

		// OpenMetrics specific format checks would go here
		// (e.g., checking for specific OpenMetrics syntax)
	});

	test("should return Prometheus format when configured (current config)", async ({
		page,
	}) => {
		// Current config uses PROMETHEUS, so this should work
		const baseURL = "http://localhost:4321";
		const metricsURL = "/_/metrics";

		const response = await page.goto(`${baseURL}${metricsURL}`);

		// Should return text/plain content type (Prometheus format)
		const contentType = response?.headers()["content-type"];
		expect(contentType).toContain("text/plain");

		// Should contain Prometheus format
		const body = await response?.text();
		expect(body).toContain("# HELP");
		expect(body).toContain("# TYPE");
		expect(body).toContain("myapp_http_requests_total");
	});
});
