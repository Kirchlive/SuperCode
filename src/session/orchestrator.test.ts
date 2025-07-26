// /Users/rob/Development/SuperCode/SuperCode/src/session/orchestrator.test.ts
import { expect, test, describe, beforeAll } from "bun:test";
import { Orchestrator, FileSystemReader } from "./orchestrator";

// Create a mock file system reader for testing
const mockReader: FileSystemReader = {
    readFile: async (filePath: string) => {
        const fileName = require('path').basename(filePath);
        if (fileName === 'CLAUDE.md') return 'Base prompt from CLAUDE.md';
        if (fileName === 'RULES.md') return 'Rules from RULES.md';
        if (fileName === 'PRINCIPLES.md') return 'Principles from PRINCIPLES.md';
        if (fileName === 'personas.json') return JSON.stringify([
            { id: 'architect', name: 'Architect', prompt: 'Architect persona prompt' }
        ]);
        throw new Error(`File not found in mock: ${filePath}`);
    }
};

describe("Orchestrator", () => {
    beforeAll(async () => {
        // Initialize the singleton instance with our mock reader
        await Orchestrator.initialize(mockReader);
    });

    test("should load and combine base prompts on initialize", async () => {
        const orchestrator = Orchestrator.getInstance();
        const prompt = await orchestrator.getSystemPrompt();
        expect(prompt).toContain("Base prompt from CLAUDE.md");
        expect(prompt).toContain("Rules from RULES.md");
    });

    test("should correctly apply a persona to the system prompt", async () => {
        const orchestrator = Orchestrator.getInstance();
        const prompt = await orchestrator.getSystemPrompt("architect");
        expect(prompt).toContain("--- PERSONA: ARCHITECT ---");
        expect(prompt).toContain("Architect persona prompt");
    });
});
