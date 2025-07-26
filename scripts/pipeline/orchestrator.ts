// /Users/rob/Development/SuperCode/SuperCode/scripts/pipeline/orchestrator.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Helper function to run a bun script and stream its output
async function runBunScript(scriptName: string) {
    console.log(`\n--- Running script: ${scriptName} ---\n`);
    try {
        const { stdout, stderr } = await execAsync(`bun run ${scriptName}`);
        if (stderr) {
            console.error(`Stderr from ${scriptName}:`);
            console.error(stderr);
        }
        console.log(stdout);
        console.log(`\n--- Script '${scriptName}' finished successfully ---\n`);
    } catch (error) {
        console.error(`🔴 FATAL: An error occurred while running '${scriptName}'.`);
        console.error(error);
        throw new Error(`Script '${scriptName}' failed.`);
    }
}

async function main() {
    console.log('🚀 Starting SuperCode Integration Pipeline Orchestrator...');
    const startTime = Date.now();

    try {
        // Step 1: Generate command boilerplate
        await runBunScript('generate:commands');

        // Step 2: Transpile and map core logic
        // Note: This currently only processes one file as per the vertical slice implementation.
        // In the future, this script will be expanded to process all core files.
        await runBunScript('map:logic');

        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Orchestrator finished successfully in ${duration.toFixed(2)}s.`);

    } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        console.error(`\n❌ Orchestrator failed after ${duration.toFixed(2)}s.`);
        process.exit(1);
    }
}

main();
