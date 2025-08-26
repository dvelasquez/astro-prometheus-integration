# 🚀 CI/CD Setup with Playwright E2E Testing

This project now includes a streamlined CI/CD pipeline that runs Playwright e2e tests to ensure the Astro Prometheus integration works correctly in production-like environments.

## 📋 **Available Workflows**

### **1. CI Workflow** (`.github/workflows/ci.yml`)
- **Triggers**: Push to `main`/`develop` branches
- **Jobs**: Lint → Build & Unit Tests → E2E Tests
- **Features**: Full pipeline for main branch protection

### **2. Build Workflow** (`.github/workflows/build.yml`)
- **Triggers**: Pull requests to `main`/`develop`
- **Jobs**: Build & Unit Tests → E2E Tests
- **Features**: PR validation with feedback comments

## 🔄 **CI Pipeline Flow**

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Lint     │───▶│ Build & Unit     │───▶│ E2E Tests  │
│            │    │ Tests            │    │            │
└─────────────┘    └──────────────────┘    └─────────────┘
```

### **Job Dependencies**
- **Lint** → **Build & Unit Tests** → **E2E Tests**
- Each job waits for the previous to complete successfully
- Parallel execution where possible for efficiency

## 🧪 **E2E Testing in CI**

### **What Gets Tested**
- ✅ **Metrics Endpoint**: `/_/metrics` accessibility and format
- ✅ **Custom Configuration**: Prefix and labels application
- ✅ **HTTP Methods**: GET and POST request handling
- ✅ **Form Submission**: POST form processing
- ✅ **Error Handling**: 500 and 404 error responses
- ✅ **Performance**: Caching and optimization verification
- ✅ **Integration**: Complete end-to-end functionality

### **Test Environment**
- **OS**: Ubuntu Latest
- **Node**: 22.18.0
- **Package Manager**: PNPM
- **Browser**: Chromium (Playwright)
- **Server**: Astro Preview (built version)

## 🏗️ **Build Process in CI**

### **1. Integration Package Build**
```bash
cd packages/astro-prometheus-node-integration
pnpm build
```

### **2. Playground Build**
```bash
cd playground
pnpm build
```

### **3. Playwright Browser Installation**
```bash
npx playwright install --with-deps
```

### **4. E2E Test Execution**
```bash
npm run test:e2e -- --reporter=line
```

## 📊 **CI Features**

### **Artifact Uploads**
- **Test Results**: Screenshots, videos, traces
- **Playwright Report**: HTML report for debugging
- **Retention**: 30 days for all artifacts

### **PR Comments** (Build Workflow Only)
- **Success**: ✅ E2E Tests Passed message
- **Failure**: ❌ E2E Tests Failed with details
- **Links**: Direct links to workflow runs and artifacts

### **Caching**
- **PNPM**: Lockfile and dependencies
- **Node**: Version and setup
- **Efficiency**: Faster subsequent runs

## 🚨 **Failure Handling**

### **Test Failures**
- **Screenshots**: Auto-captured on failure
- **Videos**: Recorded for debugging
- **Traces**: Generated for retry analysis
- **Artifacts**: Available for download

### **Build Failures**
- **Early Exit**: Prevents unnecessary e2e tests
- **Clear Error Messages**: Specific failure points
- **Dependency Chain**: Ensures proper order

## 🔧 **Local Development**

### **Pre-commit Testing**
```bash
# Run e2e tests locally before pushing
cd playground
npm run test:e2e:build
```

### **CI Simulation**
```bash
# Test the complete CI workflow locally
pnpm lint
pnpm --filter astro-prometheus-node-integration build
pnpm --filter astro-prometheus-node-integration test -- --run
cd playground && npm run test:e2e:build
```

## 📈 **Performance Optimizations**

### **Parallel Execution**
- **Lint**: Independent job
- **Build & Tests**: Sequential (required dependencies)
- **E2E Tests**: Final validation

### **Caching Strategy**
- **PNPM**: Lockfile-based dependency caching
- **Node**: Version and setup caching
- **Artifacts**: Test results and reports

### **Timeout Management**
- **Overall**: 15 minutes for e2e tests
- **Individual Steps**: Appropriate timeouts
- **Failure Handling**: Graceful degradation

## 🎯 **CI/CD Benefits**

### **Quality Assurance**
- **Automated Testing**: No manual testing required
- **Regression Prevention**: Catches breaking changes
- **Performance Validation**: Ensures optimization works

### **Developer Experience**
- **Fast Feedback**: Quick test results
- **Rich Artifacts**: Screenshots, videos, traces
- **PR Integration**: Automatic status updates

### **Production Confidence**
- **Build Validation**: Ensures packages build correctly
- **Integration Testing**: Tests built packages together
- **Real Browser Testing**: Production-like environment

## 🔍 **Monitoring & Debugging**

### **Workflow Status**
- **GitHub Actions**: Real-time status updates
- **PR Checks**: Required status checks
- **Branch Protection**: Enforce CI passing

### **Artifact Access**
- **Test Results**: Download for local analysis
- **Playwright Report**: HTML report with details
- **Failure Analysis**: Screenshots and videos

### **Log Analysis**
- **Step-by-step**: Detailed execution logs
- **Error Messages**: Clear failure descriptions
- **Debug Information**: Environment and setup details

## 🚀 **Getting Started**

### **1. Push Changes**
```bash
git add .
git commit -m "Add Playwright e2e testing to CI"
git push origin feature/e2e-ci
```

### **2. Create PR**
- Build workflow will automatically trigger
- E2E tests will run against built packages
- Results will be posted to PR

### **3. Monitor Progress**
- Check GitHub Actions tab
- Review test results and artifacts
- Address any failures before merging

## 📚 **Additional Resources**

- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [GitHub Actions Guide](https://docs.github.com/en/actions)
- [Astro Testing Guide](https://docs.astro.build/en/guides/testing/)
- [PNPM Workspace CI](https://pnpm.io/workspaces#ci)

---

**🎯 Your Astro Prometheus integration now has streamlined CI/CD with comprehensive e2e testing!**
