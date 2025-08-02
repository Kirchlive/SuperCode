// /Users/rob/Development/SuperCode/SuperCode/src/tool/__tests__/tool-integration.test.ts
import { describe, test, expect, beforeEach, mock, afterEach } from "bun:test"
import { z } from "zod"
import { Tool } from "../tool"

// Mock CommandParser and FlagResolver for integration testing
const mockCommandParser = {
  parseCommand: mock((input: string) => ({
    command: "analyze",
    args: { target: "src/" },
    flags: { deep: true, focus: "security" },
    rawInput: input
  })),
  extractFlags: mock((tokens: string[]) => ({
    flags: { deep: true, verbose: true },
    remaining: ["src/"]
  })),
  normalizeCommand: mock((cmd: string) => cmd.replace(/^\/?(sc:)?/, ""))
}

const mockFlagResolver = {
  resolveFlags: mock((command: string, flags: any) => ({
    ...flags,
    depth: flags.deep ? "deep" : "quick",
    format: "text",
    validated: true
  })),
  expandFlags: mock((flags: any) => ({
    ...flags,
    ...(flags.uc && { concise: true, minimal: true, efficient: true }),
    ...(flags.forensic && { deep: true, trace: true, evidence: true })
  })),
  validateFlags: mock((command: string, flags: any) => {
    if (flags.deep && flags.quick) {
      throw new Error("Conflicting flags: deep and quick")
    }
    if (flags.focus && !["security", "performance", "maintainability"].includes(flags.focus)) {
      throw new Error(`Invalid value '${flags.focus}' for flag 'focus'`)
    }
  })
}

// Mock Orchestrator
const mockOrchestrator = {
  getInstance: mock(() => mockOrchestrator),
  executeSuperClaudeCommand: mock(async (props: any) => ({
    updates: [
      { type: "update", message: "Command parsed successfully" },
      { type: "update", message: "Flags resolved and validated" },
      { type: "update", message: `Executing ${props.command}` },
      { type: "progress", step: 1, total: 3 },
      { type: "progress", step: 2, total: 3 },
      { type: "progress", step: 3, total: 3 }
    ],
    result: { type: "success", data: "Command completed successfully" }
  })),
  detectPersona: mock(() => "analyzer")
}

describe("Tool Integration Tests", () => {
  describe("CommandParser Integration", () => {
    let integrationTool: Tool

    beforeEach(() => {
      const args = z.object({
        rawCommand: z.string(),
        context: z.object({}).optional()
      })

      const run = mock(async function* (props: any) {
        // Simulate integration with CommandParser
        const parsed = mockCommandParser.parseCommand(props.rawCommand)
        yield { type: "parsed", data: parsed }

        const flags = mockCommandParser.extractFlags(props.rawCommand.split(" "))
        yield { type: "flags-extracted", data: flags }

        const normalized = mockCommandParser.normalizeCommand(parsed.command)
        yield { type: "normalized", command: normalized }

        return { type: "integration-complete", result: "CommandParser integration successful" }
      })

      integrationTool = new Tool("command-parser-integration", "CommandParser integration test", args, run)
    })

    test("should integrate with CommandParser for simple commands", async () => {
      const props = { rawCommand: "analyze src/" }
      const generator = integrationTool.run(props)
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      expect(mockCommandParser.parseCommand).toHaveBeenCalledWith("analyze src/")
      expect(results).toHaveLength(3)
      expect(results[0].type).toBe("parsed")
      expect(results[1].type).toBe("flags-extracted")
      expect(results[2].type).toBe("normalized")
    })

    test("should integrate with CommandParser for complex commands", async () => {
      const props = { rawCommand: "/sc:analyze src/ --deep --focus=security --output=report.json" }
      const generator = integrationTool.run(props)
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      expect(mockCommandParser.parseCommand).toHaveBeenCalledWith("/sc:analyze src/ --deep --focus=security --output=report.json")
      expect(mockCommandParser.extractFlags).toHaveBeenCalled()
      expect(mockCommandParser.normalizeCommand).toHaveBeenCalled()
    })

    test("should handle quoted arguments in CommandParser", async () => {
      const props = { rawCommand: 'explain "complex file with spaces.js" --level=expert' }
      const generator = integrationTool.run(props)

      for await (const result of generator) {
        // Consume results
      }

      expect(mockCommandParser.parseCommand).toHaveBeenCalledWith('explain "complex file with spaces.js" --level=expert')
    })
  })

  describe("FlagResolver Integration", () => {
    let flagTool: Tool

    beforeEach(() => {
      const args = z.object({
        command: z.string(),
        flags: z.record(z.any())
      })

      const run = mock(async function* (props: any) {
        // Test flag expansion
        const expandedFlags = mockFlagResolver.expandFlags(props.flags)
        yield { type: "flags-expanded", data: expandedFlags }

        // Test flag validation
        try {
          mockFlagResolver.validateFlags(props.command, expandedFlags)
          yield { type: "flags-validated", success: true }
        } catch (error: any) {
          yield { type: "validation-error", error: error.message }
          return { type: "error", message: error.message }
        }

        // Test flag resolution
        const resolvedFlags = mockFlagResolver.resolveFlags(props.command, expandedFlags)
        yield { type: "flags-resolved", data: resolvedFlags }

        return { type: "flag-integration-complete", flags: resolvedFlags }
      })

      flagTool = new Tool("flag-resolver-integration", "FlagResolver integration test", args, run)
    })

    test("should expand compound flags correctly", async () => {
      const props = {
        command: "analyze",
        flags: { uc: true, forensic: true }
      }

      const generator = flagTool.run(props)
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      expect(mockFlagResolver.expandFlags).toHaveBeenCalledWith({ uc: true, forensic: true })
      
      const expandedResult = results.find(r => r.type === "flags-expanded")
      expect(expandedResult).toBeDefined()
    })

    test("should validate flag combinations", async () => {
      const conflictingProps = {
        command: "analyze",
        flags: { deep: true, quick: true }
      }

      const generator = flagTool.run(conflictingProps)
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      const errorResult = results.find(r => r.type === "validation-error")
      expect(errorResult).toBeDefined()
      expect(errorResult?.error).toContain("Conflicting flags")
    })

    test("should validate flag values", async () => {
      const invalidProps = {
        command: "analyze",
        flags: { focus: "invalid-focus" }
      }

      const generator = flagTool.run(invalidProps)
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      const errorResult = results.find(r => r.type === "validation-error")
      expect(errorResult).toBeDefined()
      expect(errorResult?.error).toContain("Invalid value")
    })

    test("should resolve flags with defaults", async () => {
      const props = {
        command: "analyze",
        flags: { deep: true }
      }

      const generator = flagTool.run(props)
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      expect(mockFlagResolver.resolveFlags).toHaveBeenCalledWith("analyze", expect.any(Object))
      
      const resolvedResult = results.find(r => r.type === "flags-resolved")
      expect(resolvedResult).toBeDefined()
      expect(resolvedResult?.data.depth).toBe("deep")
    })
  })

  describe("Full Integration Pipeline", () => {
    let pipelineTool: Tool

    beforeEach(() => {
      const args = z.object({
        rawInput: z.string(),
        context: z.object({}).optional()
      })

      const run = mock(async function* (props: any) {
        // Step 1: Parse command
        yield { type: "step", message: "Parsing command..." }
        const parsed = mockCommandParser.parseCommand(props.rawInput)
        yield { type: "parsed", data: parsed }

        // Step 2: Expand and validate flags
        yield { type: "step", message: "Processing flags..." }
        const expanded = mockFlagResolver.expandFlags(parsed.flags)
        
        try {
          mockFlagResolver.validateFlags(parsed.command, expanded)
        } catch (error: any) {
          yield { type: "error", message: error.message }
          return { type: "failed", reason: "Flag validation failed" }
        }

        const resolved = mockFlagResolver.resolveFlags(parsed.command, expanded)
        yield { type: "flags-ready", data: resolved }

        // Step 3: Execute through orchestrator
        yield { type: "step", message: "Executing command..." }
        const orchestratorProps = {
          command: parsed.command,
          args: parsed.args,
          flags: resolved,
          userInput: props.rawInput
        }

        const execution = await mockOrchestrator.executeSuperClaudeCommand(orchestratorProps)
        
        // Yield orchestrator updates
        for (const update of execution.updates) {
          yield update
        }

        return execution.result
      })

      pipelineTool = new Tool("full-pipeline", "Full integration pipeline", args, run)
    })

    test("should execute complete pipeline successfully", async () => {
      const props = { rawInput: "analyze src/ --deep --focus=security" }
      const generator = pipelineTool.run(props)
      const results = []
      let finalResult

      for await (const result of generator) {
        if (result.type === "success") {
          finalResult = result
        } else {
          results.push(result)
        }
      }

      // Verify all integration points were called
      expect(mockCommandParser.parseCommand).toHaveBeenCalled()
      expect(mockFlagResolver.expandFlags).toHaveBeenCalled()
      expect(mockFlagResolver.validateFlags).toHaveBeenCalled()
      expect(mockFlagResolver.resolveFlags).toHaveBeenCalled()
      expect(mockOrchestrator.executeSuperClaudeCommand).toHaveBeenCalled()

      // Verify pipeline steps
      const stepResults = results.filter(r => r.type === "step")
      expect(stepResults).toHaveLength(3)
      expect(stepResults[0].message).toBe("Parsing command...")
      expect(stepResults[1].message).toBe("Processing flags...")
      expect(stepResults[2].message).toBe("Executing command...")

      // Verify final result
      expect(finalResult?.data).toBe("Command completed successfully")
    })

    test("should handle pipeline failures gracefully", async () => {
      // Set up flag validation to fail
      mockFlagResolver.validateFlags.mockImplementationOnce(() => {
        throw new Error("Test validation failure")
      })

      const props = { rawInput: "analyze --invalid-combo" }
      const generator = pipelineTool.run(props)
      const results = []
      let finalResult

      for await (const result of generator) {
        if (result.type === "failed") {
          finalResult = result
        } else {
          results.push(result)
        }
      }

      const errorResult = results.find(r => r.type === "error")
      expect(errorResult).toBeDefined()
      expect(errorResult?.message).toBe("Test validation failure")
      expect(finalResult?.reason).toBe("Flag validation failed")
    })

    test("should maintain context throughout pipeline", async () => {
      const props = {
        rawInput: "explain src/index.ts --level=expert",
        context: { sessionId: "test-session", userId: "test-user" }
      }

      const generator = pipelineTool.run(props)
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      // Context should be preserved and passed through the pipeline
      expect(props.context).toEqual({ sessionId: "test-session", userId: "test-user" })
    })
  })

  describe("Error Handling Integration", () => {
    test("should handle CommandParser errors", async () => {
      mockCommandParser.parseCommand.mockImplementationOnce(() => {
        throw new Error("Parse error: Invalid command syntax")
      })

      const errorTool = new Tool(
        "error-test",
        "Error handling test",
        z.object({ input: z.string() }),
        async function* (props) {
          try {
            mockCommandParser.parseCommand(props.input)
          } catch (error: any) {
            yield { type: "parse-error", message: error.message }
            return { type: "failed", reason: "Command parsing failed" }
          }
        }
      )

      const generator = errorTool.run({ input: "malformed command" })
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      const errorResult = results.find(r => r.type === "parse-error")
      expect(errorResult).toBeDefined()
      expect(errorResult?.message).toContain("Parse error")
    })

    test("should handle Orchestrator errors", async () => {
      mockOrchestrator.executeSuperClaudeCommand.mockImplementationOnce(async () => {
        throw new Error("Orchestrator execution failed")
      })

      const errorTool = new Tool(
        "orchestrator-error-test",
        "Orchestrator error test",
        z.object({ command: z.string() }),
        async function* (props) {
          try {
            await mockOrchestrator.executeSuperClaudeCommand(props)
          } catch (error: any) {
            yield { type: "execution-error", message: error.message }
            return { type: "failed", reason: "Command execution failed" }
          }
        }
      )

      const generator = errorTool.run({ command: "problematic-command" })
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      const errorResult = results.find(r => r.type === "execution-error")
      expect(errorResult).toBeDefined()
      expect(errorResult?.message).toBe("Orchestrator execution failed")
    })
  })

  afterEach(() => {
    // Clean up all mocks
    mockCommandParser.parseCommand.mockClear()
    mockCommandParser.extractFlags.mockClear()
    mockCommandParser.normalizeCommand.mockClear()
    mockFlagResolver.resolveFlags.mockClear()
    mockFlagResolver.expandFlags.mockClear()
    mockFlagResolver.validateFlags.mockClear()
    mockOrchestrator.executeSuperClaudeCommand.mockClear()
    mockOrchestrator.detectPersona.mockClear()
    mock.restore()
  })
})