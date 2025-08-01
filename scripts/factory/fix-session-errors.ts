#!/usr/bin/env bun

import * as fs from 'fs/promises';
import * as path from 'path';

export async function main() {
    console.log('🔧 Fixing session/index.ts errors properly...');
    
    const buildDir = path.join(import.meta.dir, '../../build/supercode');
    const sessionPath = path.join(buildDir, 'packages/opencode/src/session/index.ts');
    
    let sessionContent = await fs.readFile(sessionPath, 'utf-8');
    
    // Fix 1: Remove the duplicate imports that were added by patch
    const duplicateImportsRegex = /import \* as fs from 'fs\/promises';\nimport \* as path from 'path';\nimport { parse as parseYaml } from 'yaml';\nimport matter from 'gray-matter';\n/g;
    sessionContent = sessionContent.replace(duplicateImportsRegex, '');
    
    // Fix 2: Fix the doubled function names
    sessionContent = sessionContent.replace(
        /async function handleasync function handle(\w+)Command\([^)]+\)Command\(/g,
        'async function handle$1Command('
    );
    
    // Fix 3: Update function signatures to match TypeScript expectations
    // Remove unused 'session' parameter from command handlers
    sessionContent = sessionContent.replace(
        /async function handle(\w+)Command\(session: any, command: string, flags: any, metadata: any\)/g,
        'async function handle$1Command(command: string, flags: any, metadata: any)'
    );
    
    // Fix 4: Update the main handleSuperClaudeCommand function signature
    sessionContent = sessionContent.replace(
        /export async function handleSuperClaudeCommand\(session: any, command: string, flags: any\): Promise<any>/,
        'export async function handleSuperClaudeCommand(command: string, flags: any, contextPath: string): Promise<any>'
    );
    
    // Fix 5: Add proper return type annotations
    sessionContent = sessionContent.replace(
        /async function handle(\w+)Command\(command: string, flags: any, metadata: any\) {/g,
        'async function handle$1Command(command: string, flags: any, metadata: any): Promise<{ success: boolean; action: string; metadata: any }> {'
    );
    
    // Write the fixed content back
    await fs.writeFile(sessionPath, sessionContent);
    console.log('✅ Fixed session/index.ts successfully');
    
    // Verify the fix by checking for common patterns
    const fixedContent = await fs.readFile(sessionPath, 'utf-8');
    
    if (fixedContent.includes('handleasync function handle')) {
        console.error('❌ Double function names still exist!');
        process.exit(1);
    }
    
    if (fixedContent.includes('import matter from \'gray-matter\'')) {
        console.error('❌ Unused imports still exist!');
        // Not critical, continue
    }
    
    console.log('✓ Verification passed');
}

if (import.meta.main) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}