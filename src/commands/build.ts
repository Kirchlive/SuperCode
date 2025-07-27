// /Users/rob/Development/SuperCode/SuperCode/src/commands/build.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the build command',
            required: true,
        })
        .option('type', {
            type: 'string',
            choices: ['dev', 'prod', 'test'],
            description: 'The type of build to perform',
        })
        .option('clean', {
            type: 'boolean',
            description: 'Clean build artifacts before building',
        })
        .option('optimize', {
            type: 'boolean',
            description: 'Enable build optimizations',
        })
        .help()
        .argv;

    try {
        // Initialize the orchestrator
        await Orchestrator.initialize(realFileReader);
        const orchestrator = Orchestrator.getInstance();

        // For the build command, we might not always have a clear persona.
        // We'll detect one if possible, but otherwise proceed without one.
        const personaId = orchestrator.detectPersona(argv.prompt);

        // Get the full system prompt
        const systemPrompt = await orchestrator.getSystemPrompt(personaId || undefined);

        // In test mode, produce minimal, verifiable output.
        // Otherwise, print the full prompt for manual inspection.
        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId || 'None'}`);
            console.log(`Build Type: ${argv.type || 'default'}`);
            console.log(`Clean Build: ${argv.clean || false}`);
            console.log(`Optimized: ${argv.optimize || false}`);
        } else {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId || 'None'}`);
            console.log(`Build Type: ${argv.type || 'default'}`);
            console.log(`Clean Build: ${argv.clean || false}`);
            console.log(`Optimized: ${argv.optimize || false}`);
        }

    } catch (error) {
        console.error("An error occurred during the build command execution:", error);
        process.exit(1);
    }
}

main();
