# SuperCode Development Guide

## 🚀 Quick Start for Developers

```bash
# 1. Clone the repository
git clone https://github.com/Kirchlive/SuperCode.git
cd SuperCode

# 2. Install dependencies
make setup

# 3. Run tests to verify setup
make test

# 4. Build and run
make build
./bin/supercode --help
```

## 📁 Project Structure

```
.
├── cmd/supercode/          # CLI entry point
├── internal/               # Private packages
│   ├── cli/               # Command implementations
│   ├── downloader/        # Git repository management
│   ├── detector/          # Feature detection logic
│   ├── generator/         # Code generation
│   ├── transformer/       # Data transformation
│   └── builder/           # Build and packaging
├── pkg/                   # Public packages
├── templates/             # Code generation templates
├── testdata/              # Test fixtures
├── Makefile              # Build automation
└── go.mod                # Go module definition
```

## 🧪 Testing During Development

### Run Tests Continuously
```bash
# Watch mode - runs tests on file changes
make dev

# Run specific test suites
make test-unit        # Unit tests only
make test-integration # Integration tests
make test-e2e        # End-to-end tests
```

### Test Coverage
```bash
# Generate coverage report
make coverage
# Opens coverage.html in browser
```

## 🔧 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/detector-personas

# Run tests continuously
make dev

# Format and lint
make fmt lint

# Commit with tests passing
git commit -m "feat: add persona detection"
```

### 2. Adding a New Detector
```go
// internal/detector/example.go
type ExampleDetector struct{}

func (d *ExampleDetector) Name() string {
    return "example"
}

func (d *ExampleDetector) Detect(repo Repository) ([]Feature, error) {
    // Implementation
}

// Register in internal/detector/registry.go
func init() {
    Register(&ExampleDetector{})
}
```

### 3. Testing Your Detector
```go
// internal/detector/example_test.go
func TestExampleDetector(t *testing.T) {
    detector := &ExampleDetector{}
    repo := NewMockRepository(t)
    
    features, err := detector.Detect(repo)
    
    assert.NoError(t, err)
    assert.Len(t, features, 1)
}
```

## 🏃 Running Locally

### Basic Commands
```bash
# Initialize config
./bin/supercode init

# Run detection only
./bin/supercode detect --dry-run

# Full merge
./bin/supercode merge

# With verbose output
./bin/supercode merge -v
```

### Using Test Data
```bash
# Set up mock repositories
make mock-repos

# Test with mock data
./bin/supercode merge --repos testdata/
```

## 🐛 Debugging

### Enable Debug Logging
```bash
export SUPERCODE_LOG_LEVEL=debug
./bin/supercode merge -v
```

### Run with Delve
```bash
# Install delve
go install github.com/go-delve/delve/cmd/dlv@latest

# Debug
dlv debug ./cmd/supercode -- merge
```

### Common Issues

1. **Import Errors**
   ```bash
   go mod tidy
   go mod download
   ```

2. **Test Failures**
   ```bash
   # Run failing test with verbose output
   go test -v -run TestName ./path/to/package
   ```

3. **Build Errors**
   ```bash
   # Clean and rebuild
   make clean build
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
# Run before committing
make check
```

### GitHub Actions
The CI pipeline runs:
1. Linting
2. Unit tests
3. Integration tests
4. Build verification

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