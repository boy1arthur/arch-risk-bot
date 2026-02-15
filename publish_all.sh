#!/bin/bash
set -e

echo "🚀 ArchRisk Global Release Sequence Initiated..."

# 1. Verification
echo "🔍 Verifying Build..."
pnpm run build

# 2. Publish Engine
echo "📦 Publishing @archrisk/engine..."
cd packages/engine
npm publish --access public
cd ../..

# 3. Publish CLI
echo "📦 Publishing archrisk (CLI)..."
cd packages/cli
npm publish --access public
cd ../..

echo "✅ Global Release Complete!"
echo "   - Engine: v1.0.3"
echo "   - CLI:    v0.1.9"
echo ""
echo "👉 Don't forget to push the git tags!"
