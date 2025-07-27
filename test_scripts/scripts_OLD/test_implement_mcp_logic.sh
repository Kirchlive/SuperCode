#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_implement_mcp_logic.sh
#
# This integration test verifies that the 'implement' command correctly uses the
# MCP client based on the active persona's preferences.

# --- Configuration ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
COMMAND_TO_RUN="bun run src/commands/implement.ts"
LOG_FILE="$REPO_ROOT/test_results/test_implement_mcp_logic.log"
PERSONA_ID="frontend"

# Expected output from the mocked MCP client
EXPECTED_MCP_CALL="[MCP Client] Calling Magic server"

# --- Setup ---
rm -f "$LOG_FILE"
cd "$REPO_ROOT" || exit 1

echo "--- Test: 'implement' command MCP integration ---" > "$LOG_FILE"
echo "Running command: $COMMAND_TO_RUN implement --persona $PERSONA_ID 'a login button'" >> "$LOG_FILE"

# --- Execution ---
# The `>> "$LOG_FILE" 2>&1` is crucial. It redirects both stdout and stderr
# of the command into our log file, making debugging reliable.
$COMMAND_TO_RUN implement --persona "$PERSONA_ID" "a login button" >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

# --- Validation ---
# The validation now runs directly on the comprehensive log file.
PASSED=false
if [ $EXIT_CODE -eq 0 ] && grep -Fq "$EXPECTED_MCP_CALL" "$LOG_FILE"; then
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
