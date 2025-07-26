#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_logic_mapper_verbose.sh
# A robust test script for the logic mapping process.

# --- CONFIGURATION ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/logic_mapper_verbose_test_$(date +%Y%m%d_%H%M%S).log"
TEMP_PYTHON_FILE="$REPO_ROOT/scripts/pipeline/temp_test_file.py"
GENERATED_TS_FILE="$REPO_ROOT/src/core-generated/temp_test_file.ts"

# --- UTILITY FUNCTIONS ---
log() {
    echo "[$(date +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup() {
    log "Cleaning up test files..."
    rm -f "$TEMP_PYTHON_FILE"
    rm -f "$GENERATED_TS_FILE"
    log "Cleanup complete."
}

# --- SCRIPT START ---
echo "--- Starting Verbose Logic Mapper Test ---" | tee "$LOG_FILE"
cd "$REPO_ROOT" || exit 1
trap cleanup EXIT # Ensure cleanup happens even on error

# --- 1. TEST EXECUTION ---
log "STEP 1: Running 'bun run map:logic' with a temporary test file..."
# Create a dummy Python source file for the test
cat <<EOF > "$TEMP_PYTHON_FILE"
class Core:
    class Filesystem:
        def read_file(path):
            return "content"
def some_function():
    content = Core.Filesystem.read_file("/path/to/file")
    print("File read")
EOF

# Execute the map:logic script, passing our temp file as an argument
BUN_OUTPUT=$(bun run map:logic "$TEMP_PYTHON_FILE" 2>&1)
BUN_EXIT_CODE=$?

log "Full output from 'bun run map:logic':"
echo "$BUN_OUTPUT" | tee -a "$LOG_FILE"

if [ $BUN_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: 'bun run map:logic' exited with error code $BUN_EXIT_CODE."
    exit 1
fi
log "✅ 'bun run map:logic' executed successfully."

# --- 2. OUTPUT VERIFICATION ---
log "STEP 2: Verifying the generated TypeScript file..."
if [ ! -f "$GENERATED_TS_FILE" ]; then
    log "🔴 TEST FAILED: Generated file '$GENERATED_TS_FILE' was not created."
    exit 1
fi

# Check for the simulated content and the correct function replacement
grep -q "SIMULATED transpilation" "$GENERATED_TS_FILE" && \
grep -q "tools.read" "$GENERATED_TS_FILE" && \
grep -q "console.log" "$GENERATED_TS_FILE" && \
grep -qv "Core.Filesystem.read_file" "$GENERATED_TS_FILE" && \
grep -qv "print" "$GENERATED_TS_FILE"

VERIFICATION_EXIT_CODE=$?

if [ $VERIFICATION_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: The content of the generated file is incorrect."
else
    log "✅ TEST PASSED: The generated file contains the correct transformations."
fi

log "--- Test Finished ---"
exit $VERIFICATION_EXIT_CODE
