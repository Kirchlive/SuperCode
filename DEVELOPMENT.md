# SuperCode Development Guide

> **Current Status**: Nearly production ready with 100% test pass rate and ~80% coverage

This guide focuses on **developer-specific** topics for the SuperCode merger tool. For general project overview, see [README.md](README.md). For tool usage, see [SuperCode/README.md](SuperCode/README.md).

## 🚀 Quick Start

> For installation and basic usage, see [SuperCode/README.md](SuperCode/README.md#quick-start)

## 📁 Project Structure

> For SuperCode tool structure, see [SuperCode/README.md](SuperCode/README.md#project-structure)
> For overall project structure, see [README.md](README.md#repository-structure)

## 🧪 Testing During Development

> For comprehensive testing guide, see [TESTING.md](TESTING.md)

### Quick Test Commands
```bash
cd SuperCode/
make test              # Run all tests
go test -v ./...      # Verbose output
go test -cover ./...  # With coverage
```

### Current Test Status
- ✅ 100% test pass rate
- ✅ ~80% test coverage
- ✅ All packages have tests

## 🔧 Development Workflow

### 1. Feature Development
```bash
# Navigate to SuperCode directory
cd SuperCode/

# Create feature branch
git checkout -b feature/detector-personas

# Run tests continuously
make dev

# Format and lint
make fmt lint

# Commit with tests passing
git commit -m "feat: add persona detection"
```

### 2. Adding a New Feature Detector
```go
// internal/analyzer/example_detector.go
package analyzer

import (
    "path/filepath"
    "github.com/Kirchlive/SuperCode/internal/analyzer/types"
)

func (a *Analyzer) detectExampleFeatures(repoPath string) error {
    // Look for feature files
    examplePath := filepath.Join(repoPath, "examples")
    
    // Parse and add to results
    if exists(examplePath) {
        a.result.Examples = append(a.result.Examples, Example{
            Name: "example",
            Path: examplePath,
        })
    }
    
    return nil
}
```

### 3. Testing Your Feature
```go
// internal/analyzer/analyzer_test.go
func TestExampleDetection(t *testing.T) {
    // Create test directory structure
    testDir := t.TempDir()
    os.MkdirAll(filepath.Join(testDir, "examples"), 0755)
    
    // Run analyzer
    analyzer := NewAnalyzer()
    result, err := analyzer.AnalyzeRepository(testDir)
    
    assert.NoError(t, err)
    assert.Len(t, result.Examples, 1)
}
```

## 🏃 Running Locally

> For command usage, see [SuperCode/README.md](SuperCode/README.md#commands)

### Working with Test Data
```bash
# Navigate to SuperCode directory
cd SuperCode/

# Test data is already in testdata/ directory
# Contains sample SuperClaude and OpenCode structures

# Test detection with testdata
./bin/supercode detect testdata/superclaude

# Test with specific features
./bin/supercode detect testdata/superclaude --detailed
```

## 🐛 Debugging

### Enable Debug Logging
```bash
cd SuperCode/
export SUPERCODE_LOG_LEVEL=debug
./bin/supercode merge -v
```

### Run with Delve
```bash
cd SuperCode/

# Install delve
go install github.com/go-delve/delve/cmd/dlv@latest

# Debug
dlv debug ./cmd/supercode -- merge
```

### Common Issues and Solutions

1. **Import Cycle Errors** ✅ FIXED
   - Use interfaces package for shared types
   - Example: `internal/interfaces/generator.go`

2. **Test Failures**
   ```bash
   # Run failing test with verbose output
   go test -v -run TestName ./path/to/package
   
   # Check test data paths
   ls -la testdata/
   ```

3. **Build Errors**
   ```bash
   # Clean and rebuild
   make clean build
   
   # Update dependencies
   go mod tidy
   ```

4. **Binary Not Found**
   ```bash
   # Ensure binary is built
   make build
   # Binary will be in bin/supercode
   ```

## 📝 Code Style

### Naming Conventions
- Interfaces: `Detector`, `Generator`
- Implementations: `PersonaDetector`, `GoGenerator`
- Test files: `*_test.go`
- Mock files: `mock_*.go`

### Error Handling
```go
// Always wrap errors with context
if err != nil {
    return fmt.Errorf("detecting features: %w", err)
}
```

### Testing
```go
// Use table-driven tests
func TestDetector(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    []Feature
        wantErr bool
    }{
        // Test cases
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Test implementation
        })
    }
}
```

## 🔄 Continuous Integration

### Pre-commit Checks
```bash
cd SuperCode/

# Run before committing
make test
make fmt
make lint
```

### GitHub Actions
The CI pipeline runs:
1. Go fmt check
2. Go vet
3. Unit tests (all packages)
4. Build verification
5. Cross-platform builds

## 📚 Resources

- [Cobra Documentation](https://cobra.dev/)
- [Go-git Documentation](https://github.com/go-git/go-git)
- [Testify Documentation](https://github.com/stretchr/testify)

## 💡 Tips

1. **Start Small**: Implement one detector at a time
2. **Test First**: Write tests before implementation
3. **Mock External Dependencies**: Use interfaces for testability
4. **Document Complex Logic**: Add comments for future developers
5. **Use Make Commands**: They encapsulate best practices

---

Happy coding! 🚀