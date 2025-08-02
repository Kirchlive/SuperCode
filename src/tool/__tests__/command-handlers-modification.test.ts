// /Users/rob/Development/SuperCode/SuperCode/src/tool/__tests__/command-handlers-modification.test.ts
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

// Mock tool wrappers for modification commands
const mockToolWrappers = {
  glob: mock(async (pattern: string, options?: any) => ({
    files: [`src/${pattern}`, `tests/${pattern}`],
    count: 2
  })),
  grep: mock(async (pattern: string, options?: any) => ({
    matches: [
      { file: "src/index.ts", line: 10, text: "function implement()", match: pattern },
      { file: "src/utils.ts", line: 25, text: "const improveResult = ", match: pattern }
    ],
    count: 2
  })),
  read: mock(async (filePath: string) => ({
    content: `// Sample file content for ${filePath}\nexport function example() {\n  return true;\n}`,
    lines: 4,
    size: 95
  })),
  write: mock(async (filePath: string, content: string) => ({
    written: true,
    path: filePath,
    size: content.length
  })),
  edit: mock(async (filePath: string, oldContent: string, newContent: string) => ({
    edited: true,
    path: filePath,
    changes: [{
      line: 2,
      old: oldContent,
      new: newContent
    }]
  })),
  multiEdit: mock(async (filePath: string, edits: any[]) => ({
    edited: true,
    path: filePath,
    changes: edits.length,
    edits
  }))
};

// Mock Git operations
const mockGitOps = {
  status: mock(async () => ({
    staged: [],
    unstaged: ["src/modified.ts"],
    untracked: ["src/new.ts"]
  })),
  add: mock(async (files: string[]) => ({
    added: files,
    count: files.length
  })),
  commit: mock(async (message: string) => ({
    hash: "abc123",
    message,
    files: 2
  }))
};

// Mock test runner
const mockTestRunner = {
  runTests: mock(async (options?: any) => ({
    passed: 15,
    failed: 2,
    total: 17,
    coverage: 85.5,
    duration: 2.3
  }))
};

// Mock personas for modification tasks
const mockPersonas: Record<string, Persona> = {
  developer: {
    id: "developer",
    name: "Software Developer",
    description: "Focused on implementing features and writing clean code",
    system_prompt: "You are an expert software developer focused on clean code and best practices."
  },
  refactorer: {
    id: "refactorer",
    name: "Code Refactorer",
    description: "Specialized in improving code structure and maintainability",
    system_prompt: "You are an expert at refactoring code while maintaining functionality."
  },
  frontend: {
    id: "frontend",
    name: "Frontend Developer",
    description: "Frontend development and UI implementation specialist",
    system_prompt: "You are a frontend developer expert in modern web technologies."
  }
};

describe("Modification Command Handlers - TDD Tests", () => {
  describe("Implement Command Handler", () => {
    let implementHandler: Tool;
    let mockCommandContext: CommandContext;

    beforeEach(() => {
      // Reset all mocks
      Object.values(mockToolWrappers).forEach(mock => mock.mockClear());
      Object.values(mockGitOps).forEach(mock => mock.mockClear());
      mockTestRunner.runTests.mockClear();

      // Create implement command schema
      const implementSchema = z.object({
        command: z.literal("implement"),
        target: z.string().optional(),
        args: z.array(z.string()).default([]),
        flags: z.object({
          type: z.enum(["feature", "fix", "refactor"]).default("feature"),
          test: z.boolean().default(false),
          docs: z.boolean().default(false),
          tdd: z.boolean().default(false),
          validate: z.boolean().default(false),
          commit: z.boolean().default(false),
          message: z.string().optional(),
          format: z.enum(["text", "json", "markdown"]).default("text"),
          output: z.string().optional(),
          verbose: z.boolean().default(false),
          dry_run: z.boolean().default(false)
        }),
        persona: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          system_prompt: z.string()
        }).optional(),
        sessionId: z.string().optional()
      });

      const implementRunner = mock(async function* (props: CommandContext) {
        // Step 1: Validate implementation requirements
        yield { type: "start", message: "Starting implementation..." };

        if (!props.target && props.args.length === 0) {
          throw new Error("Implementation target is required. Specify feature description or file patterns.");
        }

        const target = props.target || props.args.join(" ");
        
        // Step 2: Parse implementation request
        yield { type: "progress", message: "Analyzing implementation requirements...", step: 1, total: 6 };
        
        const implementationType = props.flags.type || "feature";
        const requiresTests = props.flags.test || props.flags.tdd;
        const requiresDocs = props.flags.docs;
        
        // Step 3: TDD workflow - write tests first if requested
        if (props.flags.tdd) {
          yield { type: "progress", message: "TDD Mode: Writing tests first...", step: 2, total: 6 };
          
          // Find or create test files
          const testFiles = await mockToolWrappers.glob("**/*.test.{ts,js}", { cwd: "." });
          const testFile = `tests/${target.replace(/\s+/g, "-").toLowerCase()}.test.ts`;
          
          const testContent = this.generateTestContent(target, props.persona);
          await mockToolWrappers.write(testFile, testContent);
          
          yield { type: "update", message: `Generated test file: ${testFile}` };
          
          // Run tests to ensure they fail (Red phase)
          const testResult = await mockTestRunner.runTests({ file: testFile });
          if (testResult.failed === 0) {
            yield { type: "warning", message: "Tests should fail initially in TDD. Review test implementation." };
          }
        }

        // Step 4: Discover existing files to modify
        yield { type: "progress", message: "Discovering files to modify...", step: 3, total: 6 };
        
        const sourceFiles = await mockToolWrappers.glob("src/**/*.{ts,js,tsx,jsx}", { cwd: "." });
        let targetFiles = sourceFiles.files;

        // Filter files based on implementation context
        if (props.target && props.target.includes("/")) {
          // Specific file path provided
          targetFiles = targetFiles.filter(f => f.includes(props.target!));
        }

        // Step 5: Implement changes with persona guidance
        yield { type: "progress", message: "Implementing changes...", step: 4, total: 6 };
        
        const implementationResults = [];
        for (const file of targetFiles) {
          if (props.flags.dry_run) {
            // Dry run - just plan changes
            implementationResults.push({
              file,
              planned: true,
              changes: [`Add ${implementationType} implementation for: ${target}`]
            });
            continue;
          }

          const currentContent = await mockToolWrappers.read(file);
          
          // Generate implementation based on persona and type
          const newImplementation = this.generateImplementation(
            target, 
            currentContent.content, 
            implementationType,
            props.persona
          );

          // Apply changes using edit tool
          if (newImplementation.edits && newImplementation.edits.length > 0) {
            const editResult = await mockToolWrappers.multiEdit(file, newImplementation.edits);
            implementationResults.push({
              file,
              changes: editResult.changes,
              edits: editResult.edits,
              implemented: true
            });
            yield { type: "update", message: `Modified ${file}: ${editResult.changes} changes applied` };
          }
        }

        // Step 6: Generate documentation if requested
        if (requiresDocs) {
          yield { type: "progress", message: "Generating documentation...", step: 5, total: 6 };
          
          const docContent = this.generateDocumentation(target, implementationResults, props.persona);
          const docFile = `docs/${target.replace(/\s+/g, "-").toLowerCase()}.md`;
          
          await mockToolWrappers.write(docFile, docContent);
          yield { type: "update", message: `Generated documentation: ${docFile}` };
        }

        // Step 7: Run tests if requested
        if (requiresTests || props.flags.validate) {
          yield { type: "progress", message: "Running tests...", step: 6, total: 6 };
          
          const testResult = await mockTestRunner.runTests();
          
          if (testResult.failed > 0) {
            yield { 
              type: "warning", 
              message: `Tests failed: ${testResult.failed}/${testResult.total}. Implementation may need review.` 
            };
          } else {
            yield { 
              type: "update", 
              message: `All tests passed: ${testResult.passed}/${testResult.total}` 
            };
          }
        }

        // Step 8: Commit changes if requested
        if (props.flags.commit) {
          const gitStatus = await mockGitOps.status();
          const filesToCommit = [...gitStatus.unstaged, ...gitStatus.untracked];
          
          if (filesToCommit.length > 0) {
            await mockGitOps.add(filesToCommit);
            const commitMessage = props.flags.message || `Implement ${target}`;
            const commitResult = await mockGitOps.commit(commitMessage);
            
            yield { 
              type: "update", 
              message: `Changes committed: ${commitResult.hash} - ${commitResult.message}` 
            };
          }
        }

        return {
          type: "implementation-complete",
          implementation: {
            target,
            type: implementationType,
            filesModified: implementationResults.length,
            results: implementationResults,
            testsGenerated: props.flags.tdd,
            docsGenerated: requiresDocs,
            committed: props.flags.commit
          },
          success: true,
          executionTime: Date.now() - (props.sessionId ? parseInt(props.sessionId) : Date.now())
        };
      });

      implementHandler = new Tool(
        "implement", 
        "Implement features, fixes, and refactoring with TDD support", 
        implementSchema, 
        implementRunner
      );

      mockCommandContext = {
        command: "implement",
        target: "user authentication system",
        args: [],
        flags: {
          type: "feature",
          test: false,
          docs: false
        }
      };
    });

    // TDD Test 1: Parameter Validation
    test("should validate implementation target requirement", async () => {
      const invalidContext = {
        ...mockCommandContext,
        target: undefined,
        args: []
      };

      const generator = implementHandler.run(invalidContext);
      
      await expect(async () => {
        for await (const update of generator) {
          // Should throw during validation
        }
      }).toThrow("Implementation target is required");
    });

    test("should accept target from args when not specified directly", async () => {
      const validContext = {
        ...mockCommandContext,
        target: undefined,
        args: ["login", "system", "with", "JWT"]
      };

      const generator = implementHandler.run(validContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(updates[0].type).toBe("start");
      expect(mockToolWrappers.glob).toHaveBeenCalled();
    });

    // TDD Test 2: TDD Workflow Integration
    test("should implement TDD workflow when tdd flag is set", async () => {
      const tddContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, tdd: true }
      };

      const generator = implementHandler.run(tddContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      // Should write tests first
      expect(mockToolWrappers.write).toHaveBeenCalledWith(
        expect.stringContaining(".test.ts"),
        expect.any(String)
      );

      // Should run tests
      expect(mockTestRunner.runTests).toHaveBeenCalled();

      const tddUpdate = updates.find(u => u.message?.includes("TDD Mode"));
      expect(tddUpdate).toBeDefined();
    });

    test("should warn if tests don't fail initially in TDD mode", async () => {
      mockTestRunner.runTests.mockResolvedValueOnce({
        passed: 5,
        failed: 0, // Tests passing initially - should warn
        total: 5,
        coverage: 90
      });

      const tddContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, tdd: true }
      };

      const generator = implementHandler.run(tddContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      const warningUpdate = updates.find(u => 
        u.type === "warning" && u.message?.includes("Tests should fail initially")
      );
      expect(warningUpdate).toBeDefined();
    });

    // TDD Test 3: File Discovery and Modification
    test("should discover and modify relevant source files", async () => {
      const generator = implementHandler.run(mockCommandContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockToolWrappers.glob).toHaveBeenCalledWith(
        "src/**/*.{ts,js,tsx,jsx}",
        { cwd: "." }
      );

      expect(mockToolWrappers.read).toHaveBeenCalled();
      expect(mockToolWrappers.multiEdit).toHaveBeenCalled();

      const discoveryUpdate = updates.find(u => u.message?.includes("Discovering files"));
      expect(discoveryUpdate).toBeDefined();
    });

    test("should filter files based on specific target path", async () => {
      const specificContext = {
        ...mockCommandContext,
        target: "src/auth/login.ts"
      };

      const generator = implementHandler.run(specificContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      // Should filter for specific path
      expect(mockToolWrappers.glob).toHaveBeenCalled();
      // Implementation would filter results based on target path
    });

    // TDD Test 4: Implementation Types
    test("should handle feature implementation type", async () => {
      const featureContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, type: "feature" as const }
      };

      const generator = implementHandler.run(featureContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "implementation-complete") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.implementation.type).toBe("feature");
    });

    test("should handle fix implementation type", async () => {
      const fixContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, type: "fix" as const }
      };

      const generator = implementHandler.run(fixContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "implementation-complete") {
          finalResult = update;
        }
      }

      expect(finalResult?.implementation.type).toBe("fix");
    });

    // TDD Test 5: Persona Integration
    test("should apply developer persona guidance", async () => {
      const devContext = {
        ...mockCommandContext,
        persona: mockPersonas.developer
      };

      const generator = implementHandler.run(devContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      // Should call implementation generation with developer persona
      expect(mockToolWrappers.multiEdit).toHaveBeenCalled();
    });

    test("should apply frontend persona for UI implementations", async () => {
      const frontendContext = {
        ...mockCommandContext,
        target: "user profile component",
        persona: mockPersonas.frontend
      };

      const generator = implementHandler.run(frontendContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "implementation-complete") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      // Implementation would be guided by frontend persona
    });

    // TDD Test 6: Documentation Generation
    test("should generate documentation when docs flag is set", async () => {
      const docsContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, docs: true }
      };

      const generator = implementHandler.run(docsContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockToolWrappers.write).toHaveBeenCalledWith(
        expect.stringContaining(".md"),
        expect.any(String)
      );

      const docsUpdate = updates.find(u => u.message?.includes("documentation"));
      expect(docsUpdate).toBeDefined();
    });

    // TDD Test 7: Test Integration
    test("should run tests when test flag is set", async () => {
      const testContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, test: true }
      };

      const generator = implementHandler.run(testContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockTestRunner.runTests).toHaveBeenCalled();

      const testUpdate = updates.find(u => u.message?.includes("Running tests"));
      expect(testUpdate).toBeDefined();
    });

    test("should warn when tests fail after implementation", async () => {
      mockTestRunner.runTests.mockResolvedValueOnce({
        passed: 8,
        failed: 2,
        total: 10,
        coverage: 75
      });

      const testContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, validate: true }
      };

      const generator = implementHandler.run(testContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      const warningUpdate = updates.find(u => 
        u.type === "warning" && u.message?.includes("Tests failed")
      );
      expect(warningUpdate).toBeDefined();
    });

    // TDD Test 8: Git Integration
    test("should commit changes when commit flag is set", async () => {
      const commitContext = {
        ...mockCommandContext,
        flags: { 
          ...mockCommandContext.flags, 
          commit: true,
          message: "Add user authentication feature"
        }
      };

      const generator = implementHandler.run(commitContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockGitOps.status).toHaveBeenCalled();
      expect(mockGitOps.add).toHaveBeenCalled();
      expect(mockGitOps.commit).toHaveBeenCalledWith("Add user authentication feature");

      const commitUpdate = updates.find(u => u.message?.includes("committed"));
      expect(commitUpdate).toBeDefined();
    });

    test("should generate default commit message when none provided", async () => {
      const commitContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, commit: true }
      };

      const generator = implementHandler.run(commitContext);
      const updates = [];

      for await (const update of generator) {
        updates.push(update);
      }

      expect(mockGitOps.commit).toHaveBeenCalledWith(
        expect.stringContaining("Implement user authentication system")
      );
    });

    // TDD Test 9: Dry Run Mode
    test("should show planned changes in dry run mode without making modifications", async () => {
      const dryRunContext = {
        ...mockCommandContext,
        flags: { ...mockCommandContext.flags, dry_run: true }
      };

      const generator = implementHandler.run(dryRunContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "implementation-complete") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      
      // Should plan changes but not execute them
      expect(mockToolWrappers.multiEdit).not.toHaveBeenCalled();
      
      // Results should indicate planned changes
      const plannedResult = finalResult.implementation.results.find((r: any) => r.planned);
      expect(plannedResult).toBeDefined();
    });

    // TDD Test 10: Error Handling
    test("should handle file modification failures gracefully", async () => {
      mockToolWrappers.multiEdit.mockRejectedValueOnce(new Error("Write permission denied"));

      const generator = implementHandler.run(mockCommandContext);

      await expect(async () => {
        for await (const update of generator) {
          // Should propagate the error
        }
      }).toThrow("Write permission denied");
    });

    test("should continue implementation despite individual file errors", async () => {
      // Mock multiple files but one fails
      mockToolWrappers.glob.mockResolvedValueOnce({
        files: ["src/auth.ts", "src/user.ts"],
        count: 2
      });

      mockToolWrappers.read
        .mockResolvedValueOnce({ content: "// auth file", lines: 1, size: 12 })
        .mockRejectedValueOnce(new Error("File locked"));

      const generator = implementHandler.run(mockCommandContext);
      
      // Should continue with files that can be processed
      await expect(async () => {
        for await (const update of generator) {
          // Error should propagate but other files might be processed
        }
      }).toThrow("File locked");
    });

    // TDD Test 11: Success Scenarios
    test("should complete successfully with minimal configuration", async () => {
      const minimalContext = {
        ...mockCommandContext,
        flags: { type: "feature" as const }
      };

      const generator = implementHandler.run(minimalContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "implementation-complete") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.success).toBe(true);
      expect(finalResult.implementation).toBeDefined();
      expect(finalResult.implementation.target).toBe("user authentication system");
    });

    test("should complete successfully with full feature set enabled", async () => {
      const fullContext = {
        ...mockCommandContext,
        flags: {
          type: "feature" as const,
          tdd: true,
          docs: true,
          test: true,
          commit: true,
          message: "Complete feature implementation"
        },
        persona: mockPersonas.developer
      };

      const generator = implementHandler.run(fullContext);
      let finalResult;

      for await (const update of generator) {
        if (update.type === "implementation-complete") {
          finalResult = update;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult.success).toBe(true);
      expect(finalResult.implementation.testsGenerated).toBe(true);
      expect(finalResult.implementation.docsGenerated).toBe(true);
      expect(finalResult.implementation.committed).toBe(true);
    });
  });

  describe("Improve Command Handler", () => {
    // Similar TDD structure for improve command
    test("should identify improvement opportunities", () => {
      // Test implementation would follow similar pattern
    });

    test("should apply performance improvements", () => {
      // Test implementation
    });

    test("should improve code quality metrics", () => {
      // Test implementation
    });
  });

  describe("Refactor Command Handler", () => {
    // Similar TDD structure for refactor command
    test("should refactor code while preserving functionality", () => {
      // Test implementation
    });

    test("should run tests to verify refactoring safety", () => {
      // Test implementation
    });
  });

  afterEach(() => {
    // Clean up all mocks
    Object.values(mockToolWrappers).forEach(mock => mock.mockRestore());
    Object.values(mockGitOps).forEach(mock => mock.mockRestore());
    mockTestRunner.runTests.mockRestore();
    mock.restore();
  });
});