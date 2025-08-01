#!/usr/bin/env bun

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export async function main() {
    console.log('🏗️  Copying opencode chassis to build directory...');
    
    const sourceDir = path.join(import.meta.dir, '../../external/opencode');
    const destDir = path.join(import.meta.dir, '../../build/supercode');
    
    // Verify source exists
    try {
        await fs.access(sourceDir);
    } catch {
        throw new Error(`Source directory not found: ${sourceDir}`);
    }
    
    // Create destination directory
    await fs.mkdir(destDir, { recursive: true });
    
    // Copy with rsync, excluding node_modules and other unnecessary files
    const excludes = [
        '--exclude=node_modules',
        '--exclude=.git',
        '--exclude=.DS_Store',
        '--exclude=*.log',
        '--exclude=dist',
        '--exclude=build'
    ].join(' ');
    
    try {
        const { stdout, stderr } = await execAsync(
            `rsync -av ${excludes} "${sourceDir}/" "${destDir}/"`
        );
        
        if (stderr && !stderr.includes('rsync warning')) {
            console.warn('⚠️  Rsync warnings:', stderr);
        }
        
        console.log('✅ Chassis copied successfully');
        
        // Verify critical files exist
        const criticalPaths = [
            'packages/opencode/src/tool/registry.ts',
            'packages/opencode/src/session/index.ts',
            'packages/opencode/src/index.ts',
            'package.json'
        ];
        
        for (const criticalPath of criticalPaths) {
            const fullPath = path.join(destDir, criticalPath);
            try {
                await fs.access(fullPath);
                console.log(`✓ Verified: ${criticalPath}`);
            } catch {
                throw new Error(`Critical file missing: ${criticalPath}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to copy chassis:', error);
        throw error;
    }
}

if (import.meta.main) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}