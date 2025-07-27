#!/bin/bash
# test_scripts/test_task_command_integration.sh
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/task_integration_test_$(date +%Y%m%d_%H%M%S).log"
CLI_ENTRY_POINT="$REPO_ROOT/index.ts"
echo "--- Starting Task Command Integration Test ---" | tee "$LOG_FILE"
cd "$REPO_ROOT" || exit 1
EXEC_OUTPUT=$(bun run "$CLI_ENTRY_POINT" -- task execute "DEPLOY-PROD" --strategy agile 2>&1)
echo "$EXEC_OUTPUT" | tee -a "$LOG_FILE"
if grep -q "Performing action 'execute'" <<< "$EXEC_OUTPUT" && grep -q "Applying 'agile' strategy" <<< "$EXEC_OUTPUT"; then
    echo "✅ TEST PASSED" | tee -a "$LOG_FILE"
    exit 0
else
    echo "🔴 TEST FAILED" | tee -a "$LOG_FILE"
    exit 1
fi
