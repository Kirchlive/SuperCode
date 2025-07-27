// /Users/rob/Development/SuperCode/SuperCode/src/commands/test.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the test command',
            required: true,
        })
        .option('type', {
            type: 'string',
            choices: ['unit', 'integration', 'e2e', 'all'],
            description: 'The type of test to run',
        })
        .option('coverage', {
            type: 'boolean',
            description: 'Generate coverage reports',
        })
        .option('watch', {
            type: 'boolean',
            description: 'Run tests in watch mode',
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
        const personaId = orchestrator.detectPersona(detectionPrompt) || 'qa';

        const systemPrompt = await orchestrator.getSystemPrompt(personaId);

        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Test Type: ${argv.type || 'default'}`);
            console.log(`Coverage: ${argv.coverage || false}`);
            console.log(`Watch Mode: ${argv.watch || false}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Test Type: ${argv.type || 'default'}`);
            console.log(`Coverage: ${argv.coverage || false}`);
            console.log(`Watch Mode: ${argv.watch || false}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Test Type: ${argv.type || 'default'}`);
            console.log(`Coverage: ${argv.coverage || false}`);
            console.log(`Watch Mode: ${argv.watch || false}`);
        }

    } catch (error) {
        console.error("An error occurred during the test command execution:", error);
        process.exit(1);
    }
}

main();
