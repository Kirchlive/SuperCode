#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_task_management_logic.sh
#
# This integration test verifies that the 'task' command correctly simulates
# an interaction with the todowrite tool.

# --- Configuration ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
COMMAND_TO_RUN="bun run src/commands/task.ts"
LOG_FILE="$REPO_ROOT/test_results/test_task_management_logic.log"

# Expected output from the mocked tool call
EXPECTED_TOOL_CALL_SNIPPET="[Task Manager] Calling todowrite tool with tasks:"

# --- Setup ---
rm -f "$LOG_FILE"
cd "$REPO_ROOT" || exit 1

if [ ! -f "src/commands/task.ts" ]; then
    echo "❌ FAILED: Test target src/commands/task.ts not found." | tee -a "$LOG_FILE"
    exit 1
fi

echo "--- Test: 'task' command tool interaction ---" > "$LOG_FILE"
USER_INPUT="refactor the auth service"
echo "Running command: $COMMAND_TO_RUN task $USER_INPUT" >> "$LOG_FILE"

# --- Execution ---
# Pass arguments as separate words to yargs
$COMMAND_TO_RUN task $USER_INPUT >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

# --- Validation ---
PASSED=false
if [ $EXIT_CODE -eq 0 ] && grep -Fq "$EXPECTED_TOOL_CALL_SNIPPET" "$LOG_FILE"; then
    PASSED=true
fi

# --- Report ---
echo "" >> "$LOG_FILE"
echo "--- Result ---" >> "$LOG_FILE"
if [ "$PASSED" = true ]; then
    echo "✅ PASSED" >> "$LOG_FILE"
    echo "✅ Test PASSED. Full log: $LOG_FILE"
    exit 0
else
    echo "❌ FAILED" >> "$LOG_FILE"
    echo "❌ Test FAILED. Full log: $LOG_FILE"
    exit 1
fi
