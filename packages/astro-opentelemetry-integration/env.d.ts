/// <reference types="astro/client" />

import type { NodeSDK } from "@opentelemetry/sdk-node";
import type { IntegrationSchema } from "./src/integration.ts";

declare global {
	var __astroOtelStandaloneServerStarted: boolean;
	var __OTEL_OPTIONS__: IntegrationSchema["otel"];
	var __OTEL_PRESETS__: IntegrationSchema["presets"];

	// OpenTelemetry SDK initialization state
	var __OTEL_SDK__: NodeSDK | undefined;
	var __OTEL_SDK_INITIALIZED__: boolean | undefined;
	var __OTEL_SDK_INITIALIZING__: boolean | undefined;
	var __OTEL_SDK_PROMISE__: Promise<void> | undefined;
	var __OTEL_HOST_METRICS_INITIALIZED__: boolean | undefined;
	var __OTEL_SHUTDOWN_HANDLER_SET__: boolean | undefined;
}
