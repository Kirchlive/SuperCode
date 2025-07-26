// /Users/rob/Development/SuperCode/SuperCode/index.ts
import { Command } from 'commander';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const program = new Command();
    program
        .name('supercode-cli')
        .description('The CLI for the SuperCode Integration Pipeline')
        .version('0.1.0');

    // Dynamically load all command files from the generated directory
    const commandFiles = await glob(path.join(__dirname, 'src/commands/*.ts'));

    for (const file of commandFiles) {
        try {
            // Import the command module
            const commandModule = await import(file);
            
            // Find any exported object that is an instance of Command
            for (const key in commandModule) {
                if (commandModule[key] instanceof Command) {
                    program.addCommand(commandModule[key]);
                }
            }
        } catch (error) {
            console.error(`Failed to load command from file: ${file}`);
            console.error(error);
        }
    }

    // If no command is specified, show help
    if (process.argv.length < 3) {
        program.help();
    }

    // Parse the arguments from the command line
    program.parse(process.argv);
}

main().catch(error => {
    console.error("An unexpected error occurred:");
    console.error(error);
    process.exit(1);
});
