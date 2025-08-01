#!/usr/bin/env bun

import { Project, SyntaxKind } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs/promises';

export async function main() {
    console.log('💉 Injecting superclaude.ts tool into registry...');
    
    const buildDir = path.join(import.meta.dir, '../../build/supercode');
    const registryPath = path.join(buildDir, 'packages/opencode/src/tool/registry.ts');
    const toolDir = path.join(buildDir, 'packages/opencode/src/tool');
    
    // Verify registry exists
    try {
        await fs.access(registryPath);
    } catch {
        throw new Error(`Registry file not found: ${registryPath}`);
    }
    
    // Create ts-morph project
    const project = new Project({
        tsConfigFilePath: path.join(buildDir, 'tsconfig.json'),
        skipAddingFilesFromTsConfig: true
    });
    
    // Add registry file
    const registryFile = project.addSourceFileAtPath(registryPath);
    
    // Create superclaude.ts tool content - matching the pattern of other tools
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
    
    // Find the ToolRegistry namespace using proper ts-morph methods
    const namespaces = registryFile.getNamespaces();
    const namespaceDecl = namespaces.find(ns => ns.getName() === 'ToolRegistry');
    if (!namespaceDecl) {
        throw new Error('Could not find ToolRegistry namespace');
    }
    
    // Add import for SuperClaudeTool after the last tool import
    const importDeclarations = registryFile.getImportDeclarations();
    const lastToolImport = importDeclarations.find(imp => 
        imp.getModuleSpecifierValue().startsWith('./'));
    
    if (lastToolImport) {
        const index = lastToolImport.getChildIndex();
        registryFile.insertStatements(index + 1, `import { SuperClaudeTool } from "./superclaude"`);
    }
    
    // Find the ALL array and add SuperClaudeTool
    const allVariable = namespaceDecl.getVariableDeclaration('ALL');
    if (!allVariable) {
        throw new Error('Could not find ALL array in ToolRegistry');
    }
    
    const initializer = allVariable.getInitializer();
    if (initializer && initializer.getKind() === SyntaxKind.ArrayLiteralExpression) {
        const arrayLiteral = initializer.asKindOrThrow(SyntaxKind.ArrayLiteralExpression);
        // Add SuperClaudeTool before the closing bracket
        arrayLiteral.addElement('SuperClaudeTool');
    }
    
    // Save the modified file
    await registryFile.save();
    console.log('✅ Tool injection completed successfully');
}

if (import.meta.main) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}