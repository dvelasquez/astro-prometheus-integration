// @ts-check

import node from "@astrojs/node";
import { defineConfig } from "astro/config";

import prometheusNodeIntegration from "astro-prometheus-node-integration";

// https://astro.build/config
export default defineConfig({
	adapter: node({
		mode: "standalone",
	}),

	integrations: [prometheusNodeIntegration()],
});
