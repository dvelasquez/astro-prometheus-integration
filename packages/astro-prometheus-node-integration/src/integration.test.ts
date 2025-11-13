import { describe, expect, it } from "vitest";
import { integrationSchema } from "./integration.js";

describe("integrationSchema outboundRequests", () => {
	it("leaves outboundRequests undefined by default", () => {
		const parsed = integrationSchema.parse({});
		expect(parsed.outboundRequests).toBeUndefined();
	});

	it("applies defaults when outboundRequests is enabled", () => {
		const parsed = integrationSchema.parse({
			outboundRequests: {
				enabled: true,
			},
		});
		expect(parsed.outboundRequests?.enabled).toBe(true);
		expect(parsed.outboundRequests?.includeErrors).toBe(true);
		expect(parsed.outboundRequests?.labels).toEqual({});
	});
});
