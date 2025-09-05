#!/bin/bash

# E2E Test Runner for Astro Prometheus Integration
# This script builds the packages and runs Playwright tests against the preview server

set -e

echo "🚀 Starting E2E Tests for Astro Prometheus Integration"
echo "=================================================="

# Check if we're in the playground directory
if [ ! -f "package.json" ] || [ ! -d "e2e" ]; then
    echo "❌ Error: Please run this script from the playground directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected: playground/"
    exit 1
fi

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available. Please install Node.js and npm."
    exit 1
fi

# Check if Playwright browsers are installed
if [ ! -d "node_modules/.cache/ms-playwright" ]; then
    echo "📦 Installing Playwright browsers..."
    npx playwright install
fi

echo ""
echo "🔨 Building packages..."
echo "======================"

# Build the integration package first
echo "📦 Building astro-prometheus-node-integration..."
cd ../packages/astro-prometheus-node-integration
if ! pnpm build; then
    echo "❌ Failed to build astro-prometheus-node-integration"
    exit 1
fi
cd ../../playground

# Build the playground
echo "🏗️  Building playground..."
if ! pnpm build; then
    echo "❌ Failed to build playground"
    exit 1
fi

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "🧪 Running E2E Tests against preview server..."
echo "============================================="

# Run the tests (Playwright will automatically start the preview server)
if npm run test:e2e; then
    echo ""
    echo "🎉 All tests passed!"
    echo ""
    echo "📊 To view the test report:"
    echo "   npm run test:e2e:report"
    echo ""
    echo "🔍 To run tests interactively:"
    echo "   npm run test:e2e:ui"
    echo ""
    echo "🐛 To run tests in debug mode:"
    echo "   npm run test:e2e:debug"
    echo ""
    echo "🚀 To rebuild and test again:"
    echo "   npm run test:e2e:build"
else
    echo ""
    echo "❌ Some tests failed!"
    echo ""
    echo "🔍 To debug failures:"
    echo "   npm run test:e2e:debug"
    echo ""
    echo "📊 To view detailed report:"
    echo "   npm run test:e2e:report"
    echo ""
    echo "💡 Common issues:"
    echo "   - Check that both packages built successfully"
    echo "   - Verify integration is properly configured"
    echo "   - Check browser console for errors"
    echo "   - Ensure port 4321 is available for preview server"
    exit 1
fi
