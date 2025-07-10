#!/bin/bash

# Script to run real-world tests with actual repositories

set -e

echo "🧪 Running SuperCode Real-World Tests"
echo "====================================="

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if repositories exist
if [ ! -d "../SuperClaude" ]; then
    echo "❌ Error: SuperClaude repository not found at ../SuperClaude"
    echo "   Please ensure SuperClaude is cloned in the parent directory"
    exit 1
fi

if [ ! -d "../OpenCode" ]; then
    echo "❌ Error: OpenCode repository not found at ../OpenCode"
    echo "   Please ensure OpenCode is cloned in the parent directory"
    exit 1
fi

echo "✅ Found repositories:"
echo "   - SuperClaude: $(realpath ../SuperClaude)"
echo "   - OpenCode: $(realpath ../OpenCode)"
echo ""

# Run tests with real repositories
echo "🔍 Running detection and transformation tests..."
RUN_REALWORLD_TEST=true go test -v ./cmd/supercode -run TestRealWorld -timeout 30s

echo ""
echo "✅ Real-world tests completed successfully!"