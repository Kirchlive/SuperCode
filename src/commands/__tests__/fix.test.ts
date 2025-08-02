/**
 * Fix Command Tests - TDD Implementation
 * Tests for bug fixing with root cause analysis and test generation
 */

import { describe, test, expect, beforeEach, mock, afterEach } from "bun:test";
import { z } from "zod";
import { handleFixCommand, FixResult, BugReport, FixStrategy } from "../fix";
import { CommandParser, type ParsedCommand } from "../../tool/command-parser";
import { FlagResolver, type ResolvedFlags } from "../../tool/flag-resolver";

// Mock OpenCode tools
const mockTools = {
  glob: mock(async (options: any) => [
    "src/auth/login.ts",
    "src/components/UserProfile.tsx",
    "tests/auth.test.ts"
  ]),
  grep: mock(async (options: any) => [
    { file: "src/auth/login.ts", line: 25, content: "if (user = null) {" },
    { file: "src/components/UserProfile.tsx", line: 12, content: "const user = props.user.name;" }
  ]),
  read: mock(async (options: any) => `// Bug-prone code
function validateUser(user) {
  if (user = null) {  // Assignment instead of comparison
    return false;
  }
  return user.isValid;
}

async function fetchUserData(id) {
  const response = await fetch('/api/users/' + id);
  return response.json(); // No error handling
}`),
  edit: mock(async (options: any) => ({ success: true })),
  multiEdit: mock(async (options: any) => ({ success: true, changesApplied: options.edits.length })),
  bash: mock(async (options: any) => ({ 
    stdout: "Tests passed: 12/15", 
    stderr: "3 tests failed: auth validation", 
    exitCode: 1 
  }))
};

describe("Fix Command - TDD Tests", () => {
  beforeEach(() => {
    // Reset all mocks
    Object.values(mockTools).forEach(mockFn => mockFn.mockClear());
  });

  describe("Bug Detection and Root Cause Analysis", () => {
    test("should detect assignment in conditional bugs", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/auth/login.ts",
        args: [],
        flags: { type: "syntax" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        type: "syntax",
        analyze: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.bugsDetected).toContainEqual(
        expect.objectContaining({
          type: "assignment-in-conditional",
          severity: "high",
          file: "src/auth/login.ts",
          line: expect.any(Number)
        })
      );
    });

    test("should detect null pointer dereference bugs", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/components/",
        args: [],
        flags: { type: "runtime" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        type: "runtime",
        deep: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.bugsDetected).toContainEqual(
        expect.objectContaining({
          type: "potential-null-dereference",
          severity: "medium"
        })
      );
    });

    test("should detect missing error handling", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/",
        args: [],
        flags: { type: "error-handling" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        type: "error-handling",
        comprehensive: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.bugsDetected).toContainEqual(
        expect.objectContaining({
          type: "missing-error-handling",
          pattern: "unhandled-promise",
          severity: "medium"
        })
      );
    });

    test("should perform root cause analysis for detected bugs", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/auth/login.ts",
        args: [],
        flags: { analyze: true, rootCause: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        analyze: true,
        rootCause: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.analysis.rootCauses).toBeDefined();
      expect(result.analysis.rootCauses.length).toBeGreaterThan(0);
      expect(result.analysis.rootCauses[0]).toMatchObject({
        bug: expect.any(Object),
        cause: expect.any(String),
        impact: expect.stringMatching(/low|medium|high|critical/),
        solution: expect.any(String)
      });
    });

    test("should trace bug propagation through codebase", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: ".",
        args: [],
        flags: { trace: true, deep: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        trace: true,
        deep: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.analysis.propagation).toBeDefined();
      expect(result.analysis.propagation.affectedFiles).toBeGreaterThan(0);
      expect(result.analysis.propagation.callChain).toBeDefined();
    });
  });

  describe("Fix Strategy Generation", () => {
    test("should generate safe fix strategies", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/auth/login.ts",
        args: [],
        flags: { strategy: "safe" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        strategy: "safe",
        conservative: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.strategies).toBeDefined();
      expect(result.strategies.length).toBeGreaterThan(0);
      expect(result.strategies[0]).toMatchObject({
        type: "safe",
        riskLevel: "low",
        description: expect.any(String),
        steps: expect.any(Array)
      });
    });

    test("should generate aggressive fix strategies when requested", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/",
        args: [],
        flags: { strategy: "aggressive", comprehensive: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        strategy: "aggressive",
        comprehensive: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.strategies).toContainEqual(
        expect.objectContaining({
          type: "aggressive",
          riskLevel: expect.stringMatching(/medium|high/),
          comprehensiveChanges: true
        })
      );
    });

    test("should prioritize fixes by severity and impact", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/",
        args: [],
        flags: { prioritize: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        prioritize: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.strategies).toBeDefined();
      expect(result.strategies.length).toBeGreaterThan(1);
      
      // Should be ordered by priority (critical/high severity first)
      const priorities = result.strategies.map(s => s.priority);
      expect(priorities[0]).toBeGreaterThanOrEqual(priorities[1]);
    });

    test("should generate test cases for each fix", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/auth/login.ts",
        args: [],
        flags: { generateTests: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        generateTests: true,
        testType: "unit"
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.testsGenerated).toBeDefined();
      expect(result.testsGenerated.length).toBeGreaterThan(0);
      expect(result.testsGenerated[0]).toMatchObject({
        file: expect.stringContaining(".test."),
        testCases: expect.any(Array),
        purpose: "validate-fix"
      });
    });
  });

  describe("Fix Application", () => {
    test("should apply syntax fixes correctly", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/auth/login.ts",
        args: [],
        flags: { type: "syntax", apply: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        type: "syntax",
        apply: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.fixes).toContainEqual(
        expect.objectContaining({
          type: "syntax",
          applied: true,
          file: "src/auth/login.ts"
        })
      );
      
      expect(mockTools.multiEdit).toHaveBeenCalled();
    });

    test("should apply runtime error fixes", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/components/UserProfile.tsx",
        args: [],
        flags: { type: "runtime", apply: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        type: "runtime",
        apply: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.fixes).toContainEqual(
        expect.objectContaining({
          type: "runtime",
          applied: true,
          safetyCheck: "null-check-added"
        })
      );
    });

    test("should add comprehensive error handling", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/api/",
        args: [],
        flags: { type: "error-handling", comprehensive: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        type: "error-handling",
        comprehensive: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.fixes).toContainEqual(
        expect.objectContaining({
          type: "error-handling",
          applied: true,
          errorHandlingAdded: true
        })
      );
    });

    test("should preserve existing functionality while fixing bugs", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/utils/helpers.js",
        args: [],
        flags: { preserve: true, tests: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        preserve: true,
        tests: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.validation.functionalityPreserved).toBe(true);
      expect(result.testing.beforeFix).toBeDefined();
      expect(result.testing.afterFix).toBeDefined();
    });
  });

  describe("Test Generation and Validation", () => {
    test("should generate regression tests for fixed bugs", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/auth/login.ts",
        args: [],
        flags: { generateTests: true, testType: "regression" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        generateTests: true,
        testType: "regression"
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.testsGenerated).toContainEqual(
        expect.objectContaining({
          type: "regression",
          testCases: expect.arrayContaining([
            expect.objectContaining({
              name: expect.stringContaining("should not allow assignment in conditional"),
              purpose: "prevent-regression"
            })
          ])
        })
      );
    });

    test("should generate unit tests for error handling fixes", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/api/users.ts",
        args: [],
        flags: { generateTests: true, testType: "unit", focus: "error-handling" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        generateTests: true,
        testType: "unit",
        focus: "error-handling"
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.testsGenerated).toContainEqual(
        expect.objectContaining({
          type: "unit",
          focus: "error-handling",
          testCases: expect.arrayContaining([
            expect.objectContaining({
              name: expect.stringContaining("should handle network error"),
              type: "error-scenario"
            })
          ])
        })
      );
    });

    test("should run existing tests before applying fixes", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/",
        args: [],
        flags: { tests: true, preValidate: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        tests: true,
        preValidate: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.testing.beforeFix).toBeDefined();
      expect(result.testing.beforeFix.executed).toBe(true);
      expect(mockTools.bash).toHaveBeenCalledWith(
        expect.objectContaining({
          command: expect.stringContaining("test")
        })
      );
    });

    test("should validate fixes with generated tests", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/auth/login.ts",
        args: [],
        flags: { apply: true, generateTests: true, validate: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        apply: true,
        generateTests: true,
        validate: true
      };

      // Mock successful test run after fix
      mockTools.bash.mockResolvedValueOnce({
        stdout: "Tests passed: 18/18",
        stderr: "",
        exitCode: 0
      });

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.testing.afterFix).toBeDefined();
      expect(result.testing.afterFix.passed).toBe(18);
      expect(result.validation.success).toBe(true);
    });
  });

  describe("Preview Mode (Dry Run)", () => {
    test("should show planned fixes in dry run mode", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/auth/login.ts",
        args: [],
        flags: { dryRun: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        dryRun: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.preview).toBeDefined();
      expect(result.preview.fixesPlanned).toBeGreaterThan(0);
      expect(result.fixes.every(f => !f.applied)).toBe(true);
      
      // Should not have called edit functions
      expect(mockTools.edit).not.toHaveBeenCalled();
      expect(mockTools.multiEdit).not.toHaveBeenCalled();
    });

    test("should estimate fix impact in preview mode", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/",
        args: [],
        flags: { dryRun: true, comprehensive: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        dryRun: true,
        comprehensive: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.preview.impact).toBeDefined();
      expect(result.preview.impact.filesAffected).toBeGreaterThan(0);
      expect(result.preview.impact.bugsFixed).toBeGreaterThan(0);
      expect(result.preview.impact.riskAssessment).toMatch(/low|medium|high/);
    });
  });

  describe("Different Bug Types", () => {
    test("should handle memory leak fixes", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/components/",
        args: [],
        flags: { type: "memory-leak", framework: "react" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        type: "memory-leak",
        framework: "react"
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.bugsDetected).toContainEqual(
        expect.objectContaining({
          type: "memory-leak",
          framework: "react",
          pattern: expect.stringMatching(/useEffect|subscription|listener/)
        })
      );
    });

    test("should handle async/await bugs", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/api/",
        args: [],
        flags: { type: "async", pattern: "race-condition" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        type: "async",
        pattern: "race-condition"
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.bugsDetected).toContainEqual(
        expect.objectContaining({
          type: "async",
          pattern: "race-condition",
          severity: expect.stringMatching(/medium|high/)
        })
      );
    });

    test("should handle type-related bugs in TypeScript", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/",
        args: [],
        flags: { type: "type-safety", language: "typescript" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        type: "type-safety",
        language: "typescript"
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.bugsDetected).toContainEqual(
        expect.objectContaining({
          type: "type-safety",
          language: "typescript",
          typeIssue: expect.any(String)
        })
      );
    });

    test("should handle security vulnerabilities", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/auth/",
        args: [],
        flags: { type: "security", severity: "high" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        type: "security",
        severity: "high"
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.bugsDetected).toContainEqual(
        expect.objectContaining({
          type: "security",
          severity: "high",
          vulnerability: expect.any(String)
        })
      );
    });
  });

  describe("Error Handling and Recovery", () => {
    test("should handle parse errors gracefully", async () => {
      mockTools.read.mockResolvedValueOnce("invalid javascript syntax {{{");

      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/broken.js",
        args: [],
        flags: { type: "syntax" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        type: "syntax"
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.validation.errors).toContain(
        expect.stringContaining("Parse error")
      );
      expect(result.validation.success).toBe(false);
    });

    test("should rollback changes if tests fail after fix", async () => {
      // Mock successful initial test, but failure after fix
      mockTools.bash
        .mockResolvedValueOnce({ stdout: "Tests passed: 15/15", stderr: "", exitCode: 0 }) // Before fix
        .mockResolvedValueOnce({ stdout: "Tests failed: 10/15", stderr: "5 tests failed", exitCode: 1 }); // After fix

      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/auth/login.ts",
        args: [],
        flags: { apply: true, tests: true, rollback: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        apply: true,
        tests: true,
        rollback: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.rollback).toBeDefined();
      expect(result.rollback.performed).toBe(true);
      expect(result.rollback.reason).toContain("Tests failed after fix");
    });

    test("should handle partial fix failures", async () => {
      mockTools.multiEdit.mockRejectedValueOnce(new Error("Permission denied"));

      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/",
        args: [],
        flags: { apply: true, continueOnError: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        apply: true,
        continueOnError: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.validation.warnings).toContain(
        expect.stringContaining("Some fixes failed to apply")
      );
      expect(result.fixes.some(f => f.applied)).toBe(false);
      expect(result.fixes.some(f => f.error)).toBe(true);
    });
  });

  describe("Git Integration", () => {
    test("should create git commit after successful fixes", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/",
        args: [],
        flags: { apply: true, git: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        apply: true,
        git: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.git).toBeDefined();
      expect(result.git.committed).toBe(true);
      expect(result.git.commitMessage).toMatch(/fix.*bug/i);
    });

    test("should generate detailed commit messages for fixes", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/auth/login.ts",
        args: [],
        flags: { apply: true, git: true, message: "Fix assignment in conditional bug" },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        apply: true,
        git: true,
        message: "Fix assignment in conditional bug"
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.git.commitMessage).toBe("Fix assignment in conditional bug");
    });
  });

  describe("Performance and Metrics", () => {
    test("should track fix metrics and performance", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/",
        args: [],
        flags: { apply: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        apply: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.bugsDetected).toBeGreaterThan(0);
      expect(result.metrics.bugsFixed).toBeGreaterThanOrEqual(0);
      expect(result.metrics.testsGenerated).toBeGreaterThanOrEqual(0);
      expect(result.metadata.duration).toBeGreaterThan(0);
    });

    test("should provide code quality impact analysis", async () => {
      const parsedCommand: ParsedCommand = {
        command: "fix",
        target: "src/",
        args: [],
        flags: { apply: true, analyze: true },
        rawArgs: []
      };

      const resolvedFlags: ResolvedFlags = {
        apply: true,
        analyze: true
      };

      const result = await handleFixCommand(parsedCommand, resolvedFlags);

      expect(result.analysis.qualityImprovement).toBeDefined();
      expect(result.analysis.securityImprovement).toBeDefined();
      expect(result.analysis.maintainabilityImpact).toBeDefined();
    });
  });

  afterEach(() => {
    // Clean up mocks
    Object.values(mockTools).forEach(mockFn => mockFn.mockRestore());
  });
});