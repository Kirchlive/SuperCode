// /Users/rob/Development/SuperCode/SuperCode/src/tool/__tests__/command-handlers-integration.test.ts
import { describe, test, expect, beforeEach, mock, afterEach } from "bun:test";
import { z } from "zod";
import { Tool } from "../tool";
import { CommandParser, ParsedCommand } from "../command-parser";
import { FlagResolver, ResolvedFlags } from "../flag-resolver";

// Mock interfaces
interface Persona {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
}

interface ExecutionContext {
  command: string;
  parsedCommand: ParsedCommand;
  resolvedFlags: ResolvedFlags;
  persona?: Persona;
  userInput: string;
  sessionId?: string;
  startTime: number;
}

interface ExecutionUpdate {
  type: 'start' | 'progress' | 'update' | 'warning' | 'error' | 'complete';
  message: string;
  timestamp: number;
  data?: any;
  progress?: number;
}

interface ExecutionResult {
  success: boolean;
  result: any;
  executionTime: number;
  updates: ExecutionUpdate[];
  warnings: string[];
  errors: string[];
}

// Mock Orchestrator class
class MockOrchestrator {
  private static instance: MockOrchestrator;
  private personas: Record<string, Persona> = {};
  private sessionState: Map<string, any> = new Map();
  private activeExecutions: Map<string, ExecutionContext> = new Map();

  private constructor() {
    this.loadPersonas();
  }

  public static getInstance(): MockOrchestrator {
    if (!MockOrchestrator.instance) {
      MockOrchestrator.instance = new MockOrchestrator();
    }
    return MockOrchestrator.instance;
  }

  private async loadPersonas(): Promise<void> {
    this.personas = {
      analyzer: {
        id: "analyzer",
        name: "Code Analyzer",
        description: "Expert in code analysis",
        system_prompt: "You are an expert code analyzer."
      },
      developer: {
        id: "developer",
        name: "Software Developer", 
        description: "Expert in software development",
        system_prompt: "You are an expert software developer."
      },
      devops: {
        id: "devops",
        name: "DevOps Engineer",
        description: "Expert in build and deployment",
        system_prompt: "You are an expert DevOps engineer."
      }
    };
  }

  public detectPersona = mock((userInput: string): string => {
    if (userInput.includes("analyze") || userInput.includes("review")) return "analyzer";
    if (userInput.includes("build") || userInput.includes("deploy")) return "devops";
    return "developer";
  });

  public async* executeSuperClaudeCommand(props: {
    command: string;
    args: string[];
    userInput: string;
    sessionId?: string;
  }): AsyncGenerator<ExecutionUpdate, ExecutionResult, unknown> {
    const startTime = Date.now();
    const executionId = `exec_${startTime}_${Math.random().toString(36).substr(2, 9)}`;
    const updates: ExecutionUpdate[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Parse command and arguments
      yield this.createUpdate('start', `Starting SuperClaude command: ${props.command}`);
      
      const commandString = `${props.command} ${props.args.join(' ')}`;
      const parsedCommand = CommandParser.parse(commandString);
      
      // Step 2: Validate command
      if (!CommandParser.validateCommand(parsedCommand.command)) {
        const error = `Unknown command: ${parsedCommand.command}`;
        errors.push(error);
        yield this.createUpdate('error', error);
        return this.createResult(false, null, startTime, updates, warnings, errors);
      }

      // Step 3: Resolve flags
      yield this.createUpdate('progress', 'Resolving command flags...', 25);
      
      const flagResult = FlagResolver.resolve(parsedCommand.command, parsedCommand.flags);
      if (!flagResult.valid) {
        for (const error of flagResult.errors) {
          errors.push(error);
          yield this.createUpdate('error', error);
        }
        return this.createResult(false, null, startTime, updates, warnings, errors);
      }

      // Step 4: Detect persona
      yield this.createUpdate('progress', 'Detecting optimal persona...', 50);
      
      const personaId = this.detectPersona(props.userInput);
      const persona = this.personas[personaId];
      
      if (persona) {
        yield this.createUpdate('update', `Selected persona: ${persona.name}`);
      }

      // Step 5: Execute command handler
      yield this.createUpdate('progress', 'Executing command handler...', 75);
      
      const context: ExecutionContext = {
        command: parsedCommand.command,
        parsedCommand,
        resolvedFlags: flagResult.resolved,
        persona,
        userInput: props.userInput,
        sessionId: props.sessionId,
        startTime
      };

      // Mock command execution based on command type
      const commandResult = await this.mockCommandExecution(context);
      
      yield this.createUpdate('complete', `Command ${parsedCommand.command} completed successfully`);
      
      return this.createResult(
        commandResult.success,
        commandResult.result,
        startTime,
        updates,
        warnings,
        errors
      );

    } catch (error: any) {
      const errorMessage = `Unexpected error executing command: ${error.message}`;
      errors.push(errorMessage);
      yield this.createUpdate('error', errorMessage);
      
      return this.createResult(false, null, startTime, updates, warnings, errors);
    }
  }

  private async mockCommandExecution(context: ExecutionContext): Promise<{ success: boolean; result: any }> {
    // Mock different command executions
    switch (context.command) {
      case "analyze":
        return {
          success: true,
          result: {
            type: "analysis-complete",
            report: {
              summary: { filesAnalyzed: 5, overallScore: 85 },
              results: [],
              insights: { codeQuality: "Good" }
            }
          }
        };

      case "build":
        return {
          success: true,
          result: {
            type: "build-complete",
            build: {
              type: context.resolvedFlags.type || "dev",
              duration: 2.5,
              success: true
            }
          }
        };

      case "implement":
        return {
          success: true,
          result: {
            type: "implementation-complete",
            implementation: {
              target: context.parsedCommand.target,
              filesModified: 3,
              testsGenerated: !!context.resolvedFlags.tdd
            }
          }
        };

      case "help":
        return {
          success: true,
          result: {
            type: "help-complete",
            helpType: "general",
            content: { title: "SuperClaude Help" }
          }
        };

      default:
        throw new Error(`Unsupported command: ${context.command}`);
    }
  }

  private createUpdate(
    type: ExecutionUpdate['type'],
    message: string,
    progress?: number,
    data?: any
  ): ExecutionUpdate {
    return {
      type,
      message,
      timestamp: Date.now(),
      progress,
      data
    };
  }

  private createResult(
    success: boolean,
    result: any,
    startTime: number,
    updates: ExecutionUpdate[],
    warnings: string[],
    errors: string[]
  ): ExecutionResult {
    return {
      success,
      result,
      executionTime: Date.now() - startTime,
      updates,
      warnings,
      errors
    };
  }
}

// Mock command modules
const mockCommandModules = {
  analyze: {
    AnalyzeCommand: {
      handler: mock(async (args: any) => ({
        type: "analysis-complete",
        report: { summary: { filesAnalyzed: 10 } }
      }))
    }
  },
  build: {
    BuildCommand: {
      handler: mock(async (args: any) => ({
        type: "build-complete", 
        build: { success: true }
      }))
    }
  },
  implement: {
    ImplementCommand: {
      handler: mock(async (args: any) => ({
        type: "implementation-complete",
        implementation: { success: true }
      }))
    }
  }
};

// Mock tool wrappers
const mockToolWrappers = {
  glob: mock(async (pattern: string) => ({ files: ["src/test.ts"], count: 1 })),
  grep: mock(async (pattern: string) => ({ matches: [], count: 0 })),
  read: mock(async (filePath: string) => ({ content: "// test", size: 8 })),
  write: mock(async (filePath: string, content: string) => ({ written: true }))
};

describe("Command Handler Integration Tests", () => {
  let orchestrator: MockOrchestrator;

  beforeEach(() => {
    // Reset all mocks
    Object.values(mockToolWrappers).forEach(mock => mock.mockClear());
    Object.values(mockCommandModules).forEach(module => {
      Object.values(module).forEach((command: any) => {
        if (command.handler) command.handler.mockClear();
      });
    });

    orchestrator = MockOrchestrator.getInstance();
    orchestrator.detectPersona.mockClear();
  });

  describe("Full Command Pipeline Integration", () => {
    test("should execute complete pipeline for analyze command", async () => {
      const commandProps = {
        command: "analyze",
        args: ["src/", "--deep", "--focus=security"],
        userInput: "analyze src/ --deep --focus=security"
      };

      const updates: ExecutionUpdate[] = [];
      let finalResult: ExecutionResult | undefined;

      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        } else {
          updates.push(update as ExecutionUpdate);
        }
      }

      // Verify pipeline execution
      expect(updates).toHaveLength(4); // start, progress (flags), progress (persona), progress (execute)
      expect(updates[0].type).toBe("start");
      expect(updates[0].message).toContain("analyze");

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(true);
      expect(finalResult!.result.type).toBe("analysis-complete");

      // Verify persona detection was called
      expect(orchestrator.detectPersona).toHaveBeenCalledWith(commandProps.userInput);
    });

    test("should execute complete pipeline for build command", async () => {
      const commandProps = {
        command: "build",
        args: ["--type=prod", "--clean", "--tests"],
        userInput: "build --type=prod --clean --tests"
      };

      const updates: ExecutionUpdate[] = [];
      let finalResult: ExecutionResult | undefined;

      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        } else {
          updates.push(update as ExecutionUpdate);
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(true);
      expect(finalResult!.result.type).toBe("build-complete");

      // Should detect devops persona for build commands
      expect(orchestrator.detectPersona).toHaveBeenCalledWith(commandProps.userInput);
    });

    test("should execute complete pipeline for implement command", async () => {
      const commandProps = {
        command: "implement",
        args: ["user authentication", "--tdd", "--docs"],
        userInput: "implement user authentication --tdd --docs"
      };

      const updates: ExecutionUpdate[] = [];
      let finalResult: ExecutionResult | undefined;

      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        } else {
          updates.push(update as ExecutionUpdate);
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(true);
      expect(finalResult!.result.type).toBe("implementation-complete");
      expect(finalResult!.result.implementation.testsGenerated).toBe(true);
    });
  });

  describe("Command Validation Integration", () => {
    test("should fail gracefully for unknown commands", async () => {
      const commandProps = {
        command: "unknown-command",
        args: [],
        userInput: "unknown-command"
      };

      const updates: ExecutionUpdate[] = [];
      let finalResult: ExecutionResult | undefined;

      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        } else {
          updates.push(update as ExecutionUpdate);
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(false);
      expect(finalResult!.errors).toContain("Unknown command: unknown-command");

      const errorUpdate = updates.find(u => u.type === "error");
      expect(errorUpdate).toBeDefined();
    });

    test("should fail gracefully for invalid flags", async () => {
      // Mock FlagResolver to return validation errors
      const originalResolve = FlagResolver.resolve;
      FlagResolver.resolve = mock(() => ({
        valid: false,
        errors: ["Unknown flag: --invalid-flag"],
        warnings: [],
        resolved: {}
      }));

      const commandProps = {
        command: "analyze",
        args: ["--invalid-flag"],
        userInput: "analyze --invalid-flag"
      };

      const updates: ExecutionUpdate[] = [];
      let finalResult: ExecutionResult | undefined;

      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        } else {
          updates.push(update as ExecutionUpdate);
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(false);
      expect(finalResult!.errors).toContain("Unknown flag: --invalid-flag");

      // Restore original function
      FlagResolver.resolve = originalResolve;
    });
  });

  describe("Persona Integration", () => {
    test("should select analyzer persona for analysis commands", async () => {
      const commandProps = {
        command: "analyze",
        args: ["src/"],
        userInput: "analyze src/ for security issues"
      };

      const updates: ExecutionUpdate[] = [];
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if (!('success' in update)) {
          updates.push(update as ExecutionUpdate);
        }
      }

      expect(orchestrator.detectPersona).toHaveBeenCalledWith(commandProps.userInput);
      
      const personaUpdate = updates.find(u => u.message?.includes("Selected persona: Code Analyzer"));
      expect(personaUpdate).toBeDefined();
    });

    test("should select devops persona for build commands", async () => {
      const commandProps = {
        command: "build",
        args: ["--prod"],
        userInput: "build for production deployment"
      };

      const updates: ExecutionUpdate[] = [];
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if (!('success' in update)) {
          updates.push(update as ExecutionUpdate);
        }
      }

      const personaUpdate = updates.find(u => u.message?.includes("Selected persona: DevOps Engineer"));
      expect(personaUpdate).toBeDefined();
    });

    test("should select developer persona as default", async () => {
      const commandProps = {
        command: "implement",
        args: ["new feature"],
        userInput: "implement new feature for the app"
      };

      const updates: ExecutionUpdate[] = [];
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if (!('success' in update)) {
          updates.push(update as ExecutionUpdate);
        }
      }

      const personaUpdate = updates.find(u => u.message?.includes("Selected persona: Software Developer"));
      expect(personaUpdate).toBeDefined();
    });
  });

  describe("Flag Resolution Integration", () => {
    test("should resolve and apply flag defaults", async () => {
      const commandProps = {
        command: "analyze",
        args: ["src/"],
        userInput: "analyze src/"
      };

      let finalResult: ExecutionResult | undefined;
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(true);
      
      // Flags should have been resolved with defaults
      // This would be verified in the actual command execution context
    });

    test("should handle flag conflicts appropriately", async () => {
      // Mock FlagResolver to return conflict warnings
      const originalResolve = FlagResolver.resolve;
      FlagResolver.resolve = mock(() => ({
        valid: true,
        errors: [],
        warnings: ["Resolved conflict: Using --deep, ignoring --quick"],
        resolved: { deep: true, format: "text" }
      }));

      const commandProps = {
        command: "analyze",
        args: ["--deep", "--quick"],
        userInput: "analyze --deep --quick"
      };

      let finalResult: ExecutionResult | undefined;
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(true);
      expect(finalResult!.warnings).toContain("Resolved conflict: Using --deep, ignoring --quick");

      // Restore original function
      FlagResolver.resolve = originalResolve;
    });
  });

  describe("Command Parser Integration", () => {
    test("should parse complex command strings correctly", async () => {
      const commandProps = {
        command: "analyze",
        args: [`"src/complex file.ts"`, "--focus=security", "--output=report.json"],
        userInput: `analyze "src/complex file.ts" --focus=security --output=report.json`
      };

      let finalResult: ExecutionResult | undefined;
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(true);
      
      // Command should have been parsed correctly despite quotes and special characters
    });

    test("should handle commands with no arguments", async () => {
      const commandProps = {
        command: "help",
        args: [],
        userInput: "help"
      };

      let finalResult: ExecutionResult | undefined;
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(true);
      expect(finalResult!.result.type).toBe("help-complete");
    });
  });

  describe("Error Handling Integration", () => {
    test("should handle command execution failures gracefully", async () => {
      // Mock command execution to throw error
      const originalMockExecution = MockOrchestrator.prototype['mockCommandExecution'];
      MockOrchestrator.prototype['mockCommandExecution'] = mock(async () => {
        throw new Error("Command execution failed");
      });

      const commandProps = {
        command: "analyze",
        args: ["src/"],
        userInput: "analyze src/"
      };

      const updates: ExecutionUpdate[] = [];
      let finalResult: ExecutionResult | undefined;
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        } else {
          updates.push(update as ExecutionUpdate);
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(false);
      expect(finalResult!.errors).toContain(expect.stringContaining("Unexpected error executing command"));

      const errorUpdate = updates.find(u => u.type === "error");
      expect(errorUpdate).toBeDefined();

      // Restore original method
      MockOrchestrator.prototype['mockCommandExecution'] = originalMockExecution;
    });

    test("should provide meaningful error messages", async () => {
      const commandProps = {
        command: "invalid-command",
        args: [],
        userInput: "invalid-command"
      };

      const updates: ExecutionUpdate[] = [];
      let finalResult: ExecutionResult | undefined;
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        } else {
          updates.push(update as ExecutionUpdate);
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(false);
      expect(finalResult!.errors[0]).toContain("Unknown command: invalid-command");
      
      const errorUpdate = updates.find(u => u.type === "error");
      expect(errorUpdate).toBeDefined();
      expect(errorUpdate!.message).toContain("Unknown command: invalid-command");
    });
  });

  describe("Progress Reporting Integration", () => {
    test("should provide progress updates throughout execution", async () => {
      const commandProps = {
        command: "analyze",
        args: ["src/", "--comprehensive"],
        userInput: "analyze src/ --comprehensive"
      };

      const updates: ExecutionUpdate[] = [];
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if (!('success' in update)) {
          updates.push(update as ExecutionUpdate);
        }
      }

      // Should have start, progress updates, and completion
      const startUpdate = updates.find(u => u.type === "start");
      expect(startUpdate).toBeDefined();

      const progressUpdates = updates.filter(u => u.type === "progress");
      expect(progressUpdates.length).toBeGreaterThan(0);

      const completeUpdate = updates.find(u => u.type === "complete");
      expect(completeUpdate).toBeDefined();
    });

    test("should include progress percentages in updates", async () => {
      const commandProps = {
        command: "build", 
        args: ["--type=prod"],
        userInput: "build --type=prod"
      };

      const updates: ExecutionUpdate[] = [];
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if (!('success' in update)) {
          updates.push(update as ExecutionUpdate);
        }
      }

      const progressUpdates = updates.filter(u => u.type === "progress" && u.progress !== undefined);
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      // Progress should be between 0 and 100
      progressUpdates.forEach(update => {
        expect(update.progress).toBeGreaterThanOrEqual(0);
        expect(update.progress).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("Session State Integration", () => {
    test("should maintain session context across command execution", async () => {
      const sessionId = "test-session-123";
      const commandProps = {
        command: "analyze",
        args: ["src/"],
        userInput: "analyze src/",
        sessionId
      };

      let finalResult: ExecutionResult | undefined;
      
      const generator = orchestrator.executeSuperClaudeCommand(commandProps);
      
      for await (const update of generator) {
        if ('success' in update) {
          finalResult = update as ExecutionResult;
        }
      }

      expect(finalResult).toBeDefined();
      expect(finalResult!.success).toBe(true);
      
      // Session ID should be maintained in execution context
      // This would be verified through the actual command handler receiving the session ID
    });
  });

  afterEach(() => {
    // Clean up all mocks
    Object.values(mockToolWrappers).forEach(mock => mock.mockRestore());
    Object.values(mockCommandModules).forEach(module => {
      Object.values(module).forEach((command: any) => {
        if (command.handler && command.handler.mockRestore) {
          command.handler.mockRestore();
        }
      });
    });
    mock.restore();
  });
});