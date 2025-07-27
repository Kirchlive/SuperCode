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

// Keywords are now tuples of [keyword, weight]
const personaKeywords: Record<string, [string, number][]> = {
    architect: [["architecture", 10], ["architectural", 10], ["system design", 8], ["scalability", 8]],
    frontend: [["frontend", 10], ["react", 9], ["vue", 9], ["angular", 9], ["ui", 8], ["ux", 8], ["component", 7], ["responsive", 7], ["accessibility", 7]],
    backend: [["backend", 10], ["server", 9], ["api", 9], ["database", 8], ["service", 7], ["reliability", 7]],
    analyzer: [["analyze", 10], ["debug", 9], ["investigate", 8], ["root cause", 8], ["troubleshoot", 8]],
    security: [["jwt", 20], ["oauth", 20], ["encryption", 15], ["security", 15], ["vulnerability", 12], ["threat", 10], ["compliance", 8], ["cve", 20]],
    mentor: [["explain", 10], ["teach", 9], ["learn", 8], ["understand", 8], ["concept", 7]],
    refactorer: [["refactor", 10], ["cleanup", 8], ["technical debt", 10], ["improve code", 8]],
    performance: [["performance", 10], ["optimize", 9], ["bottleneck", 9], ["speed", 8]],
    qa: [["test", 10], ["testing", 10], ["quality", 8], ["validation", 5], ["qa", 10]], // "validation" is now weighted lower
    devops: [["devops", 10], ["deploy", 9], ["ci/cd", 10], ["infrastructure", 8], ["automation", 8], ["docker", 9]],
    scribe: [["docs", 10], ["documentation", 10], ["write", 7], ["guide", 7], ["readme", 8]],
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
        const lowerInput = userInput.toLowerCase();
        const scores: Record<string, number> = {};

        if (process.env.TEST_ENV === 'true') console.log(`\n--- Persona Scoring for: "${userInput}" ---`);

        for (const personaId in personaKeywords) {
            scores[personaId] = 0;
            for (const [keyword, weight] of personaKeywords[personaId]) {
                if (lowerInput.includes(keyword)) {
                    const score = (keyword.length * weight); // Score is now length * weight
                    scores[personaId] += score;
                    if (process.env.TEST_ENV === 'true') {
                        console.log(`[${personaId}] +${score} (from keyword: "${keyword}", weight: ${weight}) -> Total: ${scores[personaId]}`);
                    }
                }
            }
        }

        let bestPersona: string | null = null;
        let maxScore = 0;

        for (const personaId in scores) {
            if (scores[personaId] > maxScore) {
                maxScore = scores[personaId];
                bestPersona = personaId;
            }
        }
        
        if (process.env.TEST_ENV === 'true') console.log(`--- Final Decision: ${bestPersona || 'None'} (Score: ${maxScore}) ---\n`);

        // Only return a persona if a reasonably strong match is found (threshold increased)
        return maxScore >= 20 ? bestPersona : null;
    }
}
