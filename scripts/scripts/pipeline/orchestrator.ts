// /Users/rob/Development/SuperCode/SuperCode/scripts/pipeline/orchestrator.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runBunScript(scriptName: string) {
    console.log(`\n--- Running script: ${scriptName} ---\n`);
    try {
        const { stdout, stderr } = await execAsync(`bun run ${scriptName}`);
        if (stderr) console.error(stderr);
        console.log(stdout);
    } catch (error) {
        console.error(`🔴 FATAL: An error occurred while running '${scriptName}'.`);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting SuperCode Bootstrap Pipeline...');
    const startTime = Date.now();

    try {
        await Promise.all([
            runBunScript('generate:commands'),
            runBunScript('migrate:configs')
        ]);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Pipeline finished successfully in ${duration.toFixed(2)}s.`);
        console.log("\nNext step: Manually implement the logic in the generated 'src/commands/' files.");

    } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        console.error(`\n❌ Pipeline failed after ${duration.toFixed(2)}s.`);
        process.exit(1);
    }
}

main();
