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

# 1. Prepare test environment
log "STEP 1: Preparing test environment..."
# Clean up previous run
rm -f "$COMMANDS_DIR"/*.ts
rm -f "$CORE_LOGIC_DIR"/*.ts
# Create a fake source logic directory and file for the test
FAKE_SOURCE_CORE_DIR="$REPO_ROOT/scripts/pipeline/temp_core_source"
mkdir -p "$FAKE_SOURCE_CORE_DIR"
FAKE_LOGIC_SOURCE="$FAKE_SOURCE_CORE_DIR/analyze.py"
echo "# Fake analyze.py for testing" > "$FAKE_LOGIC_SOURCE"
echo "print('SIMULATED transpilation')" >> "$FAKE_LOGIC_SOURCE"
log "Created fake analyze.py source file in a temporary directory."

# Temporarily modify the map-logic.ts to use our fake source directory
sed -i.bak "s|external/superclaude/SuperClaude/Core|scripts/pipeline/temp_core_source|g" "$REPO_ROOT/scripts/pipeline/map-logic.ts"

# 2. Run the main import script
log "STEP 2: Running 'bun run import'..."
BUN_OUTPUT=$(bun run import 2>&1)
BUN_EXIT_CODE=$?

# Clean up the fake directory and restore the original script immediately
rm -rf "$FAKE_SOURCE_CORE_DIR"
mv "$REPO_ROOT/scripts/pipeline/map-logic.ts.bak" "$REPO_ROOT/scripts/pipeline/map-logic.ts"

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

# Verify Logic Injection
log "Verifying logic injection..."
TARGET_COMMAND_FILE="$COMMANDS_DIR/analyze.ts"
if grep -q "// TODO:" "$TARGET_COMMAND_FILE"; then
    log "🔴 TEST FAILED: The TODO marker was not removed from the command file."
    exit 1
fi
if ! grep -q "SIMULATED transpilation" "$TARGET_COMMAND_FILE"; then
    log "🔴 TEST FAILED: The simulated logic was not injected into the command file."
    exit 1
fi
log "✅ Logic injection verified successfully."
else
    log "✅ SKIPPED: Source core logic directory not found or empty."
fi

log "✅ TEST PASSED: All parts of the pipeline generated the correct number of files."
log "--- Test Finished ---"
exit 0
