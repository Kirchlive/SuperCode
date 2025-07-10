package transformer

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
	"github.com/Kirchlive/SuperCode/internal/generator"
)

// CommandTransformer transforms SuperClaude commands to OpenCode commands
type CommandTransformer struct {
	generator *generator.Generator
}

// NewCommandTransformer creates a new command transformer
func NewCommandTransformer(gen *generator.Generator) *CommandTransformer {
	return &CommandTransformer{
		generator: gen,
	}
}

// Transform converts commands to OpenCode command configurations
func (t *CommandTransformer) Transform(commands []analyzer.Command, outputDir string) error {
	// Create commands directory
	commandsDir := filepath.Join(outputDir, "commands")
	if err := t.generator.EnsureDir(commandsDir); err != nil {
		return fmt.Errorf("failed to create commands directory: %w", err)
	}

	// Generate command index file
	indexContent := t.generateCommandIndex(commands)
	if err := t.generator.WriteFile(filepath.Join(commandsDir, "index.ts"), indexContent); err != nil {
		return fmt.Errorf("failed to write command index: %w", err)
	}

	// Generate individual command files
	for _, command := range commands {
		commandContent := t.generateCommandFile(command)
		filename := filepath.Join(commandsDir, command.Name+".ts")
		if err := t.generator.WriteFile(filename, commandContent); err != nil {
			return fmt.Errorf("failed to write command %s: %w", command.Name, err)
		}
	}

	// Generate configuration file
	configContent := t.generateConfig(commands)
	configPath := filepath.Join(outputDir, "config", "commands.json")
	if err := t.generator.WriteFile(configPath, configContent); err != nil {
		return fmt.Errorf("failed to write commands config: %w", err)
	}

	return nil
}

// generateCommandIndex generates the main command index file
func (t *CommandTransformer) generateCommandIndex(commands []analyzer.Command) string {
	var imports []string
	var exports []string

	for _, command := range commands {
		className := strings.Title(command.Name) + "Command"
		imports = append(imports, fmt.Sprintf(`import { %s } from "./%s";`, className, command.Name))
		exports = append(exports, fmt.Sprintf(`  "%s": %s,`, command.Name, className))
	}

	return fmt.Sprintf(`// Auto-generated SuperCode commands from SuperClaude

%s

export const commands = {
%s
};

export type CommandName = keyof typeof commands;

export function getCommand(name: CommandName) {
  return commands[name];
}

export function listCommands(): CommandName[] {
  return Object.keys(commands) as CommandName[];
}
`, strings.Join(imports, "\n"), strings.Join(exports, "\n"))
}

// generateCommandFile generates an individual command file
func (t *CommandTransformer) generateCommandFile(command analyzer.Command) string {
	// Generate flags interface
	var flagTypes []string
	var flagDefaults []string
	
	for name, flag := range command.Flags {
		flagType := "string"
		if flag.Type == "boolean" {
			flagType = "boolean"
		} else if flag.Type == "number" {
			flagType = "number"
		}
		
		flagTypes = append(flagTypes, fmt.Sprintf(`  %s?: %s;`, name, flagType))
		
		if flag.Default != "" {
			defaultValue := flag.Default
			if flag.Type == "string" {
				defaultValue = `"` + defaultValue + `"`
			}
			flagDefaults = append(flagDefaults, fmt.Sprintf(`    %s: %s,`, name, defaultValue))
		}
	}

	flagsInterface := "interface Flags {}"
	if len(flagTypes) > 0 {
		flagsInterface = fmt.Sprintf(`interface Flags {
%s
}`, strings.Join(flagTypes, "\n"))
	}

	flagsDefault := "{}"
	if len(flagDefaults) > 0 {
		flagsDefault = fmt.Sprintf(`{
%s
  }`, strings.Join(flagDefaults, "\n"))
	}

	// Generate examples
	var examples []string
	for _, example := range command.Examples {
		examples = append(examples, fmt.Sprintf(`  {
    command: "%s",
    description: "%s"
  }`, escapeString(example.Command), escapeString(example.Description)))
	}

	examplesArray := "[]"
	if len(examples) > 0 {
		examplesArray = fmt.Sprintf(`[
%s
]`, strings.Join(examples, ",\n"))
	}

	return fmt.Sprintf(`// %s Command - Auto-generated from SuperClaude

%s

export interface %sCommand {
  name: string;
  purpose: string;
  category: string;
  flags: Flags;
  defaultFlags: Flags;
  examples: Array<{
    command: string;
    description: string;
  }>;
  execute: (args: string[], flags: Flags) => Promise<void>;
}

export const %sCommand: %sCommand = {
  name: "%s",
  purpose: "%s",
  category: "%s",
  flags: {} as Flags,
  defaultFlags: %s,
  examples: %s,
  
  async execute(args: string[], flags: Flags) {
    // TODO: Implement command logic
    console.log("Executing %s with args:", args, "and flags:", flags);
  }
};
`,
		command.Name,
		flagsInterface,
		strings.Title(command.Name),
		strings.Title(command.Name),
		strings.Title(command.Name),
		command.Name,
		escapeString(command.Purpose),
		command.Category,
		flagsDefault,
		examplesArray,
		command.Name,
	)
}

// generateConfig generates the commands configuration file
func (t *CommandTransformer) generateConfig(commands []analyzer.Command) string {
	var commandConfigs []string
	
	for _, command := range commands {
		flagCount := len(command.Flags)
		commandConfigs = append(commandConfigs, fmt.Sprintf(`    {
      "name": "%s",
      "purpose": "%s",
      "category": "%s",
      "enabled": true,
      "flagCount": %d
    }`,
			command.Name,
			escapeString(command.Purpose),
			command.Category,
			flagCount,
		))
	}

	return fmt.Sprintf(`{
  "$schema": "https://opencode.dev/schemas/commands.json",
  "commands": [
%s
  ],
  "categories": [
    "Development",
    "Analysis", 
    "Operations",
    "Design",
    "Utility"
  ]
}`, strings.Join(commandConfigs, ",\n"))
}

// Helper function
func escapeString(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, `"`, `\"`)
	s = strings.ReplaceAll(s, "\n", "\\n")
	return s
}