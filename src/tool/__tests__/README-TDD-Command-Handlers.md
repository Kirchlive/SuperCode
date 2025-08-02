# TDD Test Suites for SuperClaude Command Handlers

This directory contains comprehensive Test-Driven Development (TDD) test suites for all SuperClaude command handlers. These tests are designed to validate command execution, tool integration, flag handling, persona integration, and error scenarios.

## Test Structure Overview

### Test Files

1. **`command-handlers-analysis.test.ts`** - Analysis commands (analyze, explain, review, audit)
2. **`command-handlers-modification.test.ts`** - Modification commands (implement, improve, refactor, fix)  
3. **`command-handlers-process.test.ts`** - Process commands (build, test, deploy, validate)
4. **`command-handlers-utility.test.ts`** - Utility commands (help, search, document, spawn)
5. **`command-handlers-integration.test.ts`** - Full integration tests with orchestrator

### Test Categories

Each command handler test file follows this structure:

#### 1. Parameter Validation Tests
- Required parameter validation
- Optional parameter handling
- Type validation
- Range validation
- Edge case handling

#### 2. Tool Integration Tests
- Glob pattern matching
- Grep content searching
- File reading operations
- File writing operations
- Multi-edit operations

#### 3. Flag Handling Tests
- Command-specific flags
- Universal flags
- Flag expansion
- Flag conflicts
- Flag dependencies
- Default value application

#### 4. Persona Integration Tests
- Persona detection and selection
- Persona-specific behavior
- System prompt application
- Enhanced outputs

#### 5. Success Scenarios
- Minimal configuration
- Full feature set
- Complex workflows
- Edge cases

#### 6. Error Conditions
- Invalid inputs
- Tool failures
- System errors
- Recovery scenarios

## Test Implementation Patterns

### Mock Structure

Each test file implements comprehensive mocks for:

```typescript
// Tool wrapper mocks
const mockToolWrappers = {
  glob: mock(async (pattern: string) => ({ files: [], count: 0 })),
  grep: mock(async (pattern: string) => ({ matches: [], count: 0 })),
  read: mock(async (filePath: string) => ({ content: "", size: 0 })),
  write: mock(async (filePath: string, content: string) => ({ written: true })),
  edit: mock(async (filePath: string, oldContent: string, newContent: string) => ({ edited: true })),
  multiEdit: mock(async (filePath: string, edits: any[]) => ({ edited: true, changes: edits.length }))
};

// Persona mocks
const mockPersonas: Record<string, Persona> = {
  analyzer: { id: "analyzer", name: "Code Analyzer", ... },
  developer: { id: "developer", name: "Software Developer", ... },
  // ... other personas
};
```

### Command Context Schema

Each command handler uses Zod schemas for validation:

```typescript
const commandSchema = z.object({
  command: z.literal("command-name"),
  target: z.string().optional(),
  args: z.array(z.string()).default([]),
  flags: z.object({
    // Command-specific flags
  }),
  persona: z.object({...}).optional(),
  sessionId: z.string().optional()
});
```

### Test Runner Pattern

Commands are implemented as async generators for streaming support:

```typescript
const commandRunner = mock(async function* (props: CommandContext) {
  // Step 1: Validation
  yield { type: "start", message: "Starting command..." };
  
  // Step 2: Parameter processing
  yield { type: "progress", message: "Processing...", step: 1, total: 5 };
  
  // Step 3: Tool integration
  const result = await mockToolWrappers.someOperation();
  
  // Step 4: Business logic
  yield { type: "update", message: "Executing logic..." };
  
  // Step 5: Return result
  return {
    type: "command-complete",
    result: { /* command-specific result */ },
    success: true
  };
});
```

## Command-Specific Test Details

### Analysis Commands (`command-handlers-analysis.test.ts`)

**Analyze Command Handler Tests:**
- ✅ Parameter validation (target requirement)
- ✅ Tool integration (glob, grep, read)
- ✅ Flag handling (focus areas, depth, patterns)
- ✅ Persona integration (security, architect, analyzer)
- ✅ Output handling (formats, file writing)
- ✅ Success scenarios (minimal, comprehensive)
- ✅ Error conditions (missing files, tool failures)

**Test Coverage:**
- File discovery and analysis
- Security vulnerability detection
- Pattern analysis
- Report generation
- Multi-format output

### Modification Commands (`command-handlers-modification.test.ts`)

**Implement Command Handler Tests:**
- ✅ TDD workflow integration
- ✅ File modification operations
- ✅ Test generation and execution
- ✅ Documentation generation
- ✅ Git integration (commit, status)
- ✅ Dry run mode
- ✅ Persona-guided implementation

**Test Coverage:**
- Test-first development
- Code modification with MultiEdit
- Test runner integration
- Git workflow automation
- Implementation type handling (feature, fix, refactor)

### Process Commands (`command-handlers-process.test.ts`)

**Build Command Handler Tests:**
- ✅ Build system detection
- ✅ Dependency checking
- ✅ Pre-build validation
- ✅ Build execution
- ✅ Test integration
- ✅ Watch mode
- ✅ CI/CD pipeline support

**Test Coverage:**
- Multi-build system support (npm, yarn, etc.)
- Quality gate enforcement
- Performance optimization
- Deployment preparation

### Utility Commands (`command-handlers-utility.test.ts`)

**Help Command Handler Tests:**
- ✅ General help display
- ✅ Command-specific help
- ✅ Quick start guide
- ✅ Command suggestions
- ✅ Persona-enhanced tips

**Search Command Handler Tests:**
- ✅ File and content searching
- ✅ Pattern matching (regex support)
- ✅ Result limiting and filtering
- ✅ Search optimization

**Document Command Handler Tests:**
- ✅ API documentation generation
- ✅ README management
- ✅ Multi-format output
- ✅ Template system

**Spawn Command Handler Tests:**
- ✅ Process spawning
- ✅ Service management
- ✅ Container orchestration
- ✅ Monitoring setup

### Integration Tests (`command-handlers-integration.test.ts`)

**Full Pipeline Integration:**
- ✅ Complete command execution flow
- ✅ Orchestrator integration
- ✅ Persona detection and application
- ✅ Flag resolution pipeline
- ✅ Error handling and recovery
- ✅ Progress reporting
- ✅ Session state management

## Running the Tests

### Individual Test Files

```bash
# Run analysis command tests
bun test src/tool/__tests__/command-handlers-analysis.test.ts

# Run modification command tests  
bun test src/tool/__tests__/command-handlers-modification.test.ts

# Run process command tests
bun test src/tool/__tests__/command-handlers-process.test.ts

# Run utility command tests
bun test src/tool/__tests__/command-handlers-utility.test.ts

# Run integration tests
bun test src/tool/__tests__/command-handlers-integration.test.ts
```

### All Command Handler Tests

```bash
# Run all command handler tests
bun test src/tool/__tests__/command-handlers-*.test.ts

# Run with coverage
bun test --coverage src/tool/__tests__/command-handlers-*.test.ts

# Run with verbose output
bun test --verbose src/tool/__tests__/command-handlers-*.test.ts
```

## Test Development Guidelines

### TDD Workflow

1. **Red Phase**: Write failing tests first
   ```typescript
   test("should validate required parameters", async () => {
     const invalidContext = { /* missing required fields */ };
     
     await expect(async () => {
       for await (const update of handler.run(invalidContext)) {
         // Should throw during validation
       }
     }).toThrow("Required parameter missing");
   });
   ```

2. **Green Phase**: Implement minimal code to pass
   ```typescript
   const handler = async function* (props) {
     if (!props.target) {
       throw new Error("Required parameter missing");
     }
     // ... rest of implementation
   };
   ```

3. **Refactor Phase**: Improve code while maintaining tests

### Mock Best Practices

1. **Reset mocks in beforeEach**:
   ```typescript
   beforeEach(() => {
     Object.values(mockToolWrappers).forEach(mock => mock.mockClear());
   });
   ```

2. **Use realistic mock data**:
   ```typescript
   mockToolWrappers.glob.mockResolvedValueOnce({
     files: ["src/utils.ts", "src/api.ts"],
     count: 2
   });
   ```

3. **Test both success and failure scenarios**:
   ```typescript
   // Success case
   mockToolWrappers.read.mockResolvedValueOnce({ content: "valid content" });
   
   // Failure case  
   mockToolWrappers.read.mockRejectedValueOnce(new Error("File not found"));
   ```

### Test Structure Standards

1. **Use descriptive test names**:
   ```typescript
   test("should validate required target parameter", async () => {
   test("should integrate with glob tool wrapper for file discovery", async () => {
   test("should apply security persona insights when security persona is used", async () => {
   ```

2. **Group related tests with describe blocks**:
   ```typescript
   describe("Parameter Validation", () => {
     test("should validate required parameters", () => {});
     test("should handle optional parameters", () => {});
   });
   ```

3. **Test one concept per test**:
   - Each test should focus on a single behavior
   - Use multiple tests for complex scenarios
   - Keep tests focused and readable

## Implementation Status

✅ **Completed:**
- Analysis command handlers (analyze, explain, review, audit)
- Modification command handlers (implement, improve, refactor, fix)
- Process command handlers (build, test, deploy, validate)
- Utility command handlers (help, search, document, spawn)
- Full integration tests with orchestrator
- Comprehensive mock systems
- Error handling and edge cases
- Persona integration testing
- Tool wrapper integration testing

## Next Steps

### Command Implementation
1. Implement actual command handlers based on test specifications
2. Integrate with existing tool wrappers
3. Add real persona system integration
4. Implement flag resolution system

### Test Enhancement
1. Add performance benchmarking tests
2. Add load testing for large codebases
3. Add security testing scenarios
4. Add accessibility testing for help system

### Documentation
1. Create implementation guides for each command
2. Document persona system integration
3. Create troubleshooting guides
4. Add examples and tutorials

## Architecture Integration

These tests are designed to integrate with:

- **Tool System**: `/src/tool/` - Core tool abstractions
- **Command Parser**: `/src/tool/command-parser.ts` - Command parsing logic
- **Flag Resolver**: `/src/tool/flag-resolver.ts` - Flag resolution and validation
- **Session Orchestrator**: `/src/session/orchestrator.ts` - Command execution orchestration
- **Persona System**: `/src/personas.json` - AI persona definitions

The tests provide comprehensive coverage for the entire command execution pipeline, ensuring reliable and predictable behavior across all SuperClaude commands.