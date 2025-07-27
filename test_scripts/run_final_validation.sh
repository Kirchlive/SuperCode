#!/bin/bash

# /Users/rob/Development/SuperCode/SuperCode/test_scripts/run_final_validation.sh
# Executes the final batch of test scripts in parallel.

REPO_ROOT="/Users/rob/Development/SuperCode/SuperCode"
LOG_FILE="$REPO_ROOT/test_results/final_validation_run.log"
FAIL_COUNT=0

# --- Setup ---
rm -f "$LOG_FILE"
touch "$LOG_FILE"
cd "$REPO_ROOT" || exit 1

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "--- Starting Final Parallel Test Execution ---"

# --- Parallel Execution ---
bun run test_scripts/test_index_command.ts &
PID1=$!
log "Started test_index_command.ts with PID $PID1"

bun run test_scripts/test_load_command.ts &
PID2=$!
log "Started test_load_command.ts with PID $PID2"

bun run test_scripts/test_spawn_command.ts &
PID3=$!
log "Started test_spawn_command.ts with PID $PID3"

bun run test_scripts/test_task_command.ts &
PID4=$!
log "Started test_task_command.ts with PID $PID4"

bun run test_scripts/test_troubleshoot_command.ts &
PID5=$!
log "Started test_troubleshoot_command.ts with PID $PID5"

# Wait for all background processes to complete
wait $PID1; EXIT1=$?
log "test_index_command.ts finished with exit code $EXIT1."
wait $PID2; EXIT2=$?
log "test_load_command.ts finished with exit code $EXIT2."
wait $PID3; EXIT3=$?
log "test_spawn_command.ts finished with exit code $EXIT3."
wait $PID4; EXIT4=$?
log "test_task_command.ts finished with exit code $EXIT4."
wait $PID5; EXIT5=$?
log "test_troubleshoot_command.ts finished with exit code $EXIT5."

# --- Final Report ---
log "--- Final Parallel Execution Finished ---"

if [ $EXIT1 -ne 0 ] || [ $EXIT2 -ne 0 ] || [ $EXIT3 -ne 0 ] || [ $EXIT4 -ne 0 ] || [ $EXIT5 -ne 0 ]; then
    FAIL_COUNT=1
    log "❌ One or more parallel tests FAILED."
    echo "❌ FAILED"
    exit 1
else
    log "✅ All parallel tests PASSED."
    echo "✅ PASSED"
    exit 0
fi
