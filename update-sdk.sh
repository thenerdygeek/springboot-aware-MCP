#!/bin/bash

# Update @modelcontextprotocol/sdk to fix security vulnerability
# From: 0.5.0 → To: 1.24.3

set -e

echo "🔒 MCP SDK Security Update Script"
echo "=================================="
echo ""
echo "Current version: @modelcontextprotocol/sdk@0.5.0"
echo "Target version:  @modelcontextprotocol/sdk@^1.24.3"
echo ""

# Confirm
read -p "Do you want to proceed with the update? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Update cancelled"
    exit 1
fi

echo ""
echo "📦 Step 1: Updating package.json files..."

# Update micro-context
echo "  → packages/micro-context/package.json"
sed -i.bak 's/"@modelcontextprotocol\/sdk": "\^0\.5\.0"/"@modelcontextprotocol\/sdk": "^1.24.3"/' packages/micro-context/package.json

# Update macro-context
echo "  → packages/macro-context/package.json"
sed -i.bak 's/"@modelcontextprotocol\/sdk": "\^0\.5\.0"/"@modelcontextprotocol\/sdk": "^1.24.3"/' packages/macro-context/package.json

# Update spring-component
echo "  → packages/spring-component/package.json"
sed -i.bak 's/"@modelcontextprotocol\/sdk": "\^0\.5\.0"/"@modelcontextprotocol\/sdk": "^1.24.3"/' packages/spring-component/package.json

echo "✅ package.json files updated"
echo ""

echo "🧹 Step 2: Cleaning node_modules..."
rm -rf node_modules
rm -f package-lock.json
echo "✅ Cleaned"
echo ""

echo "📥 Step 3: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

echo "🔨 Step 4: Building packages..."
npm run build
echo "✅ Build complete"
echo ""

echo "🧪 Step 5: Running tests..."
if [ -f "./run-tests.sh" ]; then
    ./run-tests.sh test-spring-project
else
    echo "⚠️  Test script not found, skipping tests"
fi
echo ""

echo "🔍 Step 6: Verifying security audit..."
npm audit
echo ""

echo "✅ Update complete!"
echo ""
echo "📋 Verification checklist:"
echo "  □ All packages built successfully"
echo "  □ Tests passing (if run)"
echo "  □ No npm audit warnings"
echo ""
echo "Next steps:"
echo "  1. Test the servers manually"
echo "  2. Verify all tools work correctly"
echo "  3. Check logs are created properly"
echo ""
echo "If you encounter issues, see: docs/SECURITY_UPDATE_GUIDE.md"
