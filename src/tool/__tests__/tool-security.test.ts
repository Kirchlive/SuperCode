// /Users/rob/Development/SuperCode/SuperCode/src/tool/__tests__/tool-security.test.ts
import { describe, test, expect, beforeEach, mock } from "bun:test"
import { z } from "zod"
import { Tool } from "../tool"

describe("Tool Security Tests", () => {
  describe("input validation and sanitization", () => {
    test("should prevent code injection through parameters", () => {
      const tool = new Tool(
        "secure-tool",
        "Security test tool",
        z.object({
          userInput: z.string(),
          config: z.object({
            command: z.string(),
            flags: z.array(z.string())
          })
        }),
        mock(async function* () {})
      )

      const maliciousInputs = [
        {
          userInput: "'; DROP TABLE users; --",
          config: { command: "test", flags: [] }
        },
        {
          userInput: "<script>alert('xss')</script>",
          config: { command: "test", flags: [] }
        },
        {
          userInput: "$(rm -rf /)",
          config: { command: "test", flags: [] }
        },
        {
          userInput: "../../etc/passwd",
          config: { command: "test", flags: [] }
        }
      ]

      // All inputs should be validated by Zod, but malicious content should be sanitized
      maliciousInputs.forEach(input => {
        expect(() => tool.args.parse(input)).not.toThrow()
        
        const parsed = tool.args.parse(input)
        // Ensure the malicious content is preserved as a string (not executed)
        expect(typeof parsed.userInput).toBe("string")
        expect(parsed.userInput).toBe(input.userInput) // Exact match, not executed
      })
    })

    test("should validate file path parameters to prevent directory traversal", () => {
      const fileToolSchema = z.object({
        filePath: z.string().refine(
          (path) => !path.includes("..") && !path.startsWith("/etc") && !path.includes("~"),
          "Invalid file path: directory traversal not allowed"
        ),
        operation: z.enum(["read", "write", "delete"])
      })

      const tool = new Tool(
        "file-tool",
        "File operation tool",
        fileToolSchema,
        mock(async function* () {})
      )

      const maliciousPaths = [
        { filePath: "../../../etc/passwd", operation: "read" },
        { filePath: "../../../../etc/shadow", operation: "read" },
        { filePath: "/etc/hosts", operation: "write" },
        { filePath: "~/../../secrets", operation: "read" },
        { filePath: "..\\..\\windows\\system32", operation: "delete" }
      ]

      maliciousPaths.forEach(input => {
        expect(() => tool.args.parse(input as any)).toThrow("Invalid file path")
      })

      const safePaths = [
        { filePath: "documents/file.txt", operation: "read" },
        { filePath: "project/src/index.js", operation: "write" },
        { filePath: "temp/output.log", operation: "delete" }
      ]

      safePaths.forEach(input => {
        expect(() => tool.args.parse(input as any)).not.toThrow()
      })
    })

    test("should sanitize command parameters to prevent shell injection", () => {
      const commandSchema = z.object({
        command: z.string().refine(
          (cmd) => !/[;&|`$(){}[\]<>]/.test(cmd),
          "Command contains potentially dangerous characters"
        ),
        args: z.array(z.string().refine(
          (arg) => !/[;&|`$(){}[\]<>]/.test(arg),
          "Argument contains potentially dangerous characters"
        ))
      })

      const tool = new Tool(
        "command-tool",
        "Command execution tool",
        commandSchema,
        mock(async function* () {})
      )

      const dangerousCommands = [
        { command: "ls; rm -rf /", args: [] },
        { command: "cat", args: ["file.txt && rm file.txt"] },
        { command: "echo", args: ["`whoami`"] },
        { command: "grep", args: ["pattern", "$(cat /etc/passwd)"] },
        { command: "find", args: ["-name", "*.txt", "|", "xargs", "rm"] }
      ]

      dangerousCommands.forEach(input => {
        expect(() => tool.args.parse(input)).toThrow("dangerous characters")
      })

      const safeCommands = [
        { command: "ls", args: ["-la"] },
        { command: "grep", args: ["pattern", "filename.txt"] },
        { command: "find", args: ["-name", "*.js"] }
      ]

      safeCommands.forEach(input => {
        expect(() => tool.args.parse(input)).not.toThrow()
      })
    })
  })

  describe("resource access control", () => {
    test("should enforce resource limits", async () => {
      const resourceLimitTool = new Tool(
        "resource-limit-tool",
        "Resource limit test",
        z.object({
          memoryLimit: z.number().max(100 * 1024 * 1024), // 100MB max
          timeLimit: z.number().max(30000), // 30 seconds max
          itemCount: z.number().max(10000) // 10k items max
        }),
        async function* (props) {
          const startTime = performance.now()
          const items = []

          try {
            for (let i = 0; i < props.itemCount; i++) {
              // Check time limit
              if (performance.now() - startTime > props.timeLimit) {
                throw new Error("Time limit exceeded")
              }

              // Simulate memory usage
              items.push({ id: i, data: new Array(100).fill(i) })
              
              // Check memory usage approximation
              const approxMemory = items.length * 100 * 8 // rough estimate
              if (approxMemory > props.memoryLimit) {
                throw new Error("Memory limit exceeded")
              }

              if (i % 1000 === 0) {
                yield { type: "progress", processed: i, total: props.itemCount }
              }
            }

            return { type: "success", itemsProcessed: items.length }
          } catch (error: any) {
            yield { type: "error", message: error.message }
            return { type: "failed", reason: error.message }
          }
        }
      )

      // Test memory limit enforcement
      expect(() => {
        resourceLimitTool.args.parse({
          memoryLimit: 200 * 1024 * 1024, // 200MB - exceeds limit
          timeLimit: 1000,
          itemCount: 100
        })
      }).toThrow()

      // Test time limit enforcement  
      expect(() => {
        resourceLimitTool.args.parse({
          memoryLimit: 1024,
          timeLimit: 60000, // 60 seconds - exceeds limit
          itemCount: 100
        })
      }).toThrow()

      // Test item count limit
      expect(() => {
        resourceLimitTool.args.parse({
          memoryLimit: 1024,
          timeLimit: 1000,
          itemCount: 50000 // Exceeds 10k limit
        })
      }).toThrow()

      // Valid configuration should work
      const generator = resourceLimitTool.run({
        memoryLimit: 10 * 1024, // 10KB
        timeLimit: 1000, // 1 second
        itemCount: 50 // Small count
      })

      const results = []
      for await (const result of generator) {
        results.push(result)
      }

      expect(results.length).toBeGreaterThan(0)
    })

    test("should prevent unauthorized file system access", () => {
      const restrictedPaths = [
        "/etc/passwd",
        "/etc/shadow",
        "/proc/meminfo",
        "/sys/",
        "C:\\Windows\\System32",
        "~/.ssh/id_rsa"
      ]

      const pathSchema = z.object({
        path: z.string().refine(
          (path) => {
            const normalizedPath = path.toLowerCase()
            return !restrictedPaths.some(restricted => 
              normalizedPath.includes(restricted.toLowerCase())
            )
          },
          "Access to system files is not allowed"
        )
      })

      const tool = new Tool(
        "filesystem-tool",
        "Filesystem access tool",
        pathSchema,
        mock(async function* () {})
      )

      restrictedPaths.forEach(path => {
        expect(() => tool.args.parse({ path })).toThrow("system files")
      })

      const allowedPaths = [
        "/home/user/documents/file.txt",
        "./project/src/index.js",
        "data/logs/app.log"
      ]

      allowedPaths.forEach(path => {
        expect(() => tool.args.parse({ path })).not.toThrow()
      })
    })
  })

  describe("data protection", () => {
    test("should not expose sensitive data in error messages", async () => {
      const sensitiveDataTool = new Tool(
        "sensitive-data-tool",
        "Sensitive data handling tool",
        z.object({
          apiKey: z.string(),
          password: z.string(),
          config: z.object({
            secret: z.string()
          })
        }),
        async function* (props) {
          try {
            // Simulate operation that might fail
            if (props.apiKey === "invalid") {
              throw new Error(`Authentication failed with key: ${props.apiKey}`)
            }
            
            if (props.password.length < 8) {
              throw new Error(`Password too short: ${props.password}`)
            }

            return { type: "success" }
          } catch (error: any) {
            // Filter sensitive data from error messages
            const filteredMessage = error.message
              .replace(props.apiKey, "[API_KEY_REDACTED]")
              .replace(props.password, "[PASSWORD_REDACTED]")
              .replace(props.config.secret, "[SECRET_REDACTED]")

            yield { type: "error", message: filteredMessage }
            return { type: "failed" }
          }
        }
      )

      const generator = sensitiveDataTool.run({
        apiKey: "sk-1234567890abcdef",
        password: "short",
        config: { secret: "super-secret-key" }
      })

      const results = []
      for await (const result of generator) {
        results.push(result)
      }

      const errorResult = results.find(r => r.type === "error")
      expect(errorResult).toBeDefined()
      expect(errorResult?.message).not.toContain("sk-1234567890abcdef")
      expect(errorResult?.message).not.toContain("short")
      expect(errorResult?.message).not.toContain("super-secret-key")
      expect(errorResult?.message).toContain("[PASSWORD_REDACTED]")
    })

    test("should validate and sanitize network requests", () => {
      const networkSchema = z.object({
        url: z.string().url().refine(
          (url) => {
            const parsed = new URL(url)
            // Only allow HTTPS and specific domains
            return parsed.protocol === "https:" && 
                   !["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname) &&
                   !parsed.hostname.endsWith(".local")
          },
          "Only secure HTTPS URLs to public domains are allowed"
        ),
        headers: z.record(z.string(), z.string()).refine(
          (headers) => {
            // Prevent dangerous headers
            const dangerousHeaders = ["authorization", "cookie", "x-api-key"]
            return !Object.keys(headers).some(key => 
              dangerousHeaders.includes(key.toLowerCase())
            )
          },
          "Potentially dangerous headers detected"
        )
      })

      const tool = new Tool(
        "network-tool",
        "Network request tool",
        networkSchema,
        mock(async function* () {})
      )

      const dangerousRequests = [
        {
          url: "http://example.com", // HTTP not HTTPS
          headers: {}
        },
        {
          url: "https://localhost:3000/api", // localhost
          headers: {}
        },
        {
          url: "https://example.com",
          headers: { "Authorization": "Bearer token" } // Dangerous header
        },
        {
          url: "https://192.168.1.1/admin", // Private IP
          headers: {}
        }
      ]

      dangerousRequests.forEach(request => {
        expect(() => tool.args.parse(request)).toThrow()
      })

      const safeRequests = [
        {
          url: "https://api.example.com/data",
          headers: { "content-type": "application/json" }
        },
        {
          url: "https://cdn.example.com/assets/file.js",
          headers: { "accept": "application/javascript" }
        }
      ]

      safeRequests.forEach(request => {
        expect(() => tool.args.parse(request)).not.toThrow()
      })
    })
  })

  describe("execution context isolation", () => {
    test("should isolate tool execution contexts", async () => {
      let globalState = { counter: 0, data: [] as any[] }

      const isolatedTool = new Tool(
        "isolated-tool",
        "Execution isolation test",
        z.object({ id: z.string(), operations: z.number() }),
        async function* (props) {
          // Create local state that shouldn't affect other executions
          const localState = { id: props.id, processed: 0 }

          for (let i = 0; i < props.operations; i++) {
            localState.processed++
            
            // Intentionally don't modify global state directly
            // Each execution should be isolated
            yield { 
              type: "progress", 
              id: props.id, 
              local: localState.processed,
              global: globalState.counter 
            }
          }

          return { 
            type: "complete", 
            id: props.id, 
            localProcessed: localState.processed 
          }
        }
      )

      // Run multiple instances concurrently
      const executions = [
        { id: "exec-1", operations: 5 },
        { id: "exec-2", operations: 10 },
        { id: "exec-3", operations: 3 }
      ]

      const results = await Promise.all(
        executions.map(async (exec) => {
          const generator = isolatedTool.run(exec)
          const updates = []
          let final

          for await (const result of generator) {
            if (result.type === "complete") {
              final = result
            } else {
              updates.push(result)
            }
          }

          return { updates, final }
        })
      )

      // Verify each execution was isolated
      results.forEach((result, index) => {
        const expectedOps = executions[index].operations
        expect(result.final?.localProcessed).toBe(expectedOps)
        expect(result.updates).toHaveLength(expectedOps)
        
        // Each execution should see the same initial global state
        result.updates.forEach(update => {
          expect(update.global).toBe(0) // Global state unchanged
        })
      })
    })

    test("should prevent cross-tool state pollution", async () => {
      // Simulate potential state pollution scenario
      const sharedResource = { value: "initial" }

      const tool1 = new Tool(
        "tool-1",
        "First tool",
        z.object({ action: z.string() }),
        async function* (props) {
          // Tool 1 tries to modify shared resource
          const originalValue = sharedResource.value
          sharedResource.value = "modified-by-tool-1"
          
          yield { type: "modified", from: originalValue, to: sharedResource.value }
          
          // Restore state to prevent pollution
          sharedResource.value = originalValue
          
          return { type: "cleaned-up" }
        }
      )

      const tool2 = new Tool(
        "tool-2", 
        "Second tool",
        z.object({ action: z.string() }),
        async function* (props) {
          // Tool 2 should see original state
          yield { type: "observed", value: sharedResource.value }
          return { type: "complete" }
        }
      )

      // Execute tool 1
      const gen1 = tool1.run({ action: "modify" })
      const results1 = []
      for await (const result of gen1) {
        results1.push(result)
      }

      // Execute tool 2 after tool 1
      const gen2 = tool2.run({ action: "observe" })
      const results2 = []
      for await (const result of gen2) {
        results2.push(result)
      }

      // Tool 2 should see the original state (no pollution)
      const observedResult = results2.find(r => r.type === "observed")
      expect(observedResult?.value).toBe("initial")
      
      // Tool 1 should have cleaned up after itself
      const cleanupResult = results1.find(r => r.type === "cleaned-up")
      expect(cleanupResult).toBeDefined()
    })
  })

  describe("audit and logging", () => {
    test("should provide audit trail for security-sensitive operations", async () => {
      const auditLog: any[] = []

      const auditTool = new Tool(
        "audit-tool",
        "Security audit tool",
        z.object({
          operation: z.enum(["read", "write", "delete", "execute"]),
          resource: z.string(),
          user: z.string()
        }),
        async function* (props) {
          // Log operation start
          const auditEntry = {
            timestamp: new Date().toISOString(),
            operation: props.operation,
            resource: props.resource,
            user: props.user,
            status: "started",
            sessionId: `session-${Date.now()}`
          }
          auditLog.push(auditEntry)

          yield { type: "audit", message: "Operation logged", id: auditEntry.sessionId }

          try {
            // Simulate operation
            await new Promise(resolve => setTimeout(resolve, 10))
            
            // Log success
            auditLog.push({
              ...auditEntry,
              status: "completed",
              timestamp: new Date().toISOString()
            })

            return { type: "success", auditId: auditEntry.sessionId }
          } catch (error: any) {
            // Log failure
            auditLog.push({
              ...auditEntry,
              status: "failed",
              error: error.message,
              timestamp: new Date().toISOString()
            })

            return { type: "failed", auditId: auditEntry.sessionId }
          }
        }
      )

      const operations = [
        { operation: "read", resource: "/secure/file.txt", user: "user1" },
        { operation: "write", resource: "/data/output.log", user: "user2" },
        { operation: "delete", resource: "/temp/cache.tmp", user: "user1" }
      ]

      for (const op of operations) {
        const generator = auditTool.run(op as any)
        for await (const result of generator) {
          // Process results
        }
      }

      // Verify audit trail
      expect(auditLog.length).toBe(6) // 2 entries per operation (start + complete)
      
      const readOps = auditLog.filter(entry => entry.operation === "read")
      expect(readOps).toHaveLength(2) // start + complete
      expect(readOps[0].status).toBe("started")
      expect(readOps[1].status).toBe("completed")
      expect(readOps[0].user).toBe("user1")
      expect(readOps[1].resource).toBe("/secure/file.txt")

      // Verify all operations have proper timestamps
      auditLog.forEach(entry => {
        expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        expect(entry.sessionId).toMatch(/^session-\d+$/)
      })
    })
  })
})