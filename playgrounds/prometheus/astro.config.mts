import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { createResolver } from "astro-integration-kit";
import { hmrIntegration } from "astro-integration-kit/dev";

// Import the named export 'integration'
const { default: prometheusNodeIntegration } = await import(
	"astro-prometheus-node-integration"
);

// https://astro.build/config
export default defineConfig({
	integrations: [
		prometheusNodeIntegration({
			enabled: true, // explicitly enable it
			metricsUrl: "/_/metrics", // explicitly set the metrics URL
			registerContentType: "PROMETHEUS",
			standaloneMetrics: {
				enabled: false,
				port: 6080,
			},
			collectDefaultMetricsConfig: {
				prefix: "myapp_", // All metrics will be prefixed with "myapp_"
				labels: {
					env: "production",
					version: "1.0.0",
					hostname: "myapp.com",
				},
			},
			experimental: {
				useOptimizedTTLBMeasurement: false, // Enable optimized TTLB measurement
			},
			outboundRequests: {
				enabled: true,
				includeErrors: true,
			},
		}),
		hmrIntegration({
			directory: createResolver(import.meta.url).resolve(
				"../../packages/astro-prometheus-node-integration/dist",
			),
		}),
	],

	vite: {
		plugins: [tailwindcss() as any],
	},

	adapter: node({
		mode: "standalone",
	}),
});
