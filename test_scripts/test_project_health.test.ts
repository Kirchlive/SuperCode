// /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_project_health.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

const REPO_ROOT = path.resolve(import.meta.dir, '../');
const LOG_DIR = path.join(REPO_ROOT, "test_results");
const LOG_FILE_PREFIX = "project_health_test_";

let fullLogContent = "";
let overallPassed = true;

async function runStep(name: string, command: string): Promise<boolean> {
    fullLogContent += `\n--- Starting Step: ${name} ---\n`;
    fullLogContent += `Command: ${command}\n\n`;
    let passed = false;
    try {
        const { stdout, stderr } = await execAsync(command, { cwd: REPO_ROOT });
        const output = stdout + stderr;
        fullLogContent += `--- Output ---\n${output || "No output."}\n--- End Output ---\n`;
        
        // A simple heuristic: if stderr contains "error", it might have failed.
        // More robust checks might be needed depending on the command.
        if (stderr && stderr.toLowerCase().includes("error")) {
             fullLogContent += `Result: ❌ FAILED (Errors detected in stderr)\n`;
             passed = false;
        } else {
            fullLogContent += `Result: ✅ PASSED\n`;
            passed = true;
        }
    } catch (error: any) {
        fullLogContent += `--- Error (Caught Exception) ---\n`;
        fullLogContent += error.stdout || "No stdout on error.\n";
        fullLogContent += error.stderr || "No stderr on error.\n";
        fullLogContent += `--- End Error ---\n`;
        fullLogContent += `Result: ❌ FAILED\n`;
        passed = false;
    }
    if (!passed) overallPassed = false;
    return passed;
}

async function validateJson(filePath: string): Promise<boolean> {
    const name = `Validate JSON: ${path.basename(filePath)}`;
    fullLogContent += `\n--- Starting Step: ${name} ---\n`;
    let passed = false;
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        JSON.parse(content);
        fullLogContent += `Result: ✅ PASSED\n`;
        passed = true;
    } catch (error: any) {
        fullLogContent += `--- Error ---\n${error.message}\n--- End Error ---\n`;
        fullLogContent += `Result: ❌ FAILED\n`;
        passed = false;
    }
    if (!passed) overallPassed = false;
    return passed;
}


async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(LOG_DIR, `${LOG_FILE_PREFIX}${timestamp}.log`);
    
    fullLogContent += `--- Project Health Test ---\n`;
    fullLogContent += `Run At: ${new Date().toLocaleString()}\n`;

    // Step 1: Run the pipeline
    await runStep("Run Pipeline", `bun run ${REPO_ROOT}/scripts/pipeline/orchestrator.ts`);

    // Step 2: Validate JSON output
    await validateJson(path.join(REPO_ROOT, 'src/personas.json'));

    // Step 3: Run Type Integrity Check
    await runStep("Type Integrity Check", `bunx tsc --noEmit --project ${REPO_ROOT}/tsconfig.json`);

    // Step 4: Run Unit Tests
    await runStep("Unit Tests", "bun test");

    const finalStatus = overallPassed ? "✅ PASSED" : "❌ FAILED";
    fullLogContent += `\n--- Overall Result ---\n${finalStatus}\n`;

    // Write the detailed log file
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.writeFile(logFile, fullLogContent);

    // Write the simple result to the console
    console.log(finalStatus);

    process.exit(overallPassed ? 0 : 1);
}

main();
