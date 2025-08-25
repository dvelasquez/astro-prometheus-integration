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
- ✅ Server functionality (when enabled)
- ✅ Fallback behavior (when disabled)
- ✅ Port configuration validation

### 3. **OpenMetrics Tests** (`openmetrics.spec.ts`)
- ✅ Content type handling
- ✅ Format validation
- ✅ Configuration switching

### 4. **Test Utilities** (`utils/metrics-helper.ts`)
- 🔧 Helper class for common testing patterns
- 🔧 Metric value extraction and validation
- 🔧 Custom prefix and label verification
- 🔧 Traffic generation for testing
- 🔧 Metrics endpoint validation

## 🚀 Running the Tests

### Prerequisites
1. **Build the packages** (required before testing):
   ```bash
   cd playground
   npm run build:all
   ```

2. **Install Playwright browsers** (if not already installed):
   ```bash
   npx playwright install
   ```

### Test Commands

#### Build and Run All E2E Tests (Recommended)
```bash
npm run test:e2e:build
```

#### Run Tests Only (requires previous build)
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

### Using the Test Runner Script
```bash
cd playground
./e2e/run-tests.sh
```

## 🔧 Test Configuration

### Playwright Config (`playwright.config.ts`)
- **Base URL**: `http://localhost:4321`
- **Web Server**: Automatically starts `npm run preview`
- **Browser**: Chromium (Chrome)
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On retry

### Test Environment
- **Port**: 4321 (Astro preview server)
- **Metrics Endpoint**: `/_/metrics`
- **Integration**: Enabled with custom prefix `myapp_`
- **Labels**: `env=production`, `version=1.0.0`, `hostname=myapp.com`

## 🏗️ Build Workflow

The e2e tests use a **build-first approach** for production-like testing:

### **1. Build Integration Package**
```bash
cd packages/astro-prometheus-node-integration
pnpm build
```

### **2. Build Playground**
```bash
cd playground
pnpm build
```

### **3. Start Preview Server**
```bash
pnpm preview
```

### **4. Run E2E Tests**
```bash
npm run test:e2e
```

### **Automated Workflow**
```bash
# Build both packages and run tests
npm run test:e2e:build

# Or use the shell script
./e2e/run-tests.sh
```

## 📊 Test Scenarios Covered

### **Metrics Endpoint Validation**
- HTTP 200 OK responses
- Prometheus text format
- Custom prefix application
- Custom labels presence
- Default Node.js metrics

### **Functionality Testing**
- Page navigation metrics
- HTTP method handling (GET/POST)
- Duration measurement
- Error response handling
- Performance optimization

### **Configuration Testing**
- Custom metrics URL
- Prefix application
- Label propagation
- Content type handling

## 🛠️ Advanced Features

### **MetricsHelper Class**
```typescript
import { createMetricsHelper } from './utils/metrics-helper';

const metricsHelper = createMetricsHelper(page);

// Check metric existence
await metricsHelper.hasMetric('myapp_http_requests_total');

// Get metric values
const value = await metricsHelper.getMetricValue('myapp_http_requests_total');

// Wait for specific values
await metricsHelper.waitForMetricValue('myapp_http_requests_total', 5);

// Verify configuration
await metricsHelper.hasCustomPrefix('myapp_');
await metricsHelper.hasCustomLabels({ env: 'production' });
```

### **Test Utilities**
- **Traffic Generation**: Create test data
- **Metric Validation**: Comprehensive checking
- **Error Handling**: Graceful failure handling
- **Performance Testing**: Caching verification

## 🎯 Key Benefits

1. **Production-Like Testing**: Tests against built/preview version
2. **Comprehensive Coverage**: Tests all integration features
3. **Real Browser Testing**: Actual user interactions
4. **Performance Validation**: Ensures optimization works
5. **Error Scenarios**: Tests failure modes
6. **Configuration Testing**: Validates all options
7. **Maintainable**: Well-structured, documented tests
8. **Debugging**: Rich debugging tools and reports

## 🚨 What This Tests

### **✅ Working Features**
- Metrics endpoint accessibility
- Custom prefix and labels
- Default metrics collection
- Page navigation tracking
- Error handling
- Performance optimization
- Configuration options
- Form submission handling (POST requests)

### **⚠️ Edge Cases**
- 404 errors
- 500 errors
- Different HTTP methods (GET/POST)
- Rapid page navigation
- Metrics consistency
- Content type handling

## 🔍 Debugging & Troubleshooting

### **Common Issues**
- **Build failures**: Check both packages build successfully
- **Preview server issues**: Ensure port 4321 is available
- **Metrics not found**: Wait for collection, check config
- **Test timeouts**: Increase timeouts, add explicit waits

### **Debug Commands**
```bash
# Interactive debugging
npm run test:e2e:debug

# Detailed logging
DEBUG=pw:api npm run test:e2e

# View reports
npm run test:e2e:report

# Rebuild and test
npm run test:e2e:build
```

## 📝 Adding New Tests

### **Test Structure**
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

### **Best Practices**
1. **Use descriptive test names** that explain the expected behavior
2. **Group related tests** using `test.describe()`
3. **Use the MetricsHelper** for common metrics operations
4. **Add appropriate waits** for async operations
5. **Test both success and failure scenarios**
6. **Validate metrics format and content**
7. **Test against built/preview version** for production-like behavior

## 🚀 Next Steps

1. **Build and test**: `npm run test:e2e:build`
2. **Explore the UI**: `npm run test:e2e:ui`
3. **Customize tests**: Add your specific use cases
4. **CI Integration**: Add to your build pipeline
5. **Expand coverage**: Add more specific scenarios

---

**🎯 Your Astro Prometheus integration now has enterprise-grade e2e testing against production builds!**
