// /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_type_integrity.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

const REPO_ROOT = path.resolve(import.meta.dir, '../');
const LOG_DIR = path.join(REPO_ROOT, "test_results");
const LOG_FILE_PREFIX = "type_integrity_test_";

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(LOG_DIR, `${LOG_FILE_PREFIX}${timestamp}.log`);
    let logContent = `--- TypeScript Integrity Test ---\n`;
    logContent += `Run At: ${new Date().toLocaleString()}\n`;
    logContent += `--- Starting tsc --noEmit --project ${REPO_ROOT}/tsconfig.json ---\n\n`;

    let passed = false;

    try {
        // Ensure the log directory exists
        await fs.mkdir(LOG_DIR, { recursive: true });

        // Execute the tsc command
        const { stdout, stderr } = await execAsync(`bunx tsc --noEmit --project ${REPO_ROOT}/tsconfig.json`, { cwd: REPO_ROOT });
        
        const output = stdout + stderr;
        logContent += "--- TSC Output ---\n";
        logContent += output || "No output from tsc. This usually means success.\n";
        logContent += "\n--- TSC Output End ---\n";

        // If tsc succeeds, it usually has no output. If it has output but doesn't throw, we check for "error TS"
        if (!output.includes("error TS")) {
            passed = true;
        }

    } catch (error: any) {
        logContent += "\n--- TSC Error (Caught Exception) ---\n";
        logContent += error.stdout || "No stdout on error.";
        logContent += error.stderr || "No stderr on error.";
        logContent += "\n--- TSC Error End ---\n";
        passed = false;
    }

    const finalStatus = passed ? "✅ PASSED" : "❌ FAILED";
    logContent += `\n--- Result ---\n${finalStatus}\n`;

    // Write the detailed log file
    await fs.writeFile(logFile, logContent);

    // Write the simple result to the console
    console.log(finalStatus);

    process.exit(passed ? 0 : 1);
}

main();
