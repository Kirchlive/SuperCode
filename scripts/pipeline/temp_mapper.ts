// /Users/rob/Development/SuperCode/SuperCode/scripts/pipeline/map-logic.ts

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Project, SyntaxKind, Node } from 'ts-morph';

const execAsync = promisify(exec);

// --- CONFIGURATION ---
const REPO_ROOT = process.cwd();
const MAPPING_PATH = path.join(REPO_ROOT, 'scripts/pipeline/mapping.json');
const PYTHON_SOURCE_FILE = path.join(REPO_ROOT, 'external/superclaude/SuperClaude/Core/Filesystem.py');
const TEMP_TS_OUTPUT_PATH = path.join(REPO_ROOT, 'scripts/pipeline/temp_transpiled.ts');
const FINAL_TS_OUTPUT_DIR = path.join(REPO_ROOT, 'src/core-generated');

// --- MAIN LOGIC ---
async function main() {
    console.log('Starting Logic Mapper...');

    try {
        // --- Step A: Transpile Python to TypeScript ---
        console.log(`Transpiling Python file: ${path.basename(PYTHON_SOURCE_FILE)}...`);
        
        const PYTHON_EXECUTABLE = process.env.PYTHON;
if (!PYTHON_EXECUTABLE) {
    console.error("🔴 FATAL: PYTHON environment variable is not set. Please define it in the Makefile.");
    process.exit(1);
}
const command = `${PYTHON_EXECUTABLE} -m py2ts ${PYTHON_SOURCE_FILE} > ${TEMP_TS_OUTPUT_PATH}`;

// Ensure the py2ts module is available
try {
    // We check if the module can be found by the specific python executable
    await execAsync(`${PYTHON_EXECUTABLE} -m py2ts --version`);
} catch (error) {
    console.error('🔴 FATAL: `py2ts` module not found using the specified Python executable. Please ensure it is installed for this Python version.');
    process.exit(1);
}

        // Execute the transpiler
        await execAsync(command);
        console.log(`Successfully transpiled to temporary file: ${path.basename(TEMP_TS_OUTPUT_PATH)}`);

        // --- Step B: Map Logic using ts-morph ---
        console.log('Mapping transpiled code to OpenCode standards...');

        // 1. Read the mapping configuration
        const mappingConfig = JSON.parse(await fs.readFile(MAPPING_PATH, 'utf-8'));
        
        // 2. Initialize ts-morph project and parse the temp file
        const project = new Project();
        const sourceFile = project.addSourceFileAtPath(TEMP_TS_OUTPUT_PATH);

        // 3. Traverse the AST and replace function calls
        sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpression => {
            const expressionText = callExpression.getExpression().getText();

            // Check if the function call is in our mapping config
            if (mappingConfig[expressionText]) {
                const newExpressionText = mappingConfig[expressionText];
                console.log(`Mapping found: Replacing '${expressionText}' with '${newExpressionText}'`);
                
                // Replace the expression (e.g., 'Core.Filesystem.read_file' becomes 'tools.read')
                callExpression.getExpression().replaceWithText(newExpressionText);
            }
        });

        // 4. Save the modified, clean TypeScript code
        const finalOutputContent = sourceFile.getFullText();
        const finalOutputPath = path.join(FINAL_TS_OUTPUT_DIR, `${path.basename(PYTHON_SOURCE_FILE, '.py')}.ts`);
        
        await fs.mkdir(FINAL_TS_OUTPUT_DIR, { recursive: true });
        await fs.writeFile(finalOutputPath, finalOutputContent);
        console.log(`Successfully mapped and saved to: ${path.basename(finalOutputPath)}`);

        // --- Cleanup ---
        await fs.unlink(TEMP_TS_OUTPUT_PATH);
        console.log('Cleaned up temporary file.');

        console.log('\nLogic Mapper finished successfully!');

    } catch (error) {
        console.error('An error occurred during logic mapping:');
        console.error(error);
        // Clean up temp file on error
        try { await fs.unlink(TEMP_TS_OUTPUT_PATH); } catch (e) {}
        process.exit(1);
    }
}

main();
