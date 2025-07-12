# SuperCode

Automated merger tool that combines SuperClaude and OpenCode into a unified AI CLI.

## 🎉 Status: Nearly Production Ready

- ✅ **100% Feature Detection** - All personas, commands, and MCP servers detected
- ✅ **100% Test Pass Rate** - All tests passing with ~80% coverage
- ✅ **Full Command Set** - `init`, `detect`, and `merge` fully implemented
- ✅ **Import Cycle Fixed** - No more blocking issues
- 🚀 **6-9 days to production** - Minor features and optimization remaining

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Kirchlive/SuperCode.git
cd SuperCode

# Build
make build

# Initialize configuration
./bin/supercode init

# Detect features in a repository
./bin/supercode detect ../SuperClaude

# Run merge
./bin/supercode merge
```

## 📁 Project Structure

```
.
├── cmd/supercode/      # CLI entry point
│   ├── main.go        # Main application
│   ├── init.go        # Init command
│   └── detect.go      # Detect command
├── internal/           # Private packages
│   ├── analyzer/      # Feature detection
│   ├── builder/       # Build system
│   ├── downloader/    # Repository management
│   ├── generator/     # Code generation
│   ├── interfaces/    # Shared interfaces
│   └── transformer/   # Feature transformation
├── templates/         # Code templates
├── testdata/          # Test fixtures
├── bin/              # Compiled binaries
├── Makefile          # Build automation
└── go.mod            # Dependencies
```

## 🛠️ Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide.

### Quick Commands

```bash
make setup    # Install dependencies
make test     # Run tests
make build    # Build binary
make dev      # Development mode
```

## 📊 Features

- **Repository Management**: Downloads SuperClaude and OpenCode automatically
- **Feature Detection**: Identifies all SuperClaude features with 100% accuracy
  - 9 Personas (architect, frontend, backend, etc.)
  - 20 Commands (/analyze, /build, /cleanup, etc.)
  - 4 MCP Servers (Context7, Sequential, Magic, Puppeteer)
- **Code Generation**: Creates OpenCode-compatible TypeScript implementations
- **Validation**: Comprehensive test suite ensures feature parity
- **Build System**: Produces ready-to-use SuperCode binary

## 🔧 Commands

### `init`
Initialize SuperCode configuration and workspace.

```bash
./bin/supercode init [flags]
  --force    Overwrite existing configuration
  --show     Display configuration after creation
```

Creates `~/.supercode/` directory with:
- `config.yaml` - Main configuration file
- `workspace/` - Repository workspace
- `templates/` - Custom templates
- `logs/` - Log files

### `detect`
Analyze a repository to detect SuperClaude or OpenCode features.

```bash
./bin/supercode detect <path> [flags]
  -f, --format string   Output format: text, json, yaml (default "text")
  -d, --detailed        Show detailed information
  -o, --output string   Write output to file
```

Examples:
```bash
# Basic detection
./bin/supercode detect ../SuperClaude

# JSON output for automation
./bin/supercode detect ../SuperClaude -f json > features.json

# Detailed analysis
./bin/supercode detect ../SuperClaude --detailed
```

### `merge`
Merge SuperClaude and OpenCode into SuperCode.

```bash
./bin/supercode merge [flags]
  --dry-run          Preview without making changes
  --skip-build       Skip building the binary
  --skip-tests       Skip running tests
  --output string    Output directory (default "./supercode-output")
```

## 🚧 Remaining Work

1. **Compression Feature** - Transform UltraCompressed mode
2. **Code Cleanup** - Remove remaining TODOs
3. **Performance** - Add caching and concurrent processing
4. **Documentation** - Complete API documentation

## 📈 Metrics

- **Test Coverage**: ~80%
- **Test Pass Rate**: 100%
- **Feature Detection**: 100%
- **Build Time**: <30 seconds
- **Binary Size**: ~19MB

## 🔗 Related Projects

- [SuperClaude](https://github.com/NomenAK/SuperClaude) - Advanced AI development framework
- [OpenCode](https://github.com/sst/opencode) - Modern CLI development platform

## 📝 License

MIT License - see LICENSE file for details.