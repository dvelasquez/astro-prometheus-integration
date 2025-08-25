import { Page } from '@playwright/test';

/**
 * Helper class for testing Prometheus metrics in e2e tests
 */
export class MetricsHelper {
  private page: Page;
  private baseURL: string;
  private metricsURL: string;

  constructor(page: Page, baseURL = 'http://localhost:4321', metricsURL = '/_/metrics') {
    this.page = page;
    this.baseURL = baseURL;
    this.metricsURL = metricsURL;
  }

  /**
   * Navigate to the metrics endpoint and return the content
   */
  async getMetricsContent(): Promise<string> {
    await this.page.goto(`${this.baseURL}${this.metricsURL}`);
    return await this.page.content();
  }

  /**
   * Get metrics as text (raw response body)
   */
  async getMetricsText(): Promise<string> {
    const response = await this.page.goto(`${this.baseURL}${this.metricsURL}`);
    return await response?.text() || '';
  }

  /**
   * Check if a specific metric exists with given labels
   */
  async hasMetric(metricName: string, labels?: Record<string, string>): Promise<boolean> {
    const content = await this.getMetricsContent();
    
    if (!labels) {
      return content.includes(metricName);
    }

    // Build the expected metric string with labels
    const labelString = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    
    const expectedMetric = `${metricName}{${labelString}}`;
    return content.includes(expectedMetric);
  }

  /**
   * Get the value of a specific metric
   */
  async getMetricValue(metricName: string, labels?: Record<string, string>): Promise<number | null> {
    const content = await this.getMetricsContent();
    
    let searchPattern: string;
    if (!labels) {
      searchPattern = new RegExp(`${metricName}\\s+(\\d+(?:\\.\\d+)?)`, 'i');
    } else {
      const labelString = Object.entries(labels)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');
      searchPattern = new RegExp(`${metricName}\\{${labelString}\\}\\s+(\\d+(?:\\.\\d+)?)`, 'i');
    }

    const match = content.match(searchPattern);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * Wait for a metric to reach a certain value
   */
  async waitForMetricValue(
    metricName: string, 
    expectedValue: number, 
    labels?: Record<string, string>,
    timeout = 10000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const currentValue = await this.getMetricValue(metricName, labels);
      if (currentValue === expectedValue) {
        return;
      }
      await this.page.waitForTimeout(100);
    }
    
    throw new Error(`Metric ${metricName} did not reach value ${expectedValue} within ${timeout}ms`);
  }

  /**
   * Check if metrics contain the expected custom prefix
   */
  async hasCustomPrefix(prefix: string): Promise<boolean> {
    const content = await this.getMetricsContent();
    
    const expectedMetrics = [
      `${prefix}http_requests_total`,
      `${prefix}http_request_duration_seconds`,
      `${prefix}http_server_duration_seconds`
    ];
    
    return expectedMetrics.every(metric => content.includes(metric));
  }

  /**
   * Check if metrics contain the expected custom labels
   */
  async hasCustomLabels(labels: Record<string, string>): Promise<boolean> {
    const content = await this.getMetricsContent();
    
    return Object.entries(labels).every(([key, value]) => 
      content.includes(`${key}="${value}"`)
    );
  }

  /**
   * Verify that default Node.js metrics are present with prefix
   */
  async hasDefaultMetricsWithPrefix(prefix: string): Promise<boolean> {
    const content = await this.getMetricsContent();
    
    const expectedDefaultMetrics = [
      `${prefix}process_cpu_user_seconds_total`,
      `${prefix}process_resident_memory_bytes`,
      `${prefix}process_heap_size_total_bytes`
    ];
    
    // At least some default metrics should be present
    return expectedDefaultMetrics.some(metric => content.includes(metric));
  }

  /**
   * Generate traffic to test pages to create metrics
   */
  async generateTraffic(pages: string[]): Promise<void> {
    for (const pagePath of pages) {
      await this.page.goto(`${this.baseURL}${pagePath}`);
      await this.page.waitForTimeout(50); // Small delay between requests
    }
  }

  /**
   * Verify metrics endpoint is accessible and returns proper format
   */
  async verifyMetricsEndpoint(): Promise<void> {
    const response = await this.page.goto(`${this.baseURL}${this.metricsURL}`);
    
    // Should return 200 OK
    expect(response?.status()).toBe(200);
    
    // Should return text/plain content type
    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('text/plain');
    
    // Should contain Prometheus format
    const body = await response?.text();
    expect(body).toContain('# HELP');
    expect(body).toContain('# TYPE');
  }
}

/**
 * Helper function to create a MetricsHelper instance
 */
export function createMetricsHelper(page: Page, baseURL?: string, metricsURL?: string): MetricsHelper {
  return new MetricsHelper(page, baseURL, metricsURL);
}
