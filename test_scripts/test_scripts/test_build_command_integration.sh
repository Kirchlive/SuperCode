#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_build_command_integration.sh
# An integration test for the generated 'build' command.

# --- CONFIGURATION ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/build_integration_test_$(date +%Y%m%d_%H%M%S).log"
TARGET_PROJECT="$REPO_ROOT/test_fixtures/sample_project"
CLI_ENTRY_POINT="$REPO_ROOT/index.ts"

# --- UTILITY FUNCTIONS ---
log() {
    echo "[$(date +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# --- SCRIPT START ---
echo "--- Starting Build Command Integration Test ---" | tee "$LOG_FILE"
cd "$REPO_ROOT" || exit 1

# 1. Execute the command with options
log "STEP 1: Executing the build command with --clean and --optimize..."
EXEC_OUTPUT=$(bun run "$CLI_ENTRY_POINT" -- build "$TARGET_PROJECT" --clean --optimize 2>&1)
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
# Check for key phrases from the simulated build process
grep -q "Cleaning build artifacts..." <<< "$EXEC_OUTPUT" && \
grep -q "Applying optimizations..." <<< "$EXEC_OUTPUT" && \
grep -q "Build successful!" <<< "$EXEC_OUTPUT"
VERIFY_EXIT_CODE=$?

if [ $VERIFY_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: The output did not contain the expected build process messages."
    exit 1
fi
log "✅ TEST PASSED: The command produced a valid build report."
log "--- Test Finished ---"
exit 0
