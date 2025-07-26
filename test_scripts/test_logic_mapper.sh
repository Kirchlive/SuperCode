#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_logic_mapper.sh

# --- CONFIGURATION ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/logic_mapper_test_$(date +%Y%m%d_%H%M%S).log"
TEMP_PYTHON_FILE="$REPO_ROOT/scripts/pipeline/temp_test_file.py"
GENERATED_TS_FILE="$REPO_ROOT/src/core-generated/temp_test_file.ts"

# --- UTILITY FUNCTIONS ---
log() {
    echo "$(date +'%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

cleanup() {
    log "Cleaning up test files..."
    rm -f "$TEMP_PYTHON_FILE"
    rm -f "$GENERATED_TS_FILE"
    log "Cleanup complete."
}

# --- TEST EXECUTION ---
log "--- Starting Logic Mapper Test ---"
trap cleanup EXIT # Ensure cleanup happens even on error

# 1. Create a dummy Python source file for the test
log "Creating dummy Python test file..."
cat <<EOF > "$TEMP_PYTHON_FILE"
class Core:
    class Filesystem:
        def read_file(path):
            return "content"

def some_function():
    content = Core.Filesystem.read_file("/path/to/file")
    print("File read")
EOF
log "Dummy file created."

# 2. Modify the mapper script to use our dummy file
# We create a temporary mapper script for this test run
TEMP_MAPPER_SCRIPT="$REPO_ROOT/scripts/pipeline/temp_mapper.ts"
sed "s|${REPO_ROOT}/external/superclaude/SuperClaude/Core/Filesystem.py|${TEMP_PYTHON_FILE}|" "$REPO_ROOT/scripts/pipeline/map-logic.ts" > "$TEMP_MAPPER_SCRIPT"

# 3. Run the modified mapper script via make
log "Running the logic mapper script on the dummy file via make..."
cd "$REPO_ROOT"
# Temporarily modify the main map-logic.ts to point to our test file
sed -i.bak "s|${REPO_ROOT}/external/superclaude/SuperClaude/Core/Filesystem.py|${TEMP_PYTHON_FILE}|" "$REPO_ROOT/scripts/pipeline/map-logic.ts"
make map-logic >> "$LOG_FILE" 2>&1
MAPPER_EXIT_CODE=$?
# Restore the original file
mv "$REPO_ROOT/scripts/pipeline/map-logic.ts.bak" "$REPO_ROOT/scripts/pipeline/map-logic.ts"

if [ $MAPPER_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: Mapper script exited with error code $MAPPER_EXIT_CODE."
    log "Please ensure 'py2ts' is installed: pip install py2ts"
    exit 1
fi
log "Mapper script finished."

# 4. Verify the output
log "Verifying the generated TypeScript file..."
if [ ! -f "$GENERATED_TS_FILE" ]; then
    log "🔴 TEST FAILED: Generated file '$GENERATED_TS_FILE' was not created."
    exit 1
fi

log "Checking for correct function replacement..."
# Check if the new function name exists
grep -q "tools.read" "$GENERATED_TS_FILE"
GREP_SUCCESS_1=$?

# Check if the old function name has been removed
grep -q "Core.Filesystem.read_file" "$GENERATED_TS_FILE"
GREP_FAILURE_1=$?

if [ $GREP_SUCCESS_1 -ne 0 ]; then
    log "🔴 TEST FAILED: The new function 'tools.read' was NOT found in the output."
    exit 1
fi

if [ $GREP_FAILURE_1 -eq 0 ]; then
    log "🔴 TEST FAILED: The old function 'Core.Filesystem.read_file' was NOT removed from the output."
    exit 1
fi

log "✅ TEST PASSED: Logic mapping was successful."
log "--- Test Finished ---"
exit 0
