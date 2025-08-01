// /Users/rob/Development/SuperCode/SuperCode/src/session/orchestrator.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { domainKeywords, intentKeywords } from './detection-patterns';

interface Persona {
    id: string;
    name: string;
    description: string;
    system_prompt: string;
}

export class Orchestrator {
    private static instance: Orchestrator;
    private personas: Record<string, Persona> = {};

    private constructor() {
        this.loadPersonas();
    }

    public static getInstance(): Orchestrator {
        if (!Orchestrator.instance) {
            Orchestrator.instance = new Orchestrator();
        }
        return Orchestrator.instance;
    }

    private async loadPersonas(): Promise<void> {
        try {
            const personasPath = path.join(import.meta.dir, '../personas.json');
            const fileContent = await fs.readFile(personasPath, 'utf-8');
            this.personas = JSON.parse(fileContent);
            console.log(`✅ ${Object.keys(this.personas).length} personas loaded successfully.`);
        } catch (error) {
            console.error('🔴 FATAL: Could not load personas.json.', error);
        }
    }

    public detectDomain(userInput: string): string | null {
        const scores: Record<string, number> = {};
        const words = userInput.toLowerCase().split(/\s+/);

        for (const domain in domainKeywords) {
            scores[domain] = 0;
            for (const keyword of domainKeywords[domain as keyof typeof domainKeywords]) {
                if (words.includes(keyword)) {
                    scores[domain]++;
                }
            }
        }

        let bestDomain: string | null = null;
        let maxScore = 0;
        for (const domain in scores) {
            if (scores[domain] > maxScore) {
                maxScore = scores[domain];
                bestDomain = domain;
            }
        }

        return bestDomain;
    }

    public detectIntent(userInput: string): string | null {
        const scores: Record<string, number> = {};
        const words = userInput.toLowerCase().split(/\s+/);

        for (const intent in intentKeywords) {
            scores[intent] = 0;
            for (const keyword of intentKeywords[intent as keyof typeof intentKeywords]) {
                if (words.includes(keyword)) {
                    scores[intent]++;
                }
            }
        }

        let bestIntent: string | null = null;
        let maxScore = 0;
        for (const intent in scores) {
            if (scores[intent] > maxScore) {
                maxScore = scores[intent];
                bestIntent = intent;
            }
        }

        return bestIntent;
    }

public detectPersona(userInput: string): string | null {
        const domain = this.detectDomain(userInput);
        const intent = this.detectIntent(userInput);

        // Architect has priority for design tasks
        if (userInput.includes("design") || userInput.includes("architecture")) {
            return "architect";
        }

        // Specific intent/domain combinations
        if (intent === "creation" && domain === "frontend") return "frontend";
        if (intent === "creation" && domain === "backend") return "backend";
        
        // Domain-first mapping
        if (domain === "security") return "security";
        if (domain === "infrastructure") return "devops";
        if (domain === "documentation") return "scribe";

        // Intent-based mapping
        if (intent === "analysis" || intent === "debugging") return "analyzer";
        if (intent === "modification") return "refactorer";
        
        // General purpose fallback
        return "analyzer";
    }

    public async executeSuperClaudeCommand(props: { command: string, args: any, userInput: string }): Promise<{ updates: any[], result: any }> {
        const updates = [];
        let result;
        const personaId = this.detectPersona(props.userInput);
        const persona = personaId ? this.personas[personaId] : null;
        let success = true;

        updates.push({ type: "update", message: `Detected Persona: ${persona ? persona.name : 'None'}` });

        try {
            const commandModule = await import(`../commands/${props.command}.ts`);
            const commandKey = Object.keys(commandModule).find(key => key.endsWith('Command'));
            
            if (commandKey && commandModule[commandKey] && typeof commandModule[commandKey].handler === 'function') {
                updates.push({ type: "update", message: `Routing to command: ${props.command}` });
                await commandModule[commandKey].handler(props.args);
            } else {
                throw new Error(`Command handler for '${props.command}' not found or invalid.`);
            }
        } catch (error: any) {
            success = false;
            updates.push({ type: "error", message: `Error executing command '${props.command}': ${error.message}` });
        }

        result = { type: "result", result: success ? `Successfully executed ${props.command}.` : "Command execution failed." };
        return { updates, result };
    }
}
