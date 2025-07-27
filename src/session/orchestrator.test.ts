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
if (fileName === 'personas.json') return JSON.stringify({
            architect: { id: 'architect', name: 'Architect', system_prompt: '... \n- Primary: Sequential \n- Secondary: Context7 \n- Avoided: Magic' },
            frontend: { id: 'frontend', name: 'Frontend', system_prompt: '... \n- Primary: Magic \n- Secondary: Playwright' }
        });
        throw new Error(`File not found in mock: ${filePath}`);
    }
};

describe("Orchestrator MCP Preferences", () => {
    beforeAll(async () => {
        await Orchestrator.initialize(mockReader);
    });

    const orchestrator = Orchestrator.getInstance();

    test("should extract MCP preferences for a given persona", () => {
        const prefs = orchestrator.getMcpPreferences("frontend");
        expect(prefs).toEqual({
            primary: "Magic",
            secondary: "Playwright",
            avoided: null
        });
    });

    test("should handle personas with avoided preferences", () => {
        const prefs = orchestrator.getMcpPreferences("architect");
        expect(prefs).toEqual({
            primary: "Sequential",
            secondary: "Context7",
            avoided: "Magic"
        });
    });

    test("should return null for preferences if persona not found", () => {
        const prefs = orchestrator.getMcpPreferences("nonexistent");
        expect(prefs).toBeNull();
    });
});