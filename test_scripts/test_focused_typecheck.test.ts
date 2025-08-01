// /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_focused_typecheck.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

const REPO_ROOT = path.resolve(import.meta.dir, '../');
const LOG_DIR = path.join(REPO_ROOT, "test_results");
const LOG_FILE_PREFIX = "focused_typecheck_test_";
const FAILING_FILE = path.join(REPO_ROOT, 'scripts/pipeline/migrate-configs.ts');

let fullLogContent = "";

async function logSection(title: string, content: string | Promise<string>) {
    fullLogContent += `\n--- ${title.toUpperCase()} ---\n`;
    fullLogContent += await content;
    fullLogContent += `\n--- END ${title.toUpperCase()} ---\n`;
}

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(LOG_DIR, `${LOG_FILE_PREFIX}${timestamp}.log`);
    
    fullLogContent += `--- Focused TypeScript Diagnosis ---\n`;
    fullLogContent += `Run At: ${new Date().toLocaleString()}\n`;
    fullLogContent += `Target File: ${FAILING_FILE}\n`;

    // 1. Log Environment Info
    await logSection("Environment", (async () => {
        const bunVersion = await execAsync('bun --version').then(r => r.stdout.trim());
        const tscVersion = await execAsync('bunx tsc --version').then(r => r.stdout.trim());
        return `Bun Version: ${bunVersion}\nTypeScript Version: ${tscVersion}`;
    })());

    // 2. Log TSConfig
    await logSection("TSConfig", fs.readFile(path.join(REPO_ROOT, 'tsconfig.json'), 'utf-8'));

    // 3. Log Full Source Code
    await logSection("Full Source Code", fs.readFile(FAILING_FILE, 'utf-8'));

    // 4. Execute Focused Typecheck
    let passed = false;
try {
        const { stdout, stderr } = await execAsync(`bunx tsc --noEmit ${FAILING_FILE}`);
        const output = stdout + stderr;
        await logSection("TSC Output", output || "No output from tsc. This usually means success.");
        if (!output.includes("error TS")) {
            passed = true;
        }
    } catch (error: any) {
        const errorOutput = (error as any).stdout + '\\n' + (error as any).stderr;
        await logSection("TSC Error (Caught Exception)", errorOutput);
        
        const errorLineMatch = errorOutput.match(/(\(\d+,\d+\))/);
        if (errorLineMatch) {
            const errorLine = parseInt(errorLineMatch[1].split(',')[0].replace('(', ''), 10);
            const content = await fs.readFile(FAILING_FILE, 'utf-8');
            const lines = content.split('\\n');
            const context = lines.slice(Math.max(0, errorLine - 5), errorLine + 4).map((line, i) => `${Math.max(0, errorLine - 4) + i}: ${line}`).join('\\n');
            await logSection("Error Context", context);
        }
        passed = false;
    }
    } catch (error: any) {
        const errorOutput = (error as any).stdout + '\\n' + (error as any).stderr;
        await logSection("TSC Error (Caught Exception)", errorOutput);
        
        const errorLineMatch = errorOutput.match(/(\(\d+,\d+\))/);
        if (errorLineMatch) {
            const errorLine = parseInt(errorLineMatch[1].split(',')[0].replace('(', ''), 10);
            const content = await fs.readFile(FAILING_FILE, 'utf-8');
            const lines = content.split('\\n');
            const context = lines.slice(Math.max(0, errorLine - 5), errorLine + 4).map((line, i) => `${Math.max(0, errorLine - 4) + i}: ${line}`).join('\\n');
            await logSection("Error Context", context);
        }
        passed = false;
    }
    } catch (error: any) {
        const errorOutput = error.stdout + '\n' + error.stderr;
        await logSection("TSC Error (Caught Exception)", errorOutput);
        
        const errorLineMatch = errorOutput.match(/(\(\d+,\d+\))/);
        if (errorLineMatch) {
            const errorLine = parseInt(errorLineMatch[1].split(',')[0].replace('(', ''), 10);
            const content = await fs.readFile(FAILING_FILE, 'utf-8');
            const lines = content.split('\n');
            const context = lines.slice(Math.max(0, errorLine - 5), errorLine + 4).map((line, i) => `${Math.max(0, errorLine - 4) + i}: ${line}`).join('\n');
            await logSection("Error Context", context);
        }
        passed = false;
    }

    const finalStatus = passed ? "✅ PASSED" : "❌ FAILED";
    fullLogContent += `\n--- Overall Result ---\n${finalStatus}\n`;

    // Write the detailed log file
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.writeFile(logFile, fullLogContent);

    // Write the simple result to the console
    console.log(finalStatus);
    process.exit(passed ? 0 : 1);
}

main();
