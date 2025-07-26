#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_command_generator.sh

# --- CONFIGURATION ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
OUTPUT_DIR="$REPO_ROOT/src/commands"
LOG_FILE="$REPO_ROOT/test_results/command_generator_test_$(date +%Y%m%d_%H%M%S).log"
SUBMODULE_COMMANDS_DIR="$REPO_ROOT/external/superclaude/SuperClaude/Commands"

# --- UTILITY FUNCTIONS ---
log() {
    echo "$(date +'%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# --- TEST EXECUTION ---
log "--- Starting Command Generator Test ---"

# 1. Clean up previous run
log "Cleaning up previous generated files..."
rm -f "$OUTPUT_DIR"/*.ts
log "Cleanup complete."

# 2. Run the generator script
log "Running the command generator script..."
cd "$REPO_ROOT"
bun run generate:commands >> "$LOG_FILE" 2>&1
GENERATOR_EXIT_CODE=$?

if [ $GENERATOR_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: Generator script exited with error code $GENERATOR_EXIT_CODE."
    exit 1
fi
log "Generator script finished."

# 3. Verify the output
log "Verifying generated files..."
NUM_MARKDOWN_FILES=$(ls -1 "$SUBMODULE_COMMANDS_DIR"/*.md | wc -l | tr -d ' ')
NUM_TYPESCRIPT_FILES=$(ls -1 "$OUTPUT_DIR"/*.ts | wc -l | tr -d ' ')

log "Found $NUM_MARKDOWN_FILES markdown command definitions."
log "Generated $NUM_TYPESCRIPT_FILES TypeScript command files."

if [ "$NUM_MARKDOWN_FILES" -eq 0 ]; then
    log "🔴 TEST FAILED: No markdown source files found. Cannot verify."
    exit 1
fi

if [ "$NUM_MARKDOWN_FILES" -ne "$NUM_TYPESCRIPT_FILES" ]; then
    log "🔴 TEST FAILED: Mismatch in file count. Expected $NUM_MARKDOWN_FILES, but found $NUM_TYPESCRIPT_FILES."
    exit 1
fi

log "✅ TEST PASSED: The number of generated files matches the number of source files."
log "--- Test Finished ---"
exit 0
