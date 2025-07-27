#!/bin/bash

# test_build_command_v2.sh
# Validates the 'build' command with comprehensive checks and strict output standards.

# --- Configuration ---
REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
COMMAND_TO_RUN="bun run src/commands/build.ts"
LOG_FILE="$REPO_ROOT/test_results/test_build_command_v2.log"
FAIL_COUNT=0

# --- Setup ---
rm -f "$LOG_FILE"
touch "$LOG_FILE"
cd "$REPO_ROOT" || exit 1

# --- Helper Functions ---
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

run_test() {
    local test_name="$1"
    local command_args="$2"
    local expected_array_name="$3"
    local unexpected_array_name="$4"

    log "--- Starting Test Case: $test_name ---"
    log "Command: $COMMAND_TO_RUN $command_args"

    local output
    output=$($COMMAND_TO_RUN $command_args 2>&1)
    local exit_code=$?
    log "Exit Code: $exit_code"
    log "Output:\n$output"

    local test_passed=true

    if [ $exit_code -ne 0 ]; then
        log "❌ FAILED: Command exited with non-zero status."
        test_passed=false
    fi

    # Safely iterate over arrays using eval
    eval "local expected_strings=(\"\${${expected_array_name}[@]}\")"
    for expected in "${expected_strings[@]}"; do
        if ! echo "$output" | grep -Fq -- "$expected"; then
            log "❌ FAILED: Expected string not found: '$expected'"
            test_passed=false
        fi
    done

    eval "local unexpected_strings=(\"\${${unexpected_array_name}[@]}\")"
    for unexpected in "${unexpected_strings[@]}"; do
        if echo "$output" | grep -Fq -- "$unexpected"; then
            log "❌ FAILED: Unexpected string found: '$unexpected'"
            test_passed=false
        fi
    done

    if [ "$test_passed" = true ]; then
        log "✅ PASSED: Test Case '$test_name'"
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    log "--- Finished Test Case: $test_name ---"
    echo "" >> "$LOG_FILE"
}

# --- Test Cases ---

log "Starting comprehensive test suite for 'build' command."

# Test Case 1: Basic dev build, no persona
PROMPT1="build the main service"
ARGS1="--prompt \"$PROMPT1\" --type dev"
EXPECTED1=("Detected Persona: None" "Build Type: dev" "Clean Build: false")
UNEXPECTED1=("--- PERSONA:")
run_test "Basic Dev Build" "$ARGS1" EXPECTED1[@] UNEXPECTED1[@]

# Test Case 2: Production build with persona trigger and flags
PROMPT2="build the frontend component for production"
ARGS2="--prompt \"$PROMPT2\" --type prod --clean --optimize"
EXPECTED2=("Detected Persona: frontend" "Build Type: prod" "Clean Build: true" "Optimized: true" "--- PERSONA: FRONTEND ---")
UNEXPECTED2=()
run_test "Production Build with Persona and Flags" "$ARGS2" EXPECTED2[@] UNEXPECTED2[@]

# Test Case 3: Test build
PROMPT3="run a test build"
ARGS3="--prompt \"$PROMPT3\" --type test"
EXPECTED3=("Build Type: test" "Detected Persona: qa")
UNEXPECTED3=()
run_test "Test Build with QA Persona" "$ARGS3" EXPECTED3[@] UNEXPECTED3[@]

# --- Final Report ---
log "All test cases finished."
if [ $FAIL_COUNT -eq 0 ]; then
    echo "PASSED"
    exit 0
else
    echo "FAILED"
    exit 1
fi
