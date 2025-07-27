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

# --- Test Case 1: Prompt without Persona Keywords ---
rm -f "$LOG_FILE" # Clean log for the first test
echo "--- Test: 'analyze' command without persona trigger ---" > "$LOG_FILE"
NON_PERSONA_INPUT="check the file for errors"
echo "Running command: $COMMAND_TO_RUN --prompt \"$NON_PERSONA_INPUT\"" >> "$LOG_FILE"

$COMMAND_TO_RUN --prompt "$NON_PERSONA_INPUT" >> "$LOG_FILE" 2>&1
EXIT_CODE_MANUAL=$?

PASSED_MANUAL=false
# We expect the command to succeed but NOT to find the persona snippet
if [ $EXIT_CODE_MANUAL -eq 0 ] && grep -Fq "$EXPECTED_BASE_SNIPPET" "$LOG_FILE" && ! grep -Fq "$EXPECTED_PERSONA_SNIPPET" "$LOG_FILE"; then
    PASSED_MANUAL=true
fi

# --- Test Case 2: Auto-Activation ---
echo "" >> "$LOG_FILE"
echo "--- Test: 'analyze' command auto-activation ---" >> "$LOG_FILE"
USER_INPUT="analyze the architecture of the main service"
echo "Running command: $COMMAND_TO_RUN --prompt \"$USER_INPUT\"" >> "$LOG_FILE"

$COMMAND_TO_RUN --prompt "$USER_INPUT" >> "$LOG_FILE" 2>&1
EXIT_CODE_AUTO=$?

PASSED_AUTO=false
# We check for the same persona snippet, as the keywords should trigger it
if [ $EXIT_CODE_AUTO -eq 0 ] && grep -Fq "$EXPECTED_BASE_SNIPPET" "$LOG_FILE" && grep -Fq "$EXPECTED_PERSONA_SNIPPET" "$LOG_FILE"; then
    PASSED_AUTO=true
fi

# --- Test Case 2: Auto-Activation ---
rm -f "$LOG_FILE" # Clean log for the second test
echo "" >> "$LOG_FILE"
echo "--- Test: 'analyze' command auto-activation ---" >> "$LOG_FILE"
USER_INPUT="analyze the architecture of the main service"
echo "Running command: $COMMAND_TO_RUN $USER_INPUT" >> "$LOG_FILE"

# Note: We pass the user input as arguments to the command
$COMMAND_TO_RUN --prompt "$USER_INPUT" >> "$LOG_FILE" 2>&1
EXIT_CODE_AUTO=$?

PASSED_AUTO=false
# We check for the same persona snippet, as the keywords should trigger it
if [ $EXIT_CODE_AUTO -eq 0 ] && grep -Fq "$EXPECTED_BASE_SNIPPET" "$LOG_FILE" && grep -Fq "$EXPECTED_PERSONA_SNIPPET" "$LOG_FILE"; then
    PASSED_AUTO=true
fi

# --- Final Report ---
echo "" >> "$LOG_FILE"
echo "--- Final Result ---" >> "$LOG_FILE"
if [ "$PASSED_MANUAL" = true ] && [ "$PASSED_AUTO" = true ]; then
    echo "✅ All tests PASSED" >> "$LOG_FILE"
    echo "✅ Test PASSED. Full log: $LOG_FILE"
    exit 0
else
    echo "❌ One or more tests FAILED" >> "$LOG_FILE"
    [ "$PASSED_MANUAL" = false ] && echo "   - Manual persona test FAILED" >> "$LOG_FILE"
    [ "$PASSED_AUTO" = false ] && echo "   - Auto-activation test FAILED" >> "$LOG_FILE"
    echo "❌ Test FAILED. Full log: $LOG_FILE"
    exit 1
fi


# --- Test Case 2: Auto-Activation ---
echo "--- Test: 'analyze' command auto-activation ---" >> "$LOG_FILE"
USER_INPUT="analyze the architecture of the main service"
echo "Running command: $COMMAND_TO_RUN $USER_INPUT" >> "$LOG_FILE"

$COMMAND_TO_RUN $USER_INPUT >> "$LOG_FILE" 2>&1
EXIT_CODE_AUTO=$?

PASSED_AUTO=false
if [ $EXIT_CODE_AUTO -eq 0 ] && grep -Fq "$EXPECTED_BASE_SNIPPET" "$LOG_FILE" && grep -Fq "$EXPECTED_PERSONA_SNIPPET" "$LOG_FILE"; then
    PASSED_AUTO=true
fi

# --- Final Report ---
echo "" >> "$LOG_FILE"
echo "--- Final Result ---" >> "$LOG_FILE"
if [ "$PASSED" = true ] && [ "$PASSED_AUTO" = true ]; then
    echo "✅ All tests PASSED" >> "$LOG_FILE"
    echo "✅ Test PASSED. Full log: $LOG_FILE"
    exit 0
else
    echo "❌ One or more tests FAILED" >> "$LOG_FILE"
    [ "$PASSED" = false ] && echo "   - Manual persona test FAILED" >> "$LOG_FILE"
    [ "$PASSED_AUTO" = false ] && echo "   - Auto-activation test FAILED" >> "$LOG_FILE"
    echo "❌ Test FAILED. Full log: $LOG_FILE"
    exit 1
fi
