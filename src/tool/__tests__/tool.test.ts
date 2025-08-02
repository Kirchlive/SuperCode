// /Users/rob/Development/SuperCode/SuperCode/src/tool/__tests__/tool.test.ts
import { describe, test, expect, beforeEach, mock, afterEach } from "bun:test"
import { z } from "zod"
import { Tool } from "../tool"

describe("Tool", () => {
  describe("constructor", () => {
    test("should create tool with valid parameters", () => {
      const mockArgs = z.object({
        input: z.string()
      })
      const mockRun = mock(async function* () {
        yield { type: "test" }
      })

      const tool = new Tool("test-tool", "Test description", mockArgs, mockRun)

      expect(tool.name).toBe("test-tool")
      expect(tool.description).toBe("Test description")
      expect(tool.args).toBe(mockArgs)
      expect(tool.run).toBe(mockRun)
    })

    test("should validate name parameter", () => {
      const mockArgs = z.object({})
      const mockRun = mock(async function* () {})

      expect(() => {
        new Tool("", "Description", mockArgs, mockRun)
      }).toThrow("Tool name cannot be empty")

      expect(() => {
        new Tool("   ", "Description", mockArgs, mockRun)
      }).toThrow("Tool name cannot be empty")
    })

    test("should validate description parameter", () => {
      const mockArgs = z.object({})
      const mockRun = mock(async function* () {})

      expect(() => {
        new Tool("test", "", mockArgs, mockRun)
      }).toThrow("Tool description cannot be empty")
    })

    test("should validate args parameter", () => {
      const mockRun = mock(async function* () {})

      expect(() => {
        new Tool("test", "Description", null as any, mockRun)
      }).toThrow("Tool args must be a Zod schema")

      expect(() => {
        new Tool("test", "Description", {} as any, mockRun)
      }).toThrow("Tool args must be a Zod schema")
    })

    test("should validate run parameter", () => {
      const mockArgs = z.object({})

      expect(() => {
        new Tool("test", "Description", mockArgs, null as any)
      }).toThrow("Tool run must be an async generator function")

      expect(() => {
        new Tool("test", "Description", mockArgs, (() => {}) as any)
      }).toThrow("Tool run must be an async generator function")
    })
  })

  describe("parameter validation", () => {
    let tool: Tool
    let mockRun: any

    beforeEach(() => {
      const mockArgs = z.object({
        required: z.string(),
        optional: z.string().optional(),
        number: z.number().min(0).max(100)
      })
      mockRun = mock(async function* () {
        yield { type: "success" }
      })
      tool = new Tool("test-tool", "Test tool", mockArgs, mockRun)
    })

    test("should validate required parameters", async () => {
      expect(() => {
        tool.args.parse({})
      }).toThrow()

      expect(() => {
        tool.args.parse({ required: "value", number: 50 })
      }).not.toThrow()
    })

    test("should validate parameter types", async () => {
      expect(() => {
        tool.args.parse({ required: 123, number: 50 })
      }).toThrow()

      expect(() => {
        tool.args.parse({ required: "value", number: "invalid" })
      }).toThrow()
    })

    test("should validate parameter ranges", async () => {
      expect(() => {
        tool.args.parse({ required: "value", number: -1 })
      }).toThrow()

      expect(() => {
        tool.args.parse({ required: "value", number: 101 })
      }).toThrow()

      expect(() => {
        tool.args.parse({ required: "value", number: 50 })
      }).not.toThrow()
    })
  })

  describe("execution", () => {
    test("should execute async generator successfully", async () => {
      const mockRun = mock(async function* (props: any) {
        yield { type: "start", data: props }
        yield { type: "progress", value: 50 }
        return { type: "complete", result: "success" }
      })

      const tool = new Tool(
        "test-tool",
        "Test tool",
        z.object({ input: z.string() }),
        mockRun
      )

      const generator = tool.run({ input: "test" })
      const results = []
      let finalResult

      for await (const result of generator) {
        results.push(result)
      }

      // The return value is not included in the for-await iteration
      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({ type: "start", data: { input: "test" } })
      expect(results[1]).toEqual({ type: "progress", value: 50 })
      expect(mockRun).toHaveBeenCalledWith({ input: "test" })
    })

    test("should handle execution errors", async () => {
      const mockRun = mock(async function* () {
        yield { type: "start" }
        throw new Error("Execution failed")
      })

      const tool = new Tool(
        "test-tool",
        "Test tool",
        z.object({}),
        mockRun
      )

      const generator = tool.run({})
      
      await expect(async () => {
        for await (const result of generator) {
          // Should throw during iteration
        }
      }).toThrow("Execution failed")
    })

    test("should handle empty generator", async () => {
      const mockRun = mock(async function* () {
        return { type: "empty" }
      })

      const tool = new Tool(
        "test-tool",
        "Test tool",
        z.object({}),
        mockRun
      )

      const generator = tool.run({})
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      expect(results).toHaveLength(0)
    })
  })

  describe("complex scenarios", () => {
    test("should handle complex schema validation", () => {
      const complexSchema = z.object({
        config: z.object({
          timeout: z.number().min(1000).max(30000),
          retries: z.number().int().min(0).max(5),
          endpoints: z.array(z.string().url()).min(1)
        }),
        metadata: z.record(z.string(), z.any()).optional(),
        flags: z.array(z.enum(["verbose", "debug", "silent"])).optional()
      })

      const mockRun = mock(async function* () {})
      const tool = new Tool("complex-tool", "Complex tool", complexSchema, mockRun)

      const validInput = {
        config: {
          timeout: 5000,
          retries: 3,
          endpoints: ["https://api.example.com", "https://backup.example.com"]
        },
        metadata: {
          version: "1.0.0",
          author: "test"
        },
        flags: ["verbose", "debug"]
      }

      expect(() => tool.args.parse(validInput)).not.toThrow()

      const invalidInput = {
        config: {
          timeout: 500, // Too low
          retries: -1,  // Invalid
          endpoints: [] // Empty array
        }
      }

      expect(() => tool.args.parse(invalidInput)).toThrow()
    })

    test("should handle long-running operations", async () => {
      const mockRun = mock(async function* () {
        for (let i = 0; i < 5; i++) {
          yield { type: "progress", step: i, total: 5 }
          // Simulate async work
          await new Promise(resolve => setTimeout(resolve, 10))
        }
        return { type: "complete", result: "Long operation finished" }
      })

      const tool = new Tool(
        "long-tool",
        "Long running tool",
        z.object({}),
        mockRun
      )

      const generator = tool.run({})
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      expect(results).toHaveLength(5) // 5 progress updates (return value not included)
      expect(results[0]).toEqual({ type: "progress", step: 0, total: 5 })
      expect(results[4]).toEqual({ type: "progress", step: 4, total: 5 })
    })
  })

  describe("edge cases", () => {
    test("should handle tool with no parameters", () => {
      const mockRun = mock(async function* () {
        yield { type: "no-params" }
      })

      const tool = new Tool(
        "no-params-tool",
        "Tool with no parameters",
        z.object({}),
        mockRun
      )

      expect(() => tool.args.parse({})).not.toThrow()
      // z.object({}) allows extra properties by default, so this won't throw
      // Use z.object({}).strict() if you want to disallow extra properties
      expect(() => tool.args.parse({ extra: "param" })).not.toThrow()
    })

    test("should handle special characters in name and description", () => {
      const mockRun = mock(async function* () {})
      
      expect(() => {
        new Tool(
          "tool-with-special_chars.123",
          "Description with special chars: @#$%^&*()",
          z.object({}),
          mockRun
        )
      }).not.toThrow()
    })

    test("should handle very long descriptions", () => {
      const longDescription = "A".repeat(10000)
      const mockRun = mock(async function* () {})

      expect(() => {
        new Tool("test", longDescription, z.object({}), mockRun)
      }).not.toThrow()
    })
  })

  afterEach(() => {
    // Clean up any mocks
    mock.restore()
  })
})