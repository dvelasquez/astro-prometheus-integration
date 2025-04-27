// @ts-check
import { defineConfig } from "astro/config";

import node from "@astrojs/node";

import prometheusNodeIntegration from "astro-prometheus-node-integration";

// https://astro.build/config
export default defineConfig({
	adapter: node({
		mode: "standalone",
	}),

	integrations: [prometheusNodeIntegration()],
});
