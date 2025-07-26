// /Users/rob/Development/SuperCode/SuperCode/src/commands/explain.ts
import type { Argv } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cmd } from "../cmd";
import { Orchestrator, realFileReader } from "../session/orchestrator";

const ExplainCommand = cmd({
    command: "explain [code...]",
    describe: "Explain a piece of code or a concept",
    builder: (yargs: Argv) => {
        return yargs
            .positional("code", { describe: "The code or concept to explain", type: "string", array: true, default: [] })
            .option("persona", { alias: "p", describe: "The persona to use for the explanation", type: "string" });
    },
    handler: async (args) => {
        await Orchestrator.initialize(realFileReader);
        const orchestrator = Orchestrator.getInstance();
        
        let personaId = args.persona;
        if (!personaId) {
            const userInput = args.code.join(' ');
            personaId = orchestrator.detectPersona(userInput);
        }
        
        const systemPrompt = await orchestrator.getSystemPrompt(personaId);
        
        console.log(systemPrompt);
    },
});

// This structure makes the command runnable
yargs(hideBin(process.argv))
    .command(ExplainCommand)
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .parse();

