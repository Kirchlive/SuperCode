// /Users/rob/Development/SuperCode/SuperCode/src/tool/__tests__/command-handlers-utility.test.ts
import { describe, test, expect, beforeEach, mock, afterEach } from "bun:test";
import { z } from "zod";
import { Tool } from "../tool";
import { CommandParser, ParsedCommand } from "../command-parser";
import { FlagResolver, ResolvedFlags } from "../flag-resolver";

// Mock persona and context interfaces
interface Persona {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
}

interface CommandContext {
  command: string;
  target?: string;
  args: string[];
  flags: ResolvedFlags;
  persona?: Persona;
  sessionId?: string;
}

// Mock help system operations
const mockHelpSystem = {
  getCommandHelp: mock(async (command: string) => ({
    command,
    description: `Help for ${command} command`,
    usage: `/${command} [options] [target]`,
    flags: [
      { name: "verbose", description: "Enable verbose output" },
      { name: "format", description: "Output format (text|json|markdown)" }
    ],
    examples: [
      `/${command} --verbose`,
      `/${command} src/ --format=json`
    ]
  })),
  getAllCommands: mock(async () => ({
    categories: {
      analysis: ["analyze", "explain", "review"],
      modification: ["implement", "improve", "refactor"],
      process: ["build", "test", "deploy"],
      utility: ["help", "search", "document", "spawn"]
    },
    total: 12
  })),
  getQuickStart: mock(async () => ({
    title: "SuperClaude Quick Start Guide",
    sections: [
      { title: "Getting Started", content: "Welcome to SuperClaude..." },
      { title: "Basic Commands", content: "Here are the most common commands..." }
    ]
  }))
};

// Mock search operations
const mockSearchEngine = {
  searchFiles: mock(async (query: string, options?: any) => ({
    query,
    results: [
      { file: "src/utils/auth.ts", line: 15, match: "authenticate user", context: "function authenticateUser()" },
      { file: "src/components/Login.tsx", line: 8, match: "user authentication", context: "// Handle user authentication" },
      { file: "docs/auth.md", line: 3, match: "authentication flow", context: "## Authentication Flow" }
    ],
    total: 3,
    duration: 0.12
  })),
  searchContent: mock(async (pattern: string, options?: any) => ({
    pattern,
    matches: [
      { file: "src/api.ts", line: 45, text: "const API_KEY = process.env.API_KEY", snippet: "authentication configuration" },
      { file: "src/config.ts", line: 12, text: "auth: { enabled: true }", snippet: "feature flags" }
    ],
    count: 2
  })),
  indexFiles: mock(async (paths: string[]) => ({
    indexed: paths.length,
    files: paths,
    size: "2.4MB",
    duration: 1.8
  }))
};

// Mock documentation operations
const mockDocumentationEngine = {
  generateDocs: mock(async (target: string, options?: any) => ({
    target,
    type: options?.type || "api",
    sections: [
      { title: "Overview", content: "This module provides..." },
      { title: "API Reference", content: "### Functions\n\n- `function1()`..." },
      { title: "Examples", content: "```typescript\nconst result = function1();\n```" }
    ],
    wordCount: 1247,
    generated: new Date().toISOString()
  })),
  updateReadme: mock(async (content: string) => ({
    updated: true,
    size: content.length,
    sections: ["Installation", "Usage", "API", "Contributing"]
  })),
  generateApiDocs: mock(async (sourceFiles: string[]) => ({
    files: sourceFiles,
    functions: 23,
    classes: 8,
    interfaces: 15,
    coverage: 85.5
  }))
};

// Mock spawn operations
const mockSpawnSystem = {
  spawnProcess: mock(async (command: string, options?: any) => ({
    pid: 12345,
    command,
    status: "running",
    startTime: new Date().toISOString(),
    output: `Process spawned: ${command}`
  })),
  spawnService: mock(async (service: string, config?: any) => ({
    serviceId: `service-${Date.now()}`,
    name: service,
    status: "started",
    port: 3000,
    endpoint: `http://localhost:3000`,
    config
  })),
  spawnContainer: mock(async (image: string, options?: any) => ({
    containerId: `container-abc123`,
    image,
    status: "running",
    ports: { "3000/tcp": [{ HostPort: "3000" }] },
    network: "bridge"
  })),
  getSpawnedProcesses: mock(async () => ({
    processes: [
      { pid: 12345, command: "dev-server", status: "running", uptime: "2h 15m" },
      { pid: 12346, command: "watch-tests", status: "running", uptime: "1h 45m" }
    ],
    total: 2
  }))
};

// Mock file system operations
const mockFileSystem = {
  exists: mock(async (path: string) => true),
  read: mock(async (path: string) => ({
    content: `// Sample content for ${path}`,
    size: 256,
    lines: 8
  })),
  write: mock(async (path: string, content: string) => ({
    written: true,
    path,
    size: content.length
  })),
  glob: mock(async (pattern: string) => ({
    files: [`src/${pattern}`, `tests/${pattern}`],
    count: 2
  }))
};

// Mock personas for utility commands
const mockPersonas: Record<string, Persona> = {
  scribe: {
    id: "scribe",
    name: "Documentation Specialist",
    description: "Expert in creating comprehensive documentation",
    system_prompt: "You are a documentation expert focused on clarity and completeness."
  },
  helper: {
    id: "helper",
    name: "Help Assistant",
    description: "Provides clear guidance and assistance",
    system_prompt: "You are a helpful assistant focused on user guidance and support."
  },
  architect: {
    id: "architect",
    name: "System Architect",
    description: "System design and process spawning specialist",
    system_prompt: "You are a system architect focused on efficient process management."
  }
};

describe("Utility Command Handlers - TDD Tests", () => {
  describe("Help Command Handler", () => {
    let helpHandler: Tool;
    let mockCommandContext: CommandContext;

    beforeEach(() => {
      // Reset all mocks
      Object.values(mockHelpSystem).forEach(mock => mock.mockClear());

      // Create help command schema
      const helpSchema = z.object({
        command: z.literal("help"),
        target: z.string().optional(), // Specific command to get help for
        args: z.array(z.string()).default([]),
        flags: z.object({
          all: z.boolean().default(false),
          quick: z.boolean().default(false),
          format: z.enum(["text", "json", "markdown"]).default("text"),
          examples: z.boolean().default(false),
          search: z.string().optional(),
          verbose: z.boolean().default(false)
        }),
        persona: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          system_prompt: z.string()
        }).optional(),
        sessionId: z.string().optional()
      });

      const helpRunner = mock(async function* (props: CommandContext) {
        // Step 1: Determine what help to show
        yield { type: "start", message: "Preparing help information..." };

        const targetCommand = props.target || props.args[0];
        const showAll = props.flags.all || !targetCommand;
        const showQuick = props.flags.quick;

        // Step 2: Generate appropriate help content
        if (showQuick) {
          yield { type: "progress", message: "Loading quick start guide...", step: 1, total: 2 };
          
          const quickStart = await mockHelpSystem.getQuickStart();
          
          return {
            type: "help-complete",
            helpType: "quick-start",
            content: quickStart,
            success: true
          };
        }

        if (showAll) {
          yield { type: "progress", message: "Loading all commands...", step: 1, total: 3 };
          
          const allCommands = await mockHelpSystem.getAllCommands();
          
          yield { type: "update", message: `Found ${allCommands.total} available commands` };

          const helpContent = {
            title: "SuperClaude Command Reference",
            categories: allCommands.categories,
            total: allCommands.total,
            usage: "Use `/help [command]` to get specific help for a command"
          };

          return {
            type: "help-complete",
            helpType: "all-commands",
            content: helpContent,
            success: true
          };
        }

        // Step 3: Get specific command help
        if (targetCommand) {
          yield { type: "progress", message: `Loading help for '${targetCommand}'...`, step: 1, total: 2 };
          
          try {
            const commandHelp = await mockHelpSystem.getCommandHelp(targetCommand);
            
            yield { type: "update", message: `Help loaded for ${targetCommand}` };

            // Enhance help with persona-specific guidance
            if (props.persona?.id === "helper") {
              commandHelp.personalizedTips = [
                `Pro tip: Start with '/${targetCommand} --help' to see all options`,
                `Common use case: '/${targetCommand} src/ --verbose'`
              ];
            }

            return {
              type: "help-complete",
              helpType: "command-specific",
              command: targetCommand,
              content: commandHelp,
              success: true
            };

          } catch (error: any) {
            yield { type: "error", message: `Command '${targetCommand}' not found` };
            
            // Suggest similar commands
            const suggestions = this.findSimilarCommands(targetCommand);
            if (suggestions.length > 0) {
              yield { type: "update", message: `Did you mean: ${suggestions.join(", ")}?` };
            }

            return {
              type: "help-error",
              error: `Unknown command: ${targetCommand}`,
              suggestions,
              success: false
            };
          }
        }

        // Default: show general help
        const generalHelp = {
          title: "SuperClaude Help",
          description: "AI-powered development assistant",
          usage: "Use /help [command] for specific help, or /help --all for all commands",
          quickStart: "/help --quick"
        };

        return {
          type: "help-complete",
          helpType: "general",
          content: generalHelp,
          success: true
        };
      });

      helpHandler = new Tool("help", "Get help and guidance for SuperClaude commands", helpSchema, helpRunner);

      mockCommandContext = {
        command: "help",
        target: undefined,
        args: [],
        flags: {
          format: "text"
        }
      };
    });

    // TDD Test 1: General Help
    test("should provide general help by default", async () => {
      const generator = helpHandler.run(mockCommandContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "help-complete") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.helpType).toBe("general");
      expect(finalResult.content.title).toBe("SuperClaude Help");
    });

    // TDD Test 2: Quick Start Guide
    test("should show quick start guide when quick flag is set", async () => {
      const quickContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, quick: true }
      };

      const generator = helpHandler.run(quickContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "help-complete") {
          finalResult = update;
        }
      }

      expect(mockHelpSystem.getQuickStart).toHaveBeenCalled();
      expect(finalResult?.helpType).toBe("quick-start");
    });

    // TDD Test 3: All Commands Help
    test("should show all commands when all flag is set", async () => {
      const allContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, all: true }
      };

      const generator = helpHandler.run(allContext);
      const updates = [];
      let finalResult;

      for await (const update of generator) {
        if (update.type === "help-complete") {
          finalResult = update;
        } else {
          updates.push(update);
        }
      }

      expect(mockHelpSystem.getAllCommands).toHaveBeenCalled();
      expect(finalResult?.helpType).toBe("all-commands");
      
      const commandCountUpdate = updates.find(u => u.message?.includes("Found 12 available commands"));
      expect(commandCountUpdate).toBeDefined();
    });

    // TDD Test 4: Specific Command Help
    test("should provide specific command help when target is specified", async () => {
      const specificContext = {
        ...mockCommandContext,
        target: "analyze"
      };

      const generator = helpHandler.run(specificContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "help-complete") {
          finalResult = update;
        }
      }

      expect(mockHelpSystem.getCommandHelp).toHaveBeenCalledWith("analyze");
      expect(finalResult?.helpType).toBe("command-specific");
      expect(finalResult?.command).toBe("analyze");
    });

    test("should handle unknown commands gracefully", async () => {
      mockHelpSystem.getCommandHelp.mockRejectedValueOnce(new Error("Command not found"));

      const unknownContext = {
        ...mockCommandContext,
        target: "nonexistent"
      };

      const generator = helpHandler.run(unknownContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "help-error") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.success).toBe(false);
      expect(finalResult.error).toContain("Unknown command: nonexistent");
    });

    // TDD Test 5: Persona Integration
    test("should provide personalized tips with helper persona", async () => {
      const helperContext = {
        ...mockCommandContext,
        target: "build",
        persona: mockPersonas.helper
      };

      const generator = helpHandler.run(helperContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "help-complete") {
          finalResult = update;
        }
      }

      expect(finalResult?.content.personalizedTips).toBeDefined();
      expect(finalResult?.content.personalizedTips).toContain(
        expect.stringContaining("Pro tip")
      );
    });
  });

  describe("Search Command Handler", () => {
    let searchHandler: Tool;
    let mockCommandContext: CommandContext;

    beforeEach(() => {
      // Reset all mocks
      Object.values(mockSearchEngine).forEach(mock => mock.mockClear());
      Object.values(mockFileSystem).forEach(mock => mock.mockClear());

      // Create search command schema
      const searchSchema = z.object({
        command: z.literal("search"),
        target: z.string(), // Search query is required
        args: z.array(z.string()).default([]),
        flags: z.object({
          type: z.enum(["files", "content", "both"]).default("both"),
          path: z.string().optional(),
          include: z.string().optional(),
          exclude: z.string().optional(),
          case_sensitive: z.boolean().default(false),
          regex: z.boolean().default(false),
          limit: z.number().min(1).max(1000).default(50),
          format: z.enum(["text", "json", "markdown"]).default("text"),
          verbose: z.boolean().default(false)
        }),
        persona: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          system_prompt: z.string()
        }).optional(),
        sessionId: z.string().optional()
      });

      const searchRunner = mock(async function* (props: CommandContext) {
        // Step 1: Validate search query
        yield { type: "start", message: "Starting search..." };

        if (!props.target || props.target.trim().length === 0) {
          throw new Error("Search query is required. Specify what to search for.");
        }

        const query = props.target;
        const searchType = props.flags.type || "both";
        const searchPath = props.flags.path || ".";

        // Step 2: Configure search options
        yield { type: "progress", message: "Configuring search parameters...", step: 1, total: 4 };

        const searchOptions = {
          path: searchPath,
          include: props.flags.include,
          exclude: props.flags.exclude,
          caseSensitive: props.flags.case_sensitive,
          regex: props.flags.regex,
          limit: props.flags.limit
        };

        yield { type: "update", message: `Searching for "${query}" in ${searchPath}` };

        // Step 3: Execute search based on type
        const results: any = {
          query,
          searchType,
          files: [],
          content: [],
          total: 0
        };

        if (searchType === "files" || searchType === "both") {
          yield { type: "progress", message: "Searching file names...", step: 2, total: 4 };
          
          const fileResults = await mockSearchEngine.searchFiles(query, searchOptions);
          results.files = fileResults.results;
          results.total += fileResults.total;

          yield { type: "update", message: `Found ${fileResults.total} files matching "${query}"` };
        }

        if (searchType === "content" || searchType === "both") {
          yield { type: "progress", message: "Searching file contents...", step: 3, total: 4 };
          
          const contentResults = await mockSearchEngine.searchContent(query, searchOptions);
          results.content = contentResults.matches;
          results.total += contentResults.count;

          yield { type: "update", message: `Found ${contentResults.count} content matches` };
        }

        // Step 4: Process and format results
        yield { type: "progress", message: "Processing search results...", step: 4, total: 4 };

        // Apply limit
        if (results.total > props.flags.limit) {
          const fileLimit = Math.floor(props.flags.limit / 2);
          const contentLimit = props.flags.limit - fileLimit;
          
          results.files = results.files.slice(0, fileLimit);
          results.content = results.content.slice(0, contentLimit);
          results.limited = true;
          results.originalTotal = results.total;
          results.total = results.files.length + results.content.length;

          yield { 
            type: "warning", 
            message: `Results limited to ${props.flags.limit}. Total matches: ${results.originalTotal}` 
          };
        }

        // Add search statistics
        results.statistics = {
          filesSearched: 150, // Mock value
          duration: 0.25,
          indexSize: "5.2MB"
        };

        return {
          type: "search-complete",
          results,
          success: true,
          executionTime: results.statistics.duration
        };
      });

      searchHandler = new Tool("search", "Search for files and content across the codebase", searchSchema, searchRunner);

      mockCommandContext = {
        command: "search",
        target: "authentication",
        args: [],
        flags: {
          type: "both",
          limit: 50
        }
      };
    });

    // TDD Test 1: Query Validation
    test("should require search query", async () => {
      const invalidContext = {
        ...mockCommandContext,
        target: ""
      };

      const generator = searchHandler.run(invalidContext);

      await expect(async () => {
        for await (const update of generator) {
          // Should throw during validation
        }
      }).toThrow("Search query is required");
    });

    // TDD Test 2: File Search
    test("should search files when type is files or both", async () => {
      const generator = searchHandler.run(mockCommandContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockSearchEngine.searchFiles).toHaveBeenCalledWith(
        "authentication",
        expect.objectContaining({
          path: ".",
          limit: 50
        })
      );

      const fileSearchUpdate = updates.find(u => u.message?.includes("Searching file names"));
      expect(fileSearchUpdate).toBeDefined();
    });

    test("should search only files when type is files", async () => {
      const fileOnlyContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, type: "files" as const }
      };

      const generator = searchHandler.run(fileOnlyContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockSearchEngine.searchFiles).toHaveBeenCalled();
      expect(mockSearchEngine.searchContent).not.toHaveBeenCalled();
    });

    // TDD Test 3: Content Search
    test("should search content when type is content or both", async () => {
      const generator = searchHandler.run(mockCommandContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockSearchEngine.searchContent).toHaveBeenCalledWith(
        "authentication",
        expect.objectContaining({
          path: ".",
          limit: 50
        })
      );

      const contentSearchUpdate = updates.find(u => u.message?.includes("Searching file contents"));
      expect(contentSearchUpdate).toBeDefined();
    });

    // TDD Test 4: Search Options
    test("should handle regex search option", async () => {
      const regexContext = {
        ...mockCommandContext,
        flags: { 
          ...mockCommandContext.flags, 
          regex: true,
          case_sensitive: true
        }
      };

      const generator = searchHandler.run(regexContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockSearchEngine.searchFiles).toHaveBeenCalledWith(
        "authentication",
        expect.objectContaining({
          regex: true,
          caseSensitive: true
        })
      );
    });

    test("should handle path restriction", async () => {
      const pathContext = {
        ...mockCommandContext,
        flags: { 
          ...mockCommandContext.flags, 
          path: "src/auth"
        }
      };

      const generator = searchHandler.run(pathContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockSearchEngine.searchFiles).toHaveBeenCalledWith(
        "authentication",
        expect.objectContaining({
          path: "src/auth"
        })
      );
    });

    // TDD Test 5: Result Limiting
    test("should limit results when they exceed the limit", async () => {
      // Mock many results
      mockSearchEngine.searchFiles.mockResolvedValueOnce({
        query: "authentication",
        results: Array(30).fill(null).map((_, i) => ({ file: `file${i}.ts`, match: "auth" })),
        total: 30
      });

      mockSearchEngine.searchContent.mockResolvedValueOnce({
        pattern: "authentication",
        matches: Array(25).fill(null).map((_, i) => ({ file: `content${i}.ts`, match: "authenticate" })),
        count: 25
      });

      const limitContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, limit: 10 }
      };

      const generator = limitContext;
      const updates = [];
      let finalResult;

      for await (const update of searchHandler.run(limitContext)) {
        if (update.type === "search-complete") {
          finalResult = update;
        } else {
          updates.push(update);
        }
      }

      expect(finalResult?.results.limited).toBe(true);
      expect(finalResult?.results.originalTotal).toBe(55);
      expect(finalResult?.results.total).toBeLessThanOrEqual(10);

      const limitWarning = updates.find(u => u.type === "warning" && u.message?.includes("Results limited"));
      expect(limitWarning).toBeDefined();
    });

    // TDD Test 6: Success Scenarios
    test("should complete successfully with results", async () => {
      const generator = searchHandler.run(mockCommandContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "search-complete") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.success).toBe(true);
      expect(finalResult.results.query).toBe("authentication");
      expect(finalResult.results.statistics).toBeDefined();
    });
  });

  describe("Document Command Handler", () => {
    let documentHandler: Tool;
    let mockCommandContext: CommandContext;

    beforeEach(() => {
      // Reset all mocks
      Object.values(mockDocumentationEngine).forEach(mock => mock.mockClear());
      Object.values(mockFileSystem).forEach(mock => mock.mockClear());

      // Create document command schema with proper Zod validation
      const documentSchema = z.object({
        command: z.literal("document"),
        target: z.string().optional(),
        args: z.array(z.string()).default([]),
        flags: z.object({
          type: z.enum(["api", "user", "dev", "readme"]).default("api"),
          lang: z.string().default("en"),
          template: z.string().optional(),
          output: z.string().optional(),
          format: z.enum(["markdown", "html", "pdf"]).default("markdown"),
          include_examples: z.boolean().default(true),
          auto_update: z.boolean().default(false),
          verbose: z.boolean().default(false)
        }),
        persona: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          system_prompt: z.string()
        }).optional(),
        sessionId: z.string().optional()
      });

      const documentRunner = mock(async function* (props: CommandContext) {
        // Step 1: Determine documentation target
        yield { type: "start", message: "Starting documentation generation..." };

        const target = props.target || props.args.join(" ") || ".";
        const docType = props.flags.type || "api";

        // Step 2: Analyze source files
        yield { type: "progress", message: "Analyzing source files...", step: 1, total: 4 };

        const sourceFiles = await mockFileSystem.glob("**/*.{ts,js,tsx,jsx}");
        
        if (sourceFiles.count === 0) {
          throw new Error(`No source files found in target: ${target}`);
        }

        yield { type: "update", message: `Found ${sourceFiles.count} source files to document` };

        // Step 3: Generate documentation based on type
        yield { type: "progress", message: `Generating ${docType} documentation...`, step: 2, total: 4 };

        const docOptions = {
          type: docType,
          includeExamples: props.flags.include_examples,
          language: props.flags.lang,
          template: props.flags.template,
          format: props.flags.format
        };

        const documentation = await mockDocumentationEngine.generateDocs(target, docOptions);

        // Apply persona-specific enhancements
        if (props.persona?.id === "scribe") {
          documentation.enhanced = true;
          documentation.sections.push({
            title: "Best Practices",
            content: "## Best Practices\n\nBased on code analysis, here are recommended practices..."
          });
        }

        // Step 4: Handle special documentation types
        if (docType === "readme") {
          yield { type: "progress", message: "Updating README.md...", step: 3, total: 4 };
          
          const readmeContent = this.generateReadmeContent(documentation);
          const readmeResult = await mockDocumentationEngine.updateReadme(readmeContent);
          
          yield { type: "update", message: `README.md updated with ${readmeResult.sections.length} sections` };
        }

        if (docType === "api") {
          yield { type: "progress", message: "Generating API documentation...", step: 3, total: 4 };
          
          const apiDocs = await mockDocumentationEngine.generateApiDocs(sourceFiles.files);
          documentation.apiStats = apiDocs;
          
          yield { 
            type: "update", 
            message: `API docs: ${apiDocs.functions} functions, ${apiDocs.classes} classes, ${apiDocs.interfaces} interfaces` 
          };
        }

        // Step 5: Write documentation files
        yield { type: "progress", message: "Writing documentation files...", step: 4, total: 4 };

        const outputPath = props.flags.output || `docs/${target.replace(/[\/\\]/g, "-")}.md`;
        const docContent = this.formatDocumentation(documentation, props.flags.format);
        
        await mockFileSystem.write(outputPath, docContent);
        
        yield { type: "update", message: `Documentation written to: ${outputPath}` };

        return {
          type: "documentation-complete",
          documentation: {
            target,
            type: docType,
            outputPath,
            wordCount: documentation.wordCount,
            sections: documentation.sections.length,
            apiStats: documentation.apiStats,
            enhanced: documentation.enhanced || false
          },
          success: true,
          executionTime: Date.now() - (props.sessionId ? parseInt(props.sessionId) : Date.now())
        };
      });

      documentHandler = new Tool("document", "Generate comprehensive documentation", documentSchema, documentRunner);

      mockCommandContext = {
        command: "document",
        target: "src/api",
        args: [],
        flags: {
          type: "api",
          format: "markdown"
        }
      };
    });

    // TDD Test 1: Source File Analysis
    test("should analyze source files for documentation", async () => {
      const generator = documentHandler.run(mockCommandContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockFileSystem.glob).toHaveBeenCalledWith("**/*.{ts,js,tsx,jsx}");
      
      const analysisUpdate = updates.find(u => u.message?.includes("Analyzing source files"));
      expect(analysisUpdate).toBeDefined();
    });

    test("should fail when no source files found", async () => {
      mockFileSystem.glob.mockResolvedValueOnce({ files: [], count: 0 });

      const generator = documentHandler.run(mockCommandContext);

      await expect(async () => {
        for await (const update of generator) {
          // Should throw when no files found
        }
      }).toThrow("No source files found in target");
    });

    // TDD Test 2: Documentation Types
    test("should generate API documentation by default", async () => {
      const generator = documentHandler.run(mockCommandContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockDocumentationEngine.generateDocs).toHaveBeenCalledWith(
        "src/api",
        expect.objectContaining({ type: "api" })
      );

      expect(mockDocumentationEngine.generateApiDocs).toHaveBeenCalled();
    });

    test("should handle README documentation type", async () => {
      const readmeContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, type: "readme" as const }
      };

      const generator = documentHandler.run(readmeContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockDocumentationEngine.updateReadme).toHaveBeenCalled();
      
      const readmeUpdate = updates.find(u => u.message?.includes("Updating README.md"));
      expect(readmeUpdate).toBeDefined();
    });

    // TDD Test 3: Persona Integration
    test("should enhance documentation with scribe persona", async () => {
      const scribeContext = {
        ...mockCommandContext,
        persona: mockPersonas.scribe
      };

      const generator = documentHandler.run(scribeContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "documentation-complete") {
          finalResult = update;
        }
      }

      expect(finalResult?.documentation.enhanced).toBe(true);
    });

    // TDD Test 4: Output Handling
    test("should write documentation to specified output path", async () => {
      const outputContext = {
        ...mockCommandContext,
        flags: { 
          ...mockCommandContext.flags, 
          output: "custom-docs/api.md"
        }
      };

      const generator = documentHandler.run(outputContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockFileSystem.write).toHaveBeenCalledWith(
        "custom-docs/api.md",
        expect.any(String)
      );

      const outputUpdate = updates.find(u => u.message?.includes("custom-docs/api.md"));
      expect(outputUpdate).toBeDefined();
    });

    // TDD Test 5: Success Scenarios
    test("should complete successfully with API documentation", async () => {
      const generator = documentHandler.run(mockCommandContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "documentation-complete") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.success).toBe(true);
      expect(finalResult.documentation.type).toBe("api");
      expect(finalResult.documentation.apiStats).toBeDefined();
    });
  });

  describe("Spawn Command Handler", () => {
    let spawnHandler: Tool;
    let mockCommandContext: CommandContext;

    beforeEach(() => {
      // Reset all mocks
      Object.values(mockSpawnSystem).forEach(mock => mock.mockClear());

      // Create spawn command schema
      const spawnSchema = z.object({
        command: z.literal("spawn"),
        target: z.string(), // What to spawn (required)
        args: z.array(z.string()).default([]),
        flags: z.object({
          type: z.enum(["process", "service", "container"]).default("process"),
          config: z.string().optional(),
          port: z.number().optional(),
          env: z.string().optional(),
          detached: z.boolean().default(false),
          watch: z.boolean().default(false),
          restart: z.boolean().default(false),
          verbose: z.boolean().default(false)
        }),
        persona: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          system_prompt: z.string()
        }).optional(),
        sessionId: z.string().optional()
      });

      const spawnRunner = mock(async function* (props: CommandContext) {
        // Step 1: Validate spawn target
        yield { type: "start", message: "Preparing to spawn..." };

        if (!props.target || props.target.trim().length === 0) {
          throw new Error("Spawn target is required. Specify what to spawn (command, service, or container).");
        }

        const target = props.target;
        const spawnType = props.flags.type || "process";
        const additionalArgs = props.args;

        // Step 2: Configure spawn options
        yield { type: "progress", message: `Configuring ${spawnType} spawn...`, step: 1, total: 3 };

        const spawnOptions = {
          detached: props.flags.detached,
          watch: props.flags.watch,
          restart: props.flags.restart,
          config: props.flags.config,
          port: props.flags.port,
          env: props.flags.env,
          verbose: props.flags.verbose
        };

        // Apply persona-specific optimizations
        if (props.persona?.id === "architect") {
          spawnOptions.optimized = true;
          spawnOptions.monitoring = true;
        }

        // Step 3: Execute spawn based on type
        yield { type: "progress", message: `Spawning ${spawnType}...`, step: 2, total: 3 };

        let spawnResult;

        switch (spawnType) {
          case "process":
            const fullCommand = [target, ...additionalArgs].join(" ");
            spawnResult = await mockSpawnSystem.spawnProcess(fullCommand, spawnOptions);
            yield { type: "update", message: `Process spawned: PID ${spawnResult.pid}` };
            break;

          case "service":
            spawnResult = await mockSpawnSystem.spawnService(target, spawnOptions);
            yield { type: "update", message: `Service started: ${spawnResult.endpoint}` };
            break;

          case "container":
            spawnResult = await mockSpawnSystem.spawnContainer(target, spawnOptions);
            yield { type: "update", message: `Container running: ${spawnResult.containerId}` };
            break;

          default:
            throw new Error(`Unknown spawn type: ${spawnType}`);
        }

        // Step 4: Set up monitoring if requested
        if (props.flags.watch || spawnOptions.monitoring) {
          yield { type: "progress", message: "Setting up monitoring...", step: 3, total: 3 };
          
          // In real implementation, this would set up process monitoring
          yield { type: "update", message: "Monitoring enabled for spawned entity" };
          spawnResult.monitoring = true;
        }

        return {
          type: "spawn-complete",
          spawn: {
            target,
            type: spawnType,
            result: spawnResult,
            monitoring: spawnResult.monitoring || false,
            options: spawnOptions
          },
          success: true,
          executionTime: Date.now() - (props.sessionId ? parseInt(props.sessionId) : Date.now())
        };
      });

      spawnHandler = new Tool("spawn", "Spawn processes, services, and containers", spawnSchema, spawnRunner);

      mockCommandContext = {
        command: "spawn",
        target: "npm run dev",
        args: [],
        flags: {
          type: "process"
        }
      };
    });

    // TDD Test 1: Target Validation
    test("should require spawn target", async () => {
      const invalidContext = {
        ...mockCommandContext,
        target: ""
      };

      const generator = spawnHandler.run(invalidContext);

      await expect(async () => {
        for await (const update of generator) {
          // Should throw during validation
        }
      }).toThrow("Spawn target is required");
    });

    // TDD Test 2: Process Spawning
    test("should spawn process by default", async () => {
      const generator = spawnHandler.run(mockCommandContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockSpawnSystem.spawnProcess).toHaveBeenCalledWith(
        "npm run dev",
        expect.objectContaining({
          detached: false,
          verbose: false
        })
      );

      const pidUpdate = updates.find(u => u.message?.includes("Process spawned: PID"));
      expect(pidUpdate).toBeDefined();
    });

    test("should spawn process with additional arguments", async () => {
      const argsContext = {
        ...mockCommandContext,
        args: ["--port", "3001", "--hot"]
      };

      const generator = spawnHandler.run(argsContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockSpawnSystem.spawnProcess).toHaveBeenCalledWith(
        "npm run dev --port 3001 --hot",
        expect.any(Object)
      );
    });

    // TDD Test 3: Service Spawning
    test("should spawn service when type is service", async () => {
      const serviceContext = {
        ...mockCommandContext,
        target: "api-server",
        flags: { ...mockCommandContext.flags, type: "service" as const, port: 8080 }
      };

      const generator = spawnHandler.run(serviceContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockSpawnSystem.spawnService).toHaveBeenCalledWith(
        "api-server",
        expect.objectContaining({ port: 8080 })
      );

      const serviceUpdate = updates.find(u => u.message?.includes("Service started"));
      expect(serviceUpdate).toBeDefined();
    });

    // TDD Test 4: Container Spawning
    test("should spawn container when type is container", async () => {
      const containerContext = {
        ...mockCommandContext,
        target: "nginx:latest",
        flags: { ...mockCommandContext.flags, type: "container" as const }
      };

      const generator = spawnHandler.run(containerContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockSpawnSystem.spawnContainer).toHaveBeenCalledWith(
        "nginx:latest",
        expect.any(Object)
      );

      const containerUpdate = updates.find(u => u.message?.includes("Container running"));
      expect(containerUpdate).toBeDefined();
    });

    // TDD Test 5: Monitoring Setup
    test("should set up monitoring when watch flag is set", async () => {
      const watchContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, watch: true }
      };

      const generator = spawnHandler.run(watchContext);
      const updates = [];
      let finalResult;

      for await (const update of generator) {
        if (update.type === "spawn-complete") {
          finalResult = update;
        } else {
          updates.push(update);
        }
      }

      expect(finalResult?.spawn.monitoring).toBe(true);
      
      const monitoringUpdate = updates.find(u => u.message?.includes("Setting up monitoring"));
      expect(monitoringUpdate).toBeDefined();
    });

    // TDD Test 6: Persona Integration
    test("should apply architect persona optimizations", async () => {
      const architectContext = {
        ...mockCommandContext,
        persona: mockPersonas.architect
      };

      const generator = architectContext;
      let finalResult;

      for await (const update of spawnHandler.run(architectContext)) {
        if (update.type === "spawn-complete") {
          finalResult = update;
        }
      }

      expect(finalResult?.spawn.options.optimized).toBe(true);
      expect(finalResult?.spawn.options.monitoring).toBe(true);
    });

    // TDD Test 7: Success Scenarios
    test("should complete successfully with process spawn", async () => {
      const generator = spawnHandler.run(mockCommandContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "spawn-complete") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.success).toBe(true);
      expect(finalResult.spawn.target).toBe("npm run dev");
      expect(finalResult.spawn.type).toBe("process");
    });
  });

  afterEach(() => {
    // Clean up all mocks
    Object.values(mockHelpSystem).forEach(mock => mock.mockRestore());
    Object.values(mockSearchEngine).forEach(mock => mock.mockRestore());
    Object.values(mockDocumentationEngine).forEach(mock => mock.mockRestore());
    Object.values(mockSpawnSystem).forEach(mock => mock.mockRestore());
    Object.values(mockFileSystem).forEach(mock => mock.mockRestore());
    mock.restore();
  });
});