package transformer

import (
	"fmt"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
	"github.com/Kirchlive/SuperCode/internal/generator"
	"github.com/Kirchlive/SuperCode/internal/interfaces"
)

// Transformer coordinates all transformation operations
type Transformer struct {
	generator          interfaces.Generator
	personaTransformer *PersonaTransformer
	commandTransformer *CommandTransformer
	mcpTransformer     *MCPTransformer
}

// NewTransformer creates a new transformer instance
func NewTransformer() *Transformer {
	gen := generator.New()
	return &Transformer{
		generator:          gen,
		personaTransformer: NewPersonaTransformer(gen),
		commandTransformer: NewCommandTransformer(gen),
		mcpTransformer:     NewMCPTransformer(gen),
	}
}

// Transform converts detection results to OpenCode format
func (t *Transformer) Transform(result *analyzer.DetectionResult, outputDir string) error {
	// Starting transformation

	// Transform personas
	if err := t.personaTransformer.Transform(result.Personas, outputDir); err != nil {
		return fmt.Errorf("failed to transform personas: %w", err)
	}

	// Transform commands
	if err := t.commandTransformer.Transform(result.Commands, outputDir); err != nil {
		return fmt.Errorf("failed to transform commands: %w", err)
	}

	// Transform MCP features
	if result.MCPFeature != nil {
		if err := t.mcpTransformer.Transform(result.MCPFeature, outputDir); err != nil {
			return fmt.Errorf("failed to transform MCP features: %w", err)
		}
	}

	// TODO: Transform compression features

	// Transformation completed successfully
	return nil
}

// GenerateSummary creates a summary of the transformation
func (t *Transformer) GenerateSummary(result *analyzer.DetectionResult, outputDir string) error {
	summary := fmt.Sprintf(`# SuperCode Transformation Summary

## Detected Features

### Personas (%d)
`, len(result.Personas))

	for _, p := range result.Personas {
		summary += fmt.Sprintf("- **%s**: %s\n", p.Name, p.Description)
	}

	summary += fmt.Sprintf(`
### Commands (%d)
`, len(result.Commands))

	for _, c := range result.Commands {
		summary += fmt.Sprintf("- **/%s**: %s\n", c.Name, c.Purpose)
	}

	if result.MCPFeature != nil {
		summary += fmt.Sprintf(`
### MCP Servers (%d)
`, len(result.MCPFeature.Servers))

		for name, server := range result.MCPFeature.Servers {
			summary += fmt.Sprintf("- **%s**: %s\n", name, server.Purpose)
		}
	}

	summary += `
## Output Structure

` + "```" + `
output/
├── agents/              # Transformed personas
├── commands/            # Custom commands
├── mcp-servers/         # MCP server implementations
├── config/              # Configuration files
└── docs/                # Documentation
` + "```" + `

## Next Steps

1. Copy the generated files to your OpenCode installation
2. Update your opencode.json with the MCP server configurations
3. Test the integrated features
4. Customize as needed
`

	return t.generator.WriteFile(fmt.Sprintf("%s/TRANSFORMATION_SUMMARY.md", outputDir), []byte(summary))
}