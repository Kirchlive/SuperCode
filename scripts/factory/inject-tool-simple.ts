#!/usr/bin/env bun

import * as path from 'path';
import * as fs from 'fs/promises';

export async function main() {
    console.log('💉 Injecting superclaude.ts tool into registry (simple approach)...');
    
    const buildDir = path.join(import.meta.dir, '../../build/supercode');
    const registryPath = path.join(buildDir, 'packages/opencode/src/tool/registry.ts');
    const toolDir = path.join(buildDir, 'packages/opencode/src/tool');
    
    // Verify registry exists
    try {
        await fs.access(registryPath);
    } catch {
        throw new Error(`Registry file not found: ${registryPath}`);
    }
    
    // Create superclaude.ts tool content
    const superclaudeToolContent = `import { z } from "zod"
import { Tool } from "./tool"

const DESCRIPTION = \`SuperClaude Intelligent Command Framework

Execute advanced AI-powered commands with context awareness and intelligent routing.

Features:
- Context-aware command execution
- Intelligent intent detection
- Persona-based routing
- Advanced pattern matching
\`

export const SuperClaudeTool = Tool.define("superclaude", {
  description: DESCRIPTION,
  parameters: z.object({
    command: z.string().describe("The SuperClaude command to execute"),
    flags: z.record(z.any()).optional().describe("Optional flags for the command"),
    contextPath: z.string().optional().default(".claude/context.json").describe("Path to context.json file")
  }),
  permissions: [],
  execute: async ({ command, flags, contextPath }) => {
    // Import the patched session handler
    const session = await import("../session")
    
    // Route to SuperClaude command handler
    const result = await session.handleSuperClaudeCommand(command, flags, contextPath)
    
    return {
      success: true,
      result
    }
  }
})`;
    
    // Write superclaude.ts tool file
    const toolPath = path.join(toolDir, 'superclaude.ts');
    await fs.writeFile(toolPath, superclaudeToolContent);
    console.log('✓ Created superclaude.ts tool');
    
    // Read registry file
    let registryContent = await fs.readFile(registryPath, 'utf-8');
    
    // Add import after the last tool import
    const lastImportMatch = registryContent.match(/(import { \w+Tool } from "\.\/\w+")\n/g);
    if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        registryContent = registryContent.replace(
            lastImport, 
            lastImport + 'import { SuperClaudeTool } from "./superclaude"\n'
        );
    }
    
    // Add SuperClaudeTool to the ALL array
    const allArrayMatch = registryContent.match(/const ALL = \[([\s\S]*?)\]/);
    if (allArrayMatch) {
        const toolsList = allArrayMatch[1];
        // Add SuperClaudeTool before the closing bracket
        registryContent = registryContent.replace(
            /const ALL = \[([\s\S]*?)\]/, 
            `const ALL = [${toolsList.trimEnd()},\n    SuperClaudeTool,\n  ]`
        );
    }
    
    // Write the modified registry back
    await fs.writeFile(registryPath, registryContent);
    console.log('✅ Tool injection completed successfully');
}

if (import.meta.main) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}