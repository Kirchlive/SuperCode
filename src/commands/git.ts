// /Users/rob/Development/SuperCode/SuperCode/src/commands/git.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the git command',
            required: true,
        })
        .option('smart-commit', {
            type: 'boolean',
            description: 'Generate intelligent commit messages',
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

        const personaId = 'devops'; // Git commands should always default to the devops persona.

        const systemPrompt = await orchestrator.getSystemPrompt(personaId);

        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Smart Commit: ${argv['smart-commit'] || false}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Smart Commit: ${argv['smart-commit'] || false}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Smart Commit: ${argv['smart-commit'] || false}`);
        }

    } catch (error) {
        console.error("An error occurred during the git command execution:", error);
        process.exit(1);
    }
}

main();
