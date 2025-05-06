console.log("Vitest setup file loaded.");

// Define a default structure for the global options before any tests run
globalThis.__PROMETHEUS_OPTIONS__ = {
	metricsUrl: "/metrics",
	registerContentType: "PROMETHEUS",
	enabled: true,
	standaloneMetrics: {
		enabled: false,
		port: 9090,
	},
	collectDefaultMetricsConfig: undefined, // Add other potential fields if needed
};
