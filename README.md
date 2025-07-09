# SuperCode

Automated merger tool that combines SuperClaude and OpenCode into a unified AI CLI.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Kirchlive/SuperCode.git
cd SuperCode

# Build
make build

# Run merge
./bin/supercode merge
```

## 📁 Project Structure

```
.
├── cmd/supercode/      # CLI entry point
├── internal/           # Private packages
├── pkg/               # Public packages
├── templates/         # Code templates
├── testdata/          # Test fixtures
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

- **Repository Management**: Downloads SuperClaude and OpenCode
- **Feature Detection**: Identifies all SuperClaude features
- **Code Generation**: Creates OpenCode-compatible implementations
- **Validation**: Ensures feature parity
- **Build System**: Produces ready-to-use SuperCode binary

## 📝 License

MIT License - see LICENSE file for details.