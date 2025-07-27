// /Users/rob/Development/SuperCode/SuperCode/src/commands/explain.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the explain command',
            required: true,
        })
        .option('level', {
            type: 'string',
            choices: ['basic', 'intermediate', 'advanced'],
            description: 'The explanation complexity',
        })
        .option('format', {
            type: 'string',
            choices: ['text', 'diagram', 'examples'],
            description: 'The output format',
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

        const detectionPrompt = `${argv.prompt} ${argv.level || ''}`;
        const personaId = orchestrator.detectPersona(detectionPrompt) || 'mentor';

        const systemPrompt = await orchestrator.getSystemPrompt(personaId);

        if (process.env.TEST_ENV === 'true') {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Level: ${argv.level || 'default'}`);
            console.log(`Format: ${argv.format || 'default'}`);
        } else if (argv.verbose) {
            console.log("--- Generated System Prompt ---");
            console.log(systemPrompt);
            console.log("\n--- End of Prompt ---");
            console.log(`\nDetected Persona: ${personaId}`);
            console.log(`Level: ${argv.level || 'default'}`);
            console.log(`Format: ${argv.format || 'default'}`);
        } else {
            console.log(`Detected Persona: ${personaId}`);
            console.log(`Level: ${argv.level || 'default'}`);
            console.log(`Format: ${argv.format || 'default'}`);
        }

    } catch (error) {
        console.error("An error occurred during the explain command execution:", error);
        process.exit(1);
    }
}

main();
