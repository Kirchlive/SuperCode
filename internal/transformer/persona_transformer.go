package transformer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
	"text/template"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
)

// PersonaTransformer transforms SuperClaude personas to OpenCode providers
type PersonaTransformer struct {
	templates *template.Template
}

// NewPersonaTransformer creates a new persona transformer
func NewPersonaTransformer() *PersonaTransformer {
	tmpl := template.Must(template.New("persona").Parse(personaProviderTemplate))
	return &PersonaTransformer{
		templates: tmpl,
	}
}

// Name returns the transformer name
func (t *PersonaTransformer) Name() string {
	return "persona"
}

// Transform converts personas to provider configurations
func (t *PersonaTransformer) Transform(input interface{}, ctx *TransformationContext) ([]TransformResult, error) {
	personas, ok := input.([]analyzer.Persona)
	if !ok {
		return nil, fmt.Errorf("expected []analyzer.Persona, got %T", input)
	}

	var results []TransformResult

	// Generate TypeScript provider file
	tsResult, err := t.generateTypeScriptProvider(personas)
	if err != nil {
		return nil, fmt.Errorf("generating TypeScript provider: %w", err)
	}
	results = append(results, tsResult)

	// Generate individual persona configs
	for _, persona := range personas {
		configResult, err := t.generatePersonaConfig(persona)
		if err != nil {
			return nil, fmt.Errorf("generating config for %s: %w", persona.Name, err)
		}
		results = append(results, configResult)
	}

	// Generate main configuration update
	configUpdate, err := t.generateConfigUpdate(personas)
	if err != nil {
		return nil, fmt.Errorf("generating config update: %w", err)
	}
	results = append(results, configUpdate)

	return results, nil
}

// generateTypeScriptProvider creates the main provider implementation
func (t *PersonaTransformer) generateTypeScriptProvider(personas []analyzer.Persona) (TransformResult, error) {
	var buf bytes.Buffer
	
	// Transform personas to include mapped values
	transformedPersonas := make([]map[string]interface{}, len(personas))
	for i, p := range personas {
		transformedPersonas[i] = map[string]interface{}{
			"Name":         p.Name,
			"Description":  p.Description,
			"SystemPrompt": t.adaptSystemPrompt(p.SystemPrompt),
			"Model":        t.mapModel(p.Model),
			"Temperature":  p.Temperature,
			"Tools":        t.mapTools(p.Tools),
		}
	}
	
	data := map[string]interface{}{
		"Personas": transformedPersonas,
		"Imports":  t.generateImports(),
	}

	if err := t.templates.Execute(&buf, data); err != nil {
		return TransformResult{}, err
	}

	return TransformResult{
		Type:    "typescript",
		Path:    "packages/opencode/src/provider/personas/index.ts",
		Content: buf.String(),
		Metadata: map[string]interface{}{
			"personas": len(personas),
		},
	}, nil
}

// generatePersonaConfig creates individual persona configuration
func (t *PersonaTransformer) generatePersonaConfig(persona analyzer.Persona) (TransformResult, error) {
	config := ProviderConfig{
		Name:         fmt.Sprintf("persona-%s", persona.Name),
		Type:         "personas",
		SystemPrompt: t.adaptSystemPrompt(persona.SystemPrompt),
		Model:        t.mapModel(persona.Model),
		Temperature:  persona.Temperature,
		Tools:        t.mapTools(persona.Tools),
		Config: map[string]string{
			"persona": persona.Name,
		},
	}

	content, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return TransformResult{}, err
	}

	return TransformResult{
		Type:    "json",
		Path:    fmt.Sprintf("configs/personas/%s.json", persona.Name),
		Content: string(content),
		Metadata: map[string]interface{}{
			"persona": persona.Name,
		},
	}, nil
}

// generateConfigUpdate creates the opencode.json update
func (t *PersonaTransformer) generateConfigUpdate(personas []analyzer.Persona) (TransformResult, error) {
	autoActivate := make(map[string]string)
	
	for _, persona := range personas {
		for _, pattern := range persona.AutoActivate {
			autoActivate[pattern] = persona.Name
		}
	}

	config := OpenCodeConfig{
		SuperCode: &SuperCodeSettings{
			Personas: PersonaSettings{
				Default:      "architect", // Default persona
				AutoActivate: autoActivate,
			},
		},
	}

	content, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return TransformResult{}, err
	}

	return TransformResult{
		Type:    "json",
		Path:    "opencode.supercode.json",
		Content: string(content),
		Metadata: map[string]interface{}{
			"merge": true, // Indicates this should be merged with existing config
		},
	}, nil
}

// adaptSystemPrompt adapts SuperClaude prompt to OpenCode format
func (t *PersonaTransformer) adaptSystemPrompt(prompt string) string {
	// Add OpenCode-specific prefix
	prefix := "As an OpenCode AI assistant with specialized expertise:\n\n"
	
	// Add tool usage suffix
	suffix := "\n\nUse available tools effectively to accomplish tasks."
	
	return prefix + strings.TrimSpace(prompt) + suffix
}

// mapModel converts SuperClaude model names to OpenCode model IDs
func (t *PersonaTransformer) mapModel(model string) string {
	modelMap := map[string]string{
		"claude-3-opus":   "claude-3-opus-20240229",
		"claude-3-sonnet": "claude-3-sonnet-20240229",
		"claude-3-haiku":  "claude-3-haiku-20240307",
	}
	
	if mapped, ok := modelMap[model]; ok {
		return mapped
	}
	return model
}

// mapTools converts SuperClaude tools to OpenCode tools
func (t *PersonaTransformer) mapTools(tools []string) []string {
	mapped := make([]string, 0, len(tools))
	
	toolMap := map[string]string{
		"sequential": "mcp-sequential",
		"research":   "mcp-context7",
		"diagram":    "mcp-diagram",
		"magic":      "mcp-magic",
		"browser":    "mcp-browser",
		"figma":      "mcp-figma",
	}
	
	for _, tool := range tools {
		if mappedTool, ok := toolMap[tool]; ok {
			mapped = append(mapped, mappedTool)
		} else {
			mapped = append(mapped, tool)
		}
	}
	
	return mapped
}

// generateImports generates necessary TypeScript imports
func (t *PersonaTransformer) generateImports() []string {
	return []string{
		"import { BaseProvider } from '../base';",
		"import { loadYaml } from '../../utils/yaml';",
		"import { PersonaConfig } from './types';",
	}
}

// Validate validates a transformation result
func (t *PersonaTransformer) Validate(result TransformResult) error {
	if result.Type == "typescript" {
		// TODO: Add TypeScript syntax validation
		if !strings.Contains(result.Content, "export class") {
			return fmt.Errorf("TypeScript file missing export class")
		}
	}
	
	if result.Type == "json" {
		// Validate JSON syntax
		var js json.RawMessage
		if err := json.Unmarshal([]byte(result.Content), &js); err != nil {
			return fmt.Errorf("invalid JSON: %w", err)
		}
	}
	
	return nil
}

// Template for TypeScript provider
const personaProviderTemplate = `{{range .Imports}}{{.}}
{{end}}

export interface PersonaDefinition {
  name: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  tools: string[];
}

export class PersonaProvider extends BaseProvider {
  private personas: Map<string, PersonaDefinition> = new Map([
{{range .Personas}}    ['{{.Name}}', {
      name: '{{.Name}}',
      systemPrompt: {{.SystemPrompt | printf "%q"}},
      model: '{{.Model}}',
      temperature: {{.Temperature}},
      tools: [{{range $i, $tool := .Tools}}{{if $i}}, {{end}}'{{$tool}}'{{end}}]
    }],
{{end}}  ]);

  constructor() {
    super('personas');
  }

  async activatePersona(name: string): Promise<void> {
    const persona = this.personas.get(name);
    if (!persona) {
      throw new Error(` + "`Unknown persona: ${name}`" + `);
    }

    await this.setSystemPrompt(persona.systemPrompt);
    await this.setModel(persona.model);
    await this.setTemperature(persona.temperature);
    await this.setTools(persona.tools);
    
    this.emit('persona-activated', { persona: name });
  }

  getAvailablePersonas(): string[] {
    return Array.from(this.personas.keys());
  }

  async autoActivate(filePath: string): Promise<string | null> {
    // Auto-activation logic based on file patterns
    const config = await this.getConfig();
    if (config.supercode?.personas?.autoActivate) {
      for (const [pattern, persona] of Object.entries(config.supercode.personas.autoActivate)) {
        if (this.matchPattern(filePath, pattern)) {
          await this.activatePersona(persona);
          return persona;
        }
      }
    }
    return null;
  }

  private matchPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regex = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(regex).test(filePath);
  }
}
`