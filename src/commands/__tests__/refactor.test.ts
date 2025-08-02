/**
 * Refactor Command Tests - TDD Implementation
 * Tests for code refactoring with pattern detection and safe transformations
 */

import { describe, test, expect, beforeEach, mock, afterEach } from "bun:test";
import { z } from "zod";
import { handleRefactorCommand, RefactorResult, RefactorPattern, RefactorTransformation } from "../refactor";
import { CommandParser, type ParsedCommand } from "../../tool/command-parser";
import { FlagResolver, type ResolvedFlags } from "../../tool/flag-resolver";

// Mock OpenCode tools
const mockTools = {
  glob: mock(async (options: any) => [
    "src/legacy-code.ts",
    "src/components/OldComponent.tsx",
    "src/utils/helpers.js"
  ]),
  grep: mock(async (options: any) => [
    { file: "src/legacy-code.ts", line: 15, content: "var oldVariable = something;" },
    { file: "src/components/OldComponent.tsx", line: 8, content: "class OldComponent extends React.Component" }
  ]),
  read: mock(async (options: any) => `// Legacy code with old patterns
var oldVariable = 'test';
function oldFunction() {
  return oldVariable;
}

class OldComponent extends React.Component {
  render() {
    return <div>{this.props.title}</div>;
  }
}`),
  edit: mock(async (options: any) => ({ success: true })),
  multiEdit: mock(async (options: any) => ({ success: true, changesApplied: options.edits.length })),
  bash: mock(async (options: any) => ({ 
    stdout: "Tests passed: 15/15", 
    stderr: "", 
    exitCode: 0 
  }))
};

describe("Refactor Command - TDD Tests", () => {
  beforeEach(() => {
    // Reset all mocks
    Object.values(mockTools).forEach(mockFn => mockFn.mockClear());
  });

  describe("Pattern Detection", () => {
    test("should detect var to const/let refactoring patterns", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/legacy-code.ts",
        args: [],
        flags: { pattern: "var-to-const" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "var-to-const",
        dryRun: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.patterns).toContainEqual(
        expect.objectContaining({
          type: "variable-declaration",
          pattern: "var-to-const",
          severity: "medium"
        })
      );
    });

    test("should detect function to arrow function patterns", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: ".",
        args: [],
        flags: { pattern: "function-to-arrow" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "function-to-arrow",
        dryRun: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.patterns).toContainEqual(
        expect.objectContaining({
          type: "function-declaration",
          pattern: "function-to-arrow"
        })
      );
    });

    test("should detect class to functional component patterns", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/components",
        args: [],
        flags: { pattern: "class-to-functional" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "class-to-functional",
        framework: "react"
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.patterns).toContainEqual(
        expect.objectContaining({
          type: "component-refactor",
          pattern: "class-to-functional",
          framework: "react"
        })
      );
    });

    test("should detect multiple patterns simultaneously", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: ".",
        args: [],
        flags: { pattern: "all" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "all",
        comprehensive: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.patterns.length).toBeGreaterThan(1);
      expect(result.patterns).toContainEqual(
        expect.objectContaining({ type: "variable-declaration" })
      );
      expect(result.patterns).toContainEqual(
        expect.objectContaining({ type: "function-declaration" })
      );
    });
  });

  describe("Safety Validation", () => {
    test("should validate refactoring safety before applying changes", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/critical.ts",
        args: [],
        flags: { pattern: "var-to-const", validate: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "var-to-const",
        validate: true,
        safe: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.validation.safetyChecks).toBeDefined();
      expect(result.validation.safetyChecks.length).toBeGreaterThan(0);
      expect(result.validation.riskLevel).toMatch(/low|medium|high/);
    });

    test("should run tests before and after refactoring", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/",
        args: [],
        flags: { pattern: "function-to-arrow", tests: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "function-to-arrow",
        tests: true,
        validate: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.testing.beforeRefactor).toBeDefined();
      expect(result.testing.afterRefactor).toBeDefined();
      expect(result.testing.beforeRefactor.passed).toBeGreaterThan(0);
    });

    test("should abort refactoring if tests fail before changes", async () => {
      mockTools.bash.mockResolvedValueOnce({
        stdout: "Tests failed: 10/15",
        stderr: "5 tests failed",
        exitCode: 1
      });

      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/",
        args: [],
        flags: { pattern: "var-to-const", tests: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "var-to-const",
        tests: true,
        safe: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.validation.success).toBe(false);
      expect(result.validation.errors).toContain(
        expect.stringContaining("Tests must pass before refactoring")
      );
    });

    test("should create backup before applying transformations", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/important.ts",
        args: [],
        flags: { pattern: "class-to-functional", backup: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "class-to-functional",
        backup: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.metadata.backupCreated).toBe(true);
      expect(result.backup).toBeDefined();
      expect(result.backup.location).toMatch(/backup/);
    });
  });

  describe("Transformation Application", () => {
    test("should apply var to const transformations correctly", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/legacy.ts",
        args: [],
        flags: { pattern: "var-to-const" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "var-to-const"
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.transformations).toContainEqual(
        expect.objectContaining({
          pattern: "var-to-const",
          applied: true,
          filesModified: expect.any(Number)
        })
      );
      
      expect(mockTools.multiEdit).toHaveBeenCalled();
    });

    test("should apply function to arrow function transformations", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/utils.js",
        args: [],
        flags: { pattern: "function-to-arrow" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "function-to-arrow"
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.transformations).toContainEqual(
        expect.objectContaining({
          pattern: "function-to-arrow",
          applied: true
        })
      );
    });

    test("should preserve functionality during class to functional component refactor", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/components/OldComponent.tsx",
        args: [],
        flags: { pattern: "class-to-functional", preserve: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "class-to-functional",
        preserve: true,
        framework: "react"
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.transformations).toContainEqual(
        expect.objectContaining({
          pattern: "class-to-functional",
          applied: true,
          functionalityPreserved: true
        })
      );
    });

    test("should apply multiple transformations in correct order", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/",
        args: [],
        flags: { pattern: "all", incremental: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "all",
        incremental: true,
        safe: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.transformations.length).toBeGreaterThan(1);
      
      // Should be ordered by safety/impact
      const orderedTransformations = result.transformations;
      expect(orderedTransformations[0].riskLevel).not.toBe("high");
    });
  });

  describe("Preview Mode (Dry Run)", () => {
    test("should show planned changes in dry run mode without applying them", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/legacy.ts",
        args: [],
        flags: { pattern: "var-to-const", dryRun: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "var-to-const",
        dryRun: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.preview).toBeDefined();
      expect(result.preview.changes).toBeGreaterThan(0);
      expect(result.transformations.every(t => !t.applied)).toBe(true);
      
      // Should not have called edit functions
      expect(mockTools.edit).not.toHaveBeenCalled();
      expect(mockTools.multiEdit).not.toHaveBeenCalled();
    });

    test("should estimate impact in preview mode", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/",
        args: [],
        flags: { pattern: "all", dryRun: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "all",
        dryRun: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.preview.impact).toBeDefined();
      expect(result.preview.impact.filesAffected).toBeGreaterThan(0);
      expect(result.preview.impact.linesChanged).toBeGreaterThan(0);
      expect(result.preview.impact.estimatedTime).toBeGreaterThan(0);
    });
  });

  describe("Incremental Refactoring", () => {
    test("should apply refactoring incrementally with validation between steps", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/",
        args: [],
        flags: { pattern: "all", incremental: true, tests: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "all",
        incremental: true,
        tests: true,
        batchSize: 3
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.incremental).toBeDefined();
      expect(result.incremental.batches.length).toBeGreaterThan(1);
      expect(result.incremental.validationsBetweenBatches).toBe(true);
    });

    test("should rollback if incremental step fails validation", async () => {
      // Mock a test failure in the middle of refactoring
      mockTools.bash
        .mockResolvedValueOnce({ stdout: "Tests passed: 15/15", stderr: "", exitCode: 0 }) // Initial tests pass
        .mockResolvedValueOnce({ stdout: "Tests failed: 12/15", stderr: "3 tests failed", exitCode: 1 }); // After first batch fails

      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/",
        args: [],
        flags: { pattern: "function-to-arrow", incremental: true, tests: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "function-to-arrow",
        incremental: true,
        tests: true,
        rollback: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.incremental.rollbackPerformed).toBe(true);
      expect(result.validation.errors).toContain(
        expect.stringContaining("Incremental validation failed")
      );
    });
  });

  describe("Pattern-Specific Refactoring", () => {
    test("should handle React-specific patterns", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/components/",
        args: [],
        flags: { pattern: "react-hooks", framework: "react" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "react-hooks",
        framework: "react"
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.patterns).toContainEqual(
        expect.objectContaining({
          framework: "react",
          pattern: "react-hooks"
        })
      );
    });

    test("should handle TypeScript-specific patterns", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/",
        args: [],
        flags: { pattern: "ts-modern", language: "typescript" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "ts-modern",
        language: "typescript"
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.patterns).toContainEqual(
        expect.objectContaining({
          language: "typescript",
          pattern: "ts-modern"
        })
      );
    });

    test("should handle async/await patterns", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/api/",
        args: [],
        flags: { pattern: "promise-to-async" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "promise-to-async"
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.patterns).toContainEqual(
        expect.objectContaining({
          pattern: "promise-to-async",
          type: "async-refactor"
        })
      );
    });
  });

  describe("Error Handling and Recovery", () => {
    test("should handle syntax errors gracefully", async () => {
      mockTools.read.mockResolvedValueOnce("invalid syntax here {{{");

      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/broken.ts",
        args: [],
        flags: { pattern: "var-to-const" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "var-to-const"
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.validation.errors).toContain(
        expect.stringContaining("Syntax error")
      );
      expect(result.validation.success).toBe(false);
    });

    test("should recover from partial transformation failures", async () => {
      mockTools.multiEdit.mockRejectedValueOnce(new Error("File locked"));

      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/",
        args: [],
        flags: { pattern: "var-to-const", continueOnError: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "var-to-const",
        continueOnError: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.validation.warnings).toContain(
        expect.stringContaining("Some transformations failed")
      );
      expect(result.transformations.some(t => t.applied)).toBe(true);
      expect(result.transformations.some(t => !t.applied)).toBe(true);
    });
  });

  describe("Git Integration", () => {
    test("should create git commit after successful refactoring", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/",
        args: [],
        flags: { pattern: "var-to-const", git: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "var-to-const",
        git: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.git).toBeDefined();
      expect(result.git.committed).toBe(true);
      expect(result.git.commitMessage).toMatch(/refactor.*var-to-const/i);
    });

    test("should generate meaningful commit messages", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/components/",
        args: [],
        flags: { pattern: "class-to-functional", git: true, message: "Convert class components to functional" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "class-to-functional",
        git: true,
        message: "Convert class components to functional"
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.git.commitMessage).toBe("Convert class components to functional");
    });
  });

  describe("Performance and Metrics", () => {
    test("should track refactoring metrics", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/",
        args: [],
        flags: { pattern: "all" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "all"
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.totalFiles).toBeGreaterThan(0);
      expect(result.metrics.filesModified).toBeGreaterThanOrEqual(0);
      expect(result.metrics.patternsDetected).toBeGreaterThan(0);
      expect(result.metrics.transformationsApplied).toBeGreaterThanOrEqual(0);
      expect(result.metadata.duration).toBeGreaterThan(0);
    });

    test("should provide performance impact analysis", async () => {
      const parsedCommand: ParsedCommand = {
        command: "refactor",
        target: "src/",
        args: [],
        flags: { pattern: "performance", analyze: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        pattern: "performance",
        analyze: true
      };

      const result = await handleRefactorCommand(parsedCommand, resolvedFlags);

      expect(result.analysis).toBeDefined();
      expect(result.analysis.performanceImpact).toBeDefined();
      expect(result.analysis.codeQualityImprovement).toBeDefined();
    });
  });

  afterEach(() => {
    // Clean up mocks
    Object.values(mockTools).forEach(mockFn => mockFn.mockRestore());
  });
});