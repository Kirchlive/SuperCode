// /Users/rob/Development/SuperCode/SuperCode/src/commands/cleanup.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the cleanup command',
            required: true,
        })
        .option('type', {
            type: 'string',
            choices: ['code', 'imports', 'files', 'all'],
            description: 'The type of cleanup to perform',
        })
        .option('mode', {
            type: 'string',
            choices: ['safe', 'aggressive'],
            description: 'The cleanup mode',
        })
        .option('dry-run', {
            type: 'boolean',
            description: 'Preview changes without applying them',
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
        const personaId = orchestrator.detectPersona(detectionPrompt) || 'refactorer';

        const systemPrompt = await orchestrator.getSystemPrompt(personaId);

        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Cleanup Type: ${argv.type || 'default'}`);
            console.log(`Mode: ${argv.mode || 'safe'}`);
            console.log(`Dry Run: ${argv['dry-run'] || false}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Cleanup Type: ${argv.type || 'default'}`);
            console.log(`Mode: ${argv.mode || 'safe'}`);
            console.log(`Dry Run: ${argv['dry-run'] || false}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Cleanup Type: ${argv.type || 'default'}`);
            console.log(`Mode: ${argv.mode || 'safe'}`);
            console.log(`Dry Run: ${argv['dry-run'] || false}`);
        }

    } catch (error) {
        console.error("An error occurred during the cleanup command execution:", error);
        process.exit(1);
    }
}

main();
