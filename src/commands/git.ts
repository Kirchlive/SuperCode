// /Users/rob/Development/SuperCode/SuperCode/src/commands/git.ts
import type { Argv } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cmd } from "../cmd";
import { Orchestrator, realFileReader } from "../session/orchestrator";

const GitCommand = cmd({
    command: "git [args...]",
    describe: "Git operations with intelligent commit messages and branch management",
    builder: (yargs: Argv) => {
        return yargs
            .positional("args", { describe: "The git arguments", type: "string", array: true, default: [] })
            .option("persona", { alias: "p", describe: "The persona to use for the git operation", type: "string" });
    },
    handler: async (args) => {
        await Orchestrator.initialize(realFileReader);
        const orchestrator = Orchestrator.getInstance();
        
        let personaId = args.persona;
        if (!personaId) {
            const userInput = args.args.join(' ');
            personaId = orchestrator.detectPersona(userInput);
        }
        
        const systemPrompt = await orchestrator.getSystemPrompt(personaId);
        
        console.log(systemPrompt);
    },
});

// This structure makes the command runnable
yargs(hideBin(process.argv))
    .command(GitCommand)
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .parse();

