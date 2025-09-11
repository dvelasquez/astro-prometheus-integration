import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { createResolver } from "astro-integration-kit";
import { hmrIntegration } from "astro-integration-kit/dev";
import type { IntegrationSchema } from "astro-opentelemetry-integration";

// Import the named export 'integration'
const { default: openTelemetryIntegration } = await import(
	"astro-opentelemetry-integration"
);

const prometheusPreset: IntegrationSchema["presets"] = {
	metricExporter: "prometheus",
	prometheusConfig: {
		port: 8080,
		endpoint: "/prometheus",
		withResourceConstantLabels: "/service/",
		prefix: "myapp_",
	},
};

const grpcPreset: IntegrationSchema["presets"] = {
	metricExporter: "grpc",
	traceExporter: "grpc",
};

const httpPreset: IntegrationSchema["presets"] = {
	metricExporter: "http",
	traceExporter: "http",
};

let presets: IntegrationSchema["presets"] = {};

switch (process.env.ASTRO_OTEL_PRESET) {
	case "prometheus":
		presets = prometheusPreset;
		break;
	case "grpc":
		presets = grpcPreset;
		break;
	case "http":
		presets = httpPreset;
		break;
	default:
		presets = httpPreset;
		break;
}

// https://astro.build/config
export default defineConfig({
	integrations: [
		openTelemetryIntegration({
			enabled: true, // explicitly enable it
			otel: {
				serviceName: "otel-playground",
				serviceVersion: "0.0.1",
			},
			presets,
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
	server: {
		port: 8000,
	},
});
