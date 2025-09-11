# 🚀 Comprehensive CI/CD Pipeline with E2E Testing

This project includes a robust CI/CD pipeline that runs comprehensive Playwright e2e tests for both **Prometheus** and **OpenTelemetry** integrations, ensuring production-ready functionality.

## 📋 **Available Workflows**

### **1. CI Workflow** (`.github/workflows/ci.yml`)
- **Triggers**: Push to `main`/`develop` branches
- **Jobs**: Lint → Build & Unit Tests → E2E Tests (Prometheus + OpenTelemetry)
- **Features**: Full pipeline for main branch protection

### **2. PR Validation Workflow** (`.github/workflows/pr-validation.yml`)
- **Triggers**: Pull requests to `main`/`develop`
- **Jobs**: Quick Validation → E2E Tests → PR Comments
- **Features**: Fast feedback with automatic PR status updates

## 🔄 **CI Pipeline Flow**

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐    ┌─────────────┐
│   Lint     │───▶│ Build & Unit     │───▶│ Prometheus  │───▶│ OpenTelemetry│
│            │    │ Tests            │    │ E2E Tests  │    │ E2E Tests  │
└─────────────┘    └──────────────────┘    └─────────────┘    └─────────────┘
```

### **Job Dependencies**
- **Lint** → **Build & Unit Tests** → **E2E Tests (Parallel)**
- Each job waits for the previous to complete successfully
- E2E tests run in parallel for efficiency

## 🧪 **E2E Testing Coverage**

### **Prometheus Integration** (`/playgrounds/prometheus/`)
- ✅ **OpenMetrics Format**: Validates proper OpenMetrics output
- ✅ **Integration Functionality**: Tests middleware and metrics collection
- ✅ **Standalone Metrics**: Verifies standalone metrics server
- ✅ **Custom Configuration**: Tests prefix, labels, and endpoints
- ✅ **Performance**: Validates caching and optimization

### **OpenTelemetry Integration** (`/playgrounds/otel/`)
- ✅ **Prometheus Preset**: Tests metrics endpoint (port 8080)
- ✅ **HTTP Mock-Server**: Direct data verification via HTTP OTLP
- ✅ **gRPC Mock-Server**: Protocol verification (expects no HTTP data)
- ✅ **Error Handling**: 404/500 error scenarios
- ✅ **Performance**: Request duration and concurrent handling

### **Test Types by Reliability**

#### **🟢 CI-Ready Tests (Always Run)**
```bash
# Prometheus - All tests reliable
pnpm test:e2e:prometheus

# OpenTelemetry - Mock-server tests with single worker
pnpm test:e2e:http:mock-server  # --workers=1
pnpm test:e2e:grpc:mock-server  # --workers=1
```

#### **🟡 Local Development Tests (Skip in CI)**
```bash
# Docker-dependent tests (require Docker)
pnpm test:e2e:http  # Requires Docker collector
pnpm test:e2e:grpc  # Requires Docker collector

# Mock tests with multiple workers (port conflicts)
pnpm test:e2e:http:mock  # Multiple workers
pnpm test:e2e:grpc:mock  # Multiple workers
```

## 🏗️ **Build Process in CI**

### **1. Package Builds**
```bash
# Build both integration packages
pnpm build:all
```

### **2. E2E Test Execution**
```bash
# Prometheus tests
cd playgrounds/prometheus && pnpm test:e2e:ci

# OpenTelemetry tests  
cd playgrounds/otel && pnpm test:e2e:ci
```

### **3. Browser Installation**
```bash
npx playwright install --with-deps
```

## 📊 **CI Features**

### **Artifact Uploads**
- **Test Results**: Screenshots, videos, traces
- **Playwright Reports**: HTML reports for debugging
- **Retention**: 30 days for all artifacts

### **PR Comments** (PR Validation Workflow)
- **Success**: ✅ E2E Tests Passed with coverage summary
- **Failure**: ❌ E2E Tests Failed with specific details
- **Links**: Direct links to workflow runs and artifacts

### **Caching Strategy**
- **PNPM**: Lockfile and dependencies
- **Node**: Version and setup
- **Playwright**: Browser binaries
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
# Run reliable e2e tests locally
pnpm test:e2e:prometheus
pnpm test:e2e:http:mock-server
pnpm test:e2e:grpc:mock-server
```

### **Full Test Suite (Local Only)**
```bash
# Requires Docker for full coverage
pnpm test:e2e:prometheus:all
pnpm test:e2e:otel:all
```

### **CI Simulation**
```bash
# Test the complete CI workflow locally
pnpm lint
pnpm build:all
pnpm test:e2e:prometheus
pnpm test:e2e:otel
```

## 📈 **Performance Optimizations**

### **Parallel Execution**
- **Lint**: Independent job
- **Build & Tests**: Sequential (required dependencies)
- **E2E Tests**: Parallel execution where possible

### **Timeout Management**
- **Overall**: 15 minutes for e2e tests
- **Individual Steps**: Appropriate timeouts
- **Failure Handling**: Graceful degradation

### **Worker Configuration**
- **Mock-Server Tests**: `--workers=1` (prevents port conflicts)
- **Other Tests**: Default workers for speed
- **CI Environment**: Optimized for reliability

## 🎯 **CI/CD Benefits**

### **Quality Assurance**
- **Automated Testing**: No manual testing required
- **Regression Prevention**: Catches breaking changes
- **Multi-Integration Coverage**: Both Prometheus and OpenTelemetry

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
- **Playwright Reports**: HTML report with details
- **Failure Analysis**: Screenshots and videos

### **Log Analysis**
- **Step-by-step**: Detailed execution logs
- **Error Messages**: Clear failure descriptions
- **Debug Information**: Environment and setup details

## 🚀 **Getting Started**

### **1. Push Changes**
```bash
git add .
git commit -m "Add comprehensive e2e testing to CI"
git push origin feature/e2e-ci
```

### **2. Create PR**
- PR validation workflow will automatically trigger
- E2E tests will run against built packages
- Results will be posted to PR

### **3. Monitor Progress**
- Check GitHub Actions tab
- Review test results and artifacts
- Address any failures before merging

## 📚 **Test Scripts Reference**

### **Root Package Scripts**
```bash
pnpm test:e2e                    # Run all reliable tests
pnpm test:e2e:prometheus         # Prometheus tests only
pnpm test:e2e:otel              # OpenTelemetry tests only
pnpm test:e2e:build             # Build + test
```

### **Prometheus Playground Scripts**
```bash
pnpm test:e2e:ci                # CI-safe tests
pnpm test:e2e:all               # All tests (local)
pnpm test:e2e:openmetrics       # OpenMetrics format
pnpm test:e2e:integration       # Integration functionality
pnpm test:e2e:standalone        # Standalone metrics
```

### **OpenTelemetry Playground Scripts**
```bash
pnpm test:e2e:ci                # CI-safe tests (prometheus + mock-server)
pnpm test:e2e:prometheus        # Prometheus preset
pnpm test:e2e:http:mock-server  # HTTP mock-server (--workers=1)
pnpm test:e2e:grpc:mock-server  # gRPC mock-server (--workers=1)
pnpm test:e2e:all-presets       # All preset tests
```

## 📚 **Additional Resources**

- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [GitHub Actions Guide](https://docs.github.com/en/actions)
- [Astro Testing Guide](https://docs.astro.build/en/guides/testing/)
- [PNPM Workspace CI](https://pnpm.io/workspaces#ci)
- [OpenTelemetry Testing](https://opentelemetry.io/docs/instrumentation/js/testing/)

---

**🎯 Your Astro Prometheus and OpenTelemetry integrations now have comprehensive CI/CD with reliable e2e testing!**

## 🏆 **Test Coverage Summary**

| Integration | Test Type | CI Status | Coverage |
|-------------|-----------|-----------|----------|
| **Prometheus** | OpenMetrics | ✅ Reliable | Format validation, integration, standalone |
| **Prometheus** | Integration | ✅ Reliable | Middleware, metrics collection, configuration |
| **Prometheus** | Standalone | ✅ Reliable | Standalone metrics server |
| **OpenTelemetry** | Prometheus Preset | ✅ Reliable | Metrics endpoint (port 8080) |
| **OpenTelemetry** | HTTP Mock-Server | ✅ Reliable | Direct data verification |
| **OpenTelemetry** | gRPC Mock-Server | ✅ Reliable | Protocol verification |
| **OpenTelemetry** | Docker HTTP | 🟡 Local Only | Requires Docker collector |
| **OpenTelemetry** | Docker gRPC | 🟡 Local Only | Requires Docker collector |