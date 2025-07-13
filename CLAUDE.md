# CLAUDE.md - SuperCode Project Configuration

This file provides guidance to Claude Code when working with the SuperCode merger tool.

## ⚠️ Project Rules

**Read all Project Rules files as next task after CLAUDE.md:**

2. Read("/Users/rob/Development/SuperCode-Project/README.md")
3. Read("/Users/rob/Development/SuperCode-Project/.codellm/rules/general_rules.mdc")

## Repository Overview

This is the **SuperCode merger repository** that combines SuperClaude and OpenCode features into a unified system.

- **Purpose**: One-time merge tool for feature detection, code generation, and integration
- **Technology**: Go-based merger with intelligent feature detection
- **Goal**: Create a unified SuperCode CLI with all SuperClaude features in OpenCode
- **GitHub Repository**: https://github.com/Kirchlive/SuperCode

## 📁 Project Structure

```
SuperCode-Project/
├── OpenCode/                   # GitHub Repo Clone https://github.com/sst/opencode
├── SuperClaude/                # GitHub Repo Clone https://github.com/NomenAK/SuperClaude
├── SuperCode/                  # GitHub Repository directory
│   ├── cmd/supercode/          # CLI implementation
│   ├── internal/               # Core logic
│   ├── Makefile                # Build automation
│   ├── go.mod                  # Go dependencies
│   └── README.md               # Repository README
└── Documentation/              # Project documentation
```

## 🗂️ Important Project Files

### Project Documentation
- 📄 **[README.md](README.md)** - Project overview and structure
- 📋 **[PLANNING.md](PLANNING.md)** - Consolidated roadmap, strategy, and next steps
- 🏗️ **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and technical details
- 🗺️ **[FEATURE-MAPPING.md](FEATURE-MAPPING.md)** - Feature detection and transformation rules
- 📊 **[STATUS.md](STATUS.md)** - Current implementation status and metrics
- 📝 **[CHANGELOG.md](CHANGELOG.md)** - Development history and updates
- ⚙️ **[SETUP.md](SETUP.md)** - Installation and usage guide
- 🔍 **[ANALYSIS.md](ANALYSIS.md)** - Repository analysis and findings
- 📊 **[DIAGRAM.md.mermaid](DIAGRAM.md.mermaid)** - Visual system architecture
- 📄 **[CONSOLIDATION.md](CONSOLIDATION.md)** - Documentation restructuring notes


### SuperCode Repository Files
- 💻 **[SuperCode/README.md](SuperCode/README.md)** - Repository README
- 🛠️ **[SuperCode/DEVELOPMENT.md](SuperCode/DEVELOPMENT.md)** - Developer guide
- 🔨 **[SuperCode/Makefile](SuperCode/Makefile)** - Build automation
- 📦 **[SuperCode/go.mod](SuperCode/go.mod)** - Go module definition
- 🚀 **[SuperCode/cmd/supercode/main.go](SuperCode/cmd/supercode/main.go)** - CLI entry point
- 🔒 **[SuperCode/.gitignore](SuperCode/.gitignore)** - Git ignore rules
- 🤖 **[SuperCode/.github/workflows/ci.yml](SuperCode/.github/workflows/ci.yml)** - CI/CD configuration

## Working with SuperCode

### For Development
1. Navigate to the repository: `cd SuperCode/`
2. **Modify detection patterns** in `merger/analyzer/` for new features
3. **Update templates** in `templates/` for code generation
4. **Add transformation rules** in `merger/transformer/`
5. **Test with dry-run** before actual merging

### For Usage
```bash
# Navigate to SuperCode directory
cd SuperCode/

# Initial setup
./supercode init

# Run the merge
./supercode merge

# Check merge results
./supercode status

# Use the generated SuperCode
cd supercode-output/bin/
./supercode --help
```

## Key Components

### Merger Tool Architecture
- **Downloader**: Fetches current versions of both repositories
- **Analyzer**: Feature detection from SuperClaude
- **Generator**: Code generation for OpenCode
- **Transformer**: Configuration conversion
- **Validator**: Testing and validation
- **Builder**: Final binary creation

### Detected Features
- **Personas**: 9 AI personalities → Agent configurations
- **Commands**: 18 slash commands → Custom commands
- **Compression**: Token reduction → Text preprocessor
- **Context7**: Documentation lookup → MCP server
- **UI Builder**: Component generation → Tool integration
- **Research**: Evidence-based mode → API integration

## Important Guidelines

### Detection Patterns
- Look for YAML files with persona definitions
- Scan for `/user:*` command patterns
- Parse `@include` directives in CLAUDE.md
- Identify MCP server configurations

### Generation Rules
- Use Go templates for code generation
- Maintain OpenCode's coding standards
- Preserve backward compatibility
- Include comprehensive tests

### Merge Process
- Downloads repositories once when executed
- Detects all features automatically
- Generates code based on templates
- Builds final SuperCode binary

## Quick Commands

```bash
# Development in SuperCode directory
cd SuperCode/
make setup          # Install dependencies
make test          # Run tests
make build         # Build binary
make dev           # Development mode with hot reload

# Documentation browsing
cd ..              # Back to SuperCode-Project
ls *.md            # View all documentation files
```

## Error Handling

When encountering issues:
1. Check `logs/` for detailed error messages
2. Use `--verbose` flag for debugging
3. Manual overrides available for specific features
4. Clean and retry if needed

## Performance Targets

- **Detection Rate**: >95% of features ✅ (Currently 100%)
- **Generation Success**: >90% automatic ✅ (Currently 100%)
- **Build Success**: >99% passing ⚠️ (Tests failing due to import cycle)
- **Merge Time**: <10 minutes typical ✅ (Currently <30s)

## Current Status (2025-07-10)

### ✅ Functional Completeness
- All major features implemented and working
- Detects 9 personas, 20 commands, 4 MCP servers
- Successful transformation to OpenCode format
- Binary builds successfully

### ⚠️ Technical Debt
- **Critical**: Import cycle blocking tests (17/23 failing)
- **High**: Low test coverage (17-38%)
- **Medium**: Missing `init` and `detect` commands
- **Medium**: TODOs in transformer code

### 📋 Next Steps (7-10 days to production)
1. **Day 1**: Fix import cycle (2-4 hours)
2. **Day 2**: Repair test suite (4-6 hours)
3. **Days 3-4**: Complete missing features
4. **Days 5-6**: Improve code quality
5. **Days 7-10**: Integration & performance

## Notes

- This is a one-time merge tool - run again for updates
- All generated code includes markers for tracking
- Some features may require manual fine-tuning
- German documentation may appear in upstream sources
- The actual development happens in the `SuperCode/` subdirectory
- **Important**: Fix import cycle before any other development work

## Reminder

**Important: High-level Priority Rules, must always be read next after reading CLAUDE.md!**
