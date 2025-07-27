#!/bin/bash
# /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_all_commands.sh
#
# This script runs all integration tests for the implemented commands to ensure
# everything is working together correctly.

# --- Configuration ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
TEST_SCRIPTS_DIR="$REPO_ROOT/test_scripts"
LOG_FILE="$REPO_ROOT/test_results/test_all_commands.log"

# List of tests to run (excluding this script itself)
TESTS_TO_RUN=(
    "test_analyze_command.sh"
    "test_explain_command.sh"
    "test_document_command.sh"
    "test_estimate_command.sh"
    "test_build_command.sh"
    "test_implement_command.sh"
    "test_design_command.sh"
    "test_improve_command.sh"
    "test_git_command.sh"
    "test_task_command.sh"
    "test_cleanup_command.sh"
)

# --- Setup ---
rm -f "$LOG_FILE"
cd "$REPO_ROOT" || exit 1
echo "--- Final Integration Test ---" > "$LOG_FILE"
date >> "$LOG_FILE"
echo "----------------------------" >> "$LOG_FILE"

# --- Execution ---
ALL_PASSED=true
for test_script in "${TESTS_TO_RUN[@]}"; do
    echo "" >> "$LOG_FILE"
    echo "--- Running: $test_script ---" | tee -a "$LOG_FILE"
    
    # Make sure the script is executable before running
    chmod +x "$TEST_SCRIPTS_DIR/$test_script"
    
    # Run the test and capture its output
    output=$("$TEST_SCRIPTS_DIR/$test_script")
    exit_code=$?
    
    echo "$output" | tee -a "$LOG_FILE"
    
    if [ $exit_code -ne 0 ]; then
        ALL_PASSED=false
        echo "--- FAILED: $test_script ---" >> "$LOG_FILE"
    fi
done

# --- Report ---
echo "" >> "$LOG_FILE"
echo "--- Final Result ---" >> "$LOG_FILE"
if [ "$ALL_PASSED" = true ]; then
    echo "✅ All tests PASSED." >> "$LOG_FILE"
    echo "✅ All integration tests PASSED. Full log: $LOG_FILE"
    exit 0
else
    echo "❌ One or more tests FAILED." >> "$LOG_FILE"
    echo "❌ One or more integration tests FAILED. Full log: $LOG_FILE"
    exit 1
fi
