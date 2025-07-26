// /Users/rob/Development/SuperCode/SuperCode/src/commands/improve.ts
import type { Argv } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cmd } from "../cmd";
import { Orchestrator, realFileReader } from "../session/orchestrator";

const ImproveCommand = cmd({
    command: "improve [task...]",
    describe: "Apply systematic improvements to code quality, performance, and maintainability",
    builder: (yargs: Argv) => {
        return yargs
            .positional("task", { describe: "The improvement task", type: "string", array: true, default: [] })
            .option("persona", { alias: "p", describe: "The persona to use for the improvement", type: "string" });
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
    .command(ImproveCommand)
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .parse();

