import { metrics } from "@opentelemetry/api";
import type { MeterProvider } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { buildSDKConfig } from "./config/sdk-config.js";
import { initializeHostMetrics } from "./exporters/metrics.js";
import { GET_APP_CONSOLE_NAME } from "./utils/constants.js";
import { setupMetricsErrorHandling } from "./utils/error-handling.js";
import {
	getGlobalSDK,
	getSDKPromise,
	isHostMetricsInitialized,
	isSDKInitialized,
	isSDKInitializing,
	isShutdownHandlerSet,
	setGlobalSDK,
	setHostMetricsInitialized,
	setSDKInitialized,
	setSDKInitializing,
	setSDKPromise,
	setShutdownHandlerSet,
} from "./utils/global-state.js";

/**
 * Safe host metrics initialization
 */
async function initializeHostMetricsSafely(): Promise<void> {
	if (isHostMetricsInitialized()) {
		console.log(GET_APP_CONSOLE_NAME(), "Host metrics already initialized");
		return;
	}

	console.log(
		GET_APP_CONSOLE_NAME(),
		"Initializing host metrics for Prometheus",
	);
	const meterProvider = metrics.getMeterProvider() as MeterProvider;
	if (meterProvider) {
		initializeHostMetrics(meterProvider);
		setHostMetricsInitialized(true);
	}
}

/**
 * Setup graceful shutdown handler (only once)
 */
function setupGracefulShutdown(sdk: NodeSDK): void {
	if (isShutdownHandlerSet()) {
		return;
	}

	process.on("SIGTERM", () => {
		sdk
			.shutdown()
			.then(() => console.log(GET_APP_CONSOLE_NAME(), "Telemetry terminated"))
			.catch((error) =>
				console.log(
					GET_APP_CONSOLE_NAME(),
					"Error terminating telemetry",
					error,
				),
			)
			.finally(() => process.exit(0));
	});

	setShutdownHandlerSet(true);
}

/**
 * Safely initialize the OpenTelemetry SDK
 * This function is idempotent and handles multiple initialization attempts
 */
async function initializeSDKSafely(): Promise<void> {
	// Check if already initialized
	if (isSDKInitialized()) {
		console.log(
			GET_APP_CONSOLE_NAME(),
			"OpenTelemetry SDK already initialized, skipping...",
		);
		return;
	}

	// Check if currently initializing
	if (isSDKInitializing()) {
		console.log(
			GET_APP_CONSOLE_NAME(),
			"OpenTelemetry SDK is initializing, waiting...",
		);
		const existingPromise = getSDKPromise();
		if (existingPromise) {
			return existingPromise;
		}
	}

	// Start initialization
	setSDKInitializing(true);

	const initPromise = (async () => {
		try {
			console.log(
				GET_APP_CONSOLE_NAME(),
				"Initializing OpenTelemetry for Astro...",
			);

			// Check if OpenTelemetry is already initialized globally
			if (getGlobalSDK()) {
				console.log(
					GET_APP_CONSOLE_NAME(),
					"OpenTelemetry SDK already exists globally, skipping initialization",
				);
				return;
			}

			// Build configuration
			const config = buildSDKConfig(globalThis.__OTEL_PRESETS__);

			// Create and start SDK
			const sdk = new NodeSDK(config);
			sdk.start();

			// Store SDK reference globally
			setGlobalSDK(sdk);

			// Initialize host metrics for all exporters (OpenTelemetry best practice)
			await initializeHostMetricsSafely();

			// Set up error handling for export failures (OpenTelemetry best practice)
			setupMetricsErrorHandling();

			// Set up graceful shutdown (only once)
			setupGracefulShutdown(sdk);

			setSDKInitialized(true);
			console.log(
				GET_APP_CONSOLE_NAME(),
				"OpenTelemetry for Astro initialized successfully.",
			);
		} catch (error) {
			console.error(
				GET_APP_CONSOLE_NAME(),
				"Failed to initialize OpenTelemetry SDK:",
				error,
			);
			throw error;
		} finally {
			setSDKInitializing(false);
		}
	})();

	setSDKPromise(initPromise);
	return initPromise;
}

// Initialize immediately but safely
initializeSDKSafely().catch(console.error);
