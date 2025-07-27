// /Users/rob/Development/SuperCode/SuperCode/src/commands/spawn.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the spawn command',
            required: true,
        })
        .option('parallel', {
            type: 'boolean',
            description: 'Execute subtasks concurrently',
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

        const detectionPrompt = `${argv.prompt}`;
        const personaId = orchestrator.detectPersona(detectionPrompt) || 'architect';

        const systemPrompt = await orchestrator.getSystemPrompt(personaId);

        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Parallel: ${argv.parallel || false}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Parallel: ${argv.parallel || false}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Parallel: ${argv.parallel || false}`);
        }

    } catch (error) {
        console.error("An error occurred during the spawn command execution:", error);
        process.exit(1);
    }
}

main();
