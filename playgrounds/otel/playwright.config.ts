import { defineConfig, devices } from "@playwright/test";
import { getTestEnvVars } from "./e2e/test-config.js";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: "./e2e",
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: "html",
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: "http://localhost:8000",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",

		/* Take screenshot on failure */
		screenshot: "only-on-failure",

		/* Record video on failure */
		video: "retain-on-failure",
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	/* Run your local preview server before starting the tests */
	webServer: {
		command: "pnpm preview",
		url: "http://localhost:8000",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000, // 2 minutes timeout for server startup
		env: {
			...getTestEnvVars(), // Apply optimized batch settings for testing
		},
	},
});
