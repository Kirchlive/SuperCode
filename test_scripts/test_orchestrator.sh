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

# Verify Command Files
SOURCE_COMMANDS_DIR="$REPO_ROOT/external/superclaude/SuperClaude/Commands"
EXPECTED_COMMAND_FILES=$(ls -1 "$SOURCE_COMMANDS_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
ACTUAL_COMMAND_FILES=$(ls -1 "$COMMANDS_DIR"/*.ts 2>/dev/null | wc -l | tr -d ' ')
log "Found $EXPECTED_COMMAND_FILES source command definitions, generated $ACTUAL_COMMAND_FILES TypeScript files."
if [ "$EXPECTED_COMMAND_FILES" -ne "$ACTUAL_COMMAND_FILES" ]; then
    log "🔴 TEST FAILED: Mismatch in command file count."
    exit 1
fi
log "✅ Command file count is correct."

# Verify Core Logic Files
SOURCE_CORE_DIR="$REPO_ROOT/external/superclaude/SuperClaude/Core"
if [ -d "$SOURCE_CORE_DIR" ] && [ -n "$(ls -A $SOURCE_CORE_DIR)" ]; then
    EXPECTED_CORE_FILES=$(find "$SOURCE_CORE_DIR" -name '*.py' | wc -l | tr -d ' ')
    ACTUAL_CORE_FILES=$(ls -1 "$CORE_LOGIC_DIR"/*.ts 2>/dev/null | wc -l | tr -d ' ')
    log "Found $EXPECTED_CORE_FILES source core logic files, generated $ACTUAL_CORE_FILES TypeScript files."
    if [ "$EXPECTED_CORE_FILES" -ne "$ACTUAL_CORE_FILES" ]; then
        log "🔴 TEST FAILED: Mismatch in core logic file count."
        exit 1
    fi
    log "✅ Core logic file count is correct."
else
    log "✅ SKIPPED: Source core logic directory not found or empty."
fi

log "✅ TEST PASSED: All parts of the pipeline generated the correct number of files."
log "--- Test Finished ---"
exit 0
