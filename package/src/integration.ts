import { defineIntegration } from "astro-integration-kit";

export const integration = defineIntegration({
	name: "astro-prometheus-integration",
	setup() {
		console.log("astro-prometheus-integration:enabled");
		console.log("testing");
		return {
			hooks: {},
		};
	},
});
