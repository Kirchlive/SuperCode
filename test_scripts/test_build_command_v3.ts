// /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_build_command_v3.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

const REPO_ROOT = "/Users/rob/Development/SuperCode/SuperCode";
const LOG_FILE = path.join(REPO_ROOT, "test_results", "test_build_command_v3.log");

interface TestCase {
    name: string;
    prompt: string;
    args: string;
    expected: string[];
    unexpected: string[];
}

async function runTest(testCase: TestCase): Promise<boolean> {
    const command = `TEST_ENV=true bun run src/commands/build.ts --prompt "${testCase.prompt}" ${testCase.args}`;
    let output = '';
    let passed = true;

    await fs.appendFile(LOG_FILE, `--- Starting Test Case: ${testCase.name} ---\n`);
    await fs.appendFile(LOG_FILE, `Command: ${command}\n`);

    try {
        const { stdout, stderr } = await execAsync(command, { cwd: REPO_ROOT });
        output = stdout + stderr;
        await fs.appendFile(LOG_FILE, `Output:\n${output}\n`);

        for (const str of testCase.expected) {
            if (!output.includes(str)) {
                await fs.appendFile(LOG_FILE, `❌ FAILED: Expected string not found: '${str}'\n`);
                passed = false;
            }
        }

        for (const str of testCase.unexpected) {
            if (output.includes(str)) {
                await fs.appendFile(LOG_FILE, `❌ FAILED: Unexpected string found: '${str}'\n`);
                passed = false;
            }
        }

    } catch (error) {
        await fs.appendFile(LOG_FILE, `❌ FAILED: Command execution failed. Error: ${error}\n`);
        passed = false;
    }

    if (passed) {
        await fs.appendFile(LOG_FILE, `✅ PASSED: Test Case '${testCase.name}'\n`);
    }
    await fs.appendFile(LOG_FILE, `--- Finished Test Case: ${testCase.name} ---\n\n`);
    return passed;
}

async function main() {
    await fs.writeFile(LOG_FILE, "Starting comprehensive test suite for 'build' command.\n\n");

    const testCases: TestCase[] = [
        {
            name: "Basic Dev Build",
            prompt: "build the main service",
            args: "--type dev",
            expected: ["Detected Persona: backend", "Build Type: dev", "Clean Build: false"],
            unexpected: ["--- PERSONA: FRONTEND ---"],
        },
        {
            name: "Production Build with Persona and Flags",
            prompt: "build the frontend component for production",
            args: "--type prod --clean --optimize",
            expected: ["Detected Persona: frontend", "Build Type: prod", "Clean Build: true", "Optimized: true"],
            unexpected: [],
        },
        {
            name: "Test Build with QA Persona",
            prompt: "run a test build",
            args: "--type test",
            expected: ["Build Type: test", "Detected Persona: qa"],
            unexpected: [],
        },
    ];

    let allPassed = true;
    for (const tc of testCases) {
        if (!await runTest(tc)) {
            allPassed = false;
        }
    }

    await fs.appendFile(LOG_FILE, "All test cases finished.\n");
    if (allPassed) {
        console.log("PASSED");
        process.exit(0);
    } else {
        console.log("FAILED");
        process.exit(1);
    }
}

main();
