#!/bin/bash

# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_analyze_persona_logic.sh
# Enhanced test script for comprehensive diagnostics.

# --- Configuration ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
COMMAND_TO_TEST="bun run src/commands/analyze.ts"
PERSONA_TO_TEST="architect"
RESULT_LOG_FILE="$REPO_ROOT/test_results/test_analyze_persona_logic.log"

EXPECTED_BASE_PROMPT_SNIPPET="You are SuperClaude"
EXPECTED_PERSONA_PROMPT_SNIPPET="Your primary focus is on the overall structure"

# --- Cleanup and Setup ---
# Ensure a clean log file for each run
rm -f $RESULT_LOG_FILE
touch $RESULT_LOG_FILE

# --- Diagnostics ---
echo "--- DIAGNOSTICS ---" >> $RESULT_LOG_FILE
echo "Date: $(date)" >> $RESULT_LOG_FILE
echo "Running from: $(pwd)" >> $RESULT_LOG_FILE
echo "Changing to REPO_ROOT: $REPO_ROOT" >> $RESULT_LOG_FILE
cd $REPO_ROOT
echo "New CWD: $(pwd)" >> $RESULT_LOG_FILE
echo "Bun version: $(bun --version)" >> $RESULT_LOG_FILE
echo "Node version: $(node --version)" >> $RESULT_LOG_FILE
echo "" >> $RESULT_LOG_FILE
echo "Checking file existence:" >> $RESULT_LOG_FILE
ls -l src/commands/analyze.ts >> $RESULT_LOG_FILE 2>&1
# This path was wrong before, let's assume it should be inside SuperCode for now
ls -l src/session/orchestrator.ts >> $RESULT_LOG_FILE 2>&1
echo "-------------------" >> $RESULT_LOG_FILE
echo "" >> $RESULT_LOG_FILE

# --- Execution ---
echo "--- TEST EXECUTION ---" >> $RESULT_LOG_FILE
echo "Running command: $COMMAND_TO_TEST --persona $PERSONA_TO_TEST" >> $RESULT_LOG_FILE
# Capture both stdout and stderr
$COMMAND_TO_TEST --persona $PERSONA_TO_TEST >> $RESULT_LOG_FILE 2>&1
EXECUTION_EXIT_CODE=$?
echo "Execution finished with exit code: $EXECUTION_EXIT_CODE" >> $RESULT_LOG_FILE
echo "----------------------" >> $RESULT_LOG_FILE
echo "" >> $RESULT_LOG_FILE

# --- Validation ---
echo "--- VALIDATION ---" >> $RESULT_LOG_FILE
VALIDATION_PASSED=false
if grep -q "$EXPECTED_BASE_PROMPT_SNIPPET" "$RESULT_LOG_FILE" && grep -q "$EXPECTED_PERSONA_PROMPT_SNIPPET" "$RESULT_LOG_FILE"; then
    echo "✅ PASSED: The output contains both the base prompt and the correct persona prompt." >> $RESULT_LOG_FILE
    VALIDATION_PASSED=true
else
    echo "❌ FAILED: The output did not contain the expected prompt combination." >> $RESULT_LOG_FILE
    if ! grep -q "$EXPECTED_BASE_PROMPT_SNIPPET" "$RESULT_LOG_FILE"; then
        echo "   Reason: Base prompt snippet not found." >> $RESULT_LOG_FILE
    fi
    if ! grep -q "$EXPECTED_PERSONA_PROMPT_SNIPPET" "$RESULT_LOG_FILE"; then
        echo "   Reason: Persona prompt snippet for '$PERSONA_TO_TEST' not found." >> $RESULT_LOG_FILE
    fi
fi
echo "------------------" >> $RESULT_LOG_FILE

# --- Final Output ---
echo "--- TEST SUMMARY ---"
cat $RESULT_LOG_FILE
echo "--------------------"
echo "Test log saved to: $RESULT_LOG_FILE"

if [ "$VALIDATION_PASSED" = true ]; then
    exit 0
else
    exit 1
fi
