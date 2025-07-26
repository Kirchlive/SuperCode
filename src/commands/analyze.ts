// /Users/rob/Development/SuperCode/SuperCode/src/commands/analyze.ts
import type { Argv } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cmd } from "../cmd";
import { Orchestrator, realFileReader } from "../session/orchestrator";

const AnalyzeCommand = cmd({
    command: "analyze [files...]",
    describe: "Analyze code quality, security, performance, and architecture",
    builder: (yargs: Argv) => {
        return yargs
            .positional("files", { describe: "Files to analyze", type: "string", array: true, default: [] })
            .option("persona", { alias: "p", describe: "The persona to use", type: "string" })
            .option("focus", { alias: "f", describe: "The specific area to focus on", type: "string" })
            .option("mode", { alias: "m", describe: "The operational mode", type: "string" });
    },
handler: async (args) => {
        await Orchestrator.initialize(realFileReader);
        const orchestrator = Orchestrator.getInstance();
        
        let personaId = args.persona;
        if (!personaId) {
            const userInput = args.files.join(' ');
            personaId = orchestrator.detectPersona(userInput);
        }
        
        const systemPrompt = await orchestrator.getSystemPrompt(personaId);
        
        console.log(systemPrompt);
    },
});

// This structure makes the command runnable via 'bun run'
yargs(hideBin(process.argv))
    .command(AnalyzeCommand)
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .parse();
