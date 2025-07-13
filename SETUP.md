# SuperCode Setup Guide

[← Back to README](README.md) | [Technical Architecture →](ARCHITECTURE.md)

---

## 🚀 Quick Start

### Prerequisites
- Go 1.21+ installed
- Git configured with access to GitHub
- 4GB+ free disk space for repositories
- Basic command line knowledge

### Installation

```bash
# Clone SuperCode repository
git clone https://github.com/Kirchlive/SuperCode.git
cd SuperCode

# Install dependencies
go mod download

# Build the merger tool
go build -o supercode cmd/supercode/main.go

# Make it globally accessible (optional)
sudo mv supercode /usr/local/bin/
```

## ⚙️ Configuration

### 1. Initialize SuperCode

```bash
# Create configuration directory and files
supercode init

# This creates:
# - ~/.supercode/config.toml
# - ~/.supercode/templates/
# - ~/.supercode/output/
```

### 2. Configure Source Repositories

Edit `~/.supercode/config.toml`:

```toml
[sources]
superclaude = "https://github.com/NomenAK/SuperClaude.git"
opencode = "https://github.com/sst/opencode.git"

[merger]
output_dir = "./supercode-output"
backup_original = true
validation_level = "strict"

[features]
all = true  # Enable all features by default
```

### 3. Set Environment Variables (Optional)

```bash
# Add to ~/.bashrc or ~/.zshrc
export SUPERCODE_HOME="$HOME/.supercode"
export SUPERCODE_LOG_LEVEL="info"
```

## 🔧 Usage

### Basic Merge Process

```bash
# 1. Run the complete merge
supercode merge

# This will:
# - Download both repositories
# - Detect all SuperClaude features
# - Generate OpenCode-compatible code
# - Build the final SuperCode binary
```

### Step-by-Step Process

```bash
# Run individual steps for more control
supercode download    # Download repositories
supercode detect      # Detect features
supercode generate    # Generate code
supercode build       # Build SuperCode
```

### Advanced Options

```bash
# Merge specific features only
supercode merge --features personas,commands

# Skip certain features
supercode merge --skip ui-builder,puppeteer

# Use specific versions
supercode merge --superclaude-version v1.2.3 --opencode-version v2.0.0

# Preview what will be done
supercode merge --dry-run

# Verbose output for debugging
supercode merge --verbose
```

## 📁 Output Structure

After running the merge, you'll find:

```
supercode-output/
├── bin/
│   └── supercode          # The final executable
├── src/                   # Merged source code
├── configs/               # Generated configurations
├── docs/                  # Generated documentation
└── logs/                  # Merge process logs
```

## 🎯 Using SuperCode

Once the merge is complete:

```bash
# Navigate to output directory
cd supercode-output/bin/

# Run SuperCode
./supercode --help

# Use with personas
./supercode --persona architect

# Use commands
./supercode /user:build

# Enable compression
./supercode --uc
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Git Authentication Failures
```bash
# Test git access
git ls-remote https://github.com/NomenAK/SuperClaude.git

# Use SSH instead of HTTPS
supercode config set git.protocol ssh
```

#### 2. Feature Detection Issues
```bash
# Run detection with debug info
supercode detect --verbose --debug

# Check specific patterns
supercode detect --feature personas --verbose
```

#### 3. Build Failures
```bash
# Check Go environment
go version
go env

# Run build with verbose output
supercode build --verbose

# Try building manually
cd supercode-output/src
go build -o ../bin/supercode
```

### Manual Recovery

```bash
# Clean and retry
supercode clean
supercode merge

# Reset configuration
supercode reset --config
supercode init
```

## 🔐 Security Considerations

### Repository Access
- Ensure you have read access to both repositories
- Use SSH keys for private repositories
- Never commit tokens or credentials

### Code Validation
- Review generated code before building
- Run security scans on output
- Test in isolated environment first

## 📈 Performance Tips

### Faster Downloads
```bash
# Use shallow clones for faster downloads
supercode config set git.shallow true

# Limit clone depth
supercode config set git.depth 1
```

### Resource Management
```bash
# Limit parallel operations
supercode merge --parallel 2

# Use less memory
supercode merge --low-memory
```

## 📊 Validation

### Verify Merge Success

```bash
# Check merge report
cat ~/.supercode/logs/merge-report.txt

# Validate generated code
supercode validate

# Run tests
cd supercode-output
go test ./...
```

### Feature Verification

```bash
# List detected features
supercode list features

# Check specific feature
supercode check --feature personas
```

## 🎯 Next Steps

After successful merge:

1. **Test the binary**: Run various commands to ensure everything works
2. **Customize configuration**: Adjust settings in generated configs
3. **Set up aliases**: Create shortcuts for common operations
4. **Read documentation**: Check generated docs for all features

## 📚 Additional Resources

### Documentation
- Generated docs in `supercode-output/docs/`
- Original [SuperClaude docs](https://github.com/NomenAK/SuperClaude)
- Original [OpenCode docs](https://docs.sst.dev/opencode)

### Support
- Check logs in `~/.supercode/logs/`
- Use `--debug` flag for detailed output
- Report issues on GitHub

---

*For technical details about the merge process, see [ARCHITECTURE.md](ARCHITECTURE.md)*