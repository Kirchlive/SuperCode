// /Users/rob/Development/SuperCode/SuperCode/src/commands/build.ts
import type { Argv } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cmd } from "../cmd";
import { Orchestrator, realFileReader } from "../session/orchestrator";

const BuildCommand = cmd({
    command: "build [task...]",
    describe: "Build, compile, and package projects with error handling and optimization",
    builder: (yargs: Argv) => {
        return yargs
            .positional("task", { describe: "The build task to perform", type: "string", array: true, default: [] })
            .option("persona", { alias: "p", describe: "The persona to use for the build process", type: "string" });
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
    .command(BuildCommand)
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .parse();

