#!/usr/bin/env bun

import * as fs from 'fs/promises';
import * as path from 'path';

export async function main() {
    console.log('🔧 Applying final fixes...');
    
    const buildDir = path.join(import.meta.dir, '../../build/supercode');
    
    // Fix 1: Remove unused DetectedIntent interface
    const sessionPath = path.join(buildDir, 'packages/opencode/src/session/index.ts');
    let sessionContent = await fs.readFile(sessionPath, 'utf-8');
    
    // Remove the interface since it's not used
    sessionContent = sessionContent.replace(
        /\/\/ SuperClaude Command Detection and Routing\ninterface DetectedIntent \{[\s\S]*?\}\n\n/,
        '// SuperClaude Command Detection and Routing\n\n'
    );
    
    // Fix the 'fs' import issue - we already have fs imported at the top
    sessionContent = sessionContent.replace(
        'const contextData = await fs.readFile(contextPath, \'utf-8\');',
        '// Using Node fs for file reading\n        const contextData = await Bun.file(contextPath).text();'
    );
    
    // Fix the 'session' undefined error
    sessionContent = sessionContent.replace(
        'return handler(session, command, flags, { domain, intent, context });',
        'return handler(command, flags, { domain, intent, context });'
    );
    
    // Add underscore prefix to unused parameters
    sessionContent = sessionContent.replace(
        /async function handle(\w+)Command\(command: string, flags: any, metadata: any\)/g,
        'async function handle$1Command(_command: string, _flags: any, metadata: any)'
    );
    
    // Fix unused contextPath parameter
    sessionContent = sessionContent.replace(
        'export async function handleSuperClaudeCommand(command: string, flags: any, contextPath: string)',
        'export async function handleSuperClaudeCommand(command: string, flags: any, _contextPath: string)'
    );
    
    // Fix unused input parameter in detectIntent
    sessionContent = sessionContent.replace(
        'function detectIntent(input: string, domain: string): string {',
        'function detectIntent(_input: string, domain: string): string {'
    );
    
    await fs.writeFile(sessionPath, sessionContent);
    console.log('✓ Fixed session/index.ts');
    
    // Fix 2: Update superclaude.ts to match tool pattern
    const toolPath = path.join(buildDir, 'packages/opencode/src/tool/superclaude.ts');
    
    // Read a sample tool to understand the pattern better
    const bashToolContent = await fs.readFile(
        path.join(buildDir, 'packages/opencode/src/tool/bash.ts'), 
        'utf-8'
    );
    
    // Create a proper tool based on the pattern
    const superclaudeContent = `import { z } from "zod"
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
  execute: async ({ command, flags, contextPath }) => {
    // Import the patched session handler
    const session = await import("../session")
    
    // Route to SuperClaude command handler
    const result = await session.handleSuperClaudeCommand(command, flags || {}, contextPath)
    
    return {
      title: \`SuperClaude: \${command}\`,
      metadata: {
        command,
        flags: flags || {},
        contextPath,
        result
      },
      output: JSON.stringify(result, null, 2)
    }
  }
})`;
    
    await fs.writeFile(toolPath, superclaudeContent);
    console.log('✓ Fixed superclaude.ts');
    
    console.log('✅ All fixes applied successfully');
}

if (import.meta.main) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}