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

interface McpPreferences {
    primary: string | null;
    secondary: string | null;
    avoided: string | null;
}

interface Persona {
    id: string;
    name: string;
    prompt: string;
    mcpPreferences: McpPreferences;
}

// ... (personaKeywords remain the same)

export class Orchestrator {
    // ... (properties remain the same)
    private personas: Record<string, Persona> = {};
    // ... (constructor, getInstance, etc. remain the same)

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
                    prompt: original.system_prompt,
                    mcpPreferences: this.parseMcpPreferences(original.system_prompt),
                };
            }
            this.personas = transformedPersonas;

        } catch (e) { 
            console.error("DEBUG: Failed to load or parse personas.json", e);
        }
    }

    private parseMcpPreferences(promptText: string): McpPreferences {
        const prefs: McpPreferences = { primary: null, secondary: null, avoided: null };
        if (!promptText) return prefs;

        const primaryMatch = promptText.match(/- \*\*Primary\*\*:\s*`(\w+)`/);
        if (primaryMatch) prefs.primary = primaryMatch[1];

        const secondaryMatch = promptText.match(/- \*\*Secondary\*\*:\s*`(\w+)`/);
        if (secondaryMatch) prefs.secondary = secondaryMatch[1];
        
        const avoidedMatch = promptText.match(/- \*\*Avoided\*\*:\s*`(\w+)`/);
        if (avoidedMatch) prefs.avoided = avoidedMatch[1];

        return prefs;
    }

    public getMcpPreferences(personaId: string): McpPreferences | null {
        return this.personas[personaId]?.mcpPreferences || null;
    }

    // ... (getSystemPrompt and detectPersona remain the same)
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
