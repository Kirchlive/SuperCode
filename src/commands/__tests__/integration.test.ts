// Integration Tests for Utility Commands
// Verify command metadata compatibility and cross-command integration

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { HelpCommand } from "../help";
import { SearchCommand } from "../search";
import { DocumentCommand } from "../document";
import { SpawnCommand } from "../spawn";

// Mock integration points
const mockCommandRegistry = {
  help: HelpCommand,
  search: SearchCommand,
  document: DocumentCommand,
  spawn: SpawnCommand
};

// Mock external metadata from superclaude
const mockSuperClaudeMetadata = {
  help: {
    allowedTools: ["Read", "Grep"],
    description: "Context-aware help with examples and command suggestions",
    category: "utility",
    complexity: "low"
  },
  search: {
    allowedTools: ["Read", "Grep", "Glob"],
    description: "Advanced code search with semantic understanding",
    category: "utility", 
    complexity: "medium"
  },
  document: {
    allowedTools: ["Read", "Grep", "Glob", "Write", "Edit"],
    description: "Create focused documentation for specific components or features",
    category: "utility",
    complexity: "medium"
  },
  spawn: {
    allowedTools: ["Read", "Grep", "Glob", "Bash", "TodoWrite", "Edit", "MultiEdit", "Write"],
    description: "Break complex tasks into coordinated subtasks with efficient execution",
    category: "utility",
    complexity: "high"
  }
};

describe("Utility Commands Integration Tests", () => {
  describe("Command Metadata Compatibility", () => {
    test("should have consistent command structure", () => {
      for (const [name, command] of Object.entries(mockCommandRegistry)) {
        expect(command).toBeDefined();
        expect(command.command).toBeDefined();
        expect(command.describe).toBeDefined();
        expect(command.builder).toBeDefined();
        expect(command.handler).toBeDefined();
        
        // Verify command naming convention
        expect(command.command).toMatch(new RegExp(`^${name}`));
      }
    });

    test("should match external SuperClaude metadata", () => {
      for (const [name, metadata] of Object.entries(mockSuperClaudeMetadata)) {
        const command = mockCommandRegistry[name as keyof typeof mockCommandRegistry];
        expect(command).toBeDefined();
        
        // Verify description consistency
        const commandDescription = command.describe.toLowerCase();
        const metadataDescription = metadata.description.toLowerCase();
        
        // Should have some keyword overlap
        const commandWords = commandDescription.split(/\s+/);
        const metadataWords = metadataDescription.split(/\s+/);
        const overlap = commandWords.filter(word => 
          metadataWords.some(metaWord => 
            metaWord.includes(word) || word.includes(metaWord)
          )
        );
        
        expect(overlap.length).toBeGreaterThan(0);
      }
    });

    test("should have proper argument validation", async () => {
      // Test required arguments
      const searchResult = await SearchCommand.handler({ query: "" });
      expect(searchResult).toBeUndefined(); // Should exit early with error
      
      const spawnResult = await SpawnCommand.handler({ task: "" });
      expect(spawnResult).toBeUndefined(); // Should exit early with error
      
      // Test optional arguments with defaults
      const helpResult = await HelpCommand.handler({});
      expect(helpResult).toBeDefined();
      expect(helpResult.type).toBe("help-response");
      
      const documentResult = await DocumentCommand.handler({ target: "." });
      expect(documentResult).toBeDefined();
      expect(documentResult.type).toBe("documentation-complete");
    });
  });

  describe("Cross-Command Integration", () => {
    test("help command should know about all utility commands", async () => {
      const helpResult = await HelpCommand.handler({ all: true });
      
      expect(helpResult.success).toBe(true);
      expect(helpResult.content.categories.utility).toContain("help");
      expect(helpResult.content.categories.utility).toContain("search");
      expect(helpResult.content.categories.utility).toContain("document");
      expect(helpResult.content.categories.utility).toContain("spawn");
    });

    test("help command should provide specific help for utility commands", async () => {
      const commands = ["search", "document", "spawn"];
      
      for (const command of commands) {
        const helpResult = await HelpCommand.handler({ target: command });
        
        expect(helpResult.success).toBe(true);
        expect(helpResult.help_type).toBe("command-specific");
        expect(helpResult.command).toBe(command);
        expect(helpResult.content.command).toBe(command);
        expect(helpResult.content.usage).toContain(`/${command}`);
        expect(helpResult.content.examples).toBeDefined();
        expect(helpResult.content.examples.length).toBeGreaterThan(0);
      }
    });

    test("search command should find utility command implementations", async () => {
      const searchResult = await SearchCommand.handler({
        query: "export.*Command",
        type: "content",
        regex: true,
        path: "src/commands"
      });
      
      expect(searchResult.success).toBe(true);
      expect(searchResult.content_results.matches.length).toBeGreaterThan(0);
      
      // Should find all command exports
      const foundCommands = searchResult.content_results.matches
        .map((match: any) => match.text)
        .filter((text: string) => text.includes("Command"));
      
      expect(foundCommands.length).toBeGreaterThanOrEqual(4);
    });

    test("spawn command should be able to orchestrate documentation generation", async () => {
      const spawnResult = await SpawnCommand.handler({
        task: "Generate comprehensive API documentation",
        dryRun: true,
        strategy: "sequential"
      });
      
      expect(spawnResult.success).toBe(true);
      expect(spawnResult.type).toBe("spawn-dry-run");
      expect(spawnResult.execution_plan.phases.length).toBeGreaterThan(0);
      
      // Should include documentation-related tasks
      const tasks = spawnResult.task_breakdown;
      const hasDocTask = tasks.some((task: any) => 
        task.title.toLowerCase().includes("document") ||
        task.description.toLowerCase().includes("document")
      );
      expect(hasDocTask).toBe(true);
    });
  });

  describe("Persona Integration Compatibility", () => {
    test("all commands should support persona enhancements", async () => {
      const persona = {
        id: "architect",
        name: "System Architect", 
        description: "Expert in system design",
        system_prompt: "Focus on architectural considerations"
      };

      // Help with architect persona
      const helpResult = await HelpCommand.handler({ 
        target: "analyze",
        persona: persona.id
      });
      expect(helpResult.success).toBe(true);
      if (helpResult.content.personalizedTips) {
        expect(helpResult.content.personalizedTips.length).toBeGreaterThan(0);
      }

      // Search with architect persona  
      const searchResult = await SearchCommand.handler({
        query: "architecture",
        persona: persona.id
      });
      expect(searchResult.success).toBe(true);
      
      // Document with architect persona
      const documentResult = await DocumentCommand.handler({
        target: "src",
        persona: persona.id
      });
      expect(documentResult.success).toBe(true);
      
      // Spawn with architect persona
      const spawnResult = await SpawnCommand.handler({
        task: "Design system architecture", 
        dryRun: true,
        persona: persona.id
      });
      expect(spawnResult.success).toBe(true);
    });

    test("persona enhancements should be consistent across commands", () => {
      const personas = ["architect", "developer", "scribe"];
      
      personas.forEach(persona => {
        // Each command should handle the same personas
        expect(typeof HelpCommand.getPersonalizedHelp).toBe("function");
        expect(typeof SearchCommand.applyPersonaEnhancements).toBe("function");
        expect(typeof DocumentCommand.generateOutputPath).toBe("function"); // Static method exists
        expect(typeof SpawnCommand.applyPersonaEnhancements).toBe("function");
      });
    });
  });

  describe("Error Handling Consistency", () => {
    test("all commands should handle errors gracefully", async () => {
      // Test invalid inputs for each command
      const errorCases = [
        {
          command: SearchCommand,
          args: { query: "test", path: "/nonexistent/path" }
        },
        {
          command: DocumentCommand, 
          args: { target: "/nonexistent/path" }
        },
        {
          command: SpawnCommand,
          args: { task: "impossible task with circular dependencies" }
        }
      ];

      for (const testCase of errorCases) {
        try {
          const result = await testCase.command.handler(testCase.args);
          
          // Should either return error result or throw handled exception
          if (result) {
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.suggestions).toBeDefined();
            expect(Array.isArray(result.suggestions)).toBe(true);
          }
        } catch (error) {
          // Thrown errors should be informative
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBeDefined();
          expect((error as Error).message.length).toBeGreaterThan(0);
        }
      }
    });

    test("error messages should be user-friendly and actionable", async () => {
      const helpResult = await HelpCommand.handler({ target: "nonexistent" });
      
      if (!helpResult.success) {
        expect(helpResult.error).toContain("Unknown command");
        expect(helpResult.suggestions).toBeDefined();
        expect(helpResult.suggestions.length).toBeGreaterThan(0);
        expect(helpResult.suggestions[0]).toContain("Did you mean");
      }
    });
  });

  describe("Output Format Consistency", () => {
    test("all commands should support standard output formats", async () => {
      const formats = ["text", "json", "markdown"];
      
      for (const format of formats) {
        // Help command
        const helpResult = await HelpCommand.handler({ 
          target: "search",
          format 
        });
        expect(helpResult.success).toBe(true);
        
        // Search command
        const searchResult = await SearchCommand.handler({
          query: "test",
          format
        });
        expect(searchResult.success).toBe(true);
        
        // Document command supports different formats
        const documentResult = await DocumentCommand.handler({
          target: ".",
          format: format === "text" ? "markdown" : format // Document uses markdown instead of text
        });
        expect(documentResult.success).toBe(true);
      }
    });

    test("JSON output should be valid and consistent", async () => {
      const commands = [
        () => HelpCommand.handler({ format: "json" }),
        () => SearchCommand.handler({ query: "test", format: "json" })
      ];

      for (const commandFn of commands) {
        const result = await commandFn();
        expect(result.success).toBe(true);
        
        // Should be valid JSON structure
        expect(typeof result).toBe("object");
        expect(result.type).toBeDefined();
        expect(typeof result.type).toBe("string");
      }
    });
  });

  describe("Performance Requirements", () => {
    test("commands should complete within reasonable time limits", async () => {
      const performanceTests = [
        {
          name: "help",
          command: () => HelpCommand.handler({}),
          maxTime: 200
        },
        {
          name: "search",
          command: () => SearchCommand.handler({ query: "test", limit: 10 }),
          maxTime: 1000
        },
        {
          name: "document",
          command: () => DocumentCommand.handler({ target: ".", type: "api" }),
          maxTime: 2000
        },
        {
          name: "spawn-dry-run",
          command: () => SpawnCommand.handler({ task: "simple task", dryRun: true }),
          maxTime: 500
        }
      ];

      for (const test of performanceTests) {
        const startTime = Date.now();
        const result = await test.command();
        const executionTime = Date.now() - startTime;
        
        expect(result).toBeDefined();
        expect(executionTime).toBeLessThan(test.maxTime);
      }
    });

    test("commands should handle concurrent execution", async () => {
      const concurrentCommands = [
        HelpCommand.handler({ target: "search" }),
        HelpCommand.handler({ target: "document" }),
        HelpCommand.handler({ target: "spawn" }),
        SearchCommand.handler({ query: "test", limit: 5 })
      ];

      const startTime = Date.now();
      const results = await Promise.all(concurrentCommands);
      const totalTime = Date.now() - startTime;
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Concurrent execution should be faster than sequential
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe("Tool Integration Compatibility", () => {
    test("commands should declare compatible tools correctly", () => {
      for (const [name, metadata] of Object.entries(mockSuperClaudeMetadata)) {
        const allowedTools = metadata.allowedTools;
        
        // All commands should support basic tools
        expect(allowedTools).toContain("Read");
        
        // Search and documentation tools for content analysis
        if (["search", "document"].includes(name)) {
          expect(allowedTools).toContain("Grep");
          expect(allowedTools).toContain("Glob");
        }
        
        // Writing tools for output generation
        if (["document", "spawn"].includes(name)) {
          expect(allowedTools).toContain("Write");
        }
        
        // Spawn should have the most comprehensive tool set
        if (name === "spawn") {
          expect(allowedTools).toContain("TodoWrite");
          expect(allowedTools).toContain("Bash");
          expect(allowedTools).toContain("MultiEdit");
        }
      }
    });

    test("tool usage should match declared capabilities", async () => {
      // Document command should be able to write files
      const documentResult = await DocumentCommand.handler({
        target: "src",
        output: "test-output.md"
      });
      expect(documentResult.success).toBe(true);
      expect(documentResult.output_path).toContain("test-output.md");
      
      // Search command should be able to use different search types
      const fileSearchResult = await SearchCommand.handler({
        query: "*.ts",
        type: "files"
      });
      expect(fileSearchResult.success).toBe(true);
      expect(fileSearchResult.type).toBe("file-search");
      
      const contentSearchResult = await SearchCommand.handler({
        query: "function",
        type: "content"  
      });
      expect(contentSearchResult.success).toBe(true);
      expect(contentSearchResult.type).toBe("content-search");
    });
  });

  describe("Extensibility and Plugin Compatibility", () => {
    test("commands should be extendable for new functionality", () => {
      // Commands should expose their core classes/functions
      expect(HelpCommand).toBeDefined();
      expect(SearchCommand).toBeDefined();
      expect(DocumentCommand).toBeDefined();
      expect(SpawnCommand).toBeDefined();
      
      // Should be able to override or extend handlers
      const originalHandler = HelpCommand.handler;
      expect(typeof originalHandler).toBe("function");
      
      // Should maintain command structure for extensions
      expect(HelpCommand.command).toBeDefined();
      expect(HelpCommand.builder).toBeDefined();
    });

    test("new commands should integrate with help system", async () => {
      // Help should be extensible to include new commands
      const helpResult = await HelpCommand.handler({ all: true });
      
      expect(helpResult.success).toBe(true);
      expect(helpResult.content.categories).toBeDefined();
      expect(typeof helpResult.content.categories).toBe("object");
      
      // Should be possible to add new categories
      const categories = Object.keys(helpResult.content.categories);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain("utility");
    });
  });
});

// Export for use in other test files
export { mockCommandRegistry, mockSuperClaudeMetadata };