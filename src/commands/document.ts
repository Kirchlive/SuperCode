// /Users/rob/Development/SuperCode/SuperCode/src/commands/document.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the document command',
            required: true,
        })
        .option('type', {
            type: 'string',
            choices: ['inline', 'external', 'api', 'guide'],
            description: 'The type of documentation',
        })
        .option('style', {
            type: 'string',
            choices: ['brief', 'detailed'],
            description: 'The documentation style',
        })
        .option('verbose', {
            type: 'boolean',
            description: 'Enable verbose output',
        })
        .help()
        .argv;

    try {
        await Orchestrator.initialize(realFileReader);
        const orchestrator = Orchestrator.getInstance();

        const personaId = 'scribe'; // The document command should always default to the scribe persona.

        const systemPrompt = await orchestrator.getSystemPrompt(personaId);

        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Documentation Type: ${argv.type || 'default'}`);
            console.log(`Style: ${argv.style || 'brief'}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Documentation Type: ${argv.type || 'default'}`);
            console.log(`Style: ${argv.style || 'brief'}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Documentation Type: ${argv.type || 'default'}`);
            console.log(`Style: ${argv.style || 'brief'}`);
        }

    } catch (error) {
        console.error("An error occurred during the document command execution:", error);
        process.exit(1);
    }
}

main();
