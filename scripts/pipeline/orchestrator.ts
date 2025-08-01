// /Users/rob/Development/SuperCode/SuperCode/scripts/pipeline/orchestrator.ts

import { main as generateCommands } from './generate-commands.ts';
import { main as migrateConfigs } from './migrate-configs.ts';
import { main as patchImports } from './patch-imports.ts';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

async function copyImplementedLogic() {
    console.log('\n--- Copying implemented command logic ---\n');
const sourceDir = path.join(import.meta.dir, '../../src/');
    const destDir = path.join(import.meta.dir, '../../build/supercode/src/');
    await fs.mkdir(destDir, { recursive: true });
    await execAsync(`rsync -av --exclude='*.test.ts' ${sourceDir} ${destDir}`);
    console.log('✅ Source code copied to build directory.');
}

async function runScript(scriptFunc: () => Promise<void>, name: string) {
    console.log(`\n--- Running script: ${name} ---\n`);
    try {
        await scriptFunc();
    } catch (error) {
        console.error(`🔴 FATAL: An error occurred while running '${name}'.`);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting SuperCode Bootstrap Pipeline...');
    const startTime = Date.now();

    try {
        // We run them in parallel as they are independent
        await Promise.all([
            runScript(generateCommands, 'generate-commands'),
            runScript(migrateConfigs, 'migrate-configs')
        ]);

        await copyImplementedLogic();
        await runScript(patchImports, 'patch-imports');

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
