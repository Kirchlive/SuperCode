// /Users/rob/Development/SuperCode/SuperCode/src/commands/task.ts
import type { Argv } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cmd } from "../cmd";
import { Orchestrator, realFileReader } from "../session/orchestrator";

const TaskCommand = cmd({
    command: "task [description...]",
    describe: "Execute complex tasks with intelligent workflow management and cross-session persistence",
    builder: (yargs: Argv) => {
        return yargs
            .positional("description", { describe: "The task description", type: "string", array: true, default: [] })
            .option("persona", { alias: "p", describe: "The persona to use for the task", type: "string" });
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
    .command(TaskCommand)
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .parse();

