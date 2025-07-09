package analyzer

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
	"regexp"
	"strings"
)

// CommandDetector detects slash commands from SuperClaude
type CommandDetector struct {
	commandPattern  *regexp.Regexp
	purposePattern  *regexp.Regexp
	categoryPattern *regexp.Regexp
	flagPattern     *regexp.Regexp
	examplePattern  *regexp.Regexp
}

// NewCommandDetector creates a new command detector
func NewCommandDetector() *CommandDetector {
	return &CommandDetector{
		commandPattern:  regexp.MustCompile(`/user:(\w+)`),
		purposePattern:  regexp.MustCompile(`Purpose:\s*"([^"]+)"`),
		categoryPattern: regexp.MustCompile(`Category:\s*(\w+)`),
		flagPattern:     regexp.MustCompile(`--(\w+)(?:\s*\[([^\]]+)\])?`),
		examplePattern:  regexp.MustCompile(`(?m)^-\s*\` + "`" + `([^` + "`" + `]+)\` + "`" + `\s*-\s*(.+)$`),
	}
}

// Detect finds all commands in the repository
func (d *CommandDetector) Detect(repoPath string) ([]Command, error) {
	var commands []Command

	// Look for command files
	commandsDir := filepath.Join(repoPath, ".claude", "commands")
	pattern := filepath.Join(commandsDir, "*.md")
	files, err := filepath.Glob(pattern)
	if err != nil {
		return nil, fmt.Errorf("finding command files: %w", err)
	}

	for _, file := range files {
		// Skip the shared directory
		if strings.Contains(file, "shared") {
			continue
		}

		cmd, err := d.parseCommandFile(file)
		if err != nil {
			fmt.Printf("Warning: failed to parse %s: %v\n", file, err)
			continue
		}

		commands = append(commands, cmd)
	}

	return commands, nil
}

// parseCommandFile parses a single command markdown file
func (d *CommandDetector) parseCommandFile(filePath string) (Command, error) {
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		return Command{}, fmt.Errorf("reading file: %w", err)
	}

	contentStr := string(content)
	cmd := Command{
		Content: contentStr,
		Flags:   make(map[string]Flag),
	}

	// Extract command name
	if matches := d.commandPattern.FindStringSubmatch(contentStr); matches != nil {
		cmd.Name = matches[1]
	} else {
		// Try to get from filename
		base := filepath.Base(filePath)
		cmd.Name = strings.TrimSuffix(base, ".md")
	}

	// Extract purpose
	if matches := d.purposePattern.FindStringSubmatch(contentStr); matches != nil {
		cmd.Purpose = matches[1]
	}

	// Extract category
	if matches := d.categoryPattern.FindStringSubmatch(contentStr); matches != nil {
		cmd.Category = strings.ToLower(matches[1])
	} else {
		cmd.Category = d.inferCategory(cmd.Name)
	}

	// Extract examples
	exampleMatches := d.examplePattern.FindAllStringSubmatch(contentStr, -1)
	for _, match := range exampleMatches {
		if len(match) >= 3 {
			cmd.Examples = append(cmd.Examples, Example{
				Command:     match[1],
				Description: match[2],
			})
		}
	}

	// Extract flags from examples and content
	d.extractFlags(&cmd, contentStr)

	return cmd, nil
}

// extractFlags extracts flag definitions from command content
func (d *CommandDetector) extractFlags(cmd *Command, content string) {
	// Find all flag mentions
	flagMatches := d.flagPattern.FindAllStringSubmatch(content, -1)
	
	for _, match := range flagMatches {
		flagName := match[1]
		
		// Skip if already exists
		if _, exists := cmd.Flags[flagName]; exists {
			continue
		}

		flag := Flag{
			Name: flagName,
			Type: "boolean", // Default type
		}

		// Try to infer description from context
		if len(match) > 2 && match[2] != "" {
			flag.Description = match[2]
		}

		// Special handling for known flag types
		switch flagName {
		case "framework", "model", "provider":
			flag.Type = "string"
		case "port", "timeout", "limit":
			flag.Type = "number"
		case "verbose", "debug", "watch":
			flag.Type = "boolean"
		}

		cmd.Flags[flagName] = flag
	}
}

// inferCategory tries to determine command category from name
func (d *CommandDetector) inferCategory(name string) string {
	switch {
	case strings.Contains(name, "build") || strings.Contains(name, "dev") || strings.Contains(name, "test"):
		return "development"
	case strings.Contains(name, "deploy") || strings.Contains(name, "migrate"):
		return "operations"
	case strings.Contains(name, "analyze") || strings.Contains(name, "review"):
		return "analysis"
	case strings.Contains(name, "design") || strings.Contains(name, "document"):
		return "design"
	default:
		return "general"
	}
}

// ValidateCommand checks if a command has required fields
func (d *CommandDetector) ValidateCommand(c Command) error {
	if c.Name == "" {
		return fmt.Errorf("command missing name")
	}
	if c.Purpose == "" {
		return fmt.Errorf("command %s missing purpose", c.Name)
	}
	if len(c.Examples) == 0 {
		return fmt.Errorf("command %s has no examples", c.Name)
	}
	return nil
}