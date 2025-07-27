#!/bin/bash

# test_orchestrator_logic.sh
# Tests the core functionality of the Orchestrator class.

# --- Setup ---
TEST_NAME="Orchestrator Logic Test"
LOG_FILE="/Users/rob/Development/SuperCode/SuperCode/test_results/test_orchestrator_logic.log"
TEST_RUNNER_SCRIPT="/Users/rob/Development/SuperCode/SuperCode/test_scripts/run_orchestrator_test.ts"
FAIL_COUNT=0

# Clean up previous log
rm -f "$LOG_FILE"
touch "$LOG_FILE"

echo "--- Running: $TEST_NAME ---" | tee -a "$LOG_FILE"

# --- Test Runner TypeScript File ---
# We create a dedicated TypeScript file to run the test logic.
# This is cleaner than trying to embed complex TS in a bash script.
cat > "$TEST_RUNNER_SCRIPT" <<EOL
import { Orchestrator, realFileReader } from '../src/session/orchestrator';

async function runTests() {
    console.log("Starting Orchestrator tests...");

    // Test 1: Initialization
    try {
        await Orchestrator.initialize(realFileReader);
        const instance = Orchestrator.getInstance();
        if (!instance) throw new Error("Orchestrator instance not created.");
        console.log("✅ PASS: Orchestrator initializes successfully.");
    } catch (e) {
        console.error("❌ FAIL: Orchestrator initialization failed.", e);
        process.exit(1);
    }

    // Test 2: Base Prompt Loading
    try {
        const instance = Orchestrator.getInstance();
        const prompt = await instance.getSystemPrompt();
        if (!prompt || prompt.length < 100 || prompt.includes('Error loading prompt.')) {
            throw new Error("Base system prompt seems invalid or empty.");
        }
        console.log("✅ PASS: Base system prompt loaded successfully.");
    } catch (e) {
        console.error("❌ FAIL: Base system prompt loading failed.", e);
        process.exit(1);
    }

    // Test 3: Persona Loading and Detection
    try {
        const instance = Orchestrator.getInstance();
        const personaId = instance.detectPersona("analyze the architecture");
        if (personaId !== 'architect') {
            throw new Error(\`Expected to detect 'architect', but got '\${personaId}'.\`);
        }
        const personaPrompt = await instance.getSystemPrompt('architect');
        if (!personaPrompt.includes('--- PERSONA: ARCHITECT ---')) {
            throw new Error("Architect persona prompt not loaded correctly.");
        }
        console.log("✅ PASS: Persona detection and loading works.");
    } catch (e) {
        console.error("❌ FAIL: Persona detection or loading failed.", e);
        process.exit(1);
    }
}

runTests().catch(e => {
    console.error("A critical error occurred during the test run:", e);
    process.exit(1);
});
EOL

# --- Execution ---
# Run the TypeScript test runner with bun
cd /Users/rob/Development/SuperCode/SuperCode
bun run "$TEST_RUNNER_SCRIPT" >> "$LOG_FILE" 2>&1

# Capture exit code
EXIT_CODE=$?

# --- Teardown ---
rm -f "$TEST_RUNNER_SCRIPT"

# --- Result ---
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All Orchestrator tests PASSED."
else
    echo "❌ Orchestrator tests FAILED. See log for details."
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo "Full log available at: $LOG_FILE"
exit $FAIL_COUNT
