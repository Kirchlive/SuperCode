// /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_analysis_commands.ts
import { Orchestrator } from '../src/session/orchestrator';
import { expect, test, describe } from "bun:test";

// Mock the console.log to capture output
let consoleOutput: string[] = [];
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
    consoleOutput.push(args.join(' '));
};

describe("Analysis Commands Integration Test", () => {
    const orchestrator = Orchestrator.getInstance();

    test("analyze command should find files and TODOs", async () => {
        consoleOutput = [];
        const props = {
            command: "analyze",
            args: { target: "src" },
            userInput: "analyze src"
        };
        await orchestrator.executeSuperClaudeCommand(props);
        const fullOutput = consoleOutput.join('\n');
        expect(fullOutput).toContain("Found");
        expect(fullOutput).toContain("TypeScript files");
        expect(fullOutput).toContain("TODO");
    });

    test("explain command should read a file", async () => {
        consoleOutput = [];
        const props = {
            command: "explain",
            args: { target: "package.json" },
            userInput: "explain package.json"
        };
        await orchestrator.executeSuperClaudeCommand(props);
        const fullOutput = consoleOutput.join('\n');
        expect(fullOutput).toContain("File 'package.json' has");
        expect(fullOutput).toContain("lines");
    });

    test("troubleshoot command should find errors in logs", async () => {
        consoleOutput = [];
        // We need a dummy log file for this test
        const fs = await import('fs/promises');
        const path = await import('path');
        const REPO_ROOT = path.resolve(import.meta.dir, '..');
        const logDir = path.join(REPO_ROOT, 'test_results');
        await fs.mkdir(logDir, { recursive: true });
        await fs.writeFile(path.join(logDir, 'dummy.log'), 'this is an error');

        const props = {
            command: "troubleshoot",
            args: { target: "test_results" },
            userInput: "troubleshoot the logs"
        };
        await orchestrator.executeSuperClaudeCommand(props);
        const fullOutput = consoleOutput.join('\n');
        expect(fullOutput).toContain("Found 1 log files containing the word 'error'.");
    });
});
