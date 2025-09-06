import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { createResolver } from "astro-integration-kit";
import { hmrIntegration } from "astro-integration-kit/dev";

// Import the named export 'integration'
const { default: opentelemetryIntegration } = await import(
	"astro-opentelemetry-integration"
);

// https://astro.build/config
export default defineConfig({
	integrations: [
		opentelemetryIntegration({
			enabled: true, // explicitly enable it
			serviceName: "otel-playground",
			serviceVersion: "0.0.1",
		}),
		hmrIntegration({
			directory: createResolver(import.meta.url).resolve(
				"../../packages/astro-opentelemetry-integration/dist",
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
