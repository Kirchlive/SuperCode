// /Users/rob/Development/SuperCode/SuperCode/src/tool/__tests__/tool-error-handling.test.ts
import { describe, test, expect, beforeEach, mock, afterEach } from "bun:test"
import { z } from "zod"
import { Tool } from "../tool"

describe("Tool Error Handling Tests", () => {
  describe("parameter validation errors", () => {
    test("should handle missing required parameters", () => {
      const tool = new Tool(
        "required-params-tool",
        "Tool with required parameters",
        z.object({
          required: z.string(),
          optional: z.string().optional(),
          nested: z.object({
            value: z.number()
          })
        }),
        mock(async function* () {})
      )

      // Missing required parameter
      expect(() => tool.args.parse({})).toThrow()
      expect(() => tool.args.parse({ optional: "test" })).toThrow()
      
      // Missing nested required parameter
      expect(() => tool.args.parse({ 
        required: "test", 
        nested: {} 
      })).toThrow()

      // Valid parameters should work
      expect(() => tool.args.parse({
        required: "test",
        nested: { value: 42 }
      })).not.toThrow()
    })

    test("should handle type mismatch errors", () => {
      const tool = new Tool(
        "type-validation-tool",
        "Type validation test",
        z.object({
          string: z.string(),
          number: z.number(),
          boolean: z.boolean(),
          array: z.array(z.string()),
          enum: z.enum(["option1", "option2", "option3"])
        }),
        mock(async function* () {})
      )

      const invalidInputs = [
        { string: 123, number: 42, boolean: true, array: ["test"], enum: "option1" },
        { string: "test", number: "not-a-number", boolean: true, array: ["test"], enum: "option1" },
        { string: "test", number: 42, boolean: "not-boolean", array: ["test"], enum: "option1" },
        { string: "test", number: 42, boolean: true, array: "not-array", enum: "option1" },
        { string: "test", number: 42, boolean: true, array: [123], enum: "option1" },
        { string: "test", number: 42, boolean: true, array: ["test"], enum: "invalid-option" }
      ]

      invalidInputs.forEach(input => {
        expect(() => tool.args.parse(input)).toThrow()
      })

      // Valid input should work
      const validInput = {
        string: "test",
        number: 42,
        boolean: true,
        array: ["test1", "test2"],
        enum: "option2" as const
      }

      expect(() => tool.args.parse(validInput)).not.toThrow()
    })

    test("should handle constraint violations", () => {
      const tool = new Tool(
        "constraint-tool",
        "Constraint validation test",
        z.object({
          minLength: z.string().min(5),
          maxLength: z.string().max(10),
          range: z.number().min(0).max(100),
          pattern: z.string().regex(/^[a-zA-Z0-9]+$/),
          custom: z.string().refine(
            (val) => val !== "forbidden",
            "Value 'forbidden' is not allowed"
          )
        }),
        mock(async function* () {})
      )

      const constraintViolations = [
        {
          minLength: "hi", // Too short
          maxLength: "valid",
          range: 50,
          pattern: "valid123",
          custom: "allowed"
        },
        {
          minLength: "valid",
          maxLength: "this-is-way-too-long", // Too long
          range: 50,
          pattern: "valid123",
          custom: "allowed"
        },
        {
          minLength: "valid",
          maxLength: "valid",
          range: -10, // Below minimum
          pattern: "valid123",
          custom: "allowed"
        },
        {
          minLength: "valid",
          maxLength: "valid",
          range: 150, // Above maximum
          pattern: "valid123",
          custom: "allowed"
        },
        {
          minLength: "valid",
          maxLength: "valid",
          range: 50,
          pattern: "invalid-chars!", // Invalid pattern
          custom: "allowed"
        },
        {
          minLength: "valid",
          maxLength: "valid",
          range: 50,
          pattern: "valid123",
          custom: "forbidden" // Custom validation failure
        }
      ]

      constraintViolations.forEach(input => {
        expect(() => tool.args.parse(input)).toThrow()
      })

      // Valid input should work
      const validInput = {
        minLength: "valid",
        maxLength: "valid",
        range: 50,
        pattern: "valid123",
        custom: "allowed"
      }

      expect(() => tool.args.parse(validInput)).not.toThrow()
    })
  })

  describe("execution errors", () => {
    test("should handle synchronous errors in generator", async () => {
      const errorTool = new Tool(
        "sync-error-tool",
        "Synchronous error test",
        z.object({ shouldFail: z.boolean() }),
        async function* (props) {
          if (props.shouldFail) {
            throw new Error("Synchronous error occurred")
          }
          yield { type: "success" }
        }
      )

      // Should throw immediately
      const failingGenerator = errorTool.run({ shouldFail: true })
      
      await expect(async () => {
        for await (const result of failingGenerator) {
          // Should not reach here
        }
      }).toThrow("Synchronous error occurred")

      // Should work normally when not failing
      const workingGenerator = errorTool.run({ shouldFail: false })
      const results = []
      
      for await (const result of workingGenerator) {
        results.push(result)
      }
      
      expect(results).toHaveLength(1)
      expect(results[0].type).toBe("success")
    })

    test("should handle asynchronous errors in generator", async () => {
      const asyncErrorTool = new Tool(
        "async-error-tool",
        "Asynchronous error test",
        z.object({ 
          steps: z.number(),
          failAtStep: z.number().optional()
        }),
        async function* (props) {
          for (let i = 0; i < props.steps; i++) {
            if (props.failAtStep === i) {
              await new Promise(resolve => setTimeout(resolve, 10))
              throw new Error(`Async error at step ${i}`)
            }
            
            yield { type: "step", step: i }
            await new Promise(resolve => setTimeout(resolve, 1))
          }
          
          return { type: "completed", totalSteps: props.steps }
        }
      )

      // Should fail at specified step
      const failingGenerator = asyncErrorTool.run({ steps: 5, failAtStep: 2 })
      const results = []
      
      await expect(async () => {
        for await (const result of failingGenerator) {
          results.push(result)
        }
      }).toThrow("Async error at step 2")

      // Should have yielded results before the error
      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({ type: "step", step: 0 })
      expect(results[1]).toEqual({ type: "step", step: 1 })
    })

    test("should handle resource cleanup on errors", async () => {
      let resourcesAllocated = 0
      let resourcesCleaned = 0

      const cleanupTool = new Tool(
        "cleanup-tool",
        "Resource cleanup test",
        z.object({
          allocateResources: z.number(),
          failAfterSteps: z.number().optional()
        }),
        async function* (props) {
          const resources = []
          
          try {
            // Allocate resources
            for (let i = 0; i < props.allocateResources; i++) {
              resources.push({ id: i, data: new Array(100).fill(i) })
              resourcesAllocated++
              yield { type: "allocated", resourceId: i }
            }

            // Do some work that might fail
            for (let step = 0; step < 10; step++) {
              if (props.failAfterSteps === step) {
                throw new Error(`Intentional failure at step ${step}`)
              }
              
              yield { type: "processing", step }
              await new Promise(resolve => setTimeout(resolve, 1))
            }

            return { type: "success", resourcesUsed: resources.length }
          } finally {
            // Always cleanup resources
            resourcesCleaned += resources.length
            resources.length = 0
            yield { type: "cleanup", cleaned: resourcesCleaned }
          }
        }
      )

      // Test successful execution with cleanup
      const successGenerator = cleanupTool.run({ allocateResources: 3 })
      const successResults = []

      for await (const result of successGenerator) {
        successResults.push(result)
      }

      expect(resourcesAllocated).toBe(3)
      expect(resourcesCleaned).toBe(3)

      // Reset counters
      resourcesAllocated = 0
      resourcesCleaned = 0

      // Test failed execution with cleanup
      const failGenerator = cleanupTool.run({ 
        allocateResources: 5, 
        failAfterSteps: 3 
      })
      const failResults = []

      await expect(async () => {
        for await (const result of failGenerator) {
          failResults.push(result)
        }
      }).toThrow("Intentional failure at step 3")

      // Resources should still be cleaned up despite the error
      expect(resourcesAllocated).toBe(5)
      expect(resourcesCleaned).toBe(5)

      // Should have cleanup message in results
      const cleanupResult = failResults.find(r => r.type === "cleanup")
      expect(cleanupResult).toBeDefined()
    })
  })

  describe("network and I/O errors", () => {
    test("should handle network timeout errors", async () => {
      const networkTool = new Tool(
        "network-tool",
        "Network operation test",
        z.object({
          timeout: z.number(),
          simulateTimeout: z.boolean()
        }),
        async function* (props) {
          yield { type: "connecting" }

          try {
            if (props.simulateTimeout) {
              // Simulate a network timeout
              await new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Network timeout")), props.timeout)
              })
            } else {
              // Simulate successful network operation
              await new Promise(resolve => setTimeout(resolve, props.timeout / 2))
              yield { type: "connected" }
            }

            return { type: "success" }
          } catch (error: any) {
            yield { type: "network-error", error: error.message }
            throw error
          }
        }
      )

      // Test timeout scenario
      const timeoutGenerator = networkTool.run({ 
        timeout: 100, 
        simulateTimeout: true 
      })
      const timeoutResults = []

      await expect(async () => {
        for await (const result of timeoutGenerator) {
          timeoutResults.push(result)
        }
      }).toThrow("Network timeout")

      expect(timeoutResults).toHaveLength(2) // connecting + network-error
      expect(timeoutResults[0].type).toBe("connecting")
      expect(timeoutResults[1].type).toBe("network-error")

      // Test successful scenario
      const successGenerator = networkTool.run({ 
        timeout: 100, 
        simulateTimeout: false 
      })
      const successResults = []

      for await (const result of successGenerator) {
        successResults.push(result)
      }

      expect(successResults).toHaveLength(2) // connecting + connected
      expect(successResults[1].type).toBe("connected")
    })

    test("should handle file I/O errors", async () => {
      const fileIOTool = new Tool(
        "file-io-tool",
        "File I/O error test",
        z.object({
          operation: z.enum(["read", "write"]),
          filename: z.string(),
          simulateError: z.string().optional()
        }),
        async function* (props) {
          yield { type: "starting", operation: props.operation, file: props.filename }

          try {
            if (props.simulateError) {
              switch (props.simulateError) {
                case "file-not-found":
                  throw new Error(`ENOENT: no such file or directory, open '${props.filename}'`)
                case "permission-denied":
                  throw new Error(`EACCES: permission denied, open '${props.filename}'`)
                case "disk-full":
                  throw new Error(`ENOSPC: no space left on device, write`)
                case "file-locked":
                  throw new Error(`EBUSY: resource busy or locked, open '${props.filename}'`)
                default:
                  throw new Error(`Unknown error: ${props.simulateError}`)
              }
            }

            // Simulate successful I/O operation
            await new Promise(resolve => setTimeout(resolve, 10))
            yield { type: "io-complete", operation: props.operation }

            return { type: "success" }
          } catch (error: any) {
            yield { type: "io-error", error: error.message }
            
            // Categorize the error
            let errorCategory = "unknown"
            if (error.message.includes("ENOENT")) errorCategory = "file-not-found"
            else if (error.message.includes("EACCES")) errorCategory = "permission-denied"
            else if (error.message.includes("ENOSPC")) errorCategory = "disk-full"
            else if (error.message.includes("EBUSY")) errorCategory = "file-locked"

            yield { type: "error-category", category: errorCategory }
            throw error
          }
        }
      )

      const errorScenarios = [
        { error: "file-not-found", expectedCategory: "file-not-found" },
        { error: "permission-denied", expectedCategory: "permission-denied" },
        { error: "disk-full", expectedCategory: "disk-full" },
        { error: "file-locked", expectedCategory: "file-locked" }
      ]

      for (const scenario of errorScenarios) {
        const generator = fileIOTool.run({
          operation: "read" as const,
          filename: "test.txt",
          simulateError: scenario.error
        })
        const results = []

        await expect(async () => {
          for await (const result of generator) {
            results.push(result)
          }
        }).toThrow()

        const categoryResult = results.find(r => r.type === "error-category")
        expect(categoryResult?.category).toBe(scenario.expectedCategory)
      }
    })
  })

  describe("concurrent execution errors", () => {
    test("should handle errors in concurrent executions", async () => {
      const concurrentTool = new Tool(
        "concurrent-tool",
        "Concurrent execution test",
        z.object({
          id: z.string(),
          shouldFail: z.boolean(),
          steps: z.number()
        }),
        async function* (props) {
          yield { type: "started", id: props.id }

          for (let i = 0; i < props.steps; i++) {
            if (props.shouldFail && i === Math.floor(props.steps / 2)) {
              throw new Error(`Execution ${props.id} failed at step ${i}`)
            }
            
            yield { type: "step", id: props.id, step: i }
            await new Promise(resolve => setTimeout(resolve, 10))
          }

          return { type: "completed", id: props.id }
        }
      )

      const executions = [
        { id: "exec-1", shouldFail: false, steps: 3 },
        { id: "exec-2", shouldFail: true, steps: 4 },
        { id: "exec-3", shouldFail: false, steps: 2 }
      ]

      const results = await Promise.allSettled(
        executions.map(async (exec) => {
          const generator = concurrentTool.run(exec)
          const updates = []

          for await (const result of generator) {
            updates.push(result)
          }

          return updates
        })
      )

      // First execution should succeed
      expect(results[0].status).toBe("fulfilled")
      const exec1Results = (results[0] as PromiseFulfilledResult<any>).value
      expect(exec1Results[exec1Results.length - 1].type).toBe("completed")

      // Second execution should fail
      expect(results[1].status).toBe("rejected")
      const exec2Error = (results[1] as PromiseRejectedResult).reason
      expect(exec2Error.message).toContain("exec-2 failed")

      // Third execution should succeed
      expect(results[2].status).toBe("fulfilled")
      const exec3Results = (results[2] as PromiseFulfilledResult<any>).value
      expect(exec3Results[exec3Results.length - 1].type).toBe("completed")
    })

    test("should handle race conditions gracefully", async () => {
      let sharedResource = 0
      const accessLog: string[] = []

      const raceTool = new Tool(
        "race-condition-tool",
        "Race condition test",
        z.object({
          id: z.string(),
          operations: z.number()
        }),
        async function* (props) {
          for (let i = 0; i < props.operations; i++) {
            try {
              // Simulate accessing shared resource
              const currentValue = sharedResource
              accessLog.push(`${props.id}: read ${currentValue}`)
              
              // Simulate processing time
              await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
              
              // Update shared resource
              sharedResource = currentValue + 1
              accessLog.push(`${props.id}: wrote ${sharedResource}`)
              
              yield { type: "operation", id: props.id, operation: i, value: sharedResource }
            } catch (error: any) {
              yield { type: "error", id: props.id, error: error.message }
              throw error
            }
          }

          return { type: "completed", id: props.id, finalValue: sharedResource }
        }
      )

      // Run multiple instances concurrently to create race conditions
      const concurrentExecutions = Array.from({ length: 3 }, (_, i) => ({
        id: `racer-${i}`,
        operations: 5
      }))

      const results = await Promise.all(
        concurrentExecutions.map(async (exec) => {
          const generator = raceTool.run(exec)
          const updates = []
          let final

          for await (const result of generator) {
            if (result.type === "completed") {
              final = result
            } else {
              updates.push(result)
            }
          }

          return { updates, final }
        })
      )

      // All executions should complete despite race conditions
      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.final?.id).toBe(`racer-${index}`)
        expect(result.updates).toHaveLength(5) // 5 operations each
      })

      // Verify the shared resource was updated (final value should be 15)
      expect(sharedResource).toBe(15)
      
      // Access log should show interleaved operations
      expect(accessLog.length).toBe(30) // 3 instances * 5 operations * 2 log entries each
    })
  })

  describe("error recovery", () => {
    test("should support retry mechanisms", async () => {
      let attemptCount = 0

      const retryTool = new Tool(
        "retry-tool",
        "Retry mechanism test",
        z.object({
          maxRetries: z.number(),
          succeedOnAttempt: z.number()
        }),
        async function* (props) {
          for (let attempt = 1; attempt <= props.maxRetries; attempt++) {
            attemptCount++
            
            try {
              yield { type: "attempt", attempt, total: props.maxRetries }

              if (attempt < props.succeedOnAttempt) {
                throw new Error(`Attempt ${attempt} failed`)
              }

              yield { type: "success", attempt }
              return { type: "completed", successfulAttempt: attempt }
            } catch (error: any) {
              yield { type: "retry-error", attempt, error: error.message }
              
              if (attempt === props.maxRetries) {
                yield { type: "max-retries-exceeded" }
                throw error
              }
              
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 10))
            }
          }
        }
      )

      // Test successful retry
      attemptCount = 0
      const successGenerator = retryTool.run({ maxRetries: 3, succeedOnAttempt: 2 })
      const successResults = []

      for await (const result of successGenerator) {
        successResults.push(result)
      }

      expect(attemptCount).toBe(2)
      const completedResult = successResults.find(r => r.type === "completed")
      expect(completedResult?.successfulAttempt).toBe(2)

      // Test max retries exceeded
      attemptCount = 0
      const failGenerator = retryTool.run({ maxRetries: 2, succeedOnAttempt: 5 })
      const failResults = []

      await expect(async () => {
        for await (const result of failGenerator) {
          failResults.push(result)
        }
      }).toThrow("Attempt 2 failed")

      expect(attemptCount).toBe(2)
      const maxRetriesResult = failResults.find(r => r.type === "max-retries-exceeded")
      expect(maxRetriesResult).toBeDefined()
    })

    test("should support graceful degradation", async () => {
      const degradationTool = new Tool(
        "degradation-tool",
        "Graceful degradation test",
        z.object({
          features: z.array(z.string()),
          simulateFailures: z.array(z.string())
        }),
        async function* (props) {
          const availableFeatures = [...props.features]
          const results = []

          for (const feature of props.features) {
            try {
              yield { type: "testing-feature", feature }

              if (props.simulateFailures.includes(feature)) {
                throw new Error(`Feature '${feature}' is unavailable`)
              }

              yield { type: "feature-available", feature }
              results.push(feature)
            } catch (error: any) {
              yield { type: "feature-degraded", feature, error: error.message }
              
              // Remove failed feature but continue
              const index = availableFeatures.indexOf(feature)
              if (index > -1) {
                availableFeatures.splice(index, 1)
              }
            }
          }

          return { 
            type: "completed", 
            availableFeatures,
            degradedFeatures: props.features.filter(f => !availableFeatures.includes(f))
          }
        }
      )

      const generator = degradationTool.run({
        features: ["auth", "database", "cache", "logging", "metrics"],
        simulateFailures: ["cache", "metrics"]
      })

      const results = []
      let final

      for await (const result of generator) {
        if (result.type === "completed") {
          final = result
        } else {
          results.push(result)
        }
      }

      // Should continue despite some features failing
      expect(final?.availableFeatures).toEqual(["auth", "database", "logging"])
      expect(final?.degradedFeatures).toEqual(["cache", "metrics"])

      // Should log degradation events
      const degradedEvents = results.filter(r => r.type === "feature-degraded")
      expect(degradedEvents).toHaveLength(2)
      expect(degradedEvents.map(e => e.feature)).toEqual(["cache", "metrics"])
    })
  })

  afterEach(() => {
    mock.restore()
  })
})