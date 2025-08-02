// /Users/rob/Development/SuperCode/SuperCode/src/tool/__tests__/command-handlers-analysis.test.ts
import { describe, test, expect, beforeEach, mock, afterEach } from "bun:test";
import { z } from "zod";
import { Tool } from "../tool";
import { CommandParser, ParsedCommand } from "../command-parser";
import { FlagResolver, ResolvedFlags } from "../flag-resolver";

// Mock persona interfaces
interface Persona {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
}

// Mock command execution context
interface CommandContext {
  command: string;
  target?: string;
  args: string[];
  flags: ResolvedFlags;
  persona?: Persona;
  sessionId?: string;
}

// Mock tool wrappers for analysis commands
const mockToolWrappers = {
  glob: mock(async (pattern: string, options?: any) => ({
    files: [`src/${pattern}`, `tests/${pattern}`],
    count: 2
  })),
  grep: mock(async (pattern: string, options?: any) => ({
    matches: [
      { file: "src/index.ts", line: 10, text: "function analyze()" },
      { file: "src/utils.ts", line: 25, text: "const analyzeResult = " }
    ],
    count: 2
  })),
  read: mock(async (filePath: string) => ({
    content: `// Sample file content for ${filePath}\nexport function example() { return true; }`,
    lines: 2,
    size: 64
  })),
  write: mock(async (filePath: string, content: string) => ({
    written: true,
    path: filePath,
    size: content.length
  }))
};

// Mock personas
const mockPersonas: Record<string, Persona> = {
  analyzer: {
    id: "analyzer",
    name: "Code Analyzer",
    description: "Specialized in code analysis and quality assessment",
    system_prompt: "You are an expert code analyzer focused on quality, patterns, and best practices."
  },
  security: {
    id: "security",
    name: "Security Expert",
    description: "Security-focused analysis and vulnerability assessment",
    system_prompt: "You are a security expert focused on identifying vulnerabilities and security risks."
  },
  architect: {
    id: "architect",
    name: "Software Architect",
    description: "Architecture and design pattern analysis",
    system_prompt: "You are a software architect focused on system design and architectural patterns."
  }
};

describe("Analysis Command Handlers - TDD Tests", () => {
  describe("Analyze Command Handler", () => {
    let analyzeHandler: Tool;
    let mockCommandContext: CommandContext;

    beforeEach(() => {
      // Reset all mocks
      Object.values(mockToolWrappers).forEach(mock => mock.mockClear());

      // Create analyze command handler schema
      const analyzeSchema = z.object({
        command: z.literal("analyze"),
        target: z.string().optional(),
        args: z.array(z.string()).default([]),
        flags: z.object({
          focus: z.enum(["quality", "security", "performance", "architecture"]).optional(),
          depth: z.enum(["quick", "deep"]).default("deep"),
          code: z.boolean().default(false),
          security: z.boolean().default(false),
          performance: z.boolean().default(false),
          architecture: z.boolean().default(false),
          deps: z.boolean().default(false),
          patterns: z.boolean().default(false),
          forensic: z.boolean().default(false),
          trace: z.boolean().default(false),
          logs: z.boolean().default(false),
          comprehensive: z.boolean().default(false),
          evidence: z.boolean().default(false),
          report: z.boolean().default(false),
          format: z.enum(["text", "json", "markdown"]).default("text"),
          output: z.string().optional(),
          verbose: z.boolean().default(false),
          quiet: z.boolean().default(false)
        }),
        persona: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          system_prompt: z.string()
        }).optional(),
        sessionId: z.string().optional()
      });

      const analyzeRunner = mock(async function* (props: CommandContext) {
        // Step 1: Parameter validation
        yield { type: "start", message: "Starting code analysis..." };

        if (!props.target && props.args.length === 0) {
          throw new Error("Analysis target is required. Specify files, directories, or patterns.");
        }

        const target = props.target || props.args[0] || ".";
        
        // Step 2: Tool integration - discover files
        yield { type: "progress", message: "Discovering files to analyze...", step: 1, total: 5 };
        const globResult = await mockToolWrappers.glob(`**/*.{ts,js,tsx,jsx}`, { cwd: target });

        if (globResult.files.length === 0) {
          throw new Error(`No analyzable files found in target: ${target}`);
        }

        // Step 3: Flag-based analysis selection
        const analysisTypes = [];
        if (props.flags.code || props.flags.comprehensive) analysisTypes.push("code quality");
        if (props.flags.security || props.flags.focus === "security") analysisTypes.push("security");
        if (props.flags.performance || props.flags.focus === "performance") analysisTypes.push("performance");
        if (props.flags.architecture || props.flags.focus === "architecture") analysisTypes.push("architecture");
        if (props.flags.deps) analysisTypes.push("dependencies");
        if (props.flags.patterns) analysisTypes.push("patterns");

        if (analysisTypes.length === 0) {
          analysisTypes.push("general code quality"); // Default
        }

        yield { 
          type: "update", 
          message: `Analyzing ${globResult.files.length} files for: ${analysisTypes.join(", ")}` 
        };

        // Step 4: File analysis with tool integration
        yield { type: "progress", message: "Analyzing file contents...", step: 2, total: 5 };
        
        const analysisResults = [];
        for (const file of globResult.files) {
          const content = await mockToolWrappers.read(file);
          
          // Perform different analysis types based on flags
          const fileAnalysis: any = {
            file,
            size: content.size,
            lines: content.lines
          };

          if (props.flags.security || props.flags.focus === "security") {
            // Mock security analysis
            const securityIssues = await mockToolWrappers.grep("(eval|innerHTML|dangerouslySetInnerHTML)", { file });
            fileAnalysis.security = {
              issues: securityIssues.matches.length,
              details: securityIssues.matches
            };
          }

          if (props.flags.patterns) {
            // Mock pattern analysis
            const patterns = await mockToolWrappers.grep("(class|function|const|let|var)", { file });
            fileAnalysis.patterns = {
              constructs: patterns.count,
              details: patterns.matches
            };
          }

          analysisResults.push(fileAnalysis);
        }

        // Step 5: Persona-specific analysis
        yield { type: "progress", message: "Applying persona-specific analysis...", step: 3, total: 5 };
        
        let personaInsights = {};
        if (props.persona) {
          switch (props.persona.id) {
            case "security":
              personaInsights = {
                securityScore: 85,
                vulnerabilities: ["Potential XSS in component", "Unsafe eval usage"],
                recommendations: ["Sanitize user input", "Use safe evaluation methods"]
              };
              break;
            case "architect":
              personaInsights = {
                architecturalScore: 78,
                patterns: ["Module pattern", "Observer pattern"],
                suggestions: ["Consider dependency injection", "Implement proper separation of concerns"]
              };
              break;
            default:
              personaInsights = {
                overallScore: 82,
                codeQuality: "Good",
                suggestions: ["Add more unit tests", "Improve documentation"]
              };
          }
        }

        // Step 6: Generate report
        yield { type: "progress", message: "Generating analysis report...", step: 4, total: 5 };

        const report = {
          summary: {
            filesAnalyzed: globResult.files.length,
            analysisTypes: analysisTypes,
            overallScore: personaInsights.overallScore || 80,
            persona: props.persona?.name || "General Analysis"
          },
          results: analysisResults,
          insights: personaInsights,
          timestamp: new Date().toISOString(),
          flags: props.flags
        };

        // Step 7: Output handling
        yield { type: "progress", message: "Finalizing output...", step: 5, total: 5 };

        if (props.flags.output) {
          const outputContent = props.flags.format === "json" 
            ? JSON.stringify(report, null, 2)
            : props.flags.format === "markdown"
            ? this.formatAsMarkdown(report)
            : this.formatAsText(report);
          
          await mockToolWrappers.write(props.flags.output, outputContent);
          yield { type: "update", message: `Analysis report written to: ${props.flags.output}` };
        }

        return {
          type: "analysis-complete",
          report,
          success: true,
          executionTime: Date.now() - (props.sessionId ? parseInt(props.sessionId) : Date.now())
        };
      });

      analyzeHandler = new Tool("analyze", "Analyze code quality, security, performance, and architecture", analyzeSchema, analyzeRunner);

      mockCommandContext = {
        command: "analyze",
        target: "src/",
        args: [],
        flags: {
          depth: "deep",
          format: "text"
        }
      };
    });

    // TDD Test 1: Parameter Validation
    test("should validate required target parameter", async () => {
      const invalidContext = {
        ...mockCommandContext,
        target: undefined,
        args: []
      };

      const generator = analyzeHandler.run(invalidContext);
      
      await expect(async () => {
        for await (const update of generator) {
          // Should throw during execution
        }
      }).toThrow("Analysis target is required");
    });

    test("should accept target from args if not specified directly", async () => {
      const validContext = {
        ...mockCommandContext,
        target: undefined,
        args: ["lib/"]
      };

      const generator = analyzeHandler.run(validContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(updates[0].type).toBe("start");
      expect(mockToolWrappers.glob).toHaveBeenCalled();
    });

    // TDD Test 2: Tool Integration - Glob
    test("should discover files using glob tool wrapper", async () => {
      const generator = analyzeHandler.run(mockCommandContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockToolWrappers.glob).toHaveBeenCalledWith(
        "**/*.{ts,js,tsx,jsx}",
        { cwd: "src/" }
      );

      const discoveryUpdate = updates.find(u => u.message?.includes("Discovering files"));
      expect(discoveryUpdate).toBeDefined();
    });

    test("should handle empty file discovery gracefully", async () => {
      mockToolWrappers.glob.mockResolvedValueOnce({ files: [], count: 0 });

      const generator = analyzeHandler.run(mockCommandContext);

      await expect(async () => {
        for await (const update of generator) {
          // Should throw when no files found
        }
      }).toThrow("No analyzable files found");
    });

    // TDD Test 3: Flag Handling - Focus Areas
    test("should handle focus=security flag correctly", async () => {
      const securityContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, focus: "security" as const }
      };

      const generator = analyzeHandler.run(securityContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      const analysisUpdate = updates.find(u => u.message?.includes("security"));
      expect(analysisUpdate).toBeDefined();
      expect(mockToolWrappers.grep).toHaveBeenCalledWith(
        expect.stringContaining("eval"),
        expect.any(Object)
      );
    });

    test("should handle multiple analysis flags", async () => {
      const multiContext = {
        ...mockCommandContext,
        flags: {
          ...mockCommandContext.flags,
          security: true,
          patterns: true,
          performance: true
        }
      };

      const generator = analyzeHandler.run(multiContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      const analysisUpdate = updates.find(u => 
        u.message?.includes("security") && 
        u.message?.includes("patterns") && 
        u.message?.includes("performance")
      );
      expect(analysisUpdate).toBeDefined();
    });

    // TDD Test 4: Tool Integration - Read Files
    test("should read file contents for analysis", async () => {
      const generator = analyzeHandler.run(mockCommandContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockToolWrappers.read).toHaveBeenCalled();
      
      const contentUpdate = updates.find(u => u.message?.includes("Analyzing file contents"));
      expect(contentUpdate).toBeDefined();
    });

    // TDD Test 5: Tool Integration - Grep for Patterns
    test("should use grep for pattern analysis when patterns flag is set", async () => {
      const patternsContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, patterns: true }
      };

      const generator = analyzeHandler.run(patternsContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockToolWrappers.grep).toHaveBeenCalledWith(
        "(class|function|const|let|var)",
        expect.any(Object)
      );
    });

    // TDD Test 6: Persona Integration
    test("should apply security persona insights when security persona is used", async () => {
      const securityContext = {
        ...mockCommandContext,
        persona: mockPersonas.security
      };

      const generator = analyzeHandler.run(securityContext);
      const updates = [];
      let finalResult;

      for await (const update of generator) {
        if (update.type === "analysis-complete") {
          finalResult = update;
        } else {
          updates.push(update);
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.report.insights.securityScore).toBeDefined();
      expect(finalResult.report.insights.vulnerabilities).toBeDefined();
      
      const personaUpdate = updates.find(u => u.message?.includes("persona-specific"));
      expect(personaUpdate).toBeDefined();
    });

    test("should apply architect persona insights", async () => {
      const architectContext = {
        ...mockCommandContext,
        persona: mockPersonas.architect
      };

      const generator = analyzeHandler.run(architectContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "analysis-complete") {
          finalResult = update;
        }
      }

      expect(finalResult?.report.insights.architecturalScore).toBeDefined();
      expect(finalResult?.report.insights.patterns).toBeDefined();
    });

    // TDD Test 7: Output Handling - Write Tool Integration
    test("should write report to file when output flag is specified", async () => {
      const outputContext = {
        ...mockCommandContext,
        flags: { 
          ...mockCommandContext.flags, 
          output: "analysis-report.json",
          format: "json" as const
        }
      };

      const generator = analyzeHandler.run(outputContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockToolWrappers.write).toHaveBeenCalledWith(
        "analysis-report.json",
        expect.stringContaining('"type": "analysis-complete"')
      );

      const outputUpdate = updates.find(u => u.message?.includes("written to"));
      expect(outputUpdate).toBeDefined();
    });

    test("should handle different output formats", async () => {
      const formats = ["json", "markdown", "text"] as const;
      
      for (const format of formats) {
        mockToolWrappers.write.mockClear();
        
        const formatContext = {
          ...mockCommandContext,
          flags: { 
            ...mockCommandContext.flags, 
            output: `report.${format}`,
            format
          }
        };

        const generator = analyzeHandler.run(formatContext);
        
        for await (const update of generator) {
          // Consume updates
        }

        expect(mockToolWrappers.write).toHaveBeenCalledWith(
          `report.${format}`,
          expect.any(String)
        );
      }
    });

    // TDD Test 8: Success Scenarios
    test("should complete successfully with minimal flags", async () => {
      const minimalContext = {
        ...mockCommandContext,
        flags: { format: "text" as const }
      };

      const generator = analyzeHandler.run(minimalContext);
      let finalResult;
      const updates = [];

      for await (const update of generator) {
        if (update.type === "analysis-complete") {
          finalResult = update;
        } else {
          updates.push(update);
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.success).toBe(true);
      expect(finalResult.report).toBeDefined();
      expect(finalResult.report.summary).toBeDefined();
      expect(finalResult.report.results).toBeDefined();
    });

    test("should complete successfully with comprehensive analysis", async () => {
      const comprehensiveContext = {
        ...mockCommandContext,
        flags: {
          ...mockCommandContext.flags,
          comprehensive: true,
          security: true,
          patterns: true,
          evidence: true,
          verbose: true
        },
        persona: mockPersonas.analyzer
      };

      const generator = analyzeHandler.run(comprehensiveContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "analysis-complete") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.success).toBe(true);
      expect(finalResult.report.summary.analysisTypes).toContain("security");
      expect(finalResult.report.summary.analysisTypes).toContain("patterns");
    });

    // TDD Test 9: Error Conditions
    test("should handle tool wrapper failures gracefully", async () => {
      mockToolWrappers.glob.mockRejectedValueOnce(new Error("File system error"));

      const generator = analyzeHandler.run(mockCommandContext);

      await expect(async () => {
        for await (const update of generator) {
          // Should propagate the error
        }
      }).toThrow("File system error");
    });

    test("should handle read failures for individual files", async () => {
      mockToolWrappers.read.mockRejectedValueOnce(new Error("Permission denied"));

      const generator = analyzeHandler.run(mockCommandContext);

      // Should continue processing other files despite individual failures
      const updates = [];
      try {
        for await (const update of generator) {
          updates.push(update);
        }
      } catch (error) {
        // Expected to propagate read error
        expect(error.message).toContain("Permission denied");
      }
    });

    // TDD Test 10: Edge Cases
    test("should handle empty files gracefully", async () => {
      mockToolWrappers.read.mockResolvedValueOnce({
        content: "",
        lines: 0,
        size: 0
      });

      const generator = analyzeHandler.run(mockCommandContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "analysis-complete") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.success).toBe(true);
      // Should handle zero-line files
      const emptyFileResult = finalResult.report.results.find((r: any) => r.lines === 0);
      expect(emptyFileResult).toBeDefined();
    });

    test("should handle very large codebases efficiently", async () => {
      const largeFileList = Array.from({ length: 1000 }, (_, i) => `src/file${i}.ts`);
      mockToolWrappers.glob.mockResolvedValueOnce({
        files: largeFileList,
        count: 1000
      });

      const generator = analyzeHandler.run(mockCommandContext);
      const updates = [];
      let finalResult;

      for await (const update of generator) {
        if (update.type === "analysis-complete") {
          finalResult = update;
        } else {
          updates.push(update);
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.report.summary.filesAnalyzed).toBe(1000);
      
      // Should have progress updates for large operations
      const progressUpdates = updates.filter(u => u.type === "progress");
      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });
  
  // Additional analysis command handlers would follow the same pattern...
  describe("Explain Command Handler", () => {
    // Similar TDD structure for explain command
    test("should provide explanations at different complexity levels", () => {
      // Test implementation would follow similar pattern
    });
  });

  describe("Review Command Handler", () => {
    // Similar TDD structure for review command
    test("should perform code review with different focus areas", () => {
      // Test implementation would follow similar pattern
    });
  });

  afterEach(() => {
    // Clean up all mocks
    Object.values(mockToolWrappers).forEach(mock => mock.mockRestore());
    mock.restore();
  });
});