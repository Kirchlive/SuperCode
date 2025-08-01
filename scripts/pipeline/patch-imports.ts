// /Users/rob/Development/SuperCode/SuperCode/scripts/pipeline/patch-imports.ts
const { Project, SyntaxKind } = await import('ts-morph');
import * as path from 'path';

const REPO_ROOT = path.resolve(import.meta.dir, '../../');
const REGISTRY_FILE = path.join(REPO_ROOT, 'build/supercode/packages/opencode/src/tool/registry.ts');

export async function main() {
    console.log('\n--- Patching import paths in registry.ts ---\n');
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(REGISTRY_FILE);

    const importDeclarations = sourceFile.getImportDeclarations();
    for (const importDeclaration of importDeclarations) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
        if (moduleSpecifier.includes('SuperCode/src/tool/superclaude')) {
            const newPath = '../../../../src/tool/superclaude';
            importDeclaration.setModuleSpecifier(newPath);
            console.log(`Patched import path: ${moduleSpecifier} -> ${newPath}`);
        }
    }

    await sourceFile.save();
    console.log('✅ Import paths patched successfully.');
}

if (import.meta.main) {
    main();
}
