import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		setupFiles: ["./vitest.setup.ts"],
		globals: true, // Optional: If you want Vitest globals like describe, it, etc.
		environment: "node", // Or 'jsdom' if needed
	},
});
