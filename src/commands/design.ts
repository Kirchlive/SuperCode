// /Users/rob/Development/SuperCode/SuperCode/src/commands/design.ts
import type { Argv } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cmd } from "../cmd";
import { Orchestrator, realFileReader } from "../session/orchestrator";

const DesignCommand = cmd({
    command: "design [task...]",
    describe: "Design system architecture, APIs, and component interfaces",
    builder: (yargs: Argv) => {
        return yargs
            .positional("task", { describe: "The design task", type: "string", array: true, default: [] })
            .option("persona", { alias: "p", describe: "The persona to use for designing", type: "string" });
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
    .command(DesignCommand)
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .parse();

