// /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_analyze_logic.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

const REPO_ROOT = path.resolve(import.meta.dir, '../');
const LOG_DIR = path.join(REPO_ROOT, "test_results");
const LOG_FILE = path.join(LOG_DIR, "test_analyze_logic.log");

interface TestCase {
    name: string;
    args: string;
    expected: string[];
    unexpected: string[];
}

async function runTest(testCase: TestCase): Promise<boolean> {
    const command = `bun run src/commands/analyze.ts analyze ${testCase.args}`;
    let output = '';
    let passed = true;
    let logEntry = `--- Starting Test Case: ${testCase.name} ---\n`;
    logEntry += `Command: ${command}\n`;

    try {
        const { stdout, stderr } = await execAsync(command, { cwd: REPO_ROOT });
        output = stdout + stderr;
        logEntry += `Output:\n${output}\n`;

        for (const str of testCase.expected) {
            if (!output.includes(str)) {
                logEntry += `❌ FAILED: Expected string not found: '${str}'\n`;
                passed = false;
            }
        }

        for (const str of testCase.unexpected) {
            if (output.includes(str)) {
                logEntry += `❌ FAILED: Unexpected string found: '${str}'\n`;
                passed = false;
            }
        }

    } catch (error: any) {
        logEntry += `❌ FAILED: Command execution failed. Error: ${error.stdout}\n${error.stderr}\n`;
        passed = false;
    }

    if (passed) {
        logEntry += `✅ PASSED\n`;
    }
    logEntry += `--- Finished Test Case ---\n`;
    await fs.appendFile(LOG_FILE, logEntry + '\n');
    return passed;
}

async function main() {
    await fs.writeFile(LOG_FILE, `--- Analyze Command Logic Test ---\nRun At: ${new Date().toLocaleString()}\n`);

    const testCases: TestCase[] = [
        {
            name: "Default arguments",
            args: "src/",
            expected: ["Target: src/", "Focus: quality", "Depth: quick", "Format: text", "Analyzing for code quality issues..."],
            unexpected: ["Analyzing for security vulnerabilities..."],
        },
        {
            name: "Security focus",
            args: "src/ --focus security",
            expected: ["Target: src/", "Focus: security", "Analyzing for security vulnerabilities..."],
            unexpected: ["Analyzing for code quality issues..."],
        },
        {
            name: "Deep performance analysis",
            args: "src/ --focus performance --depth deep",
            expected: ["Target: src/", "Focus: performance", "Depth: deep", "Analyzing for performance bottlenecks..."],
            unexpected: [],
        },
    ];

    let allPassed = true;
    for (const tc of testCases) {
        if (!await runTest(tc)) {
            allPassed = false;
        }
    }

    const finalStatus = allPassed ? "✅ PASSED" : "❌ FAILED";
    console.log(finalStatus);
    await fs.appendFile(LOG_FILE, `\n--- Overall Result: ${finalStatus} ---\n`);

    process.exit(allPassed ? 0 : 1);
}

main();
