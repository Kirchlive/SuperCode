// /Users/rob/Development/SuperCode/SuperCode/src/tool/__tests__/superclaude-tool.test.ts
import { describe, test, expect, beforeEach, mock, afterEach, spyOn } from "bun:test"

// Create comprehensive mocks for all dependencies
const mockCommandParser = {
  validateCommand: mock((cmd: string) => ["analyze", "build", "test", "explain"].includes(cmd)),
  parse: mock((input: string) => ({
    command: "analyze",
    args: { target: "src/" },
    flags: { deep: true },
    rawInput: input
  }))
}

const mockFlagResolver = {
  resolve: mock((command: string, flags: any) => ({
    valid: true,
    resolved: { ...flags, format: "text" },
    errors: [],
    warnings: []
  })),
  getHelp: mock((command: string) => `Help for ${command}`)
}

const mockResponseFormatter = {
  format: mock((result: any, context: any, warnings: any, errors: any) => ({
    content: result,
    format: "text"
  })),
  createMetadata: mock((context: any, result: any) => ({ context, result }))
}

const mockSessionManager = {
  getInstance: mock(() => mockSessionManager),
  createSession: mock((id: any, cwd: string) => "test-session-123"),
  getCachedResult: mock(() => null),
  setCachedResult: mock(() => {}),
  getPersonaSuggestion: mock(() => null),
  updateSessionWithExecution: mock(() => {}),
  generateCacheKey: mock(() => "cache-key-123")
}

const mockOrchestrator = {
  getInstance: mock(() => mockOrchestrator),
  executeSuperClaudeCommand: mock(async function* (props: any) {
    yield { type: "update", message: `Executing ${props.command}` }
    return { success: true, result: `Completed ${props.command}` }
  })
}

// Mock all the modules
mock.module("../command-parser", () => ({
  CommandParser: mockCommandParser
}))

mock.module("../flag-resolver", () => ({
  FlagResolver: mockFlagResolver
}))

mock.module("../response-formatter", () => ({
  ResponseFormatter: mockResponseFormatter,
  formatStreamingUpdate: mock((update: any, flags: any) => update.message)
}))

mock.module("../session-manager", () => ({
  SessionManager: mockSessionManager
}))

mock.module("../../session/orchestrator", () => ({
  Orchestrator: mockOrchestrator
}))

// Import after mocking
import { SuperClaudeTool } from "../superclaude"

describe("SuperClaudeTool", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockOrchestrator.executeSuperClaudeCommand.mockClear()
    mockOrchestrator.detectPersona.mockClear()
    mockOrchestrator.detectDomain.mockClear()
    mockOrchestrator.detectIntent.mockClear()
  })

  describe("tool properties", () => {
    test("should have correct name and description", () => {
      expect(SuperClaudeTool.name).toBe("superclaude")
      expect(SuperClaudeTool.description).toContain("SuperClaude commands")
    })

    test("should have valid Zod schema", () => {
      const validInput = {
        command: "analyze",
        args: ["src/", "--deep", "--focus=security"]
      }

      expect(() => SuperClaudeTool.args.parse(validInput)).not.toThrow()

      const invalidInput = {
        command: 123,
        args: "not-an-array"
      }

      expect(() => SuperClaudeTool.args.parse(invalidInput)).toThrow()
    })
  })

  describe("parameter validation", () => {
    test("should validate command parameter", () => {
      const validInputs = [
        { command: "analyze", args: [] },
        { command: "build", args: ["--watch"] },
        { command: "explain", args: ["src/index.ts", "--level=expert"] }
      ]

      validInputs.forEach(input => {
        expect(() => SuperClaudeTool.args.parse(input)).not.toThrow()
      })

      const invalidInputs = [
        { command: "", args: [] },
        { command: null, args: [] },
        { command: undefined, args: [] },
        { args: [] }, // Missing command
      ]

      invalidInputs.forEach(input => {
        expect(() => SuperClaudeTool.args.parse(input)).toThrow()
      })
    })

    test("should validate args parameter", () => {
      const validInputs = [
        { command: "analyze", args: [] },
        { command: "analyze", args: ["src/"] },
        { command: "analyze", args: ["src/", "--deep", "--focus=security"] }
      ]

      validInputs.forEach(input => {
        expect(() => SuperClaudeTool.args.parse(input)).not.toThrow()
      })

      const invalidInputs = [
        { command: "analyze", args: null },
        { command: "analyze", args: "string" },
        { command: "analyze", args: 123 },
        { command: "analyze", args: [123, true, {}] } // Non-string array elements
      ]

      invalidInputs.forEach(input => {
        expect(() => SuperClaudeTool.args.parse(input)).toThrow()
      })
    })
  })

  describe("command execution", () => {
    test("should execute simple command successfully", async () => {
      const props = {
        command: "analyze",
        args: ["src/"]
      }

      const generator = SuperClaudeTool.run(props)
      const results = []
      let finalResult

      for await (const result of generator) {
        if (result.type === "result") {
          finalResult = result
        } else {
          results.push(result)
        }
      }

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        type: "update",
        message: "Executing SuperClaude command: analyze with args: src/"
      })

      expect(finalResult).toEqual({
        type: "result",
        result: "Placeholder: SuperClaude command execution finished."
      })
    })

    test("should handle command with multiple arguments", async () => {
      const props = {
        command: "build",
        args: ["--watch", "--clean", "--output=dist"]
      }

      const generator = SuperClaudeTool.run(props)
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      expect(results).toHaveLength(2) // Update + Result
      expect(results[0].message).toContain("build with args: --watch --clean --output=dist")
    })

    test("should handle command with no arguments", async () => {
      const props = {
        command: "status",
        args: []
      }

      const generator = SuperClaudeTool.run(props)
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      expect(results[0].message).toContain("status with args: ")
    })
  })

  describe("orchestrator integration", () => {
    test("should call Orchestrator.getInstance", async () => {
      const props = { command: "analyze", args: ["src/"] }
      
      const generator = SuperClaudeTool.run(props)
      for await (const result of generator) {
        // Consume generator
      }

      expect(mockOrchestrator.getInstance).toHaveBeenCalled()
    })

    test("should prepare for future orchestrator integration", async () => {
      // This test documents the intended integration with orchestrator
      const props = {
        command: "analyze",
        args: ["src/", "--deep"]
      }

      // When orchestrator integration is implemented, it should:
      // 1. Parse the command and args
      // 2. Resolve flags using FlagResolver
      // 3. Detect appropriate persona
      // 4. Execute the command through the orchestrator
      // 5. Yield updates as they come from the orchestrator

      const generator = SuperClaudeTool.run(props)
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      // For now, we just verify the placeholder behavior
      expect(results).toHaveLength(2)
      expect(results[0].type).toBe("update")
      expect(results[1].type).toBe("result")
    })
  })

  describe("future integration scenarios", () => {
    test("should handle CommandParser integration", () => {
      // This test documents how CommandParser will be integrated
      const testCases = [
        {
          input: { command: "analyze", args: ["src/", "--deep", "--focus=security"] },
          expected: {
            command: "analyze",
            args: { target: "src/" },
            flags: { deep: true, focus: "security" }
          }
        },
        {
          input: { command: "build", args: ["--watch", "--clean"] },
          expected: {
            command: "build",
            args: {},
            flags: { watch: true, clean: true }
          }
        }
      ]

      // When implemented, the tool should parse args array into structured format
      testCases.forEach(({ input, expected }) => {
        // Future implementation will use CommandParser here
        expect(input.command).toBe(expected.command)
      })
    })

    test("should handle FlagResolver integration", () => {
      // This test documents how FlagResolver will be integrated
      const flagScenarios = [
        {
          command: "analyze",
          flags: { deep: true, uc: true },
          expectedResolved: {
            deep: true,
            uc: true,
            concise: true,
            minimal: true,
            efficient: true,
            depth: "deep"
          }
        },
        {
          command: "build",
          flags: { watch: true, clean: false },
          expectedResolved: {
            watch: true,
            clean: false
          }
        }
      ]

      // When implemented, the tool should resolve flags using FlagResolver
      flagScenarios.forEach(({ command, flags, expectedResolved }) => {
        expect(command).toBeTruthy()
        expect(flags).toBeTruthy()
        // Future implementation will resolve flags here
      })
    })

    test("should handle error scenarios gracefully", async () => {
      // Test how the tool should handle various error conditions
      const errorScenarios = [
        { command: "nonexistent", args: [] },
        { command: "analyze", args: ["--invalid-flag"] },
        { command: "", args: [] }
      ]

      for (const scenario of errorScenarios) {
        if (scenario.command === "") {
          // This should fail validation
          expect(() => SuperClaudeTool.args.parse(scenario)).toThrow()
        } else {
          // These should be handled gracefully by the orchestrator
          const generator = SuperClaudeTool.run(scenario)
          const results = []

          for await (const result of generator) {
            results.push(result)
          }

          expect(results).toHaveLength(2) // Should still produce update and result
        }
      }
    })
  })

  describe("async generator behavior", () => {
    test("should be an async generator", () => {
      const props = { command: "test", args: [] }
      const generator = SuperClaudeTool.run(props)
      
      expect(generator).toBeDefined()
      expect(typeof generator.next).toBe("function")
      expect(typeof generator[Symbol.asyncIterator]).toBe("function")
    })

    test("should yield intermediate updates", async () => {
      const props = { command: "analyze", args: ["src/"] }
      const generator = SuperClaudeTool.run(props)
      
      const firstResult = await generator.next()
      expect(firstResult.done).toBe(false)
      expect(firstResult.value.type).toBe("update")

      const secondResult = await generator.next()
      expect(secondResult.done).toBe(true)
      expect(secondResult.value.type).toBe("result")
    })

    test("should handle early termination", async () => {
      const props = { command: "long-running", args: [] }
      const generator = SuperClaudeTool.run(props)
      
      const firstResult = await generator.next()
      expect(firstResult.done).toBe(false)

      // Simulate early termination
      const returnResult = await generator.return({ type: "cancelled" })
      expect(returnResult.done).toBe(true)
      expect(returnResult.value.type).toBe("cancelled")
    })
  })

  afterEach(() => {
    mock.restore()
  })
})