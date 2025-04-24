import tailwindcss from "@tailwindcss/vite";
import { createResolver } from "astro-integration-kit";
import { hmrIntegration } from "astro-integration-kit/dev";
import { defineConfig } from "astro/config";

import node from "@astrojs/node";

const { default: prometheusIntegration } = await import("astro-prometheus-integration");

// https://astro.build/config
export default defineConfig({
  integrations: [
      prometheusIntegration(),
      hmrIntegration({
          directory: createResolver(import.meta.url).resolve("../package/dist"),
      }),
	],

  vite: {
      plugins: [tailwindcss()],
	},

  adapter: node({
    mode: "standalone",
  }),
});