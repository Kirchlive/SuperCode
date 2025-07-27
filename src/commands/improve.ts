// /Users/rob/Development/SuperCode/SuperCode/src/commands/improve.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the improve command',
            required: true,
        })
        .option('type', {
            type: 'string',
            choices: ['quality', 'performance', 'maintainability', 'style'],
            description: 'The type of improvement',
        })
        .option('safe', {
            type: 'boolean',
            description: 'Apply only safe, low-risk improvements',
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
            console.log(`Improvement Type: ${argv.type || 'default'}`);
            console.log(`Safe Mode: ${argv.safe || false}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Improvement Type: ${argv.type || 'default'}`);
            console.log(`Safe Mode: ${argv.safe || false}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Improvement Type: ${argv.type || 'default'}`);
            console.log(`Safe Mode: ${argv.safe || false}`);
        }

    } catch (error) {
        console.error("An error occurred during the improve command execution:", error);
        process.exit(1);
    }
}

main();
