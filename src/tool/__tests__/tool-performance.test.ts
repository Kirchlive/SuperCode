// /Users/rob/Development/SuperCode/SuperCode/src/tool/__tests__/tool-performance.test.ts
import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { z } from "zod"
import { Tool } from "../tool"

describe("Tool Performance Tests", () => {
  describe("memory usage", () => {
    test("should not leak memory with repeated tool creation", () => {
      const initialMemory = process.memoryUsage().heapUsed
      const tools: Tool[] = []

      // Create many tools
      for (let i = 0; i < 1000; i++) {
        const tool = new Tool(
          `test-tool-${i}`,
          `Test tool ${i}`,
          z.object({ id: z.number() }),
          async function* () {
            yield { id: i }
          }
        )
        tools.push(tool)
      }

      const afterCreationMemory = process.memoryUsage().heapUsed
      const memoryIncrease = afterCreationMemory - initialMemory

      // Clear references
      tools.length = 0

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const afterCleanupMemory = process.memoryUsage().heapUsed
      const memoryAfterCleanup = afterCleanupMemory - initialMemory

      // Memory should not grow excessively
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
      
      // Memory should be mostly reclaimed after cleanup
      expect(memoryAfterCleanup).toBeLessThan(memoryIncrease / 2)
    })

    test("should handle large parameter schemas efficiently", () => {
      const startTime = performance.now()

      const largeSchema = z.object({
        config: z.object({
          database: z.object({
            host: z.string(),
            port: z.number(),
            username: z.string(),
            password: z.string(),
            ssl: z.boolean(),
            poolSize: z.number(),
            timeout: z.number()
          }),
          cache: z.object({
            redis: z.object({
              host: z.string(),
              port: z.number(),
              db: z.number()
            }),
            ttl: z.number(),
            maxSize: z.number()
          }),
          api: z.object({
            endpoints: z.array(z.object({
              path: z.string(),
              method: z.enum(["GET", "POST", "PUT", "DELETE"]),
              auth: z.boolean(),
              rateLimit: z.number()
            })),
            cors: z.object({
              origins: z.array(z.string()),
              methods: z.array(z.string()),
              headers: z.array(z.string())
            })
          })
        }),
        features: z.record(z.string(), z.boolean()),
        metadata: z.record(z.string(), z.any())
      })

      const tool = new Tool(
        "large-schema-tool",
        "Tool with large schema",
        largeSchema,
        async function* () {
          yield { type: "success" }
        }
      )

      const endTime = performance.now()
      const creationTime = endTime - startTime

      // Tool creation should be fast even with large schemas
      expect(creationTime).toBeLessThan(100) // 100ms
      expect(tool.args).toBe(largeSchema)
    })
  })

  describe("execution performance", () => {
    test("should handle high-frequency tool execution", async () => {
      const tool = new Tool(
        "high-frequency-tool",
        "High frequency test tool",
        z.object({ iteration: z.number() }),
        async function* (props) {
          yield { type: "start", iteration: props.iteration }
          // Simulate some work
          await new Promise(resolve => setTimeout(resolve, 1))
          yield { type: "complete", iteration: props.iteration }
        }
      )

      const startTime = performance.now()
      const executions = []

      // Execute tool many times concurrently
      for (let i = 0; i < 100; i++) {
        const execution = (async () => {
          const generator = tool.run({ iteration: i })
          const results = []
          for await (const result of generator) {
            results.push(result)
          }
          return results
        })()
        executions.push(execution)
      }

      const results = await Promise.all(executions)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All executions should complete
      expect(results).toHaveLength(100)
      results.forEach((result, index) => {
        expect(result).toHaveLength(2) // start + complete
        expect(result[0].iteration).toBe(index)
        expect(result[1].iteration).toBe(index)
      })

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(5000) // 5 seconds
    })

    test("should handle large data processing efficiently", async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: `Data for item ${i}`.repeat(10)
      }))

      const tool = new Tool(
        "large-data-tool",
        "Large data processing tool",
        z.object({ items: z.array(z.any()) }),
        async function* (props) {
          const batchSize = 100
          const items = props.items
          
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize)
            yield {
              type: "batch",
              batch: i / batchSize + 1,
              total: Math.ceil(items.length / batchSize),
              processed: batch.length
            }
          }

          return { type: "complete", totalProcessed: items.length }
        }
      )

      const startTime = performance.now()
      const generator = tool.run({ items: largeData })
      const results = []
      let finalResult

      for await (const result of generator) {
        if (result.type === "complete") {
          finalResult = result
        } else {
          results.push(result)
        }
      }

      const endTime = performance.now()
      const processingTime = endTime - startTime

      expect(results).toHaveLength(100) // 100 batches
      expect(finalResult?.totalProcessed).toBe(10000)
      expect(processingTime).toBeLessThan(1000) // 1 second
    })

    test("should handle rapid successive calls", async () => {
      let callCount = 0
      
      const tool = new Tool(
        "rapid-call-tool",
        "Rapid successive calls tool",
        z.object({ id: z.string() }),
        async function* (props) {
          callCount++
          yield { type: "call", id: props.id, count: callCount }
          // Very short processing time
          await new Promise(resolve => setTimeout(resolve, 0))
          return { type: "done", id: props.id }
        }
      )

      const rapidCalls = Array.from({ length: 50 }, (_, i) => 
        (async () => {
          const generator = tool.run({ id: `call-${i}` })
          const results = []
          for await (const result of generator) {
            results.push(result)
          }
          return results
        })()
      )

      const startTime = performance.now()
      const results = await Promise.all(rapidCalls)
      const endTime = performance.now()

      expect(results).toHaveLength(50)
      expect(callCount).toBe(50)
      
      // Should handle rapid calls efficiently
      const avgTimePerCall = (endTime - startTime) / 50
      expect(avgTimePerCall).toBeLessThan(20) // 20ms per call on average
    })
  })

  describe("resource management", () => {
    test("should cleanup resources after generator completion", async () => {
      let resourcesAllocated = 0
      let resourcesCleaned = 0

      const tool = new Tool(
        "resource-management-tool",
        "Resource management test tool",
        z.object({ size: z.number() }),
        async function* (props) {
          // Simulate resource allocation
          const resources = Array.from({ length: props.size }, (_, i) => ({
            id: i,
            data: new Array(1000).fill(i)
          }))
          resourcesAllocated += resources.length

          try {
            yield { type: "allocated", count: resources.length }
            
            // Process resources
            for (let i = 0; i < resources.length; i += 10) {
              yield { type: "processing", batch: i / 10 }
              await new Promise(resolve => setTimeout(resolve, 1))
            }

            yield { type: "processed", total: resources.length }
          } finally {
            // Cleanup resources
            resources.length = 0
            resourcesCleaned += props.size
          }

          return { type: "cleanup-complete" }
        }
      )

      const generator = tool.run({ size: 100 })
      const results = []

      for await (const result of generator) {
        results.push(result)
      }

      expect(resourcesAllocated).toBe(100)
      expect(resourcesCleaned).toBe(100)
      
      const allocatedResult = results.find(r => r.type === "allocated")
      const processedResult = results.find(r => r.type === "processed")
      
      expect(allocatedResult?.count).toBe(100)
      expect(processedResult?.total).toBe(100)
    })

    test("should handle generator interruption gracefully", async () => {
      let cleanupCalled = false

      const tool = new Tool(
        "interruption-tool",
        "Generator interruption test",
        z.object({}),
        async function* () {
          try {
            for (let i = 0; i < 1000; i++) {
              yield { type: "iteration", value: i }
              await new Promise(resolve => setTimeout(resolve, 1))
            }
          } finally {
            cleanupCalled = true
          }
        }
      )

      const generator = tool.run({})
      let iterationCount = 0

      // Process only first few iterations then break
      for await (const result of generator) {
        iterationCount++
        if (iterationCount >= 5) {
          break
        }
      }

      // Small delay to allow cleanup
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(iterationCount).toBe(5)
      expect(cleanupCalled).toBe(true)
    })
  })

  describe("concurrent execution", () => {
    test("should handle multiple concurrent tool instances", async () => {
      const tool = new Tool(
        "concurrent-tool",
        "Concurrent execution test",
        z.object({ 
          instanceId: z.string(),
          workload: z.number()
        }),
        async function* (props) {
          yield { type: "start", instance: props.instanceId }
          
          // Simulate work proportional to workload
          for (let i = 0; i < props.workload; i++) {
            yield { type: "work", instance: props.instanceId, unit: i }
            await new Promise(resolve => setTimeout(resolve, 1))
          }

          return { type: "complete", instance: props.instanceId, totalWork: props.workload }
        }
      )

      const instances = [
        { instanceId: "fast", workload: 10 },
        { instanceId: "medium", workload: 25 },
        { instanceId: "slow", workload: 50 }
      ]

      const startTime = performance.now()
      
      const executions = instances.map(async (instance) => {
        const generator = tool.run(instance)
        const results = []
        let finalResult

        for await (const result of generator) {
          if (result.type === "complete") {
            finalResult = result
          } else {
            results.push(result)
          }
        }

        return { updates: results, final: finalResult }
      })

      const results = await Promise.all(executions)
      const endTime = performance.now()

      // All instances should complete
      expect(results).toHaveLength(3)
      
      // Verify each instance completed its work
      results.forEach((result, index) => {
        const instance = instances[index]
        expect(result.final?.instance).toBe(instance.instanceId)
        expect(result.final?.totalWork).toBe(instance.workload)
        expect(result.updates).toHaveLength(instance.workload + 1) // start + work units
      })

      // Concurrent execution should be faster than sequential
      const maxSequentialTime = instances.reduce((sum, instance) => sum + instance.workload, 0) * 2
      expect(endTime - startTime).toBeLessThan(maxSequentialTime)
    })

    test("should maintain thread safety with shared resources", async () => {
      let sharedCounter = 0
      const results: number[] = []

      const tool = new Tool(
        "thread-safety-tool",
        "Thread safety test",
        z.object({ operations: z.number() }),
        async function* (props) {
          for (let i = 0; i < props.operations; i++) {
            // Simulate atomic operation
            const currentValue = sharedCounter
            await new Promise(resolve => setTimeout(resolve, 0))
            sharedCounter = currentValue + 1
            results.push(sharedCounter)
            
            yield { type: "operation", value: sharedCounter }
          }

          return { type: "complete", finalCounter: sharedCounter }
        }
      )

      // Run multiple instances concurrently
      const concurrentExecutions = Array.from({ length: 5 }, (_, i) =>
        (async () => {
          const generator = tool.run({ operations: 10 })
          const updates = []
          
          for await (const result of generator) {
            updates.push(result)
          }
          
          return updates
        })()
      )

      const allResults = await Promise.all(concurrentExecutions)
      
      // Verify all operations completed
      expect(allResults).toHaveLength(5)
      expect(sharedCounter).toBe(50) // 5 instances * 10 operations each
      expect(results).toHaveLength(50)
    })
  })

  afterEach(() => {
    // Force garbage collection if available to clean up test artifacts
    if (global.gc) {
      global.gc()
    }
  })
})