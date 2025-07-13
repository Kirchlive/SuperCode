# SuperCode `docs` Command

## Overview

The `docs` command provides a comprehensive documentation status report for the SuperCode project, helping maintain documentation quality and completeness.

## Usage

```bash
# Basic documentation check
supercode docs

# Verbose output showing all files
supercode docs --verbose
supercode docs -v

# Different output formats
supercode docs --format json
supercode docs --format yaml
supercode docs -f json
```

## Features

### Documentation Completeness Check
- Checks 16 required documentation files
- Reports missing files
- Identifies outdated documentation
- Calculates completion percentage

### Status Categories
- ✅ **Current** - Modified today
- 🟢 **Recent** - Modified within 3 days
- 🟡 **Week old** - Modified within 7 days
- 🟠 **Outdated** - Modified within 30 days
- 🔴 **Very outdated** - Older than 30 days
- ❌ **Missing** - File not found

### Required Documentation Files

#### Project Root
- README.md
- PLANNING.md
- ARCHITECTURE.md
- STATUS.md
- CHANGELOG.md
- SETUP.md
- FEATURE-MAPPING.md
- TECHNICAL_DEBT.md
- PERFORMANCE.md
- CLAUDE.md

#### SuperCode Directory
- SuperCode/README.md
- SuperCode/DEVELOPMENT.md

#### Rules Directory
- .codellm/rules/general_rules.mdc
- .codellm/rules/docu_use_rules.mdc
- .codellm/rules/compression_rules.mdc
- .codellm/rules/compact_rules.mdc

## Output Formats

### Text Format (Default)
```
📚 Documentation Status Report
==================================================

📊 Summary:
  Total Files:      16
  Existing:         14 (87.5%)
  Missing:          2
  Outdated (>7d):   3
  Last Update:      2025-07-12

  Completion: ████████░░ 87.5%

📄 File Status:

❌ Missing:
  - TECHNICAL_DEBT.md
  - PERFORMANCE.md

🟠 Outdated:
  - ARCHITECTURE.md                         (15 days old, 12.3 KB)

💡 Recommendations:
  - Create 2 missing documentation files
  - Update 3 outdated files (>7 days old)
```

### JSON Format
```json
{
  "total_files": 16,
  "existing_files": 14,
  "missing_files": 2,
  "outdated_files": 3,
  "completion_rate": 87.5,
  "last_full_update": "2025-07-12T10:30:00Z",
  "files": [
    {
      "file": "README.md",
      "exists": true,
      "last_modified": "2025-07-12T10:30:00Z",
      "days_since_update": 0,
      "size_bytes": 4567,
      "status": "✅ Current"
    }
  ]
}
```

### YAML Format
```yaml
total_files: 16
existing_files: 14
missing_files: 2
outdated_files: 3
completion_rate: 87.5
last_full_update: 2025-07-12T10:30:00Z
files:
  - file: README.md
    exists: true
    last_modified: 2025-07-12T10:30:00Z
    days_since_update: 0
    size_bytes: 4567
    status: ✅ Current
```

## Command Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| --verbose | -v | Show all files, not just problems | false |
| --format | -f | Output format (text, json, yaml) | text |

## Use Cases

### Daily Documentation Check
```bash
# Quick check for missing or outdated docs
supercode docs
```

### CI/CD Integration
```bash
# Get JSON output for automated processing
supercode docs --format json | jq '.completion_rate'

# Fail if documentation is incomplete
if [ $(supercode docs -f json | jq '.missing_files') -gt 0 ]; then
  echo "Documentation incomplete!"
  exit 1
fi
```

### Documentation Audit
```bash
# Full verbose output for documentation review
supercode docs --verbose
```

### Monitoring Script
```bash
#!/bin/bash
# Check documentation status and alert if needed

MISSING=$(supercode docs -f json | jq '.missing_files')
OUTDATED=$(supercode docs -f json | jq '.outdated_files')

if [ $MISSING -gt 0 ] || [ $OUTDATED -gt 5 ]; then
  echo "Documentation needs attention!"
  echo "Missing: $MISSING files"
  echo "Outdated: $OUTDATED files"
  supercode docs
fi
```

## Integration with Development Workflow

1. **Pre-commit Hook**: Check documentation before commits
2. **CI Pipeline**: Ensure documentation stays current
3. **Release Process**: Verify all docs are up-to-date
4. **Sprint Planning**: Review outdated documentation

## Best Practices

1. Run `supercode docs` before releases
2. Keep documentation updated within 7 days
3. Address missing files immediately
4. Use verbose mode for detailed reviews
5. Integrate with CI/CD for automated checks

## Future Enhancements

- [ ] Custom documentation file lists
- [ ] Documentation quality metrics
- [ ] Markdown linting integration
- [ ] Auto-generation of missing files
- [ ] Documentation coverage reports
- [ ] Link validation
- [ ] Content freshness analysis