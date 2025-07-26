// /Users/rob/Development/SuperCode/SuperCode/src/commands/cleanup.ts
import type { Argv } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cmd } from "../cmd";
import { Orchestrator, realFileReader } from "../session/orchestrator";

const CleanupCommand = cmd({
    command: "cleanup [task...]",
    describe: "Clean up code, remove dead code, and optimize project structure",
    builder: (yargs: Argv) => {
        return yargs
            .positional("task", { describe: "The cleanup task", type: "string", array: true, default: [] })
            .option("persona", { alias: "p", describe: "The persona to use for cleanup", type: "string" });
    },
    handler: async (args) => {
        await Orchestrator.initialize(realFileReader);
        const orchestrator = Orchestrator.getInstance();
        
        let personaId = args.persona;
        if (!personaId) {
            const userInput = args.task.join(' ');
            personaId = orchestrator.detectPersona(userInput);
        }
        
        const systemPrompt = await orchestrator.getSystemPrompt(personaId);
        
        console.log(systemPrompt);
    },
});

// This structure makes the command runnable
yargs(hideBin(process.argv))
    .command(CleanupCommand)
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .parse();

