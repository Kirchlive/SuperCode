// /Users/rob/Development/SuperCode/SuperCode/src/commands/design.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the design command',
            required: true,
        })
        .option('type', {
            type: 'string',
            choices: ['architecture', 'api', 'component', 'database'],
            description: 'The type of design',
        })
        .option('format', {
            type: 'string',
            choices: ['diagram', 'spec', 'code'],
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
        const personaId = orchestrator.detectPersona(detectionPrompt);

        const systemPrompt = await orchestrator.getSystemPrompt(personaId || undefined);

        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId || 'None'}`);
            console.log(`Design Type: ${argv.type || 'default'}`);
            console.log(`Output Format: ${argv.format || 'default'}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId || 'None'}`);
            console.log(`Design Type: ${argv.type || 'default'}`);
            console.log(`Output Format: ${argv.format || 'default'}`);
        } else {
            console.log(`Detected Persona: ${personaId || 'None'}`);
            console.log(`Design Type: ${argv.type || 'default'}`);
            console.log(`Output Format: ${argv.format || 'default'}`);
        }

    } catch (error) {
        console.error("An error occurred during the design command execution:", error);
        process.exit(1);
    }
}

main();
