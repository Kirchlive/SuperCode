// /Users/rob/Development/SuperCode/SuperCode/src/commands/estimate.ts
import type { Argv } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cmd } from "../cmd";
import { Orchestrator, realFileReader } from "../session/orchestrator";

const EstimateCommand = cmd({
    command: "estimate [task...]",
    describe: "Provide development estimates for tasks, features, or projects",
    builder: (yargs: Argv) => {
        return yargs
            .positional("task", { describe: "The task to estimate", type: "string", array: true, default: [] })
            .option("persona", { alias: "p", describe: "The persona to use for estimation", type: "string" });
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
    .command(EstimateCommand)
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .parse();

