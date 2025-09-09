// @ts-check

import node from "@astrojs/node";
import { defineConfig } from "astro/config";
import openTelemetryIntegration from "astro-opentelemetry-integration";
// import prometheusNodeIntegration from "astro-prometheus-node-integration";

// https://astro.build/config
export default defineConfig({
	adapter: node({
		mode: "standalone",
	}),

	integrations: [
		// prometheusNodeIntegration(),
		openTelemetryIntegration({
			enabled: true,
			otel: {
				serviceName: "demo",
				serviceVersion: "0.0.1",
			},
			presets: {
				metricExporter: "prometheus",
				traceExporter: "console",
			},
		}),
	],
});
