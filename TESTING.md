# SuperCode Testing Guide

> A comprehensive testing guide combining SuperCode-specific implementation with universal testing standards.

## 📑 Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [Directory Structure](#directory-structure)
3. [Test Categories](#test-categories)
4. [Writing Tests](#writing-tests)
5. [Running Tests](#running-tests)
6. [Test Metrics & Coverage](#test-metrics--coverage)
7. [Universal Testing Standard](#universal-testing-standard)
8. [Best Practices](#best-practices)
9. [Future Roadmap](#future-roadmap)

## 🎯 Overview & Philosophy

SuperCode follows a **hybrid testing approach** that combines:
- **Go conventions**: Test files (`*_test.go`) alongside source code
- **Universal standards**: Organized test data, results, and configuration

This approach ensures:
- ✅ Compliance with Go's testing expectations
- ✅ Consistency with cross-language testing standards
- ✅ Clear separation of test data from test logic
- ✅ Easy CI/CD integration

## 📁 Directory Structure

### Current Structure (Hybrid Approach)

```
SuperCode/
├── cmd/supercode/
│   ├── main.go
│   ├── main_test.go          # Unit tests (Go convention)
│   ├── init.go
│   ├── init_test.go          # Unit tests for init command
│   ├── detect.go
│   └── detect_test.go        # Unit tests for detect command
├── internal/analyzer/
│   ├── analyzer.go
│   ├── analyzer_test.go      # Unit tests (Go convention)
│   └── ...
├── testdata/                # Test fixtures (Universal standard)
│   ├── input/              # Input test data
│   │   ├── superclaude/    # Mock SuperClaude repo
│   │   └── opencode/       # Mock OpenCode repo
│   ├── expected/           # Expected outputs
│   │   ├── personas/       # Expected persona detections
│   │   └── commands/       # Expected command detections
│   └── mocks/              # Mock data and services
├── test-results/           # Test execution results (Universal standard)
│   ├── coverage/           # Coverage reports
│   │   ├── coverage.out    # Go coverage profile
│   │   └── coverage.html   # HTML coverage report
│   ├── reports/            # Test reports
│   │   └── test-report.json # JSON test results
│   ├── logs/               # Execution logs
│   │   └── test.log        # Test run logs
│   └── analysis/           # Analysis results
│       └── import-cycle-analysis.txt
└── .test/                  # Test configuration (Universal standard)
    ├── config/             # Test configurations
    │   └── test.yaml       # Test settings
    └── scripts/            # Test automation
        └── test.sh         # Standard test runner
```

### Standard vs Language-Specific

| Component | Universal Standard | Go Adaptation |
|-----------|-------------------|---------------|
| Test files | `tests/` directory | `*_test.go` with source |
| Test data | `testdata/` | ✅ Same |
| Results | `test-results/` | ✅ Same |
| Config | `.test/` | ✅ Same |

## 🧪 Test Categories

### 1. Unit Tests
- **Location**: `*_test.go` files alongside source code
- **Naming**: `TestFunctionName` for public functions
- **Coverage**: Individual functions and methods
- **Example**:
```go
// internal/analyzer/analyzer_test.go
func TestAnalyzeRepository(t *testing.T) {
    // Test implementation
}
```

### 2. Integration Tests
- **Location**: `tests/integration/` (when needed)
- **Purpose**: Test component interactions
- **Coverage**: Multiple packages working together
- **Status**: Not yet implemented

### 3. End-to-End Tests
- **Location**: `tests/e2e/` (when needed)
- **Purpose**: Complete workflow validation
- **Coverage**: Full user scenarios
- **Status**: Not yet implemented

### 4. Performance Tests
- **Location**: `*_bench_test.go` files
- **Naming**: `BenchmarkFunctionName`
- **Purpose**: Performance benchmarking
- **Example**:
```go
func BenchmarkAnalyzer(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Benchmark code
    }
}
```

## 📝 Writing Tests

### Unit Test Template
```go
package analyzer_test

import (
    "testing"
    "path/filepath"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    
    "github.com/yourusername/supercode/internal/analyzer"
)

func TestAnalyzeRepository(t *testing.T) {
    // Setup
    testRepo := filepath.Join("testdata", "input", "superclaude")
    expectedPath := filepath.Join("testdata", "expected", "analysis.json")
    
    // Execute
    a := analyzer.New()
    result, err := a.AnalyzeRepository(testRepo)
    
    // Assert
    require.NoError(t, err)
    assert.NotNil(t, result)
    assert.Equal(t, 9, len(result.Personas))
}
```

### Table-Driven Tests
```go
func TestCommandDetection(t *testing.T) {
    tests := []struct {
        name     string
        input    string
        expected []string
    }{
        {
            name:     "basic command",
            input:    "/help",
            expected: []string{"help"},
        },
        {
            name:     "command with args",
            input:    "/user:analyst mode",
            expected: []string{"user", "analyst"},
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := detectCommands(tt.input)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

### Using Test Fixtures
```go
func TestTransformation(t *testing.T) {
    // Load test data
    inputData := loadTestData(t, "input/personas.yaml")
    expectedData := loadTestData(t, "expected/personas-transformed.json")
    
    // Test transformation
    result := transformer.Transform(inputData)
    
    // Compare with expected
    assert.JSONEq(t, expectedData, result)
}

func loadTestData(t *testing.T, path string) string {
    t.Helper()
    data, err := os.ReadFile(filepath.Join("testdata", path))
    require.NoError(t, err)
    return string(data)
}
```

## 🚀 Running Tests

### Standard Test Runner (Recommended)
```bash
cd SuperCode/
./.test/scripts/test.sh
```

This script:
- ✅ Runs all tests with coverage
- ✅ Generates JSON report in `test-results/reports/`
- ✅ Creates HTML coverage in `test-results/coverage/`
- ✅ Saves logs in `test-results/logs/`
- ✅ Provides summary statistics

### Manual Commands

```bash
# Run all tests
go test ./...

# Run specific package
go test ./internal/analyzer/...

# Run with coverage
go test -coverprofile=test-results/coverage/coverage.out ./...
go tool cover -html=test-results/coverage/coverage.out

# Run with verbose output
go test -v ./...

# Run specific test
go test -run TestAnalyzeRepository ./internal/analyzer

# Run benchmarks
go test -bench=. ./...

# Run with race detector
go test -race ./...
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      - run: ./.test/scripts/test.sh
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## 📊 Test Metrics & Coverage

### Current Status
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Files | ~10 | 15+ | 🟨 |
| Test Coverage | ~80% | 90%+ | 🟨 |
| Pass Rate | 100% | 100% | ✅ |
| Benchmark Tests | 0 | 5+ | ❌ |

### Coverage by Package
| Package | Coverage | Status |
|---------|----------|--------|
| `analyzer` | High (85%+) | ✅ |
| `transformer` | Good (75%+) | 🟨 |
| `generator` | Good (70%+) | 🟨 |
| `builder` | Moderate (60%+) | 🟡 |
| `downloader` | Basic (40%+) | ❌ |

### Coverage Goals
- **Critical paths**: 95%+ coverage
- **Business logic**: 90%+ coverage
- **Utilities**: 80%+ coverage
- **Error handling**: 100% coverage

## 🌍 Universal Testing Standard

### Cross-Language Compatibility

The testing structure is designed to work across different programming languages:

| Language | Test Files | Test Data | Results | Config |
|----------|------------|-----------|---------|---------|
| Go | `*_test.go` with source | `testdata/` | `test-results/` | `.test/` |
| JavaScript | `tests/` directory | `testdata/` | `test-results/` | `.test/` |
| Python | `tests/` directory | `testdata/` | `test-results/` | `.test/` |
| Java | `src/test/` | `testdata/` | `test-results/` | `.test/` |

### Standard Benefits
1. **Consistency**: Same structure across projects
2. **Tooling**: Universal test runners and analyzers
3. **CI/CD**: Simplified pipeline configuration
4. **Onboarding**: Developers know where to find things
5. **Metrics**: Standardized reporting across languages

## ✅ Best Practices

### Do's
1. **Write tests first** (TDD) when adding new features
2. **Use table-driven tests** for multiple scenarios
3. **Keep tests focused** - one concept per test
4. **Use descriptive names** - `TestAnalyzer_WithEmptyRepo_ReturnsError`
5. **Clean up resources** - Use `t.Cleanup()` for cleanup
6. **Use test helpers** - Extract common setup code
7. **Mock external dependencies** - Don't rely on network/filesystem
8. **Document complex tests** - Add comments explaining why

### Don'ts
1. **Don't test private functions** - Test through public API
2. **Don't use hardcoded paths** - Use `filepath.Join()`
3. **Don't commit large fixtures** - Keep test data minimal
4. **Don't ignore flaky tests** - Fix or remove them
5. **Don't test implementation details** - Test behavior
6. **Don't share state between tests** - Each test should be independent

### Test Data Management
```go
// Good: Minimal, focused test data
testdata/
├── input/
│   └── minimal-persona.yaml (10 lines)
├── expected/
│   └── persona-output.json (15 lines)

// Bad: Large, unfocused test data
testdata/
├── full-superclaude-repo.zip (100MB)
├── entire-analysis-dump.json (10,000 lines)
```

## 🔮 Future Roadmap

### Phase 1: Foundation (Current)
- [x] Basic unit tests
- [x] Test data structure
- [ ] Coverage reporting
- [ ] CI/CD integration

### Phase 2: Enhancement (Next)
- [ ] Integration tests
- [ ] Benchmark tests
- [ ] Mutation testing
- [ ] Test documentation

### Phase 3: Advanced (Future)
- [ ] E2E test suite
- [ ] Performance regression tests
- [ ] Fuzz testing
- [ ] Property-based testing
- [ ] Visual regression tests (for UI components)

### Phase 4: Automation
- [ ] Automated test generation
- [ ] Coverage enforcement
- [ ] Performance budgets
- [ ] Continuous benchmarking

## 📚 Resources

### Testing Tools
- **testify**: Assertions and test suites
- **gomock**: Mocking framework
- **go-cmp**: Deep equality comparisons
- **httptest**: HTTP testing utilities

### Commands Reference
```bash
# Quick test commands
alias gt='go test ./...'
alias gtv='go test -v ./...'
alias gtc='go test -cover ./...'
alias gtr='go test -race ./...'
alias gtb='go test -bench=. ./...'
```

### Further Reading
- [Go Testing Documentation](https://golang.org/pkg/testing/)
- [Testify Framework](https://github.com/stretchr/testify)
- [Go Test Patterns](https://github.com/golang/go/wiki/TestComments)
- [Table Driven Tests](https://dave.cheney.net/2019/05/07/prefer-table-driven-tests)

---

*SuperCode Testing Guide v2.0 | Hybrid approach combining Go conventions with universal standards*