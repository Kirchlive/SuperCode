/**
 * Analyze Command Handler
 * Comprehensive code analysis including quality, security, performance, and architecture
 */

import { z } from "zod";
import type { Argv } from "yargs";
import { cmd } from "../cmd";
import { CommandParser, type ParsedCommand } from "../tool/command-parser";
import { FlagResolver, type ResolvedFlags } from "../tool/flag-resolver";
import * as glob from "../tool/glob";
import * as grep from "../tool/grep";
import * as read from "../tool/read";

// Analysis command schemas
const AnalyzeOptionsSchema = z.object({
  target: z.string().optional().describe("Files, directories, or project to analyze"),
  focus: z.enum(["quality", "security", "performance", "architecture"]).optional(),
  depth: z.enum(["quick", "deep"]).optional().default("deep"),
  format: z.enum(["text", "json", "report"]).optional().default("text"),
  comprehensive: z.boolean().optional().describe("Enable comprehensive analysis"),
  security: z.boolean().optional().describe("Analyze security vulnerabilities"),
  performance: z.boolean().optional().describe("Analyze performance issues"),
  architecture: z.boolean().optional().describe("Analyze architecture patterns"),
  deps: z.boolean().optional().describe("Analyze dependencies"),
  evidence: z.boolean().optional().describe("Include evidence in output")
});

export interface AnalysisResult {
  command: string;
  timestamp: string;
  options: z.infer<typeof AnalyzeOptionsSchema>;
  findings: AnalysisFinding[];
  summary: AnalysisSummary;
  metadata?: {
    filesAnalyzed: number;
    analysisTime: number;
  };
}

export interface AnalysisFinding {
  type: "security" | "performance" | "architecture" | "quality";
  severity: "info" | "low" | "medium" | "high" | "critical";
  issue: string;
  locations?: string[];
  details?: Record<string, any>;
  recommendations?: string[];
}

export interface AnalysisSummary {
  totalIssues: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  recommendations: string[];
}

/**
 * Main analyze command handler
 */
export async function handleAnalyzeCommand(
  parsedCommand: ParsedCommand,
  resolvedFlags: ResolvedFlags
): Promise<AnalysisResult> {
  const startTime = Date.now();
  const options = AnalyzeOptionsSchema.parse({ ...parsedCommand.args, ...resolvedFlags });
  
  const result: AnalysisResult = {
    command: "analyze",
    timestamp: new Date().toISOString(),
    options,
    findings: [],
    summary: {
      totalIssues: 0,
      bySeverity: {},
      byType: {},
      recommendations: []
    },
    metadata: {
      filesAnalyzed: 0,
      analysisTime: 0
    }
  };

  try {
    // Determine target scope
    const target = options.target || parsedCommand.target || ".";
    
    // Find files to analyze
    const files = await findFilesToAnalyze(target);
    result.metadata!.filesAnalyzed = files.length;

    if (files.length === 0) {
      throw new Error("No files found to analyze");
    }

    // Perform analysis based on flags and focus
    if (options.comprehensive) {
      result.findings = await performComprehensiveAnalysis(files, options);
    } else {
      result.findings = await performTargetedAnalysis(files, options);
    }

    // Generate summary
    result.summary = generateAnalysisSummary(result.findings);
    result.metadata!.analysisTime = Date.now() - startTime;

    return result;
    
  } catch (error) {
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find files to analyze based on target specification
 */
async function findFilesToAnalyze(target: string): Promise<string[]> {
  try {
    let pattern: string;
    
    if (target.endsWith(".ts") || target.endsWith(".js") || target.endsWith(".tsx") || target.endsWith(".jsx")) {
      pattern = target;
    } else {
      pattern = `${target}/**/*.{ts,tsx,js,jsx,vue,svelte}`;
    }
    
    const files = await glob.run({ pattern });
    return files.filter(file => !file.includes('node_modules') && !file.includes('.git'));
  } catch (error) {
    return [];
  }
}

/**
 * Perform comprehensive analysis covering all areas
 */
async function performComprehensiveAnalysis(
  files: string[],
  options: z.infer<typeof AnalyzeOptionsSchema>
): Promise<AnalysisFinding[]> {
  const findings: AnalysisFinding[] = [];
  
  // Run all analysis types
  findings.push(...await analyzeSecurityPatterns(files));
  findings.push(...await analyzePerformancePatterns(files));
  findings.push(...await analyzeArchitecturePatterns(files));
  findings.push(...await analyzeCodeQuality(files));
  
  if (options.deps) {
    findings.push(...await analyzeDependencies(files));
  }
  
  return findings;
}

/**
 * Perform targeted analysis based on specific focus or flags
 */
async function performTargetedAnalysis(
  files: string[],
  options: z.infer<typeof AnalyzeOptionsSchema>
): Promise<AnalysisFinding[]> {
  const findings: AnalysisFinding[] = [];
  
  // Analyze based on focus area
  if (options.focus === "security" || options.security) {
    findings.push(...await analyzeSecurityPatterns(files));
  } else if (options.focus === "performance" || options.performance) {
    findings.push(...await analyzePerformancePatterns(files));
  } else if (options.focus === "architecture" || options.architecture) {
    findings.push(...await analyzeArchitecturePatterns(files));
  } else {
    // Default: run quality analysis
    findings.push(...await analyzeCodeQuality(files));
  }
  
  return findings;
}

/**
 * Analyze security patterns and vulnerabilities
 */
async function analyzeSecurityPatterns(files: string[]): Promise<AnalysisFinding[]> {
  const findings: AnalysisFinding[] = [];
  
  const securityPatterns = [
    { pattern: "eval\\(", severity: "high" as const, issue: "Direct eval usage - potential code injection" },
    { pattern: "innerHTML\\s*=", severity: "medium" as const, issue: "innerHTML usage - potential XSS vulnerability" },
    { pattern: "console\\.log.*password", severity: "medium" as const, issue: "Password logged to console" }
  ];

  for (const pattern of securityPatterns) {
    try {
      const matches = await grep.run({ pattern: pattern.pattern, include: "**/*.{ts,tsx,js,jsx}" });
      
      if (matches.length > 0) {
        findings.push({
          type: "security",
          severity: pattern.severity,
          issue: pattern.issue,
          locations: matches,
          recommendations: getSecurityRecommendations(pattern.issue)
        });
      }
    } catch (error) {
      // Continue with other patterns if one fails
    }
  }

  return findings;
}

/**
 * Analyze performance patterns and issues
 */
async function analyzePerformancePatterns(files: string[]): Promise<AnalysisFinding[]> {
  const findings: AnalysisFinding[] = [];
  
  const performancePatterns = [
    { pattern: "for.*in\\s+", severity: "low" as const, issue: "for...in loop - consider for...of for better performance" },
    { pattern: "\\.forEach\\(", severity: "info" as const, issue: "forEach usage - consider for loop for better performance" },
    { pattern: "JSON\\.parse.*JSON\\.stringify", severity: "medium" as const, issue: "Inefficient deep cloning via JSON" }
  ];

  for (const pattern of performancePatterns) {
    try {
      const matches = await grep.run({ pattern: pattern.pattern, include: "**/*.{ts,tsx,js,jsx}" });
      
      if (matches.length > 0) {
        findings.push({
          type: "performance",
          severity: pattern.severity,
          issue: pattern.issue,
          locations: matches,
          recommendations: getPerformanceRecommendations(pattern.issue)
        });
      }
    } catch (error) {
      // Continue with other patterns
    }
  }

  return findings;
}

/**
 * Analyze architecture patterns and structure
 */
async function analyzeArchitecturePatterns(files: string[]): Promise<AnalysisFinding[]> {
  const findings: AnalysisFinding[] = [];
  
  try {
    // Analyze import patterns
    const importMatches = await grep.run({ pattern: "^import.*from", include: "**/*.{ts,tsx,js,jsx}" });
    
    if (importMatches.length > 0) {
      const importAnalysis = analyzeImportStructure(importMatches);
      findings.push(...importAnalysis);
    }
    
    // Analyze file organization
    const organizationFindings = analyzeFileOrganization(files);
    findings.push(...organizationFindings);
    
  } catch (error) {
    // Architecture analysis failed, but don't stop the entire analysis
  }

  return findings;
}

/**
 * Analyze code quality patterns
 */
async function analyzeCodeQuality(files: string[]): Promise<AnalysisFinding[]> {
  const findings: AnalysisFinding[] = [];
  
  const qualityPatterns = [
    { pattern: "console\\.(log|error|warn|info)", severity: "info" as const, issue: "Console statement found - remove before production" },
    { pattern: "TODO|FIXME|HACK|XXX", severity: "info" as const, issue: "Code comment marker found" },
    { pattern: "any\\s*[)\\]>]", severity: "low" as const, issue: "TypeScript 'any' type usage - consider specific types" }
  ];

  for (const pattern of qualityPatterns) {
    try {
      const matches = await grep.run({ pattern: pattern.pattern, include: "**/*.{ts,tsx,js,jsx}" });
      
      if (matches.length > 0) {
        findings.push({
          type: "quality",
          severity: pattern.severity,
          issue: pattern.issue,
          locations: matches,
          recommendations: getQualityRecommendations(pattern.issue)
        });
      }
    } catch (error) {
      // Continue with other patterns
    }
  }

  return findings;
}

/**
 * Analyze dependencies
 */
async function analyzeDependencies(files: string[]): Promise<AnalysisFinding[]> {
  const findings: AnalysisFinding[] = [];
  
  try {
    // Look for package.json files
    const packageFiles = await glob.run({ pattern: "**/package.json" });
    
    for (const packageFile of packageFiles) {
      if (packageFile.includes('node_modules')) continue;
      
      try {
        const content = await read.run({ filePath: packageFile });
        const pkg = JSON.parse(content);
        
        // Check for outdated or potentially problematic dependencies
        const depFindings = analyzeDependencyStructure(pkg, packageFile);
        findings.push(...depFindings);
      } catch (error) {
        // Skip invalid package.json files
      }
    }
  } catch (error) {
    // Dependency analysis failed
  }
  
  return findings;
}

// Helper functions
function analyzeImportStructure(importMatches: string[]): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];
  
  const importMap = new Map<string, string[]>();
  
  // Build import map
  importMatches.forEach((line) => {
    const match = line.match(/(.+?):import.*from\s+['"](.+?)['"]/);
    if (match && match[1] && match[2]) {
      const [, file, importPath] = match;
      if (!importMap.has(file)) {
        importMap.set(file, []);
      }
      importMap.get(file)!.push(importPath);
    }
  });
  
  if (importMap.size > 0) {
    const avgImports = Array.from(importMap.values()).reduce((a, b) => a + b.length, 0) / importMap.size;
    
    if (avgImports > 10) {
      findings.push({
        type: "architecture",
        severity: "info",
        issue: `High average imports per file (${avgImports.toFixed(1)})`,
        details: { totalFiles: importMap.size, averageImports: avgImports },
        recommendations: ["Consider breaking down large modules", "Review module dependencies"]
      });
    }
  }
  
  return findings;
}

function analyzeFileOrganization(files: string[]): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];
  
  // Check for proper file organization
  const hasTestFiles = files.some(f => f.includes('.test.') || f.includes('.spec.'));
  
  if (!hasTestFiles && files.length > 5) {
    findings.push({
      type: "architecture",
      severity: "medium",
      issue: "No test files found in project with multiple source files",
      recommendations: ["Add unit tests", "Consider test-driven development"]
    });
  }
  
  return findings;
}

function analyzeDependencyStructure(pkg: any, filePath: string): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];
  
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const depCount = Object.keys(deps).length;
  
  if (depCount > 50) {
    findings.push({
      type: "architecture",
      severity: "info",
      issue: `High dependency count (${depCount}) in ${filePath}`,
      recommendations: ["Review if all dependencies are necessary", "Consider dependency pruning"]
    });
  }
  
  return findings;
}

function generateAnalysisSummary(findings: AnalysisFinding[]): AnalysisSummary {
  const summary: AnalysisSummary = {
    totalIssues: findings.length,
    bySeverity: {},
    byType: {},
    recommendations: []
  };

  findings.forEach(finding => {
    // Count by severity
    summary.bySeverity[finding.severity] = (summary.bySeverity[finding.severity] || 0) + 1;
    
    // Count by type
    summary.byType[finding.type] = (summary.byType[finding.type] || 0) + 1;
    
    // Collect unique recommendations
    if (finding.recommendations) {
      finding.recommendations.forEach(rec => {
        if (!summary.recommendations.includes(rec)) {
          summary.recommendations.push(rec);
        }
      });
    }
  });

  return summary;
}

// Recommendation helpers
function getSecurityRecommendations(issue: string): string[] {
  const recommendations: Record<string, string[]> = {
    "Direct eval usage": ["Use safer alternatives like Function constructor or JSON.parse", "Validate and sanitize all input"],
    "innerHTML usage": ["Use textContent or innerText for plain text", "Sanitize HTML content with DOMPurify"],
    "Password logged to console": ["Remove password logging", "Use proper logging library with masking"]
  };
  
  return recommendations[issue] || ["Review security implications"];
}

function getPerformanceRecommendations(issue: string): string[] {
  const recommendations: Record<string, string[]> = {
    "for...in loop": ["Use for...of for arrays", "Use Object.keys() for object iteration"],
    "forEach usage": ["Consider traditional for loops for better performance", "Use map() for transformations"],
    "Inefficient deep cloning": ["Use structured cloning or libraries like lodash.cloneDeep", "Consider if deep cloning is necessary"]
  };
  
  return recommendations[issue] || ["Review performance implications"];
}

function getQualityRecommendations(issue: string): string[] {
  const recommendations: Record<string, string[]> = {
    "Console statement found": ["Remove console statements before production", "Use proper logging library"],
    "Code comment marker found": ["Address TODO/FIXME items", "Remove or convert to proper documentation"],
    "TypeScript 'any' type": ["Use specific types", "Consider union types or generics"]
  };
  
  return recommendations[issue] || ["Follow coding best practices"];
}

export const AnalyzeCommand = cmd({
    command: "analyze [target]",
    describe: "Analyze code quality, security, performance, and architecture",
    
    builder: (yargs: Argv) => {
        return yargs
            .positional("target", {
                describe: "Files, directories, or project to analyze",
                type: "string",
                default: ".",
            })
            .option("focus", {
                describe: "Focus area for analysis",
                choices: ["quality", "security", "performance", "architecture"],
                type: "string"
            })
            .option("depth", {
                describe: "Analysis depth",
                choices: ["quick", "deep"],
                default: "deep",
                type: "string"
            })
            .option("format", {
                describe: "Output format",
                choices: ["text", "json", "report"],
                default: "text",
                type: "string"
            })
            .option("comprehensive", {
                describe: "Enable comprehensive analysis",
                type: "boolean",
                default: false
            })
            .option("security", {
                describe: "Focus on security analysis",
                type: "boolean",
                default: false
            })
            .option("performance", {
                describe: "Focus on performance analysis",
                type: "boolean",
                default: false
            })
            .option("architecture", {
                describe: "Focus on architecture analysis",
                type: "boolean",
                default: false
            })
            .option("deps", {
                describe: "Analyze dependencies",
                type: "boolean",
                default: false
            })
            .option("evidence", {
                describe: "Include evidence in output",
                type: "boolean",
                default: false
            });
    },

    handler: async (args) => {
        try {
            // Parse the command using CommandParser
            const parsedCommand: ParsedCommand = {
                command: "analyze",
                target: args.target as string,
                args: [],
                flags: {
                    focus: args.focus,
                    depth: args.depth,
                    format: args.format,
                    comprehensive: args.comprehensive,
                    security: args.security,
                    performance: args.performance,
                    architecture: args.architecture,
                    deps: args.deps,
                    evidence: args.evidence
                },
                rawArgs: []
            };

            // Resolve flags using FlagResolver
            const flagResult = FlagResolver.resolve("analyze", parsedCommand.flags);
            
            if (!flagResult.valid) {
                console.error("Flag validation errors:");
                flagResult.errors.forEach(error => console.error(`  - ${error}`));
                process.exit(1);
            }

            if (flagResult.warnings.length > 0) {
                console.warn("Flag warnings:");
                flagResult.warnings.forEach(warning => console.warn(`  - ${warning}`));
            }

            // Execute the analysis
            const result = await handleAnalyzeCommand(parsedCommand, flagResult.resolved);
            
            // Format and display results
            if (result.options.format === "json") {
                console.log(JSON.stringify(result, null, 2));
            } else {
                displayAnalysisResults(result);
            }
            
        } catch (error) {
            console.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    },
});

/**
 * Display analysis results in human-readable format
 */
function displayAnalysisResults(result: AnalysisResult): void {
    console.log("\\n📊 Analysis Results");
    console.log("===================");
    console.log(`Files analyzed: ${result.metadata?.filesAnalyzed || 0}`);
    console.log(`Analysis time: ${result.metadata?.analysisTime || 0}ms`);
    console.log(`Total issues found: ${result.summary.totalIssues}`);
    
    if (result.summary.totalIssues > 0) {
        console.log("\\n🔍 Issues by Severity:");
        Object.entries(result.summary.bySeverity).forEach(([severity, count]) => {
            const icon = severity === 'critical' ? '🚨' : severity === 'high' ? '🔴' : 
                        severity === 'medium' ? '🟡' : severity === 'low' ? '🟠' : 'ℹ️';
            console.log(`  ${icon} ${severity}: ${count}`);
        });
        
        console.log("\\n📂 Issues by Type:");
        Object.entries(result.summary.byType).forEach(([type, count]) => {
            const icon = type === 'security' ? '🔒' : type === 'performance' ? '⚡' : 
                        type === 'architecture' ? '🏗️' : '✨';
            console.log(`  ${icon} ${type}: ${count}`);
        });
        
        if (result.options.evidence) {
            console.log("\\n📋 Detailed Findings:");
            result.findings.slice(0, 10).forEach((finding, index) => {
                console.log(`\\n${index + 1}. [${finding.severity.toUpperCase()}] ${finding.issue}`);
                if (finding.locations && finding.locations.length > 0) {
                    console.log(`   Files: ${finding.locations.slice(0, 3).join(', ')}${finding.locations.length > 3 ? ' ...' : ''}`);
                }
            });
            if (result.findings.length > 10) {
                console.log(`\\n... and ${result.findings.length - 10} more findings`);
            }
        }
    }
    
    if (result.summary.recommendations.length > 0) {
        console.log("\\n💡 Top Recommendations:");
        result.summary.recommendations.slice(0, 5).forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });
    }
    
    console.log("\\n✅ Analysis complete!\\n");
}
