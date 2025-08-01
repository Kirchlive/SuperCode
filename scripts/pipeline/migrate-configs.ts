// /Users/rob/Development/SuperCode/SuperCode/scripts/pipeline/migrate-configs.ts

import * as fs from 'fs/promises';
import * as path from 'path';

// --- CONFIGURATION ---
const SCRIPT_DIR = import.meta.dir;
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../../'); // Resolve to the SuperCode repo root
const PERSONAS_SOURCE_FILE = path.join(REPO_ROOT, 'external/superclaude/SuperClaude/Core/PERSONAS.md');
const OUTPUT_FILE = path.join(REPO_ROOT, 'src/personas.json');

interface Persona {
    id: string;
    name: string;
    description: string;
    system_prompt: string;
}

/**
 * A simple custom parser for the PERSONAS.md file.
 * It looks for headings like '## `--persona-architect`' and treats the following text as the prompt.
 */
function parsePersonasFile(content: string): Record<string, Partial<Persona>> {
    const personas: Record<string, Partial<Persona>> = {};
    const lines = content.split('\n');
    let currentPersonaId: string | null = null;
    let currentPromptLines: string[] = [];

    for (const line of lines) {
        const personaHeaderMatch = line.match(/^##\s+`--persona-([a-z_=-]+)`/);

        if (personaHeaderMatch) {
            // If we were processing a persona, save it before starting the new one.
            if (currentPersonaId && personas[currentPersonaId]) {
                personas[currentPersonaId]!.system_prompt = currentPromptLines.join('\n').trim();
            }

            // Start a new persona
            const newPersonaId = personaHeaderMatch[1]?.replace(/=.*/, ''); // Safely access and replace
            if (newPersonaId) {
                currentPersonaId = newPersonaId;
                personas[currentPersonaId] = { id: currentPersonaId };
                currentPromptLines = [];
            }
        } else if (currentPersonaId) {
            // If we are inside a persona block, collect the lines for the prompt.
            currentPromptLines.push(line);
        }
    }

    // Save the last persona in the file
    if (currentPersonaId && personas[currentPersonaId]) {
        personas[currentPersonaId]!.system_prompt = currentPromptLines.join('\n').trim();
    }

    return personas;
}


export async function main() {
    console.log('Starting Config Migrator for Personas...');

    try {
        // 1. Read the central PERSONAS.md file
        const fileContent = await fs.readFile(PERSONAS_SOURCE_FILE, 'utf-8');
        console.log(`Successfully read ${PERSONAS_SOURCE_FILE}`);

        // 2. Parse the file content to extract personas
        const parsedPersonas = parsePersonasFile(fileContent);
        
        // In a real scenario, we would enrich this with metadata from other files if needed,
        // but for now, this structure is sufficient.
        const finalPersonas = Object.fromEntries(
            Object.entries(parsedPersonas).map(([id, persona]) => [
                id,
                {
                    id: id,
                    name: persona.name || id.charAt(0).toUpperCase() + id.slice(1), // Capitalize ID as a fallback name
                    description: persona.description || 'No description provided.',
                    system_prompt: persona.system_prompt || '',
                }
            ])
        );

        // 3. Write the aggregated personas to a single JSON file
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(finalPersonas, null, 2));
        console.log(`\nSuccessfully migrated ${Object.keys(finalPersonas).length} personas to: ${OUTPUT_FILE}`);

        console.log('Config Migrator finished successfully!');

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.warn(`⚠️  WARNING: Persona file not found at: ${PERSONAS_SOURCE_FILE}. Skipping persona migration.`);
            await fs.writeFile(OUTPUT_FILE, JSON.stringify({}, null, 2));
        } else {
            console.error('An error occurred during config migration:');
            console.error(error);
            process.exit(1);
        }
    }
}

// main();
