// /Users/rob/Development/SuperCode/SuperCode/src/commands/troubleshoot.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the troubleshoot command',
            required: true,
        })
        .option('type', {
            type: 'string',
            choices: ['bug', 'build', 'performance', 'deployment'],
            description: 'The issue category',
        })
        .option('trace', {
            type: 'boolean',
            description: 'Enable detailed tracing',
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
            console.log(`Issue Type: ${argv.type || 'default'}`);
            console.log(`Trace: ${argv.trace || false}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Issue Type: ${argv.type || 'default'}`);
            console.log(`Trace: ${argv.trace || false}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Issue Type: ${argv.type || 'default'}`);
            console.log(`Trace: ${argv.trace || false}`);
        }

    } catch (error) {
        console.error("An error occurred during the troubleshoot command execution:", error);
        process.exit(1);
    }
}

main();
