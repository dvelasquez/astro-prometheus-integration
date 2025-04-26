import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { createResolver } from "astro-integration-kit";
import { hmrIntegration } from "astro-integration-kit/dev";
import { defineConfig } from "astro/config";

// Import the named export 'integration'
const { integration: prometheusNodeIntegration } = await import(
	"astro-prometheus-node-integration"
);

// https://astro.build/config
export default defineConfig({
	integrations: [
		prometheusNodeIntegration({
			enabled: true, // explicitly enable it
			metricsUrl: "/metrics", // explicitly set the metrics URL
			collectDefaultMetricsConfig: {
				prefix: "myapp_", // All metrics will be prefixed with "myapp_"
				labels: {
					env: "production",
					version: "1.0.0",
					hostname: "myapp.com",
				},
			},
		}),
		hmrIntegration({
			directory: createResolver(import.meta.url).resolve(
				"../packages/astro-prometheus-node-integration/dist",
			),
		}),
	],

	vite: {
		plugins: [tailwindcss()],
	},

	adapter: node({
		mode: "standalone",
	}),
});
