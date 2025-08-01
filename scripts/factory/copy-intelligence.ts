#!/usr/bin/env bun

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export async function main() {
    console.log('🧠 Copying SuperClaude intelligence files...');
    
    const sourceBase = path.join(import.meta.dir, '../../external/superclaude');
    const destBase = path.join(import.meta.dir, '../../build/supercode/.superclaude');
    
    // Create destination directory
    await fs.mkdir(destBase, { recursive: true });
    
    // Define source directories to copy
    const intelligenceDirs = [
        { source: 'Core', dest: 'core' },
        { source: 'Commands', dest: 'commands' },
        { source: 'Patterns', dest: 'patterns' },
        { source: 'shared', dest: 'shared' }
    ];
    
    for (const dir of intelligenceDirs) {
        const sourceDir = path.join(sourceBase, dir.source);
        const destDir = path.join(destBase, dir.dest);
        
        try {
            await fs.access(sourceDir);
            
            // Create destination subdirectory
            await fs.mkdir(destDir, { recursive: true });
            
            // Copy .md and .yml files
            const { stdout, stderr } = await execAsync(
                `rsync -av --include='*.md' --include='*.yml' --include='*.yaml' --include='*/' --exclude='*' "${sourceDir}/" "${destDir}/"`
            );
            
            console.log(`✓ Copied ${dir.source} → ${dir.dest}`);
        } catch (error) {
            console.warn(`⚠️  Directory not found, skipping: ${dir.source}`);
        }
    }
    
    // Copy root configuration files
    const rootFiles = ['README.md', 'CLAUDE.md', 'WORKFLOW.md'];
    for (const file of rootFiles) {
        const sourcePath = path.join(sourceBase, file);
        const destPath = path.join(destBase, file);
        
        try {
            await fs.copyFile(sourcePath, destPath);
            console.log(`✓ Copied ${file}`);
        } catch {
            // File might not exist, continue
        }
    }
    
    // Create index file for easy access
    const indexContent = `# SuperClaude Intelligence Index

This directory contains the SuperClaude prompt engineering framework files.

## Structure:
- **core/**: Core system prompts and configurations
- **commands/**: Command-specific prompts and templates
- **patterns/**: Reusable prompt patterns
- **shared/**: Shared utilities and constants

## Integration:
These files are used by the patched orchestrator to generate intelligent prompts
based on user commands and context.
`;
    
    await fs.writeFile(path.join(destBase, 'INDEX.md'), indexContent);
    
    console.log('✅ Intelligence files copied successfully');
}

if (import.meta.main) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}