#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_analyze_command_integration.sh
# An integration test for the generated 'analyze' command.

# --- CONFIGURATION ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/analyze_integration_test_$(date +%Y%m%d_%H%M%S).log"
TARGET_PROJECT="$REPO_ROOT/test_fixtures/sample_project"
COMMAND_FILE="$REPO_ROOT/src/commands/analyze.ts"
CLI_ENTRY_POINT="$REPO_ROOT/index.ts"

# --- UTILITY FUNCTIONS ---
log() {
    echo "[$(date +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# --- SCRIPT START ---
echo "--- Starting Analyze Command Integration Test ---" | tee "$LOG_FILE"
cd "$REPO_ROOT" || exit 1

# 1. Prerequisite Check
log "STEP 1: Checking prerequisites..."
if [ ! -f "$COMMAND_FILE" ]; then
    log "🔴 TEST FAILED: Command file '$COMMAND_FILE' not found. Please run the 'import' pipeline first."
    exit 1
fi
log "✅ Prerequisite check passed."

# 2. Execute the command
log "STEP 2: Executing the analyze command..."
# We use bun to directly run the CLI entry point and pass arguments to it
# The '--' separates arguments for bun from arguments for the script
EXEC_OUTPUT=$(bun run "$CLI_ENTRY_POINT" -- analyze "$TARGET_PROJECT" 2>&1)
EXEC_EXIT_CODE=$?

log "Full output from command execution:"
echo "$EXEC_OUTPUT" | tee -a "$LOG_FILE"

if [ $EXEC_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: Command exited with a non-zero exit code: $EXEC_EXIT_CODE."
    exit 1
fi
log "✅ Command executed successfully."

# 3. Verify the output
log "STEP 3: Verifying the output..."
# Check for key phrases in the new, functional output
grep -q "Analysis Report" <<< "$EXEC_OUTPUT" && \
grep -q "Found 2 files to analyze" <<< "$EXEC_OUTPUT" && \
grep -q "Recommendations:" <<< "$EXEC_OUTPUT"
VERIFY_EXIT_CODE=$?

if [ $VERIFY_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: The output did not contain the expected analysis report structure."
    exit 1
fi
log "✅ TEST PASSED: The command produced a valid analysis report."
log "--- Test Finished ---"
exit 0
