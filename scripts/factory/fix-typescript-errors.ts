#!/usr/bin/env bun

import * as fs from 'fs/promises';
import * as path from 'path';

export async function main() {
    console.log('🔧 Fixing TypeScript errors...');
    
    const buildDir = path.join(import.meta.dir, '../../build/supercode');
    
    // Fix session/index.ts
    const sessionPath = path.join(buildDir, 'packages/opencode/src/session/index.ts');
    let sessionContent = await fs.readFile(sessionPath, 'utf-8');
    
    // Remove duplicate imports and unused imports
    sessionContent = sessionContent.replace(
        /import \* as fs from 'fs\/promises';\nimport \* as path from 'path';\nimport { parse as parseYaml } from 'yaml';\nimport matter from 'gray-matter';/,
        ''
    );
    
    // Fix handleSuperClaudeCommand signature
    sessionContent = sessionContent.replace(
        /export async function handleSuperClaudeCommand\(session: any, command: string, flags: any\)/,
        'export async function handleSuperClaudeCommand(command: string, flags: any, contextPath: string)'
    );
    
    // Remove unused parameters from handler functions
    sessionContent = sessionContent.replace(
        /async function handle\w+Command\(session: any, command: string, flags: any, metadata: any\)/g,
        'async function handle$&Command(command: string, flags: any, metadata: any)'
    );
    
    await fs.writeFile(sessionPath, sessionContent);
    console.log('✓ Fixed session/index.ts');
    
    // Ensure the superclaude tool exists
    const toolPath = path.join(buildDir, 'packages/opencode/src/tool/superclaude.ts');
    try {
        await fs.access(toolPath);
        console.log('✓ SuperClaude tool exists');
    } catch {
        console.error('❌ SuperClaude tool missing!');
    }
    
    console.log('✅ TypeScript fixes completed');
}

if (import.meta.main) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}