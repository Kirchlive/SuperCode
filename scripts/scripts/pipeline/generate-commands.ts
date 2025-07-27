// /Users/rob/Development/SuperCode/SuperCode/scripts/pipeline/generate-commands.ts

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import ejs from 'ejs';

// Define paths based on the project structure
const REPO_ROOT = process.cwd(); // Use the current working directory as the repo root
const TEMPLATE_PATH = path.join(REPO_ROOT, 'scripts/pipeline/templates/command.ts.ejs');
const SUBMODULE_COMMANDS_PATH = path.join(REPO_ROOT, 'external/superclaude/SuperClaude/Commands/*.md');
const OUTPUT_DIR = path.join(REPO_ROOT, 'src/commands');

// Helper function to convert kebab-case or snake_case to camelCase for variable names
function toCamelCase(str: string): string {
    return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
}

async function main() {
    console.log('Starting Command Generator...');

    try {
        // 1. Read the EJS template
        const template = await fs.readFile(TEMPLATE_PATH, 'utf-8');
        console.log('Successfully read template file.');

        // 2. Find all SuperClaude command markdown files
        const commandFiles = await glob(SUBMODULE_COMMANDS_PATH);
        if (commandFiles.length === 0) {
            throw new Error(`No command files found at: ${SUBMODULE_COMMANDS_PATH}`);
        }
        console.log(`Found ${commandFiles.length} command definition files.`);

        // 3. Process each command file
        for (const filePath of commandFiles) {
            const fileName = path.basename(filePath, '.md');
            console.log(`Processing: ${fileName}.md`);

            // Read and parse the markdown file's frontmatter
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const { data } = matter(fileContent); // 'data' contains the frontmatter

            // Prepare data for the template
            const templateData = {
                commandName: toCamelCase(data.command || fileName),
                description: data.description || 'No description provided.',
                aliases: data.aliases || [],
            };

            // 4. Render the template
            const generatedCode = ejs.render(template, templateData);

            // 5. Write the generated TypeScript file
            const outputFilePath = path.join(OUTPUT_DIR, `${templateData.commandName}.ts`);
            await fs.writeFile(outputFilePath, generatedCode);
            console.log(`Successfully generated: ${path.basename(outputFilePath)}`);
        }

        console.log('\nCommand Generator finished successfully!');

    } catch (error) {
        console.error('An error occurred during command generation:');
        console.error(error);
        process.exit(1);
    }
}

main();
