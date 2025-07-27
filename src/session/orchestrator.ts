// /Users/rob/Development/SuperCode/SuperCode/src/session/orchestrator.ts
import * as fs from 'fs/promises';
import * as path from 'path';

// Define an interface for the file system dependency
export interface FileSystemReader {
    readFile(filePath: string): Promise<string>;
}

// A real implementation that uses the 'fs' module
export const realFileReader: FileSystemReader = {
    readFile: (filePath: string) => fs.readFile(filePath, 'utf-8')
};

const SUPERCLAUDE_BASE_PATH = '/Users/rob/Development/SuperCode/SuperClaude_Framework/SuperClaude/Core';
const SUPERCODE_BASE_PATH = '/Users/rob/Development/SuperCode/SuperCode';
const CORE_PROMPT_FILES = ['CLAUDE.md', 'RULES.md', 'PRINCIPLES.md'];

interface Persona { id: string; name: string; prompt: string; }

const personaKeywords: Record<string, string[]> = {
    architect: ["architecture", "architectural", "system design", "scalability"],
    frontend: ["frontend", "ui", "ux", "react", "component", "responsive", "accessibility"],
    backend: ["backend", "server", "api", "database", "service", "reliability"],
    analyzer: ["analyze", "debug", "investigate", "root cause", "troubleshoot"],
    security: ["security", "vulnerability", "threat", "compliance", "cve"],
    mentor: ["explain", "teach", "learn", "understand", "concept"],
    refactorer: ["refactor", "cleanup", "technical debt", "improve code"],
    performance: ["performance", "optimize", "bottleneck", "speed"],
    qa: ["test", "testing", "quality", "validation", "qa"],
    devops: ["devops", "deploy", "ci/cd", "infrastructure", "automation", "docker"],
    scribe: ["docs", "documentation", "write", "guide", "readme"],
};

export class Orchestrator {
    private static instance: Orchestrator;
    private baseSystemPrompt: string | null = null;
    private personas: Record<string, Persona> = {};
    private isInitialized = false;

    private constructor() {}

    public static async initialize(reader: FileSystemReader): Promise<void> {
        if (Orchestrator.getInstance().isInitialized) return;
        await Orchestrator.getInstance().loadAll(reader);
    }

    public static getInstance(): Orchestrator {
        if (!Orchestrator.instance) {
            Orchestrator.instance = new Orchestrator();
        }
        return Orchestrator.instance;
    }

    private async loadAll(reader: FileSystemReader): Promise<void> {
        await this.loadBaseSystemPrompt(reader);
        await this.loadPersonas(reader);
        this.isInitialized = true;
    }

    private async loadBaseSystemPrompt(reader: FileSystemReader): Promise<void> {
        try {
            const prompts = await Promise.all(CORE_PROMPT_FILES.map(file => reader.readFile(path.join(SUPERCLAUDE_BASE_PATH, file))));
            this.baseSystemPrompt = prompts.join('\n\n---\n\n');
        } catch (e) { this.baseSystemPrompt = 'Error loading prompt.'; }
    }

    private async loadPersonas(reader: FileSystemReader): Promise<void> {
        try {
            const content = await reader.readFile(path.join(SUPERCODE_BASE_PATH, 'src/personas.json'));
            const parsedData: Record<string, any> = JSON.parse(content);
            
            const transformedPersonas: Record<string, Persona> = {};
            for (const key in parsedData) {
                const original = parsedData[key];
                transformedPersonas[key] = {
                    id: original.id,
                    name: original.name,
                    prompt: original.system_prompt
                };
            }
            this.personas = transformedPersonas;

        } catch (e) { 
            console.error("DEBUG: Failed to load or parse personas.json", e);
        }
    }

    public async getSystemPrompt(personaId?: string): Promise<string> {
        let finalPrompt = this.baseSystemPrompt || '';
        if (personaId && this.personas[personaId]) {
            const p = this.personas[personaId];
            finalPrompt += `\n\n--- PERSONA: ${p.name.toUpperCase()} ---\n\n${p.prompt}`;
        }
        return finalPrompt;
    }

    public detectPersona(userInput: string): string | null {
        const lowerInput = ` ${userInput.toLowerCase()} `;
        
        const allKeywords = Object.entries(personaKeywords).flatMap(([id, keywords]) => 
            keywords.map(keyword => ({ id, keyword }))
        );

        allKeywords.sort((a, b) => b.keyword.length - a.keyword.length);

        for (const { id, keyword } of allKeywords) {
            // Use surrounding spaces to ensure whole word matching
            if (lowerInput.includes(` ${keyword} `)) {
                return id;
            }
        }

        return null;
    }
}
