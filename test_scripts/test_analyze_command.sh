#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_analyze_command.sh
#
# This integration test verifies that the 'analyze' command correctly uses the
# Orchestrator to generate a system prompt based on a given persona.

# --- Configuration ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
# We need to make the command executable to test it.
# Bun can run a TypeScript file directly.
COMMAND_TO_RUN="bun run src/commands/analyze.ts"
LOG_FILE="$REPO_ROOT/test_results/test_analyze_command.log"
PERSONA_ID="architect"

# Expected snippets in the final output
EXPECTED_BASE_SNIPPET="# SuperClaude Entry Point" # From CLAUDE.md
EXPECTED_PERSONA_SNIPPET="**Identity**: Systems architecture specialist" # From personas.json

# --- Setup ---
rm -f "$LOG_FILE"
cd "$REPO_ROOT" || exit 1

echo "--- Test: 'analyze' command integration ---" > "$LOG_FILE"
echo "Running command: $COMMAND_TO_RUN analyze --persona $PERSONA_ID" >> "$LOG_FILE"

# --- Execution ---
# We need to pass 'analyze' as the command to yargs
$COMMAND_TO_RUN analyze --persona "$PERSONA_ID" >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

# --- Validation ---
PASSED=false
if [ $EXIT_CODE -eq 0 ] && grep -Fq "$EXPECTED_BASE_SNIPPET" "$LOG_FILE" && grep -Fq "$EXPECTED_PERSONA_SNIPPET" "$LOG_FILE"; then
    PASSED=true
fi

# --- Report ---
echo "" >> "$LOG_FILE"
echo "--- Result ---" >> "$LOG_FILE"
if [ "$PASSED" = true ]; then
    echo "✅ PASSED" >> "$LOG_FILE"
    echo "✅ Test PASSED. Full log: $LOG_FILE"
    exit 0
else
    echo "❌ FAILED" >> "$LOG_FILE"
    echo "❌ Test FAILED. Full log: $LOG_FILE"
    exit 1
fi
