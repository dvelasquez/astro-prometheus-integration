import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the dependencies
vi.doMock("./integration.ts", () => ({
	integration: { name: "mock-integration" },
}));

vi.doMock("./integrationSchema.ts", () => ({
	integrationSchema: { type: "mock-schema" },
}));

describe("index", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should export integration", async () => {
		const { integration } = await import("./index.js");
		expect(integration).toEqual({ name: "mock-integration" });
	});

	it("should export integrationSchema", async () => {
		const { integrationSchema } = await import("./index.js");
		expect(integrationSchema).toEqual({ type: "mock-schema" });
	});

	it("should export integration as default", async () => {
		const module = await import("./index.js");
		expect(module.default).toEqual({ name: "mock-integration" });
	});

	it("should export all expected exports", async () => {
		const module = await import("./index.js");

		expect(module).toHaveProperty("integration");
		expect(module).toHaveProperty("integrationSchema");
		expect(module).toHaveProperty("default");

		// Should have exactly 3 exports
		const exports = Object.keys(module);
		expect(exports).toHaveLength(3);
		expect(exports).toContain("integration");
		expect(exports).toContain("integrationSchema");
		expect(exports).toContain("default");
	});
});
