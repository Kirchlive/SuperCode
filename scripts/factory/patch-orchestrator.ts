#!/usr/bin/env bun

import { Project, SyntaxKind } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs/promises';

export async function main() {
    console.log('🔧 Patching orchestrator with SuperClaude logic...');
    
    const buildDir = path.join(import.meta.dir, '../../build/supercode');
    const orchestratorPath = path.join(buildDir, 'packages/opencode/src/session/index.ts');
    
    // Verify orchestrator exists
    try {
        await fs.access(orchestratorPath);
    } catch {
        throw new Error(`Orchestrator file not found: ${orchestratorPath}`);
    }
    
    // Create ts-morph project
    const project = new Project({
        tsConfigFilePath: path.join(buildDir, 'tsconfig.json'),
        skipAddingFilesFromTsConfig: true
    });
    
    // Add orchestrator file
    const orchestratorFile = project.addSourceFileAtPath(orchestratorPath);
    
    // Add SuperClaude imports
    orchestratorFile.insertStatements(0, [
        `import * as fs from 'fs/promises';`,
        `import * as path from 'path';`,
        `import { parse as parseYaml } from 'yaml';`,
        `import matter from 'gray-matter';`
    ]);
    
    // Add SuperClaude command handler
    const superClaudeHandler = `
// SuperClaude Command Detection and Routing
interface DetectedIntent {
    domain: string;
    intent: string;
    persona?: string;
    confidence: number;
}

function detectDomain(input: string): string {
    const keywords = {
        'analysis': ['analyze', 'explain', 'understand', 'review', 'audit'],
        'modification': ['implement', 'improve', 'refactor', 'fix', 'update'],
        'process': ['build', 'test', 'deploy', 'validate', 'compile'],
        'utility': ['help', 'search', 'document', 'visualize', 'compare']
    };
    
    const lowerInput = input.toLowerCase();
    
    for (const [domain, domainKeywords] of Object.entries(keywords)) {
        if (domainKeywords.some(keyword => lowerInput.includes(keyword))) {
            return domain;
        }
    }
    
    return 'general';
}

function detectIntent(input: string, domain: string): string {
    const intents: Record<string, string[]> = {
        'analysis': ['code-review', 'architecture-analysis', 'performance-audit'],
        'modification': ['feature-implementation', 'bug-fix', 'code-improvement'],
        'process': ['build-execution', 'test-running', 'deployment'],
        'utility': ['help-request', 'code-search', 'documentation']
    };
    
    const domainIntents = intents[domain] || [];
    // Simplified: return first intent for now
    return domainIntents[0] || 'general-assistance';
}

async function loadSuperClaudeContext(): Promise<any> {
    const contextPath = path.join(process.cwd(), '.claude/context.json');
    try {
        const contextData = await fs.readFile(contextPath, 'utf-8');
        return JSON.parse(contextData);
    } catch {
        return null;
    }
}

export async function handleSuperClaudeCommand(session: any, command: string, flags: any): Promise<any> {
    console.log('🚀 SuperClaude command detected:', command);
    
    // Load context
    const context = await loadSuperClaudeContext();
    
    // Detect domain and intent
    const domain = detectDomain(command);
    const intent = detectIntent(command, domain);
    
    console.log('📊 Detection results:', { domain, intent });
    
    // Route to appropriate handler
    const handlers: Record<string, Function> = {
        'analyze': handleAnalyzeCommand,
        'implement': handleImplementCommand,
        'build': handleBuildCommand,
        'test': handleTestCommand,
        // Add more handlers as implemented
    };
    
    const handler = handlers[command.split(' ')[0]];
    if (handler) {
        return handler(session, command, flags, { domain, intent, context });
    }
    
    // Default response
    return {
        success: true,
        message: \`SuperClaude processing: \${command}\`,
        domain,
        intent
    };
}

// Command handlers (to be implemented)
async function handleAnalyzeCommand(session: any, command: string, flags: any, metadata: any) {
    return {
        success: true,
        action: 'analyze',
        metadata
    };
}

async function handleImplementCommand(session: any, command: string, flags: any, metadata: any) {
    return {
        success: true,
        action: 'implement',
        metadata
    };
}

async function handleBuildCommand(session: any, command: string, flags: any, metadata: any) {
    return {
        success: true,
        action: 'build',
        metadata
    };
}

async function handleTestCommand(session: any, command: string, flags: any, metadata: any) {
    return {
        success: true,
        action: 'test',
        metadata
    };
}`;
    
    // Find the main orchestrator class or function
    const classes = orchestratorFile.getClasses();
    if (classes.length > 0) {
        // Add to the first class
        const mainClass = classes[0];
        mainClass.insertMember(0, superClaudeHandler);
    } else {
        // Add at the end of file
        orchestratorFile.addStatements(superClaudeHandler);
    }
    
    // Save the modified file
    await orchestratorFile.save();
    console.log('✅ Orchestrator patching completed successfully');
}

if (import.meta.main) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}