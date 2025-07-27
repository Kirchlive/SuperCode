// /Users/rob/Development/SuperCode/SuperCode/src/commands/analyze.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Orchestrator, realFileReader } from '../session/orchestrator';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('prompt', {
            alias: 'p',
            type: 'string',
            description: 'The user prompt for the analysis',
            required: true,
        })
        .help()
        .argv;

    try {
        // Initialize the orchestrator
        await Orchestrator.initialize(realFileReader);
        const orchestrator = Orchestrator.getInstance();

        // Detect the appropriate persona from the prompt
        const personaId = orchestrator.detectPersona(argv.prompt);

        // Get the full system prompt, including the detected persona
        const systemPrompt = await orchestrator.getSystemPrompt(personaId || undefined);

        // For this test, we will just print the generated prompt.
        // In a full implementation, this would be sent to the LLM.
        console.log("--- Generated System Prompt ---");
        console.log(systemPrompt);
        console.log("\n--- End of Prompt ---");
        console.log(`\nDetected Persona: ${personaId || 'None'}`);

    } catch (error) {
        console.error("An error occurred during the analyze command execution:", error);
        process.exit(1);
    }
}

main();
