// /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_design_command.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

const REPO_ROOT = "/Users/rob/Development/SuperCode/SuperCode";
const LOG_FILE = path.join(REPO_ROOT, "test_results", "test_design_command.log");
let LOG_HISTORY: string[] = [];

interface TestCase {
    name: string;
    prompt: string;
    args: string;
    expected: string[];
    unexpected: string[];
}

async function runTest(testCase: TestCase): Promise<boolean> {
    const command = `TEST_ENV=true bun run src/commands/design.ts --prompt "${testCase.prompt}" ${testCase.args}`;
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

    } catch (error) {
        logEntry += `❌ FAILED: Command execution failed. Error: ${error}\n`;
        passed = false;
    }

    if (passed) {
        logEntry += `✅ PASSED: Test Case '${testCase.name}'\n`;
    }
    logEntry += `--- Finished Test Case: ${testCase.name} ---\n`;
    LOG_HISTORY.push(logEntry);
    return passed;
}

async function main() {
    const runTimestamp = new Date().toISOString();
    let runNumber = 1;

    try {
        const existingLog = await fs.readFile(LOG_FILE, 'utf-8');
        const firstLine = existingLog.split('\n')[0];
        const match = firstLine.match(/^Run #(\d+)/);
        if (match) {
            runNumber = parseInt(match[1], 10) + 1;
        }
    } catch (e) {}

    const testCases: TestCase[] = [
        {
            name: "Design API",
            prompt: "a new user management API",
            args: "--type api --format spec",
            expected: ["Detected Persona: backend", "Design Type: api", "Output Format: spec"],
            unexpected: ["Detected Persona: architect"],
        },
        {
            name: "Design System Architecture",
            prompt: "the microservices architecture for the new e-commerce platform",
            args: "--type architecture --format diagram",
            expected: ["Detected Persona: architect", "Design Type: architecture", "Output Format: diagram"],
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
    const fullLogOutput = `Run #${runNumber} - ${runTimestamp}\n---\n` + LOG_HISTORY.join('\n') + `\nFinal Result: ${finalStatus}\n`;

    console.log(fullLogOutput);
    console.log(finalStatus);

    try {
        const existingLog = await fs.readFile(LOG_FILE, 'utf-8');
        await fs.writeFile(LOG_FILE, fullLogOutput + '\n---\n\n' + existingLog);
    } catch (e) {
        await fs.writeFile(LOG_FILE, fullLogOutput);
    }

    process.exit(allPassed ? 0 : 1);
}

main();
