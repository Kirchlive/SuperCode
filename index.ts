// /Users/rob/Development/SuperCode/SuperCode/index.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const cli = yargs(hideBin(process.argv));

    // Dynamically load all command files from the generated directory
    const commandFiles = await glob(path.join(__dirname, 'src/commands/*.ts'));

    for (const file of commandFiles) {
        try {
            const commandModule = await import(file);
            // Find any exported object that has a 'command' property (our command modules)
            for (const key in commandModule) {
                if (commandModule[key] && typeof commandModule[key] === 'object' && 'command' in commandModule[key]) {
                    cli.command(commandModule[key]);
                }
            }
        } catch (error) {
            console.error(`Failed to load command from file: ${file}`);
            console.error(error);
        }
    }

    cli
        .demandCommand(1, 'You need at least one command before moving on')
        .help()
        .argv;
}

main().catch(error => {
    console.error("An unexpected error occurred:");
    console.error(error);
    process.exit(1);
});
