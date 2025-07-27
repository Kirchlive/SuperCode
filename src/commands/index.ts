// /Users/rob/Development/SuperCode/SuperCode/src/commands/index.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the index command',
            required: true,
        })
        .option('type', {
            type: 'string',
            choices: ['docs', 'api', 'structure', 'readme'],
            description: 'The type of documentation to generate',
        })
        .option('format', {
            type: 'string',
            choices: ['md', 'json', 'yaml'],
            description: 'The output format',
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

        const detectionPrompt = `${argv.prompt} ${argv.type || ''}`;
        const personaId = orchestrator.detectPersona(detectionPrompt) || 'scribe';

        const systemPrompt = await orchestrator.getSystemPrompt(personaId);

        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Index Type: ${argv.type || 'default'}`);
            console.log(`Format: ${argv.format || 'default'}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Index Type: ${argv.type || 'default'}`);
            console.log(`Format: ${argv.format || 'default'}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Index Type: ${argv.type || 'default'}`);
            console.log(`Format: ${argv.format || 'default'}`);
        }

    } catch (error) {
        console.error("An error occurred during the index command execution:", error);
        process.exit(1);
    }
}

main();
