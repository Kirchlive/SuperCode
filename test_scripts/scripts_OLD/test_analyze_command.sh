# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_analyze_command.sh
# This script tests both manual and automatic persona activation for the 'analyze' command.

# --- Configuration ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
COMMAND_TO_RUN="bun run src/commands/analyze.ts"
LOG_FILE="$REPO_ROOT/test_results/test_analyze_command.log"
PERSONA_ID="architect"

EXPECTED_BASE_SNIPPET="# SuperClaude Entry Point"
EXPECTED_PERSONA_SNIPPET="**Identity**: Systems architecture specialist"

# --- Setup ---
cd "$REPO_ROOT" || exit 1

# --- Test Case 1: Manual Activation ---
rm -f "$LOG_FILE"
echo "--- Test: 'analyze' command manual activation ---" > "$LOG_FILE"
echo "Running command: $COMMAND_TO_RUN analyze --persona $PERSONA_ID" >> "$LOG_FILE"

$COMMAND_TO_RUN analyze --persona "$PERSONA_ID" >> "$LOG_FILE" 2>&1
EXIT_CODE_MANUAL=$?

PASSED_MANUAL=false
if [ $EXIT_CODE_MANUAL -eq 0 ] && grep -Fq "$EXPECTED_BASE_SNIPPET" "$LOG_FILE" && grep -Fq "$EXPECTED_PERSONA_SNIPPET" "$LOG_FILE"; then
    PASSED_MANUAL=true
fi

# --- Test Case 2: Auto-Activation ---
rm -f "$LOG_FILE"
echo "--- Test: 'analyze' command auto-activation ---" >> "$LOG_FILE"
USER_INPUT="analyze the architecture of the main service"
echo "Running command: $COMMAND_TO_RUN analyze $USER_INPUT" >> "$LOG_FILE"

$COMMAND_TO_RUN analyze $USER_INPUT >> "$LOG_FILE" 2>&1
EXIT_CODE_AUTO=$?

PASSED_AUTO=false
if [ $EXIT_CODE_AUTO -eq 0 ] && grep -Fq "$EXPECTED_BASE_SNIPPET" "$LOG_FILE" && grep -Fq "$EXPECTED_PERSONA_SNIPPET" "$LOG_FILE"; then
    PASSED_AUTO=true
fi

# --- Final Report ---
# This part is for this script's own log file, not for the console output.
LOG_SUMMARY_FILE="$REPO_ROOT/test_results/test_analyze_command_summary.log"
rm -f "$LOG_SUMMARY_FILE"
echo "--- Final Result Summary ---" > "$LOG_SUMMARY_FILE"
if [ "$PASSED_MANUAL" = true ] && [ "$PASSED_AUTO" = true ]; then
    echo "✅ All tests PASSED" >> "$LOG_SUMMARY_FILE"
    echo "✅ Test PASSED. Full log: $LOG_FILE"
    exit 0
else
    echo "❌ One or more tests FAILED" >> "$LOG_SUMMARY_FILE"
    [ "$PASSED_MANUAL" = false ] && echo "   - Manual persona test FAILED" >> "$LOG_SUMMARY_FILE"
    [ "$PASSED_AUTO" = false ] && echo "   - Auto-activation test FAILED" >> "$LOG_SUMMARY_FILE"
    echo "❌ Test FAILED. Full log: $LOG_FILE"
    exit 1
fi
