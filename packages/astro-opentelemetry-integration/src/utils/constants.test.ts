import { describe, expect, it } from "vitest";
import { ALLOWED_ADAPTERS, INTEGRATION_NAME } from "./constants.js";

describe("constants", () => {
	describe("ALLOWED_ADAPTERS", () => {
		it("should contain the expected adapter", () => {
			expect(ALLOWED_ADAPTERS).toContain("@astrojs/node");
		});

		it("should be an array", () => {
			expect(Array.isArray(ALLOWED_ADAPTERS)).toBe(true);
		});

		it("should have the correct length", () => {
			expect(ALLOWED_ADAPTERS).toHaveLength(1);
		});

		it("should contain only string values", () => {
			ALLOWED_ADAPTERS.forEach((adapter) => {
				expect(typeof adapter).toBe("string");
			});
		});
	});

	describe("INTEGRATION_NAME", () => {
		it("should be a string", () => {
			expect(typeof INTEGRATION_NAME).toBe("string");
		});

		it("should have the correct value", () => {
			expect(INTEGRATION_NAME).toBe("astro-opentelemetry-integration");
		});

		it("should not be empty", () => {
			expect(INTEGRATION_NAME.length).toBeGreaterThan(0);
		});
	});
});
