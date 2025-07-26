#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_design_command_integration.sh
# An integration test for the generated 'design' command.

# --- CONFIGURATION ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/design_integration_test_$(date +%Y%m%d_%H%M%S).log"
CLI_ENTRY_POINT="$REPO_ROOT/index.ts"

# --- UTILITY FUNCTIONS ---
log() {
    echo "[$(date +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# --- SCRIPT START ---
echo "--- Starting Design Command Integration Test ---" | tee "$LOG_FILE"
cd "$REPO_ROOT" || exit 1

# 1. Execute the command
log "STEP 1: Executing the design command..."
EXEC_OUTPUT=$(bun run "$CLI_ENTRY_POINT" -- design "NewAuthService" --type api 2>&1)
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
# Check for key phrases from the simulated design process
grep -q "Design Specification for 'NewAuthService'" <<< "$EXEC_OUTPUT" && \
grep -q "Format: spec" <<< "$EXEC_OUTPUT" && \
grep -q "via REST API" <<< "$EXEC_OUTPUT"
VERIFY_EXIT_CODE=$?

if [ $VERIFY_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: The output did not contain the expected design specification."
    exit 1
fi
log "✅ TEST PASSED: The command produced a valid design specification."
log "--- Test Finished ---"
exit 0
