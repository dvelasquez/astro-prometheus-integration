import { expect, test } from "@playwright/test";
import { createMetricsHelper } from "./utils/metrics-helper.js";

type MetricSample = {
	labels: Record<string, string>;
	value: number;
};

const METRICS_ENDPOINT = "/_/metrics";
const METRIC_PREFIX = "myapp_";

const parseMetricSamples = (metricsText: string, metricName: string) => {
	const lines = metricsText
		.split("\n")
		.map((line) => line.trim())
		.filter(
			(line) =>
				line.startsWith(`${metricName} `) ||
				line.startsWith(`${metricName}{`),
		);

	const samples: MetricSample[] = [];

	for (const line of lines) {
		const match = line.match(
			new RegExp(
				`^${metricName}(?:\\{([^}]*)\\})?\\s+([+-]?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)`,
			),
		);

		if (!match) {
			continue;
		}

		const [, labelsText, valueText] = match;
		const labels: Record<string, string> = {};

		if (labelsText) {
			for (const entry of labelsText.split(",")) {
				const [key, rawValue] = entry.split("=");
				if (!key || !rawValue) {
					continue;
				}
				labels[key.trim()] = rawValue.replace(/^"|"$/g, "");
			}
		}

		samples.push({
			labels,
			value: Number.parseFloat(valueText),
		});
	}

	return samples;
};

const findSample = (
	samples: MetricSample[],
	expected: Record<string, string>,
): MetricSample | undefined => {
	return samples.find((sample) => {
		for (const [key, value] of Object.entries(expected)) {
			if (sample.labels[key] !== value) {
				return false;
			}
		}
		return true;
	});
};

const getMetricValue = async (
	metricsHelper: ReturnType<typeof createMetricsHelper>,
	metricName: string,
	expectedLabels: Record<string, string>,
): Promise<number> => {
	const metricsText = await metricsHelper.getMetricsText();
	const samples = parseMetricSamples(metricsText, metricName);
	const sample = findSample(samples, expectedLabels);
	return sample?.value ?? 0;
};

const getMetricValueWithPartialLabels = async (
	metricsHelper: ReturnType<typeof createMetricsHelper>,
	metricName: string,
	partialLabels: Record<string, string>,
): Promise<number> => {
	const metricsText = await metricsHelper.getMetricsText();
	const samples = parseMetricSamples(metricsText, metricName);

	return samples
		.filter((sample) =>
			Object.entries(partialLabels).every(
				([key, value]) => sample.labels[key] === value,
			),
		)
		.reduce((total, sample) => total + sample.value, 0);
};

test.describe.configure({ mode: "serial" });

test.describe("Outbound HTTP metrics", () => {
	const baseURL = "http://localhost:4321";

	test.beforeEach(async ({ page }) => {
		await page.goto(baseURL);
	});

	test("records metrics for external API calls", async ({ page }) => {
		const metricsHelper = createMetricsHelper(page, baseURL, METRICS_ENDPOINT);
		const partialLabels = {
			app: "prom-playground",
			host: "mockly.me",
			method: "GET",
			endpoint: "/user/basic",
		};

		const counterMetric = `${METRIC_PREFIX}http_responses_total`;
		const histogramMetric = `${METRIC_PREFIX}http_response_duration_seconds_count`;

		const beforeCounter = await getMetricValueWithPartialLabels(
			metricsHelper,
			counterMetric,
			partialLabels,
		);
		const beforeHistogram = await getMetricValueWithPartialLabels(
			metricsHelper,
			histogramMetric,
			partialLabels,
		);

		await page.goto(`${baseURL}/test/call-api`);
		await page.waitForSelector("p");

		await expect
			.poll(() =>
				getMetricValueWithPartialLabels(
					metricsHelper,
					counterMetric,
					partialLabels,
				),
			)
			.toBeGreaterThan(beforeCounter);

		await expect
			.poll(() =>
				getMetricValueWithPartialLabels(
					metricsHelper,
					histogramMetric,
					partialLabels,
				),
			)
			.toBeGreaterThan(beforeHistogram);

		const metricsText = await metricsHelper.getMetricsText();
		const samples = parseMetricSamples(metricsText, counterMetric);
		const matchingSamples = samples.filter((sample) =>
			Object.entries(partialLabels).every(
				([key, value]) => sample.labels[key] === value,
			),
		);

		expect(matchingSamples.length).toBeGreaterThan(0);
		expect(matchingSamples[0].labels.host).toBe("mockly.me");
		expect(matchingSamples[0].labels.endpoint).toBe("/user/basic");
		expect(matchingSamples[0].labels.status).toBeDefined();
	});

	test("records metrics for successful outbound requests", async ({ page }) => {
		const metricsHelper = createMetricsHelper(page, baseURL, METRICS_ENDPOINT);
		const labels = {
			app: "prom-playground",
			endpoint: "/api/mock/resource/:id",
			method: "GET",
			status: "200",
		};

		const before = await getMetricValue(
			metricsHelper,
			`${METRIC_PREFIX}http_responses_total`,
			labels,
		);

		await page.goto(`${baseURL}/test/outbound/success`);
		await page.waitForSelector("pre");

		await expect
			.poll(async () =>
				getMetricValue(
					metricsHelper,
					`${METRIC_PREFIX}http_responses_total`,
					labels,
				),
			)
			.toBeGreaterThan(before);

		const metricsText = await metricsHelper.getMetricsText();
		const samples = parseMetricSamples(
			metricsText,
			`${METRIC_PREFIX}http_responses_total`,
		);
		const sample = findSample(samples, labels);
		expect(sample).toBeDefined();
		expect(sample?.labels.host).toContain(":4321");

		const histogramSamples = parseMetricSamples(
			metricsText,
			`${METRIC_PREFIX}http_response_duration_seconds_count`,
		);
		const histogramSample = findSample(histogramSamples, labels);
		expect(histogramSample?.value ?? 0).toBeGreaterThan(0);
	});

	test("records error metrics with error reason", async ({ page }) => {
		const metricsHelper = createMetricsHelper(page, baseURL, METRICS_ENDPOINT);
		const counterLabels = {
			app: "prom-playground",
			endpoint: "/api/mock/error",
			method: "GET",
			status: "500",
		};
		const errorLabels = {
			...counterLabels,
			error_reason: "HTTP_500",
		};

		const beforeResponses = await getMetricValue(
			metricsHelper,
			`${METRIC_PREFIX}http_responses_total`,
			counterLabels,
		);
		const beforeErrors = await getMetricValue(
			metricsHelper,
			`${METRIC_PREFIX}http_response_error_total`,
			errorLabels,
		);

		await page.goto(`${baseURL}/test/outbound/error`);
		await page.waitForSelector("[data-status]");

		await expect
			.poll(async () =>
				getMetricValue(
					metricsHelper,
					`${METRIC_PREFIX}http_responses_total`,
					counterLabels,
				),
			)
			.toBeGreaterThan(beforeResponses);

		await expect
			.poll(async () =>
				getMetricValue(
					metricsHelper,
					`${METRIC_PREFIX}http_response_error_total`,
					errorLabels,
				),
			)
			.toBeGreaterThan(beforeErrors);

		const metricsText = await metricsHelper.getMetricsText();
		const histogramSamples = parseMetricSamples(
			metricsText,
			`${METRIC_PREFIX}http_response_duration_seconds_count`,
		);
		const histogramSample = findSample(histogramSamples, counterLabels);
		expect(histogramSample?.value ?? 0).toBeGreaterThan(0);
	});

	test("skips histogram observations when includeErrors is disabled", async ({
		page,
		request,
	}) => {
		const metricsHelper = createMetricsHelper(page, baseURL, METRICS_ENDPOINT);
		const counterLabels = {
			app: "prom-playground",
			endpoint: "/api/mock/error",
			method: "GET",
			status: "500",
		};

		const toggleIncludeErrors = async (value: boolean) => {
			const response = await request.post(
				`${baseURL}/api/test/outbound-config`,
				{
					data: { includeErrors: value },
				},
			);
			expect(response.ok()).toBeTruthy();
		};

		await toggleIncludeErrors(false);

		const beforeResponses = await getMetricValue(
			metricsHelper,
			`${METRIC_PREFIX}http_responses_total`,
			counterLabels,
		);
		const beforeHistogram = await getMetricValue(
			metricsHelper,
			`${METRIC_PREFIX}http_response_duration_seconds_count`,
			counterLabels,
		);

		try {
			await page.goto(`${baseURL}/test/outbound/error`);
			await page.waitForSelector("[data-status]");

			await expect
				.poll(async () =>
					getMetricValue(
						metricsHelper,
						`${METRIC_PREFIX}http_responses_total`,
						counterLabels,
					),
				)
				.toBeGreaterThan(beforeResponses);

			const histogramAfter = await getMetricValue(
				metricsHelper,
				`${METRIC_PREFIX}http_response_duration_seconds_count`,
				counterLabels,
			);
			expect(histogramAfter).toBe(beforeHistogram);
		} finally {
			await toggleIncludeErrors(true);
		}
	});

	test("respects shouldObserve filter for skip targets", async ({ page }) => {
		const metricsHelper = createMetricsHelper(page, baseURL, METRICS_ENDPOINT);
		const labels = {
			app: "prom-playground",
			endpoint: "/api/mock/skip-metrics",
			method: "GET",
			status: "200",
		};

		const before = await getMetricValue(
			metricsHelper,
			`${METRIC_PREFIX}http_responses_total`,
			labels,
		);

		await page.goto(`${baseURL}/test/outbound/filtered`);
		await page.waitForSelector("pre");

		// Give the observer time to process entries
		await page.waitForTimeout(200);
		const after = await getMetricValue(
			metricsHelper,
			`${METRIC_PREFIX}http_responses_total`,
			labels,
		);

		expect(after).toBe(before);
	});
});

