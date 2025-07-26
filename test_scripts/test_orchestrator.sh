#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_orchestrator.sh
# An end-to-end test for the main orchestration script.

# --- CONFIGURATION ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/orchestrator_test_$(date +%Y%m%d_%H%M%S).log"
COMMANDS_DIR="$REPO_ROOT/src/commands"
CORE_LOGIC_DIR="$REPO_ROOT/src/core-generated"

# --- UTILITY FUNCTIONS ---
log() {
    echo "[$(date +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# --- SCRIPT START ---
echo "--- Starting Orchestrator End-to-End Test ---" | tee "$LOG_FILE"
cd "$REPO_ROOT" || exit 1

# 1. Clean up previous run
log "STEP 1: Cleaning up previous generated files..."
rm -f "$COMMANDS_DIR"/*.ts
rm -f "$CORE_LOGIC_DIR"/*.ts
log "Cleanup complete."

# 2. Run the main import script
log "STEP 2: Running 'bun run import'..."
BUN_OUTPUT=$(bun run import 2>&1)
BUN_EXIT_CODE=$?

log "Full output from 'bun run import':"
echo "$BUN_OUTPUT" | tee -a "$LOG_FILE"

if [ $BUN_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: 'bun run import' exited with error code $BUN_EXIT_CODE."
    exit 1
fi
log "✅ 'bun run import' executed successfully."

# 3. Verify the output
log "STEP 3: Verifying the output..."
NUM_COMMAND_FILES=$(ls -1 "$COMMANDS_DIR"/*.ts 2>/dev/null | wc -l | tr -d ' ')
log "Found $NUM_COMMAND_FILES generated command files."

if [ "$NUM_COMMAND_FILES" -lt 1 ]; then
    log "🔴 TEST FAILED: No command files were generated."
    exit 1
fi

# Only check for core logic files if the source directory exists and is not empty
SOURCE_CORE_DIR="$REPO_ROOT/external/superclaude/SuperClaude/Core"
if [ -d "$SOURCE_CORE_DIR" ] && [ -n "$(ls -A $SOURCE_CORE_DIR)" ]; then
    log "Source core logic directory found. Verifying generated core logic files..."
    NUM_CORE_FILES=$(ls -1 "$CORE_LOGIC_DIR"/*.ts 2>/dev/null | wc -l | tr -d ' ')
    log "Found $NUM_CORE_FILES generated core logic files."

    if [ "$NUM_CORE_FILES" -lt 1 ]; then
        log "🔴 TEST FAILED: No core logic files were generated, even though source files exist."
        exit 1
    fi
else
    log "✅ SKIPPED: Source core logic directory not found or empty. Skipping verification of generated core logic files."
fi

log "✅ TEST PASSED: All parts of the pipeline generated output successfully."
log "--- Test Finished ---"
exit 0
