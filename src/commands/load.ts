// /Users/rob/Development/SuperCode/SuperCode/src/commands/load.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the load command',
            required: true,
        })
        .option('type', {
            type: 'string',
            choices: ['project', 'config', 'deps', 'env'],
            description: 'The type of context to load',
        })
        .option('cache', {
            type: 'boolean',
            description: 'Cache the loaded context',
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
        const personaId = orchestrator.detectPersona(detectionPrompt) || 'analyzer';

        const systemPrompt = await orchestrator.getSystemPrompt(personaId);

        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Load Type: ${argv.type || 'default'}`);
            console.log(`Cache: ${argv.cache || false}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Load Type: ${argv.type || 'default'}`);
            console.log(`Cache: ${argv.cache || false}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Load Type: ${argv.type || 'default'}`);
            console.log(`Cache: ${argv.cache || false}`);
        }

    } catch (error) {
        console.error("An error occurred during the load command execution:", error);
        process.exit(1);
    }
}

main();
