// /Users/rob/Development/SuperCode/SuperCode/scripts/pipeline/injector.ts
import fs from 'fs/promises';

const INJECTION_MARKER = '// TODO: Implement the actual command logic by mapping from SuperClaude\'s core functions.';

/**
 * Injects the content of a logic file into a command file at a specific marker.
 * @param commandFilePath The path to the command boilerplate file.
 * @param logicFilePath The path to the translated core logic file.
 */
export async function injectLogic(commandFilePath: string, logicFilePath: string): Promise<void> {
    try {
        // 1. Read both files
        const commandFileContent = await fs.readFile(commandFilePath, 'utf-8');
        const logicFileContent = await fs.readFile(logicFilePath, 'utf-8');

        // 2. Check if the marker exists
        if (!commandFileContent.includes(INJECTION_MARKER)) {
            console.warn(`⚠️  WARNING: Injection marker not found in ${commandFilePath}. Skipping injection.`);
            return;
        }

        // 3. Perform the replacement
        // We indent the logic content to match the indentation of the marker
        const lines = commandFileContent.split('\n');
        const markerLine = lines.find(line => line.includes(INJECTION_MARKER));
        const indentation = markerLine?.match(/^\s*/)?.[0] || '';
        
        const indentedLogicContent = logicFileContent
            .split('\n')
            .map(line => indentation + line)
            .join('\n');

        const finalContent = commandFileContent.replace(INJECTION_MARKER, indentedLogicContent);

        // 4. Write the modified content back to the command file
        await fs.writeFile(commandFilePath, finalContent);

        console.log(`✅ Injected logic from ${logicFilePath} into ${commandFilePath}`);

    } catch (error) {
        console.error(`🔴 ERROR: Failed to inject logic for ${commandFilePath}.`);
        // Check if the logic file was missing
        if (error.code === 'ENOENT') {
            console.error(` -> Logic file not found: ${logicFilePath}`);
        } else {
            console.error(error);
        }
        // We don't re-throw the error, allowing the orchestrator to continue with other files.
    }
}
