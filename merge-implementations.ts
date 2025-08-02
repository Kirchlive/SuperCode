#!/usr/bin/env bun

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Map handler functions to command files
const handlerMappings = {
  "analyze": {
    source: "build/supercode/packages/opencode/src/superclaude/handlers/analysis.ts",
    handler: "handleAnalyzeCommand",
    imports: [
      'import * as glob from "../tool/glob"',
      'import * as grep from "../tool/grep"', 
      'import * as read from "../tool/read"'
    ]
  },
  "explain": {
    source: "build/supercode/packages/opencode/src/superclaude/handlers/analysis.ts",
    handler: "handleExplainCommand",
    imports: [
      'import * as read from "../tool/read"'
    ]
  }
};

// Function to extract handler implementation from source
function extractHandlerImplementation(sourcePath: string, handlerName: string): string | null {
  if (!existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    return null;
  }
  
  const content = readFileSync(sourcePath, 'utf-8');
  
  // Find the handler function
  const handlerRegex = new RegExp(`export async function ${handlerName}\\([^)]*\\)[^{]*{([\\s\\S]*?)^}`, 'gm');
  const match = handlerRegex.exec(content);
  
  if (!match) {
    console.error(`Handler ${handlerName} not found in ${sourcePath}`);
    return null;
  }
  
  // Extract the function body
  return match[1];
}

// Function to update command file with handler implementation
function updateCommandFile(commandName: string, mapping: any) {
  const commandPath = join("src/commands", `${commandName}.ts`);
  
  if (!existsSync(commandPath)) {
    console.error(`Command file not found: ${commandPath}`);
    return;
  }
  
  const handlerBody = extractHandlerImplementation(mapping.source, mapping.handler);
  
  if (!handlerBody) {
    return;
  }
  
  let content = readFileSync(commandPath, 'utf-8');
  
  // Add imports if not present
  mapping.imports.forEach((imp: string) => {
    if (!content.includes(imp)) {
      // Add after the existing imports
      const importIndex = content.lastIndexOf('import');
      const nextLineIndex = content.indexOf('\n', importIndex);
      content = content.slice(0, nextLineIndex + 1) + imp + '\n' + content.slice(nextLineIndex + 1);
    }
  });
  
  // Replace the handler implementation
  const handlerStart = content.indexOf('handler: async (args) => {');
  if (handlerStart === -1) {
    console.error(`Handler not found in ${commandPath}`);
    return;
  }
  
  const handlerEnd = content.indexOf('    },', handlerStart);
  if (handlerEnd === -1) {
    console.error(`Handler end not found in ${commandPath}`);
    return;
  }
  
  // Replace the handler body
  const newHandler = `handler: async (args) => {\n        // Enhanced implementation from handler\n${handlerBody.split('\n').map(line => '        ' + line).join('\n')}\n    },`;
  
  content = content.slice(0, handlerStart) + newHandler + content.slice(handlerEnd + 6);
  
  // Write the updated content
  writeFileSync(commandPath, content);
  console.log(`✅ Updated ${commandName}.ts with ${mapping.handler} implementation`);
}

// Main execution
console.log("🔧 Merging handler implementations into command files...\n");

Object.entries(handlerMappings).forEach(([command, mapping]) => {
  updateCommandFile(command, mapping);
});

console.log("\n✅ Merge complete!");
console.log("\n⚠️  Note: This is a partial merge. For complete functionality:");
console.log("1. Copy the full handler logic from the build directory");
console.log("2. Adapt the handler pattern to the yargs command structure");
console.log("3. Update all imports to match the src/commands structure");
console.log("4. Test each command individually");