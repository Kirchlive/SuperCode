#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_document_command_integration.sh
# An integration test for the generated 'document' command.

# --- CONFIGURATION ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/document_integration_test_$(date +%Y%m%d_%H%M%S).log"
CLI_ENTRY_POINT="$REPO_ROOT/index.ts"

# --- UTILITY FUNCTIONS ---
log() {
    echo "[$(date +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# --- SCRIPT START ---
echo "--- Starting Document Command Integration Test ---" | tee "$LOG_FILE"
cd "$REPO_ROOT" || exit 1

# 1. Execute the command
log "STEP 1: Executing the document command with --style detailed..."
EXEC_OUTPUT=$(bun run "$CLI_ENTRY_POINT" -- document "AuthService" --style detailed 2>&1)
EXEC_EXIT_CODE=$?

log "Full output from command execution:"
echo "$EXEC_OUTPUT" | tee -a "$LOG_FILE"

if [ $EXEC_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: Command exited with a non-zero exit code: $EXEC_EXIT_CODE."
    exit 1
fi
log "✅ Command executed successfully."

# 2. Verify the output
log "STEP 2: Verifying the output..."
# Check for key phrases from the simulated documentation process
grep -q "Documentation for 'AuthService' created" <<< "$EXEC_OUTPUT" && \
grep -q "Parameters" <<< "$EXEC_OUTPUT" && \
grep -q "user (string)" <<< "$EXEC_OUTPUT"
VERIFY_EXIT_CODE=$?

if [ $VERIFY_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: The output did not contain the expected detailed documentation."
    exit 1
fi
log "✅ TEST PASSED: The command produced a valid detailed documentation."
log "--- Test Finished ---"
exit 0
