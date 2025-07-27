#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_config_migrator.sh
# An integration test for the config migrator script.

# --- CONFIGURATION ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/config_migrator_test_$(date +%Y%m%d_%H%M%S).log"
TEMP_SOURCE_DIR="$REPO_ROOT/scripts/pipeline/temp_core_source"
TEMP_PERSONAS_FILE="$TEMP_SOURCE_DIR/PERSONAS.md"
GENERATED_JSON_FILE="$REPO_ROOT/src/personas.json"

# --- UTILITY FUNCTIONS ---
log() {
    echo "[$(date +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup() {
    log "Cleaning up test files..."
    rm -rf "$TEMP_SOURCE_DIR"
    rm -f "$GENERATED_JSON_FILE"
    # Restore original migrator script if a backup exists
    if [ -f "$REPO_ROOT/scripts/pipeline/migrate-configs.ts.bak" ]; then
        mv "$REPO_ROOT/scripts/pipeline/migrate-configs.ts.bak" "$REPO_ROOT/scripts/pipeline/migrate-configs.ts"
    fi
    log "Cleanup complete."
}

# --- SCRIPT START ---
echo "--- Starting Config Migrator Test ---" | tee "$LOG_FILE"
cd "$REPO_ROOT" || exit 1
trap cleanup EXIT # Ensure cleanup happens even on error

# 1. Create a dummy PERSONAS.md file
log "STEP 1: Creating dummy PERSONAS.md file..."
mkdir -p "$TEMP_SOURCE_DIR"
cat <<EOF > "$TEMP_PERSONAS_FILE"
# Personas

This is some introductory text.

## \`--persona-architect\`
You are a world-class software architect. Your goal is to design robust and scalable systems.

## \`--persona-scribe=lang\`
You are a meticulous technical writer.
EOF
log "Dummy file created."

# 2. Temporarily modify the migrator script to use our dummy file
sed -i.bak "s|external/superclaude/SuperClaude/Core/PERSONAS.md|scripts/pipeline/temp_core_source/PERSONAS.md|g" "$REPO_ROOT/scripts/pipeline/migrate-configs.ts"

# 3. Run the migrator script
log "STEP 2: Running 'bun run migrate:configs'..."
BUN_OUTPUT=$(bun run migrate:configs 2>&1)
BUN_EXIT_CODE=$?

log "Full output from 'bun run migrate:configs':"
echo "$BUN_OUTPUT" | tee -a "$LOG_FILE"

if [ $BUN_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: 'bun run migrate:configs' exited with error code $BUN_EXIT_CODE."
    exit 1
fi
log "✅ 'bun run migrate:configs' executed successfully."

# 4. Verify the output
log "STEP 3: Verifying the generated JSON file..."
if [ ! -f "$GENERATED_JSON_FILE" ]; then
    log "🔴 TEST FAILED: Generated file '$GENERATED_JSON_FILE' was not created."
    exit 1
fi

# Check for key content
grep -q '"architect"' "$GENERATED_JSON_FILE" && \
grep -q '"scribe"' "$GENERATED_JSON_FILE" && \
grep -q "robust and scalable systems" "$GENERATED_JSON_FILE"
VERIFICATION_EXIT_CODE=$?

if [ $VERIFICATION_EXIT_CODE -ne 0 ]; then
    log "🔴 TEST FAILED: The content of the generated JSON file is incorrect."
else
    log "✅ TEST PASSED: The generated JSON file contains the correct persona data."
fi

log "--- Test Finished ---"
exit $VERIFICATION_EXIT_CODE
