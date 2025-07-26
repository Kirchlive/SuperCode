// /Users/rob/Development/SuperCode/SuperCode/src/commands/document.ts
import type { Argv } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cmd } from "../cmd";
import { Orchestrator, realFileReader } from "../session/orchestrator";

const DocumentCommand = cmd({
    command: "document [files...]",
    describe: "Create focused documentation for specific components or features",
    builder: (yargs: Argv) => {
        return yargs
            .positional("files", { describe: "The files to document", type: "string", array: true, default: [] })
            .option("persona", { alias: "p", describe: "The persona to use for documentation", type: "string" });
    },
    handler: async (args) => {
        await Orchestrator.initialize(realFileReader);
        const orchestrator = Orchestrator.getInstance();
        
        const systemPrompt = await orchestrator.getSystemPrompt(args.persona);
        
        console.log(systemPrompt);
    },
});

// This structure makes the command runnable
yargs(hideBin(process.argv))
    .command(DocumentCommand)
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .parse();

