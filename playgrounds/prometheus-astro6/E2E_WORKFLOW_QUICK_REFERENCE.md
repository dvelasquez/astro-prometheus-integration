# 🚀 E2E Testing Workflow - Quick Reference

## ⚡ **One-Command Testing (Recommended)**

```bash
cd playground
npm run test:e2e:build
```

This command:
1. ✅ Builds `astro-prometheus-node-integration` package
2. ✅ Builds playground application  
3. ✅ Starts preview server
4. ✅ Runs all e2e tests
5. ✅ Cleans up automatically

## 🔧 **Manual Workflow**

```bash
# 1. Build integration package
cd ../packages/astro-prometheus-node-integration
pnpm build

# 2. Build playground
cd ../../playground  
pnpm build

# 3. Run e2e tests (Playwright auto-starts preview server)
npm run test:e2e
```

## 📋 **Available Commands**

| Command | Description |
|---------|-------------|
| `npm run test:e2e:build` | **Build both packages + run tests** |
| `npm run test:e2e` | Run tests only (requires previous build) |
| `npm run test:e2e:ui` | Interactive testing with UI |
| `npm run test:e2e:headed` | Visible browser testing |
| `npm run test:e2e:debug` | Debug mode with breakpoints |
| `npm run test:e2e:report` | View test results report |
| `./e2e/run-tests.sh` | Shell script alternative |

## 🎯 **What Gets Tested**

- ✅ **Metrics Endpoint**: `/_/metrics` accessibility and format
- ✅ **Custom Prefix**: `myapp_` prefix on all metrics
- ✅ **Custom Labels**: `env=production`, `version=1.0.0`, `hostname=myapp.com`
- ✅ **HTTP Methods**: GET and POST request handling
- ✅ **Form Submission**: POST form processing and metrics collection
- ✅ **Error Handling**: 500 errors, 404s, proper status recording
- ✅ **Performance**: Caching verification, no expensive operations per request
- ✅ **Integration**: Configuration validation, custom URL support

## 🏗️ **Build Process**

1. **Integration Package** → `pnpm build` in `packages/astro-prometheus-node-integration`
2. **Playground** → `pnpm build` in `playground`  
3. **Preview Server** → `npm run preview` (auto-started by Playwright)
4. **E2E Tests** → Run against `http://localhost:4321`

## 🚨 **Troubleshooting**

### **Build Fails**
```bash
# Check integration package
cd ../packages/astro-prometheus-node-integration
pnpm build

# Check playground
cd ../../playground
pnpm build
```

### **Preview Server Issues**
- Ensure port 4321 is available
- Check `pnpm preview` works manually
- Verify both packages built successfully

### **Tests Fail**
```bash
# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report

# Check browser console for errors
```

## 📊 **Test Results**

- **Screenshots**: Auto-captured on failure
- **Videos**: Recorded on failure  
- **Traces**: Generated on retry
- **Reports**: HTML report with detailed results

## 🔄 **CI/CD Integration**

```yaml
# Example GitHub Actions workflow
- name: Build and Test
  run: |
    cd playground
    npm run test:e2e:build
```

---

**🎯 Your e2e tests now validate the complete build → preview → test workflow!**
