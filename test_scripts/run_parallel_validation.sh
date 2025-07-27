#!/bin/bash

# /Users/rob/Development/SuperCode/SuperCode/test_scripts/run_parallel_validation.sh
# Executes the test scripts for design, test, and cleanup in parallel.

REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/parallel_validation_run.log"
FAIL_COUNT=0

# --- Setup ---
rm -f "$LOG_FILE"
touch "$LOG_FILE"
cd "$REPO_ROOT" || exit 1

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "--- Starting Parallel Test Execution ---"

# --- Parallel Execution ---
# Start all three test scripts as background processes
bun run test_scripts/test_design_command.ts &
PID1=$!
log "Started test_design_command.ts with PID $PID1"

bun run test_scripts/test_test_command.ts &
PID2=$!
log "Started test_test_command.ts with PID $PID2"

bun run test_scripts/test_cleanup_command.ts &
PID3=$!
log "Started test_cleanup_command.ts with PID $PID3"

# Wait for all background processes to complete
wait $PID1
EXIT1=$?
log "test_design_command.ts finished with exit code $EXIT1."

wait $PID2
EXIT2=$?
log "test_test_command.ts finished with exit code $EXIT2."

wait $PID3
EXIT3=$?
log "test_cleanup_command.ts finished with exit code $EXIT3."

# --- Final Report ---
log "--- Parallel Execution Finished ---"

if [ $EXIT1 -ne 0 ] || [ $EXIT2 -ne 0 ] || [ $EXIT3 -ne 0 ]; then
    FAIL_COUNT=1
    log "❌ One or more parallel tests FAILED."
    [ $EXIT1 -ne 0 ] && log "   - design test FAILED."
    [ $EXIT2 -ne 0 ] && log "   - test test FAILED."
    [ $EXIT3 -ne 0 ] && log "   - cleanup test FAILED."
    echo "❌ FAILED"
    exit 1
else
    log "✅ All parallel tests PASSED."
    echo "✅ PASSED"
    exit 0
fi
