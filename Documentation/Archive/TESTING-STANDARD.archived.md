# Universal Testing Standard for Repositories

## 🎯 Generalized Testing Structure

This standard can be applied to any repository, regardless of programming language.

### Standard Directory Structure
```
project-root/
├── src/                      # Source code
├── tests/                    # All test files
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── e2e/                # End-to-end tests
│   ├── performance/         # Performance/benchmark tests
│   └── fixtures/            # Test fixtures (alternative to testdata)
├── testdata/                # Test data and fixtures
│   ├── input/              # Input test data
│   ├── expected/           # Expected output data
│   ├── mocks/              # Mock data/services
│   └── snapshots/          # Test snapshots
├── test-results/           # Test execution results
│   ├── coverage/           # Coverage reports
│   ├── reports/            # Test reports (XML, HTML)
│   ├── logs/               # Test execution logs
│   └── analysis/           # Test analysis results
└── .test/                  # Test configuration
    ├── config/             # Test runner configurations
    └── scripts/            # Test automation scripts
```

## 🔄 Language-Specific Adaptations

### Go Projects (Current SuperCode)
```
SuperCode/
├── cmd/supercode/
│   ├── main.go
│   └── main_test.go         # Go convention: tests with code
├── internal/*/
│   └── *_test.go           # Go convention: tests with code
├── testdata/               # ✅ Follows standard
│   ├── analyzer/
│   ├── transformer/
│   └── analysis/
└── test-results/           # ❌ MISSING - Should add
    ├── coverage/
    └── reports/
```

### JavaScript/TypeScript Projects
```
project/
├── src/
├── tests/                  # Separate test directory
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── testdata/
└── test-results/
```

### Python Projects
```
project/
├── src/
├── tests/                  # Separate test directory
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── testdata/
└── test-results/
```

## 📋 Migration Plan for SuperCode

To align with the generalized standard while respecting Go conventions:

### 1. Keep Go Convention for Test Files
```bash
# Test files stay with source code (Go requirement)
cmd/supercode/main_test.go
internal/analyzer/analyzer_test.go
```

### 2. Add Missing Standard Directories
```bash
# Create test results directory
mkdir -p test-results/coverage
mkdir -p test-results/reports
mkdir -p test-results/logs
mkdir -p test-results/analysis

# Create test configuration
mkdir -p .test/config
mkdir -p .test/scripts
```

### 3. Reorganize testdata
```bash
testdata/
├── input/                  # Input test data
│   ├── superclaude/       # Mock SuperClaude repo
│   └── opencode/          # Mock OpenCode repo
├── expected/              # Expected outputs
│   ├── personas/
│   └── commands/
├── mocks/                 # Mock services/data
└── analysis/              # Analysis results
    └── import-cycle-analysis-resolved.txt
```

### 4. Update Test Scripts
```bash
# .test/scripts/run-all.sh
#!/bin/bash
go test -coverprofile=test-results/coverage/coverage.out ./...
go test -json ./... > test-results/reports/test-report.json
```

## 🔧 Benefits of Standard Structure

1. **Consistency**: Same structure across all projects
2. **Clarity**: Clear separation of concerns
3. **Automation**: Easy to set up CI/CD
4. **Portability**: Tools can work across languages
5. **Discoverability**: Developers know where to look

## 📊 Compliance Checklist

- [ ] `tests/` directory exists (or language-specific location)
- [ ] `testdata/` follows standard subdirectories
- [ ] `test-results/` captures all outputs
- [ ] `.test/` contains configuration
- [ ] README documents test structure
- [ ] CI/CD uses standard paths

## 🚀 Implementation Commands

```bash
# Create standard structure
mkdir -p test-results/{coverage,reports,logs,analysis}
mkdir -p .test/{config,scripts}

# Move existing analysis files
mv testdata/analysis/* test-results/analysis/

# Update .gitignore
echo "test-results/" >> .gitignore
echo ".test/scripts/*.log" >> .gitignore

# Create test runner script
cat > .test/scripts/test.sh << 'EOF'
#!/bin/bash
# Standard test runner
OUTPUT_DIR="test-results"
mkdir -p $OUTPUT_DIR/{coverage,reports,logs}

# Run tests with coverage
go test -coverprofile=$OUTPUT_DIR/coverage/coverage.out -json ./... \
  > $OUTPUT_DIR/reports/test-report.json 2> $OUTPUT_DIR/logs/test.log

# Generate HTML coverage
go tool cover -html=$OUTPUT_DIR/coverage/coverage.out \
  -o $OUTPUT_DIR/coverage/coverage.html

# Summary
echo "Tests completed. Results in $OUTPUT_DIR/"
EOF

chmod +x .test/scripts/test.sh
```

## 🎯 Final Structure for SuperCode

```
SuperCode/
├── *_test.go files         # Go convention (keep as is)
├── testdata/               # Reorganize to standard
│   ├── input/
│   ├── expected/
│   └── mocks/
├── test-results/           # Add for outputs
│   ├── coverage/
│   ├── reports/
│   └── logs/
└── .test/                  # Add for configuration
    ├── config/
    └── scripts/
```

This provides a generalized standard while respecting language-specific requirements!