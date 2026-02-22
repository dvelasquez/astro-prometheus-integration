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
	security: {
		checkOrigin: false,
	},
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
			histogramBuckets: {
				inbound: [0.05, 0.1, 0.25],
				outbound: [0.1, 0.5, 1],
			},
			outboundRequests: {
				enabled: true,
				includeErrors: true,
				labels: {
					endpoint: (context) =>
						context.defaultEndpoint.replace(/\/\d+/g, "/:id"),
					app: () => "prom-playground",
				},
				shouldObserve: (entry) => {
					const resourceTarget =
						typeof (entry as { name?: unknown }).name === "string"
							? (entry as { name: string }).name
							: "";
					const httpTarget = (() => {
						const detail = (entry as { detail?: unknown }).detail as
							| {
									req?: {
										url?: string;
									};
							  }
							| undefined;
						return detail?.req?.url ?? "";
					})();
					const target = httpTarget || resourceTarget;
					return !target.includes("skip-metrics");
				},
			},
		}),
		hmrIntegration({
			directory: createResolver(import.meta.url).resolve(
				"../../packages/astro-prometheus-node-integration/dist",
			),
		}),
	],

	vite: {
		plugins: [
			// biome-ignore lint/suspicious/noExplicitAny: Tailwind plugin typings are not compatible with Astro config typing.
			tailwindcss() as any,
		],
	},

	adapter: node({
		mode: "standalone",
	}),
});
