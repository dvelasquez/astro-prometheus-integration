# E2E Tests for Astro Prometheus Integration

This directory contains comprehensive end-to-end tests for the Astro Prometheus integration using Playwright.

## 🎯 Test Coverage

### 1. **Prometheus Integration Tests** (`prometheus-integration.spec.ts`)
- ✅ Metrics endpoint accessibility and format
- ✅ Custom prefix and label application
- ✅ Default Node.js metrics collection
- ✅ Page navigation and metrics collection
- ✅ HTTP method handling (GET, POST)
- ✅ Duration metrics collection
- ✅ Error handling (500, 404)
- ✅ Performance and caching verification
- ✅ Integration configuration validation

### 2. **Standalone Metrics Server Tests** (`standalone-metrics.spec.ts`)
- ✅ Standalone server functionality (when enabled)
- ✅ Fallback to main app endpoint (when disabled)
- ✅ Port configuration validation

### 3. **OpenMetrics Tests** (`openmetrics.spec.ts`)
- ✅ OpenMetrics content type (when configured)
- ✅ Prometheus format (current default)
- ✅ Content type headers validation

### 4. **Test Utilities** (`utils/metrics-helper.ts`)
- 🔧 Helper class for common metrics testing patterns
- 🔧 Metric value extraction and validation
- 🔧 Custom prefix and label verification
- 🔧 Traffic generation for testing
- 🔧 Metrics endpoint validation

## 🚀 Running the Tests

### Prerequisites
1. **Start the playground development server**:
   ```bash
   cd playground
   npm run dev
   ```

2. **Install Playwright browsers** (if not already installed):
   ```bash
   npx playwright install
   ```

### Test Commands

#### Run All E2E Tests
```bash
npm run test:e2e
```

#### Run Tests with UI (Interactive)
```bash
npm run test:e2e:ui
```

#### Run Tests in Headed Mode (Visible Browser)
```bash
npm run test:e2e:headed
```

#### Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

#### View Test Report
```bash
npm run test:e2e:report
```

## 🔧 Test Configuration

### Playwright Config (`playwright.config.ts`)
- **Base URL**: `http://localhost:4321`
- **Web Server**: Automatically starts `npm run dev`
- **Browser**: Chromium (Chrome)
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On retry

### Test Environment
- **Port**: 4321 (Astro dev server)
- **Metrics Endpoint**: `/_/metrics`
- **Integration**: Enabled with custom prefix `myapp_`
- **Labels**: `env=production`, `version=1.0.0`, `hostname=myapp.com`

## 📊 Test Scenarios

### Metrics Endpoint Validation
- Verifies `/metrics` endpoint returns 200 OK
- Checks Prometheus text format
- Validates custom prefix application
- Confirms custom labels presence
- Ensures default Node.js metrics collection

### Page Navigation Testing
- Tests multiple page visits
- Verifies metrics collection for different routes
- Handles different HTTP methods
- Validates duration metrics accuracy

### Error Handling
- Tests 500 error responses
- Validates 404 error handling
- Ensures metrics are collected for errors
- Verifies proper status code recording

### Performance Verification
- Confirms no expensive operations per request
- Validates metrics caching functionality
- Tests metric consistency across requests
- Measures response time improvements

### Configuration Testing
- Custom metrics URL validation
- Prefix application verification
- Label propagation testing
- Content type handling

## 🛠️ Test Utilities

### MetricsHelper Class
```typescript
import { createMetricsHelper } from './utils/metrics-helper';

const metricsHelper = createMetricsHelper(page);

// Check if metric exists
await metricsHelper.hasMetric('myapp_http_requests_total');

// Get metric value
const value = await metricsHelper.getMetricValue('myapp_http_requests_total');

// Wait for metric value
await metricsHelper.waitForMetricValue('myapp_http_requests_total', 5);

// Verify custom prefix
await metricsHelper.hasCustomPrefix('myapp_');

// Verify custom labels
await metricsHelper.hasCustomLabels({ env: 'production' });
```

## 🔍 Debugging Tests

### Enable Debug Mode
```bash
npm run test:e2e:debug
```

### View Detailed Logs
```bash
DEBUG=pw:api npm run test:e2e
```

### Generate Test Report
```bash
npm run test:e2e:report
```

### Take Screenshots on Failure
Screenshots are automatically captured on test failures and saved to `test-results/`.

## 📝 Adding New Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { createMetricsHelper } from './utils/metrics-helper';

test.describe('New Feature', () => {
  test('should work correctly', async ({ page }) => {
    const metricsHelper = createMetricsHelper(page);
    
    // Your test logic here
    await page.goto('/test-page');
    
    // Verify metrics
    await metricsHelper.hasMetric('expected_metric');
  });
});
```

### Best Practices
1. **Use descriptive test names** that explain the expected behavior
2. **Group related tests** using `test.describe()`
3. **Use the MetricsHelper** for common metrics operations
4. **Add appropriate waits** for async operations
5. **Test both success and failure scenarios**
6. **Validate metrics format and content**

## 🚨 Common Issues

### Server Not Starting
- Ensure `npm run dev` works manually
- Check port 4321 is available
- Verify all dependencies are installed

### Metrics Not Found
- Wait for metrics collection (use `waitForTimeout`)
- Check integration is properly configured
- Verify metrics endpoint is accessible

### Test Timeouts
- Increase timeout in Playwright config
- Add explicit waits for async operations
- Check for long-running operations

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Astro Testing Guide](https://docs.astro.build/en/guides/testing/)
- [Prometheus Metrics Format](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [Integration Testing Best Practices](https://playwright.dev/docs/best-practices)
