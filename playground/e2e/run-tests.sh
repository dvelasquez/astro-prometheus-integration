#!/bin/bash

# E2E Test Runner for Astro Prometheus Integration
# This script sets up the environment and runs the Playwright tests

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

# Check if the dev server is running
echo "🔍 Checking if dev server is running on port 4321..."
if ! curl -s http://localhost:4321 > /dev/null 2>&1; then
    echo "⚠️  Warning: Dev server is not running on port 4321"
    echo "   Please start it with: npm run dev"
    echo "   Then run the tests in another terminal"
    echo ""
    echo "   Or let Playwright start it automatically (recommended)"
    echo ""
    read -p "Continue with tests? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Tests cancelled"
        exit 1
    fi
else
    echo "✅ Dev server is running"
fi

echo ""
echo "🧪 Running E2E Tests..."
echo "========================"

# Run the tests
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
    echo "   - Ensure dev server is running (npm run dev)"
    echo "   - Check that integration is properly configured"
    echo "   - Verify metrics endpoint is accessible"
    echo "   - Check browser console for errors"
    exit 1
fi
