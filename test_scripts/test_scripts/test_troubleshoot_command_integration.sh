#!/bin/bash
# test_scripts/test_troubleshoot_command_integration.sh
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/troubleshoot_integration_test_$(date +%Y%m%d_%H%M%S).log"
CLI_ENTRY_POINT="$REPO_ROOT/index.ts"
echo "--- Starting Troubleshoot Command Integration Test ---" | tee "$LOG_FILE"
cd "$REPO_ROOT" || exit 1
EXEC_OUTPUT=$(bun run "$CLI_ENTRY_POINT" -- troubleshoot "500 Internal Server Error" --type deployment 2>&1)
echo "$EXEC_OUTPUT" | tee -a "$LOG_FILE"
if grep -q "Troubleshooting '500 Internal Server Error'" <<< "$EXEC_OUTPUT" && grep -q "Proposed Solution" <<< "$EXEC_OUTPUT"; then
    echo "✅ TEST PASSED" | tee -a "$LOG_FILE"
    exit 0
else
    echo "🔴 TEST FAILED" | tee -a "$LOG_FILE"
    exit 1
fi
