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

describe("Orchestrator Persona Detection", () => {
    beforeAll(async () => {
        await Orchestrator.initialize(mockReader);
    });

    const orchestrator = Orchestrator.getInstance();

    test("should detect 'architect' persona from keywords", () => {
        const input = "Can you design the new architecture for our service?";
        expect(orchestrator.detectPersona(input)).toBe("architect");
    });

    test("should detect 'frontend' persona from keywords", () => {
        const input = "Create a new responsive component.";
        expect(orchestrator.detectPersona(input)).toBe("frontend");
    });

    test("should detect 'security' persona from keywords", () => {
        const input = "Check for a vulnerability in the auth flow.";
        expect(orchestrator.detectPersona(input)).toBe("security");
    });

    test("should return null if no persona is detected", () => {
        const input = "Hello, how are you today?";
        expect(orchestrator.detectPersona(input)).toBeNull();
    });

    test("should be case-insensitive", () => {
        const input = "Can you DESIGN the new ARCHITECTURE?";
        expect(orchestrator.detectPersona(input)).toBe("architect");
    });
});