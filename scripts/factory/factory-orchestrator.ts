#!/usr/bin/env bun

import { main as copyChassis } from './copy-chassis.ts';
import { main as injectTool } from './inject-tool-simple.ts';
import { main as patchOrchestrator } from './patch-orchestrator.ts';
import { main as copyIntelligence } from './copy-intelligence.ts';
import * as fs from 'fs/promises';
import * as path from 'path';

async function ensureExternalSources() {
    console.log('🔍 Verifying external sources...');
    
    const requiredDirs = [
        'external/opencode',
        'external/superclaude'
    ];
    
    for (const dir of requiredDirs) {
        const fullPath = path.join(import.meta.dir, '../..', dir);
        try {
            await fs.access(fullPath);
            console.log(`✓ Found: ${dir}`);
        } catch {
            throw new Error(`Missing required directory: ${dir}\nPlease ensure both external projects are cloned.`);
        }
    }
}

async function cleanBuildDirectory() {
    console.log('🧹 Cleaning build directory...');
    
    const buildDir = path.join(import.meta.dir, '../../build/supercode');
    
    try {
        await fs.rm(buildDir, { recursive: true, force: true });
        console.log('✓ Build directory cleaned');
    } catch {
        // Directory might not exist, that's fine
    }
}

async function runStep(name: string, fn: () => Promise<void>) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`▶️  ${name}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const start = Date.now();
    
    try {
        await fn();
        const duration = ((Date.now() - start) / 1000).toFixed(2);
        console.log(`\n✅ ${name} completed in ${duration}s`);
    } catch (error) {
        const duration = ((Date.now() - start) / 1000).toFixed(2);
        console.error(`\n❌ ${name} failed after ${duration}s`);
        throw error;
    }
}

export async function main() {
    console.log('🏭 SuperCode Factory Pipeline Starting...\n');
    const pipelineStart = Date.now();
    
    try {
        // Pre-flight checks
        await ensureExternalSources();
        
        // Clean build directory for fresh start
        await cleanBuildDirectory();
        
        // Execute factory steps in order
        await runStep('Step 1: Copy OpenCode Chassis', copyChassis);
        await runStep('Step 2: Inject SuperClaude Tool', injectTool);
        await runStep('Step 3: Patch Orchestrator Logic', patchOrchestrator);
        await runStep('Step 4: Copy Intelligence Files', copyIntelligence);
        
        // Final summary
        const totalDuration = ((Date.now() - pipelineStart) / 1000).toFixed(2);
        
        console.log(`\n${'='.repeat(60)}`);
        console.log('🎉 FACTORY PIPELINE COMPLETED SUCCESSFULLY!');
        console.log(`${'='.repeat(60)}`);
        console.log(`\n📊 Summary:`);
        console.log(`   • Total duration: ${totalDuration}s`);
        console.log(`   • Output location: build/supercode/`);
        console.log(`   • Next steps:`);
        console.log(`     1. cd build/supercode`);
        console.log(`     2. bun install`);
        console.log(`     3. bun run dev`);
        console.log(`\n🚀 SuperCode is ready for implementation!\n`);
        
    } catch (error) {
        const totalDuration = ((Date.now() - pipelineStart) / 1000).toFixed(2);
        
        console.error(`\n${'='.repeat(60)}`);
        console.error('💥 FACTORY PIPELINE FAILED!');
        console.error(`${'='.repeat(60)}`);
        console.error(`\nError after ${totalDuration}s:`);
        console.error(error);
        
        process.exit(1);
    }
}

if (import.meta.main) {
    main();
}