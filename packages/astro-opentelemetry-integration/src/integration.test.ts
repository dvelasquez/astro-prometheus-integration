import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.doMock("./utils/constants.js", () => ({
	ALLOWED_ADAPTERS: ["@astrojs/node", "@astrojs/vercel"],
	INTEGRATION_NAME: "astro-opentelemetry-integration",
}));

vi.doMock("./sdk.js", () => ({
	default: {},
}));

const enabledOptions = {
	enabled: true as const,
	otel: { serviceName: "test-service" },
	presets: { metricExporter: "prometheus" as const },
};

const expectedOtel = {
	serviceName: "test-service",
	serviceVersion: "unknown_version",
};

const expectedPresets = {
	metricExporter: "prometheus",
	traceExporter: "console",
};

const expectedBootstrapPrefix =
	'globalThis.__OTEL_OPTIONS__={"serviceName":"test-service","serviceVersion":"unknown_version"};globalThis.__OTEL_PRESETS__={"metricExporter":"prometheus","traceExporter":"console"};await import("astro-opentelemetry-integration/sdk");\n';

describe("integration", () => {
	let originalGlobalOptions: typeof globalThis.__OTEL_OPTIONS__;
	let originalGlobalPresets: typeof globalThis.__OTEL_PRESETS__;

	beforeEach(() => {
		originalGlobalOptions = globalThis.__OTEL_OPTIONS__;
		originalGlobalPresets = globalThis.__OTEL_PRESETS__;

		vi.clearAllMocks();

		globalThis.__OTEL_OPTIONS__ = undefined;
		globalThis.__OTEL_PRESETS__ = undefined;
	});

	afterEach(() => {
		globalThis.__OTEL_OPTIONS__ = originalGlobalOptions;
		globalThis.__OTEL_PRESETS__ = originalGlobalPresets;

		vi.clearAllMocks();
	});

	it("should return an Astro integration with the correct name", async () => {
		const { integration } = await import("./integration.js");

		const result = integration(enabledOptions);

		expect(result.name).toBe("astro-opentelemetry-integration");
		expect(result.hooks).toHaveProperty("astro:config:setup");
	});

	describe("factory function", () => {
		let mockLogger: {
			info: ReturnType<typeof vi.fn>;
		};
		let mockAddMiddleware: ReturnType<typeof vi.fn>;
		let mockUpdateConfig: ReturnType<typeof vi.fn>;
		let mockConfig: {
			adapter: { name: string } | null;
			build: { serverEntry?: string };
		};

		beforeEach(() => {
			mockLogger = {
				info: vi.fn(),
			};
			mockAddMiddleware = vi.fn();
			mockUpdateConfig = vi.fn();
			mockConfig = {
				adapter: {
					name: "@astrojs/node",
				},
				build: {
					serverEntry: "entry.mjs",
				},
			};
		});

		it("should return empty hooks when integration is disabled", async () => {
			const { integration } = await import("./integration.js");

			const result = integration({ enabled: false });

			expect(result).toEqual({
				name: "astro-opentelemetry-integration",
				hooks: {},
			});

			expect(globalThis.__OTEL_OPTIONS__).toBeUndefined();
			expect(globalThis.__OTEL_PRESETS__).toBeUndefined();
		});

		it("should set global options when integration is enabled", async () => {
			const { integration } = await import("./integration.js");

			const result = integration(enabledOptions);

			expect(result.hooks).toHaveProperty("astro:config:setup");
			expect(globalThis.__OTEL_OPTIONS__).toEqual(expectedOtel);
			expect(globalThis.__OTEL_PRESETS__).toEqual(expectedPresets);
		});

		describe("astro:config:setup hook", () => {
			let setupHook: (params: {
				addMiddleware: unknown;
				logger: unknown;
				updateConfig: unknown;
				config: unknown;
				command: string;
			}) => void;

			beforeEach(async () => {
				const { integration } = await import("./integration.js");

				const result = integration(enabledOptions);

				setupHook = result.hooks["astro:config:setup"] as typeof setupHook;
			});

			it("should log integration setup start", () => {
				setupHook({
					addMiddleware: mockAddMiddleware,
					logger: mockLogger,
					updateConfig: mockUpdateConfig,
					config: mockConfig,
					command: "build",
				});

				expect(mockLogger.info).toHaveBeenCalledWith("setting up integration");
			});

			it("should throw error for unsupported adapter", () => {
				const configWithUnsupportedAdapter = {
					...mockConfig,
					adapter: {
						name: "@astrojs/unsupported",
					},
				};

				expect(() => {
					setupHook({
						addMiddleware: mockAddMiddleware,
						logger: mockLogger,
						updateConfig: mockUpdateConfig,
						config: configWithUnsupportedAdapter,
						command: "build",
					});
				}).toThrow(
					"astro-opentelemetry-integration currently only works with one of the following adapters: @astrojs/node, @astrojs/vercel",
				);
			});

			it("should throw error when no adapter is configured", () => {
				const configWithoutAdapter = {
					...mockConfig,
					adapter: null,
				};

				expect(() => {
					setupHook({
						addMiddleware: mockAddMiddleware,
						logger: mockLogger,
						updateConfig: mockUpdateConfig,
						config: configWithoutAdapter,
						command: "build",
					});
				}).toThrow(
					"astro-opentelemetry-integration currently only works with one of the following adapters: @astrojs/node, @astrojs/vercel",
				);
			});

			it("should import SDK in dev mode", () => {
				setupHook({
					addMiddleware: mockAddMiddleware,
					logger: mockLogger,
					updateConfig: mockUpdateConfig,
					config: mockConfig,
					command: "dev",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					"prepending astro-opentelemetry-integration OpenTelemetry SDK to dev mode",
				);
			});

			it("should not import SDK in build mode", () => {
				setupHook({
					addMiddleware: mockAddMiddleware,
					logger: mockLogger,
					updateConfig: mockUpdateConfig,
					config: mockConfig,
					command: "build",
				});

				expect(mockLogger.info).not.toHaveBeenCalledWith(
					"prepending astro-opentelemetry-integration OpenTelemetry SDK to dev mode",
				);
			});

			it("should configure Vite plugin for build", () => {
				setupHook({
					addMiddleware: mockAddMiddleware,
					logger: mockLogger,
					updateConfig: mockUpdateConfig,
					config: mockConfig,
					command: "build",
				});

				expect(mockUpdateConfig).toHaveBeenCalledWith({
					vite: {
						plugins: [
							{
								name: "astro-opentelemetry-integration-sdk-prepend",
								enforce: "pre",
								generateBundle: expect.any(Function),
							},
						],
					},
				});
			});

			it("should add middleware with correct configuration", () => {
				setupHook({
					addMiddleware: mockAddMiddleware,
					logger: mockLogger,
					updateConfig: mockUpdateConfig,
					config: mockConfig,
					command: "build",
				});

				expect(mockAddMiddleware).toHaveBeenCalledWith({
					order: "pre",
					entrypoint: expect.any(URL),
				});

				const call = mockAddMiddleware.mock.calls[0][0];
				expect(call.entrypoint.href).toMatch(/middleware\/index\.js$/);
			});

			it("should log integration setup complete", () => {
				setupHook({
					addMiddleware: mockAddMiddleware,
					logger: mockLogger,
					updateConfig: mockUpdateConfig,
					config: mockConfig,
					command: "build",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					"integration setup complete",
				);
			});

			describe("Vite plugin generateBundle", () => {
				let generateBundle: (
					options: unknown,
					bundle: Record<string, unknown>,
				) => void;

				beforeEach(() => {
					setupHook({
						addMiddleware: mockAddMiddleware,
						logger: mockLogger,
						updateConfig: mockUpdateConfig,
						config: mockConfig,
						command: "build",
					});

					const viteConfig = mockUpdateConfig.mock.calls[0][0];
					generateBundle = viteConfig.vite.plugins[0].generateBundle;
				});

				it("should prepend SDK bootstrap with options to entry chunk", () => {
					const mockBundle = {
						"entry.mjs": {
							type: "chunk",
							code: "console.log('original code');",
						},
						"other.js": {
							type: "chunk",
							code: "console.log('other code');",
						},
					};

					generateBundle({}, mockBundle);

					expect(mockBundle["entry.mjs"].code).toBe(
						`${expectedBootstrapPrefix}console.log('original code');`,
					);
					expect(mockBundle["other.js"].code).toBe(
						"console.log('other code');",
					);
				});

				it("should use default entry filename when serverEntry is not specified", async () => {
					const configWithoutServerEntry = {
						...mockConfig,
						build: {},
					};

					const { integration } = await import("./integration.js");
					const result = integration(enabledOptions);

					const setupHookNew = result.hooks[
						"astro:config:setup"
					] as typeof setupHook;
					setupHookNew({
						addMiddleware: mockAddMiddleware,
						logger: mockLogger,
						updateConfig: mockUpdateConfig,
						config: configWithoutServerEntry,
						command: "build",
					});

					const viteConfig = mockUpdateConfig.mock.calls[0][0];
					const generateBundleNew = viteConfig.vite.plugins[0].generateBundle;

					const mockBundle = {
						"entry.mjs": {
							type: "chunk",
							code: "console.log('original code');",
						},
					};

					generateBundleNew({}, mockBundle);

					expect(mockBundle["entry.mjs"].code).toBe(
						`${expectedBootstrapPrefix}console.log('original code');`,
					);
				});

				it("should log when prepending SDK to chunk", () => {
					const mockBundle = {
						"entry.mjs": {
							type: "chunk",
							code: "console.log('original code');",
						},
					};

					generateBundle({}, mockBundle);

					expect(mockLogger.info).toHaveBeenCalledWith(
						"Prepending astro-opentelemetry-integration OpenTelemetry SDK to output file: entry.mjs",
					);
				});

				it("should not modify non-chunk files", () => {
					const mockBundle = {
						"entry.mjs": {
							type: "asset",
							source: "asset content",
						},
					};

					generateBundle({}, mockBundle);

					expect(mockBundle["entry.mjs"].source).toBe("asset content");
				});

				it("should not modify chunks that are not the entry file", () => {
					const mockBundle = {
						"other.mjs": {
							type: "chunk",
							code: "console.log('other code');",
						},
					};

					generateBundle({}, mockBundle);

					expect(mockBundle["other.mjs"].code).toBe(
						"console.log('other code');",
					);
				});
			});

			it("should work with all allowed adapters", () => {
				const allowedAdapters = ["@astrojs/node", "@astrojs/vercel"];

				for (const adapterName of allowedAdapters) {
					const configWithAdapter = {
						...mockConfig,
						adapter: {
							name: adapterName,
						},
					};

					expect(() => {
						setupHook({
							addMiddleware: mockAddMiddleware,
							logger: mockLogger,
							updateConfig: mockUpdateConfig,
							config: configWithAdapter,
							command: "build",
						});
					}).not.toThrow();
				}
			});
		});
	});
});
