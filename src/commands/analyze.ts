import type { Argv } from "yargs";
import { cmd } from "../cmd";
import * as glob from "../tool/glob";
import * as grep from "../tool/grep";
import * as read from "../tool/read";
import { z } from "zod";

// Analysis command schema
const AnalyzeOptionsSchema = z.object({
  target: z.string().optional().describe("Files, directories, or project to analyze"),
  focus: z.enum(["quality", "security", "performance", "architecture"]).optional(),
  depth: z.enum(["quick", "deep"]).optional().default("quick"),
  format: z.enum(["text", "json", "report"]).optional().default("text")
});

export const AnalyzeCommand = cmd({
    command: "analyze [target]",
    describe: "Analyze code quality, security, performance, and architecture",
    
    builder: (yargs: Argv) => {
        return yargs
            .positional("target", {
                describe: "Target directory or file to analyze",
                type: "string",
                default: ".",
            })
            .option("focus", {
                describe: "Analysis focus area",
                type: "string",
                choices: ["quality", "security", "performance", "architecture"],
            })
            .option("depth", {
                describe: "Analysis depth",
                type: "string",
                choices: ["quick", "deep"],
                default: "quick",
            })
            .option("format", {
                describe: "Output format",
                type: "string",
                choices: ["text", "json", "report"],
                default: "text",
            })
            .example("$0 analyze src/", "Analyze all code in src directory")
            .example("$0 analyze --focus=security --depth=deep", "Deep security analysis");
    },

    handler: async (args) => {
        try {
            const options = AnalyzeOptionsSchema.parse(args);
            const target = options.target || ".";
            
            console.log(`\n🔍 Analyzing ${target}...\n`);
            
            const result = {
                command: "analyze",
                timestamp: new Date().toISOString(),
                target,
                options,
                findings: [] as any[],
                summary: {} as any
            };

            // Use Glob to find files
            const globPattern = target.endsWith(".ts") || target.endsWith(".js") 
                ? target 
                : `${target}/**/*.{ts,tsx,js,jsx}`;
            
            const files = await glob.glob({ pattern: globPattern });
            
            if (!files || files.length === 0) {
                console.log("❌ No files found to analyze");
                return {
                    ...result,
                    error: "No files found to analyze"
                };
            }

            console.log(`Found ${files.length} files to analyze\n`);

            // Analyze based on focus area
            switch (options.focus) {
                case "security":
                    result.findings = await analyzeSecurityPatterns(files);
                    break;
                case "performance":
                    result.findings = await analyzePerformancePatterns(files);
                    break;
                case "architecture":
                    result.findings = await analyzeArchitecturePatterns(files);
                    break;
                case "quality":
                default:
                    result.findings = await analyzeCodeQuality(files);
                    break;
            }

            // Generate summary
            result.summary = generateAnalysisSummary(result.findings);

            // Display results
            displayResults(result, options.format);

            return result;
        } catch (error) {
            console.error("❌ Analysis failed:", error.message);
            return { error: error.message };
        }
    },
});

// Helper functions for analysis
async function analyzeSecurityPatterns(files: string[]): Promise<any[]> {
    const findings = [];
    
    const securityPatterns = [
        { pattern: "eval\\(", severity: "high", issue: "Direct eval usage" },
        { pattern: "innerHTML\\s*=", severity: "medium", issue: "Potential XSS vulnerability" },
        { pattern: "document\\.write", severity: "medium", issue: "Document.write usage" },
        { pattern: "\\bpassword\\b.*=.*['\"]", severity: "high", issue: "Hardcoded password" }
    ];

    for (const pattern of securityPatterns) {
        const matches = await grep.grep({ 
            pattern: pattern.pattern,
            files 
        });
        
        if (matches && matches.length > 0) {
            findings.push({
                type: "security",
                severity: pattern.severity,
                issue: pattern.issue,
                locations: matches
            });
        }
    }

    return findings;
}

async function analyzePerformancePatterns(files: string[]): Promise<any[]> {
    const findings = [];
    
    const performancePatterns = [
        { pattern: "for.*in\\s+", severity: "low", issue: "for...in loop (consider for...of)" },
        { pattern: "\\.forEach\\(", severity: "info", issue: "forEach usage (consider for loop for performance)" },
        { pattern: "JSON\\.parse.*JSON\\.stringify", severity: "medium", issue: "Deep cloning via JSON" }
    ];

    for (const pattern of performancePatterns) {
        const matches = await grep.grep({ 
            pattern: pattern.pattern,
            files 
        });
        
        if (matches && matches.length > 0) {
            findings.push({
                type: "performance",
                severity: pattern.severity,
                issue: pattern.issue,
                locations: matches
            });
        }
    }

    return findings;
}

async function analyzeArchitecturePatterns(files: string[]): Promise<any[]> {
    const findings = [];
    
    // Check for circular dependencies, layer violations, etc.
    const importPattern = "^import.*from";
    const imports = await grep.grep({ 
        pattern: importPattern,
        files 
    });

    if (imports && imports.length > 0) {
        // Basic architecture analysis
        findings.push({
            type: "architecture",
            severity: "info",
            issue: "Import structure analysis",
            details: {
                totalImports: imports.length,
                files: files.length,
                averageImports: Math.round(imports.length / files.length)
            }
        });
    }

    return findings;
}

async function analyzeCodeQuality(files: string[]): Promise<any[]> {
    const findings = [];
    
    const qualityPatterns = [
        { pattern: "console\\.(log|error|warn)", severity: "info", issue: "Console statement" },
        { pattern: "TODO|FIXME|HACK", severity: "info", issue: "Code comment marker" },
        { pattern: "any\\s*\\)", severity: "low", issue: "TypeScript 'any' type usage" },
        { pattern: "!important", severity: "low", issue: "CSS !important usage" }
    ];

    for (const pattern of qualityPatterns) {
        const matches = await grep.grep({ 
            pattern: pattern.pattern,
            files 
        });
        
        if (matches && matches.length > 0) {
            findings.push({
                type: "quality",
                severity: pattern.severity,
                issue: pattern.issue,
                count: matches.length,
                locations: matches.slice(0, 5) // Limit to first 5 locations
            });
        }
    }

    return findings;
}

function generateAnalysisSummary(findings: any[]): any {
    const summary = {
        totalIssues: findings.length,
        bySeverity: {} as Record<string, number>,
        byType: {} as Record<string, number>
    };

    findings.forEach(finding => {
        // Count by severity
        summary.bySeverity[finding.severity] = (summary.bySeverity[finding.severity] || 0) + 1;
        
        // Count by type
        summary.byType[finding.type] = (summary.byType[finding.type] || 0) + 1;
    });

    return summary;
}

function displayResults(result: any, format: string) {
    if (format === "json") {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    // Text format
    console.log("📊 Analysis Results\n" + "=".repeat(50));
    console.log(`Target: ${result.target}`);
    console.log(`Time: ${new Date(result.timestamp).toLocaleString()}`);
    console.log(`Focus: ${result.options.focus || "general"}\n`);

    if (result.findings.length === 0) {
        console.log("✅ No issues found!");
        return;
    }

    // Display findings by severity
    const severityOrder = ["high", "medium", "low", "info"];
    const severityIcons = {
        high: "🔴",
        medium: "🟡",
        low: "🟢",
        info: "ℹ️"
    };

    severityOrder.forEach(severity => {
        const severityFindings = result.findings.filter(f => f.severity === severity);
        if (severityFindings.length > 0) {
            console.log(`\n${severityIcons[severity]} ${severity.toUpperCase()} (${severityFindings.length})`);
            severityFindings.forEach(finding => {
                console.log(`  - ${finding.issue}`);
                if (finding.count) {
                    console.log(`    Found ${finding.count} occurrences`);
                }
            });
        }
    });

    // Display summary
    console.log(`\n📈 Summary`);
    console.log(`Total Issues: ${result.summary.totalIssues}`);
    Object.entries(result.summary.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
}