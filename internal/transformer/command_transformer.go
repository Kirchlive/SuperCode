package transformer

import (
	"bytes"
	"fmt"
	"strings"
	"text/template"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
)

// CommandTransformer transforms SuperClaude commands to Yargs commands
type CommandTransformer struct {
	templates *template.Template
}

// NewCommandTransformer creates a new command transformer
func NewCommandTransformer() *CommandTransformer {
	tmpl := template.Must(template.New("command").Funcs(template.FuncMap{
		"escapeBackticks": escapeBackticks,
		"formatExample":   formatExample,
		"title":           strings.Title,
	}).Parse(commandTemplate))
	
	return &CommandTransformer{
		templates: tmpl,
	}
}

// Name returns the transformer name
func (t *CommandTransformer) Name() string {
	return "command"
}

// Transform converts commands to Yargs command files
func (t *CommandTransformer) Transform(input interface{}, ctx *TransformationContext) ([]TransformResult, error) {
	commands, ok := input.([]analyzer.Command)
	if !ok {
		return nil, fmt.Errorf("expected []analyzer.Command, got %T", input)
	}

	var results []TransformResult

	// Generate individual command files
	for _, cmd := range commands {
		result, err := t.generateCommand(cmd)
		if err != nil {
			return nil, fmt.Errorf("generating command %s: %w", cmd.Name, err)
		}
		results = append(results, result)
	}

	// Generate command index file
	indexResult, err := t.generateCommandIndex(commands)
	if err != nil {
		return nil, fmt.Errorf("generating command index: %w", err)
	}
	results = append(results, indexResult)

	// Generate universal flags mixin
	flagsResult, err := t.generateUniversalFlags()
	if err != nil {
		return nil, fmt.Errorf("generating universal flags: %w", err)
	}
	results = append(results, flagsResult)

	return results, nil
}

// generateCommand creates a single Yargs command file
func (t *CommandTransformer) generateCommand(cmd analyzer.Command) (TransformResult, error) {
	yargsCmd := t.convertToYargsCommand(cmd)
	
	var buf bytes.Buffer
	data := map[string]interface{}{
		"Command":     yargsCmd,
		"OriginalCmd": cmd,
		"Imports":     t.generateCommandImports(cmd),
	}

	if err := t.templates.Execute(&buf, data); err != nil {
		return TransformResult{}, err
	}

	return TransformResult{
		Type:    "typescript",
		Path:    fmt.Sprintf("packages/opencode/src/cli/cmd/sc-%s.ts", cmd.Name),
		Content: buf.String(),
		Metadata: map[string]interface{}{
			"command": cmd.Name,
			"flags":   len(cmd.Flags),
		},
	}, nil
}

// convertToYargsCommand converts analyzer.Command to YargsCommand
func (t *CommandTransformer) convertToYargsCommand(cmd analyzer.Command) YargsCommand {
	yargs := YargsCommand{
		Name:        fmt.Sprintf("sc-%s", cmd.Name),
		Description: cmd.Purpose,
		Category:    cmd.Category,
		Flags:       make(map[string]YargsFlag),
		Examples:    []string{},
	}

	// Set aliases based on command name
	switch cmd.Name {
	case "build":
		yargs.Aliases = []string{"b", "construct"}
	case "test":
		yargs.Aliases = []string{"t"}
	case "deploy":
		yargs.Aliases = []string{"d"}
	}

	// Convert flags
	for name, flag := range cmd.Flags {
		yargsFlag := YargsFlag{
			Type:        t.mapFlagType(flag.Type),
			Description: flag.Description,
		}

		// Set defaults for known flags
		switch name {
		case "typescript":
			yargsFlag.Default = true
		case "verbose", "debug":
			yargsFlag.Default = false
		case "framework":
			yargsFlag.Choices = []string{"react", "vue", "angular", "next", "nuxt"}
		}

		if flag.Default != "" {
			yargsFlag.Default = flag.Default
		}
		if len(flag.Choices) > 0 {
			yargsFlag.Choices = flag.Choices
		}

		yargs.Flags[name] = yargsFlag
	}

	// Convert examples
	for _, ex := range cmd.Examples {
		// Transform SuperClaude command to OpenCode command
		example := strings.Replace(ex.Command, fmt.Sprintf("/%s", cmd.Name), fmt.Sprintf("opencode sc-%s", cmd.Name), 1)
		yargs.Examples = append(yargs.Examples, example)
	}

	return yargs
}

// mapFlagType maps SuperClaude flag types to Yargs types
func (t *CommandTransformer) mapFlagType(flagType string) string {
	switch flagType {
	case "bool", "boolean":
		return "boolean"
	case "int", "number":
		return "number"
	case "array":
		return "array"
	default:
		return "string"
	}
}

// generateCommandIndex creates an index file for all commands
func (t *CommandTransformer) generateCommandIndex(commands []analyzer.Command) (TransformResult, error) {
	var imports []string
	var exports []string

	for _, cmd := range commands {
		cmdName := fmt.Sprintf("sc-%s", cmd.Name)
		varName := strings.ReplaceAll(cmdName, "-", "_")
		
		imports = append(imports, fmt.Sprintf("import %s from './%s';", varName, cmdName))
		exports = append(exports, fmt.Sprintf("  '%s': %s,", cmdName, varName))
	}

	content := fmt.Sprintf(`// Auto-generated SuperCode command index
%s

export const superCodeCommands = {
%s
};

export function registerSuperCodeCommands(yargs: any): void {
  Object.entries(superCodeCommands).forEach(([name, command]) => {
    yargs.command(command);
  });
}
`, strings.Join(imports, "\n"), strings.Join(exports, "\n"))

	return TransformResult{
		Type:    "typescript",
		Path:    "packages/opencode/src/cli/cmd/supercode-index.ts",
		Content: content,
		Metadata: map[string]interface{}{
			"commands": len(commands),
		},
	}, nil
}

// generateUniversalFlags creates the universal flags mixin
func (t *CommandTransformer) generateUniversalFlags() (TransformResult, error) {
	content := universalFlagsTemplate
	
	return TransformResult{
		Type:    "typescript",
		Path:    "packages/opencode/src/cli/flags/universal.ts",
		Content: content,
	}, nil
}

// generateCommandImports generates imports for a command
func (t *CommandTransformer) generateCommandImports(cmd analyzer.Command) []string {
	imports := []string{
		"import { Arguments } from 'yargs';",
		"import { defineCommand } from '../command';",
		"import { inheritUniversalFlags } from '../flags/universal';",
	}

	// Add specific imports based on command features
	if strings.Contains(cmd.Content, "persona") {
		imports = append(imports, "import { activatePersona } from '../../provider/personas';")
	}

	return imports
}

// Validate validates a transformation result
func (t *CommandTransformer) Validate(result TransformResult) error {
	if result.Type != "typescript" {
		return nil
	}

	// Basic TypeScript validation
	if !strings.Contains(result.Content, "export default") {
		return fmt.Errorf("missing export default")
	}

	return nil
}

// Helper functions
func escapeBackticks(s string) string {
	return strings.ReplaceAll(s, "`", "\\`")
}

func formatExample(example string) string {
	return strings.TrimSpace(example)
}

// Template for Yargs command
const commandTemplate = `{{range .Imports}}{{.}}
{{end}}

export default defineCommand({
  command: '{{.Command.Name}}',
  {{if .Command.Aliases}}aliases: [{{range $i, $a := .Command.Aliases}}{{if $i}}, {{end}}'{{$a}}'{{end}}],{{end}}
  describe: '{{.Command.Description}}',
  
  builder: (yargs) => {
    return yargs
{{range $name, $flag := .Command.Flags}}      .option('{{$name}}', {
        type: '{{$flag.Type}}',
        description: '{{$flag.Description}}',
        {{if $flag.Default}}default: {{$flag.Default}},{{end}}
        {{if $flag.Choices}}choices: [{{range $i, $c := $flag.Choices}}{{if $i}}, {{end}}'{{$c}}'{{end}}],{{end}}
      })
{{end}}      .options(inheritUniversalFlags())
      .example([
{{range .Command.Examples}}        ['{{formatExample .}}', ''],
{{end}}      ]);
  },
  
  handler: async (argv: Arguments) => {
    const { _, $0, ...flags } = argv;
    
    // Handle persona activation
    if (flags.persona) {
      await activatePersona(flags.persona as string);
    }
    
    // Handle thinking modes
    const thinkingLevel = flags.ultrathink ? 3 : flags['think-hard'] ? 2 : flags.think ? 1 : 0;
    
    // Execute command logic
    await executeCommand{{.OriginalCmd.Name | title}}(argv._, flags, thinkingLevel);
  }
});

async function executeCommand{{.OriginalCmd.Name | title}}(args: string[], flags: any, thinkingLevel: number): Promise<void> {
  // TODO: Implement {{.OriginalCmd.Name}} command logic
  console.log('Executing SuperCode {{.OriginalCmd.Name}} command');
  console.log('Args:', args);
  console.log('Flags:', flags);
  console.log('Thinking level:', thinkingLevel);
}
`

// Universal flags template
const universalFlagsTemplate = `// SuperCode Universal Flags
export interface UniversalFlags {
  // Thinking modes
  think?: boolean;
  'think-hard'?: boolean;
  ultrathink?: boolean;
  
  // Compression
  uc?: boolean;
  
  // MCP control
  c7?: boolean;
  seq?: boolean;
  magic?: boolean;
  pup?: boolean;
  'all-mcp'?: boolean;
  'no-mcp'?: boolean;
  
  // Personas
  'persona-architect'?: boolean;
  'persona-frontend'?: boolean;
  'persona-backend'?: boolean;
  'persona-analyzer'?: boolean;
  'persona-security'?: boolean;
  'persona-mentor'?: boolean;
  'persona-refactorer'?: boolean;
  'persona-performance'?: boolean;
  'persona-qa'?: boolean;
  persona?: string;
  
  // Introspection
  introspect?: boolean;
}

export function inheritUniversalFlags(): Record<string, any> {
  return {
    // Thinking modes
    'think': {
      type: 'boolean',
      description: 'Enable thoughtful analysis',
    },
    'think-hard': {
      type: 'boolean',
      description: 'Deep analysis mode',
    },
    'ultrathink': {
      type: 'boolean',
      description: 'Maximum analysis depth',
    },
    
    // Compression
    'uc': {
      type: 'boolean',
      description: 'UltraCompressed mode (70% token reduction)',
    },
    
    // MCP control
    'c7': {
      type: 'boolean',
      description: 'Enable Context7 documentation lookup',
    },
    'seq': {
      type: 'boolean',
      description: 'Enable Sequential reasoning',
    },
    'magic': {
      type: 'boolean',
      description: 'Enable Magic UI generation',
    },
    'pup': {
      type: 'boolean',
      description: 'Enable Puppeteer browser automation',
    },
    'all-mcp': {
      type: 'boolean',
      description: 'Enable all MCP servers',
    },
    'no-mcp': {
      type: 'boolean',
      description: 'Disable all MCP servers',
    },
    
    // Persona selection
    'persona': {
      type: 'string',
      description: 'Activate specific persona',
      choices: ['architect', 'frontend', 'backend', 'analyzer', 'security', 'mentor', 'refactorer', 'performance', 'qa'],
    },
    
    // Introspection
    'introspect': {
      type: 'boolean',
      description: 'Show reasoning process',
    },
  };
}

// Helper to extract persona from flags
export function getActivePersona(flags: UniversalFlags): string | null {
  if (flags.persona) return flags.persona;
  
  const personaFlags = [
    'persona-architect', 'persona-frontend', 'persona-backend',
    'persona-analyzer', 'persona-security', 'persona-mentor',
    'persona-refactorer', 'persona-performance', 'persona-qa'
  ];
  
  for (const flag of personaFlags) {
    if (flags[flag as keyof UniversalFlags]) {
      return flag.replace('persona-', '');
    }
  }
  
  return null;
}
`