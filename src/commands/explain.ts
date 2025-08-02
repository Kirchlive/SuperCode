/**
 * Explain Command Handler
 * Provide clear explanations of code, concepts, or system behavior
 */

import { z } from "zod";
import type { Argv } from "yargs";
import { cmd } from "../cmd";
import { CommandParser, type ParsedCommand } from "../tool/command-parser";
import { FlagResolver, type ResolvedFlags } from "../tool/flag-resolver";
import * as glob from "../tool/glob";
import * as read from "../tool/read";

// Explain command schemas
const ExplainOptionsSchema = z.object({
  code: z.string().optional().describe("Code snippet or file to explain"),
  level: z.enum(["beginner", "intermediate", "expert"]).optional().default("intermediate"),
  style: z.enum(["concise", "detailed", "visual"]).optional().default("concise"),
  format: z.enum(["text", "markdown", "json"]).optional().default("text"),
  examples: z.boolean().optional().describe("Include examples"),
  detailed: z.boolean().optional().describe("Provide detailed explanations")
});

export interface ExplanationResult {
  command: string;
  timestamp: string;
  options: z.infer<typeof ExplainOptionsSchema>;
  target: string;
  explanation: {
    summary: string;
    details: ExplanationSection[];
    examples?: CodeExample[];
    relatedConcepts?: string[];
  };
  metadata: {
    targetType: "file" | "snippet" | "concept";
    language?: string;
    complexity: "low" | "medium" | "high";
  };
}

export interface ExplanationSection {
  title: string;
  content: string;
  subsections?: ExplanationSection[];
}

export interface CodeExample {
  title: string;
  code: string;
  explanation: string;
  language?: string;
}

/**
 * Main explain command handler
 */
export async function handleExplainCommand(
  parsedCommand: ParsedCommand,
  resolvedFlags: ResolvedFlags
): Promise<ExplanationResult> {
  const options = ExplainOptionsSchema.parse({ ...parsedCommand.args, ...resolvedFlags });
  
  const target = options.code || parsedCommand.target || "";
  
  if (!target) {
    throw new Error("Please provide code, file path, or concept to explain");
  }

  const result: ExplanationResult = {
    command: "explain",
    timestamp: new Date().toISOString(),
    options,
    target,
    explanation: {
      summary: "",
      details: [],
      examples: [],
      relatedConcepts: []
    },
    metadata: {
      targetType: "concept",
      complexity: "medium"
    }
  };

  try {
    // Determine what we're explaining
    if (await isFilePath(target)) {
      await explainFile(target, result);
    } else if (isCodeSnippet(target)) {
      await explainCodeSnippet(target, result);
    } else {
      await explainConcept(target, result);
    }

    return result;
    
  } catch (error) {
    throw new Error(`Explanation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if target is a file path
 */
async function isFilePath(target: string): Promise<boolean> {
  // Simple heuristics for file paths
  if (target.includes("/") || target.includes("\\") || target.includes(".")) {
    try {
      const content = await read.run({ filePath: target });
      return content.length > 0;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Check if target is a code snippet
 */
function isCodeSnippet(target: string): boolean {
  // Simple heuristics for code snippets
  const codeIndicators = [
    "{", "}", "(", ")", "function", "const", "let", "var", "class", "import", "export",
    "if", "else", "for", "while", "return", "=>", "===", "!==", "&&", "||"
  ];
  
  return codeIndicators.some(indicator => target.includes(indicator));
}

/**
 * Explain a file
 */
async function explainFile(filePath: string, result: ExplanationResult): Promise<void> {
  try {
    const content = await read.run({ filePath });
    const language = detectLanguage(filePath);
    
    result.metadata.targetType = "file";
    result.metadata.language = language;
    result.metadata.complexity = assessComplexity(content);
    
    result.explanation.summary = `This is a ${language} file that ${getFilePurpose(content, language)}.`;
    
    result.explanation.details = [
      {
        title: "File Overview",
        content: `File: ${filePath}\nLanguage: ${language}\nLines: ${content.split('\n').length}`
      },
      {
        title: "Structure Analysis",
        content: analyzeFileStructure(content, language)
      },
      {
        title: "Key Components",
        content: identifyKeyComponents(content, language)
      }
    ];

    if (result.options.examples) {
      result.explanation.examples = generateFileExamples(content, language);
    }

    result.explanation.relatedConcepts = getRelatedConcepts(content, language);
    
  } catch (error) {
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

/**
 * Explain a code snippet
 */
async function explainCodeSnippet(code: string, result: ExplanationResult): Promise<void> {
  const language = detectLanguageFromCode(code);
  
  result.metadata.targetType = "snippet";
  result.metadata.language = language;
  result.metadata.complexity = assessComplexity(code);
  
  result.explanation.summary = `This ${language} code snippet ${getSnippetPurpose(code)}.`;
  
  result.explanation.details = [
    {
      title: "Code Analysis",
      content: `Language: ${language}\nLines: ${code.split('\n').length}`
    },
    {
      title: "Functionality",
      content: explainCodeFunctionality(code, language)
    },
    {
      title: "Syntax Breakdown",
      content: breakdownSyntax(code, language)
    }
  ];

  if (result.options.examples) {
    result.explanation.examples = generateCodeExamples(code, language);
  }

  result.explanation.relatedConcepts = getRelatedConcepts(code, language);
}

/**
 * Explain a concept
 */
async function explainConcept(concept: string, result: ExplanationResult): Promise<void> {
  result.metadata.targetType = "concept";
  result.metadata.complexity = assessConceptComplexity(concept);
  
  const conceptExplanation = getConceptExplanation(concept, result.options.level);
  
  result.explanation.summary = conceptExplanation.summary;
  result.explanation.details = conceptExplanation.details;
  
  if (result.options.examples) {
    result.explanation.examples = conceptExplanation.examples;
  }

  result.explanation.relatedConcepts = conceptExplanation.relatedConcepts;
}

// Helper functions
function detectLanguage(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'ts': 'TypeScript',
    'tsx': 'TypeScript React',
    'js': 'JavaScript',
    'jsx': 'JavaScript React',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'dart': 'Dart',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML',
    'xml': 'XML',
    'md': 'Markdown'
  };
  
  return languageMap[extension || ''] || 'Unknown';
}

function detectLanguageFromCode(code: string): string {
  // Simple heuristics to detect language from code
  if (code.includes('function') || code.includes('const') || code.includes('let')) {
    if (code.includes('interface') || code.includes(': string') || code.includes(': number')) {
      return 'TypeScript';
    }
    return 'JavaScript';
  }
  
  if (code.includes('def ') || code.includes('import ') || code.includes('print(')) {
    return 'Python';
  }
  
  if (code.includes('public class') || code.includes('public static void')) {
    return 'Java';
  }
  
  if (code.includes('#include') || code.includes('int main')) {
    return 'C/C++';
  }
  
  return 'Unknown';
}

function assessComplexity(content: string): "low" | "medium" | "high" {
  const lines = content.split('\n').length;
  const complexityIndicators = [
    'class', 'interface', 'function', 'async', 'await', 'Promise', 'callback',
    'recursion', 'algorithm', 'data structure', 'design pattern'
  ];
  
  const complexity = complexityIndicators.filter(indicator => 
    content.toLowerCase().includes(indicator)
  ).length;
  
  if (lines > 100 || complexity > 5) return "high";
  if (lines > 50 || complexity > 2) return "medium";
  return "low";
}

function assessConceptComplexity(concept: string): "low" | "medium" | "high" {
  const complexConcepts = [
    'algorithm', 'data structure', 'design pattern', 'architecture', 
    'concurrency', 'asynchronous', 'distributed', 'microservices'
  ];
  
  const mediumConcepts = [
    'function', 'class', 'inheritance', 'polymorphism', 'encapsulation',
    'api', 'database', 'framework', 'library'
  ];
  
  const conceptLower = concept.toLowerCase();
  
  if (complexConcepts.some(c => conceptLower.includes(c))) return "high";
  if (mediumConcepts.some(c => conceptLower.includes(c))) return "medium";
  return "low";
}

function getFilePurpose(content: string, language: string): string {
  // Analyze file content to determine purpose
  if (content.includes('export') && content.includes('function')) {
    return 'exports functions and utilities';
  }
  
  if (content.includes('class') && content.includes('extends')) {
    return 'defines classes with inheritance';
  }
  
  if (content.includes('test') || content.includes('describe') || content.includes('it(')) {
    return 'contains test cases';
  }
  
  if (content.includes('import') && content.includes('component')) {
    return 'defines React components';
  }
  
  return 'contains code implementation';
}

function getSnippetPurpose(code: string): string {
  if (code.includes('function') || code.includes('=>')) {
    return 'defines a function';
  }
  
  if (code.includes('class')) {
    return 'defines a class';
  }
  
  if (code.includes('if') || code.includes('else')) {
    return 'implements conditional logic';
  }
  
  if (code.includes('for') || code.includes('while')) {
    return 'implements iteration logic';
  }
  
  return 'performs some operation';
}

function analyzeFileStructure(content: string, language: string): string {
  const lines = content.split('\n');
  const imports = lines.filter(line => line.trim().startsWith('import')).length;
  const exports = lines.filter(line => line.includes('export')).length;
  const functions = lines.filter(line => line.includes('function')).length;
  const classes = lines.filter(line => line.includes('class')).length;
  
  return `Structure: ${imports} imports, ${exports} exports, ${functions} functions, ${classes} classes`;
}

function identifyKeyComponents(content: string, language: string): string {
  const components = [];
  
  if (content.includes('import')) components.push('Module imports');
  if (content.includes('export')) components.push('Module exports');
  if (content.includes('function')) components.push('Function definitions');
  if (content.includes('class')) components.push('Class definitions');
  if (content.includes('interface')) components.push('Type interfaces');
  if (content.includes('async')) components.push('Asynchronous operations');
  
  return components.length > 0 ? components.join(', ') : 'Basic code structure';
}

function explainCodeFunctionality(code: string, language: string): string {
  // Basic explanation of what the code does
  if (code.includes('function') || code.includes('=>')) {
    return 'This code defines a function that performs specific operations.';
  }
  
  if (code.includes('class')) {
    return 'This code defines a class with properties and methods.';
  }
  
  if (code.includes('if') && code.includes('else')) {
    return 'This code implements conditional logic with branching.';
  }
  
  return 'This code performs computational operations.';
}

function breakdownSyntax(code: string, language: string): string {
  const syntaxElements = [];
  
  if (code.includes('{') && code.includes('}')) {
    syntaxElements.push('Curly braces for code blocks');
  }
  
  if (code.includes('(') && code.includes(')')) {
    syntaxElements.push('Parentheses for function calls or parameters');
  }
  
  if (code.includes('=>')) {
    syntaxElements.push('Arrow function syntax');
  }
  
  if (code.includes('const') || code.includes('let') || code.includes('var')) {
    syntaxElements.push('Variable declarations');
  }
  
  return syntaxElements.join(', ') || 'Standard syntax elements';
}

function generateFileExamples(content: string, language: string): CodeExample[] {
  // Extract meaningful examples from file content
  return [
    {
      title: "Basic Usage",
      code: content.split('\n').slice(0, 10).join('\n'),
      explanation: "This shows the basic structure and imports of the file.",
      language
    }
  ];
}

function generateCodeExamples(code: string, language: string): CodeExample[] {
  return [
    {
      title: "Code Example",
      code: code,
      explanation: "This is the code being explained.",
      language
    }
  ];
}

function getRelatedConcepts(content: string, language: string): string[] {
  const concepts = [];
  
  if (content.includes('async') || content.includes('await')) {
    concepts.push('Asynchronous Programming', 'Promises', 'Event Loop');
  }
  
  if (content.includes('class')) {
    concepts.push('Object-Oriented Programming', 'Inheritance', 'Encapsulation');
  }
  
  if (content.includes('function')) {
    concepts.push('Functions', 'Scope', 'Closures');
  }
  
  if (content.includes('import') || content.includes('export')) {
    concepts.push('Modules', 'ES6', 'Bundling');
  }
  
  return concepts;
}

function getConceptExplanation(concept: string, level: string): {
  summary: string;
  details: ExplanationSection[];
  examples: CodeExample[];
  relatedConcepts: string[];
} {
  // This would contain a comprehensive concept database
  // For now, providing a basic structure
  
  const conceptLower = concept.toLowerCase();
  
  if (conceptLower.includes('function')) {
    return {
      summary: "Functions are reusable blocks of code that perform specific tasks.",
      details: [
        {
          title: "What are Functions?",
          content: "Functions are fundamental building blocks in programming that encapsulate code to perform specific tasks."
        },
        {
          title: "How Functions Work",
          content: "Functions take input (parameters), process it, and optionally return output."
        },
        {
          title: "Benefits",
          content: "Functions promote code reusability, modularity, and maintainability."
        }
      ],
      examples: [
        {
          title: "Basic Function",
          code: "function greet(name) {\n  return `Hello, ${name}!`;\n}",
          explanation: "A simple function that takes a name parameter and returns a greeting.",
          language: "JavaScript"
        }
      ],
      relatedConcepts: ["Parameters", "Return Values", "Scope", "Closures"]
    };
  }
  
  // Default explanation
  return {
    summary: `${concept} is a programming concept that requires further explanation.`,
    details: [
      {
        title: "Overview",
        content: `${concept} is an important concept in software development.`
      }
    ],
    examples: [],
    relatedConcepts: []
  };
}

export const ExplainCommand = cmd({
    command: "explain [target]",
    describe: "Provide clear explanations of code, concepts, or system behavior",
    
    builder: (yargs: Argv) => {
        return yargs
            .positional("target", {
                describe: "Code file, snippet, or concept to explain",
                type: "string",
            })
            .option("level", {
                describe: "Explanation level",
                choices: ["beginner", "intermediate", "expert"],
                default: "intermediate",
                type: "string"
            })
            .option("style", {
                describe: "Explanation style",
                choices: ["concise", "detailed", "visual"],
                default: "concise",
                type: "string"
            })
            .option("format", {
                describe: "Output format",
                choices: ["text", "markdown", "json"],
                default: "text",
                type: "string"
            })
            .option("examples", {
                describe: "Include examples",
                type: "boolean",
                default: false
            })
            .option("detailed", {
                describe: "Provide detailed explanations",
                type: "boolean",
                default: false
            });
    },

    handler: async (args) => {
        try {
            // Parse the command using CommandParser
            const parsedCommand: ParsedCommand = {
                command: "explain",
                target: args.target as string,
                args: [],
                flags: {
                    level: args.level,
                    style: args.style,
                    format: args.format,
                    examples: args.examples,
                    detailed: args.detailed
                },
                rawArgs: []
            };

            // Resolve flags using FlagResolver
            const flagResult = FlagResolver.resolve("explain", parsedCommand.flags);
            
            if (!flagResult.valid) {
                console.error("Flag validation errors:");
                flagResult.errors.forEach(error => console.error(`  - ${error}`));
                process.exit(1);
            }

            if (flagResult.warnings.length > 0) {
                console.warn("Flag warnings:");
                flagResult.warnings.forEach(warning => console.warn(`  - ${warning}`));
            }

            // Execute the explanation
            const result = await handleExplainCommand(parsedCommand, flagResult.resolved);
            
            // Format and display results
            if (result.options.format === "json") {
                console.log(JSON.stringify(result, null, 2));
            } else {
                displayExplanationResults(result);
            }
            
        } catch (error) {
            console.error(`Explanation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    },
});

/**
 * Display explanation results in human-readable format
 */
function displayExplanationResults(result: ExplanationResult): void {
    console.log("\n📖 Explanation Results");
    console.log("======================");
    console.log(`Target: ${result.target}`);
    console.log(`Type: ${result.metadata.targetType}`);
    console.log(`Complexity: ${result.metadata.complexity}`);
    if (result.metadata.language) {
        console.log(`Language: ${result.metadata.language}`);
    }
    
    console.log(`\n📝 Summary:`);
    console.log(`${result.explanation.summary}\n`);
    
    if (result.explanation.details.length > 0) {
        console.log("📋 Detailed Explanation:");
        result.explanation.details.forEach((section, index) => {
            console.log(`\n${index + 1}. ${section.title}`);
            console.log(`   ${section.content}`);
        });
    }
    
    if (result.explanation.examples && result.explanation.examples.length > 0) {
        console.log("\n💡 Examples:");
        result.explanation.examples.forEach((example, index) => {
            console.log(`\n${index + 1}. ${example.title}`);
            console.log(`\`\`\`${example.language || ''}`);
            console.log(example.code);
            console.log(`\`\`\``);
            console.log(`   ${example.explanation}`);
        });
    }
    
    if (result.explanation.relatedConcepts && result.explanation.relatedConcepts.length > 0) {
        console.log("\n🔗 Related Concepts:");
        result.explanation.relatedConcepts.forEach(concept => {
            console.log(`  • ${concept}`);
        });
    }
    
    console.log("\n✅ Explanation complete!\n");
}
