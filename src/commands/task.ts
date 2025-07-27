// /Users/rob/Development/SuperCode/SuperCode/src/commands/task.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the task command',
            required: true,
        })
        .option('strategy', {
            type: 'string',
            choices: ['systematic', 'agile', 'enterprise'],
            description: 'The execution strategy',
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

        const detectionPrompt = `${argv.prompt} ${argv.strategy || ''}`;
        const personaId = orchestrator.detectPersona(detectionPrompt) || 'architect';

        const systemPrompt = await orchestrator.getSystemPrompt(personaId);

        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Strategy: ${argv.strategy || 'default'}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Strategy: ${argv.strategy || 'default'}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Strategy: ${argv.strategy || 'default'}`);
        }

    } catch (error) {
        console.error("An error occurred during the task command execution:", error);
        process.exit(1);
    }
}

main();
