# 🚀 CI Quick Reference

## 📋 **Workflow Overview**

| Workflow | Trigger | Purpose | Jobs |
|----------|---------|---------|------|
| **CI** | Push to main/develop | Full pipeline | Lint → Build → E2E |
| **Build** | PR to main/develop | PR validation | Build → E2E |

## ⚡ **Quick Commands**

### **Local Testing (Pre-commit)**
```bash
# Run complete CI locally
pnpm lint
pnpm --filter astro-prometheus-node-integration build
pnpm --filter astro-prometheus-node-integration test -- --run
cd playground && npm run test:e2e:build
```

### **E2E Testing Only**
```bash
cd playground
npm run test:e2e:build
```

## 🔄 **CI Pipeline Steps**

### **1. Lint Job**
- ✅ Biome code quality checks
- ✅ Runs on all code changes
- ✅ Fast feedback (< 1 minute)

### **2. Build & Unit Tests**
- ✅ Builds integration package
- ✅ Runs unit tests with Vitest
- ✅ Ensures core functionality works

### **3. E2E Tests**
- ✅ Builds playground application
- ✅ Installs Playwright browsers
- ✅ Runs comprehensive e2e tests
- ✅ Tests against built/preview version

## 📊 **Test Coverage**

### **What Gets Tested**
- ✅ Metrics endpoint (`/_/metrics`)
- ✅ Custom prefix and labels
- ✅ HTTP methods (GET/POST)
- ✅ Form submission handling
- ✅ Error responses (500/404)
- ✅ Performance optimization
- ✅ Integration configuration

### **Test Environment**
- **OS**: Ubuntu Latest
- **Node**: 22.18.0
- **Browser**: Chromium (Playwright)
- **Server**: Astro Preview (production build)

## 🚨 **Failure Handling**

### **Test Failures**
- **Screenshots**: Auto-captured
- **Videos**: Recorded for debugging
- **Traces**: Generated for analysis
- **Artifacts**: Available for download

### **Build Failures**
- **Early Exit**: Prevents unnecessary e2e tests
- **Clear Messages**: Specific failure points
- **Dependency Chain**: Proper execution order

## 🔍 **Debugging CI Issues**

### **Local Reproduction**
```bash
# Simulate CI environment
cd playground
npm run test:e2e:build
```

### **Artifact Analysis**
- Download test results from GitHub Actions
- View Playwright HTML report
- Analyze screenshots and videos

### **Common Issues**
- **Build Failures**: Check package dependencies
- **Test Timeouts**: Increase timeouts or optimize tests
- **Browser Issues**: Verify Playwright installation

## 📈 **Performance Tips**

### **CI Optimization**
- **Caching**: PNPM and Node caching enabled
- **Parallel Jobs**: Independent jobs run in parallel
- **Artifact Retention**: 30 days for debugging

### **Local Development**
- **Pre-commit**: Run tests before pushing
- **Fast Feedback**: Use `npm run test:e2e` for quick tests
- **Debug Mode**: Use `npm run test:e2e:debug` for troubleshooting

## 🎯 **CI/CD Benefits**

### **Quality Assurance**
- **Automated Testing**: No manual testing required
- **Regression Prevention**: Catches breaking changes
- **Performance Validation**: Ensures optimization works

### **Developer Experience**
- **Fast Feedback**: Quick test results
- **Rich Artifacts**: Comprehensive debugging info
- **PR Integration**: Automatic status updates

## 🚀 **Getting Started**

### **1. Push Changes**
```bash
git add .
git commit -m "Add feature with e2e tests"
git push origin feature/new-feature
```

### **2. Monitor CI**
- Check GitHub Actions tab
- Review test results
- Download artifacts if needed

### **3. Address Issues**
- Fix any test failures
- Update tests if needed
- Re-run CI pipeline

---

**🎯 Your streamlined CI pipeline provides enterprise-grade quality assurance with comprehensive e2e testing!**
