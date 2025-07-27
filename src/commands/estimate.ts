// /Users/rob/Development/SuperCode/SuperCode/src/commands/estimate.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the estimate command',
            required: true,
        })
        .option('type', {
            type: 'string',
            choices: ['time', 'effort', 'complexity', 'cost'],
            description: 'The type of estimation',
        })
        .option('unit', {
            type: 'string',
            choices: ['hours', 'days', 'weeks'],
            description: 'The time unit for estimates',
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
        const personaId = orchestrator.detectPersona(detectionPrompt) || 'architect';

        const systemPrompt = await orchestrator.getSystemPrompt(personaId);

        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Estimation Type: ${argv.type || 'default'}`);
            console.log(`Unit: ${argv.unit || 'default'}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Estimation Type: ${argv.type || 'default'}`);
            console.log(`Unit: ${argv.unit || 'default'}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Estimation Type: ${argv.type || 'default'}`);
            console.log(`Unit: ${argv.unit || 'default'}`);
        }

    } catch (error) {
        console.error("An error occurred during the estimate command execution:", error);
        process.exit(1);
    }
}

main();
