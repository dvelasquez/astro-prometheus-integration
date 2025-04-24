import tailwindcss from "@tailwindcss/vite";
import { createResolver } from "astro-integration-kit";
import { hmrIntegration } from "astro-integration-kit/dev";
import { defineConfig } from "astro/config";

import node from "@astrojs/node";

const { default: prometheusNodeIntegration } = await import(
	"astro-prometheus-node-integration"
);

// https://astro.build/config
export default defineConfig({
	integrations: [
		prometheusNodeIntegration(),
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
