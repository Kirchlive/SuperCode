package transformer

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
	"github.com/Kirchlive/SuperCode/internal/interfaces"
)

// PersonaTransformer transforms SuperClaude personas to OpenCode agents
type PersonaTransformer struct {
	generator interfaces.Generator
}

// NewPersonaTransformer creates a new persona transformer
func NewPersonaTransformer(gen interfaces.Generator) *PersonaTransformer {
	return &PersonaTransformer{
		generator: gen,
	}
}

// Transform converts personas to OpenCode agent configurations
func (t *PersonaTransformer) Transform(personas []analyzer.Persona, outputDir string) error {
	// Create agents directory
	agentsDir := filepath.Join(outputDir, "agents")
	if err := t.generator.EnsureDir(agentsDir); err != nil {
		return fmt.Errorf("failed to create agents directory: %w", err)
	}

	// Generate provider index file
	providerContent := t.generateProviderIndex(personas)
	if err := t.generator.WriteFile(filepath.Join(agentsDir, "index.ts"), []byte(providerContent)); err != nil {
		return fmt.Errorf("failed to write provider index: %w", err)
	}

	// Generate individual persona files
	for _, persona := range personas {
		personaContent := t.generatePersonaFile(persona)
		filename := filepath.Join(agentsDir, strings.ToLower(persona.Name)+".ts")
		if err := t.generator.WriteFile(filename, []byte(personaContent)); err != nil {
			return fmt.Errorf("failed to write persona %s: %w", persona.Name, err)
		}
	}

	// Generate configuration file
	configContent := t.generateConfig(personas)
	configPath := filepath.Join(outputDir, "config", "agents.json")
	if err := t.generator.WriteFile(configPath, []byte(configContent)); err != nil {
		return fmt.Errorf("failed to write agents config: %w", err)
	}

	return nil
}

// generateProviderIndex generates the main provider index file
func (t *PersonaTransformer) generateProviderIndex(personas []analyzer.Persona) string {
	var imports []string
	var exports []string

	for _, persona := range personas {
		name := strings.ToLower(persona.Name)
		className := persona.Name + "Agent"
		imports = append(imports, fmt.Sprintf(`import { %s } from "./%s";`, className, name))
		exports = append(exports, fmt.Sprintf(`  %s,`, className))
	}

	return fmt.Sprintf(`// Auto-generated SuperCode agents from SuperClaude personas

%s

export const agents = {
%s
};

export type AgentName = keyof typeof agents;

export function getAgent(name: AgentName) {
  return agents[name];
}
`, strings.Join(imports, "\n"), strings.Join(exports, "\n"))
}

// generatePersonaFile generates an individual persona file
func (t *PersonaTransformer) generatePersonaFile(persona analyzer.Persona) string {
	tools := "[]"
	if len(persona.Tools) > 0 {
		toolList := make([]string, len(persona.Tools))
		for i, tool := range persona.Tools {
			toolList[i] = fmt.Sprintf(`"%s"`, tool)
		}
		tools = fmt.Sprintf("[%s]", strings.Join(toolList, ", "))
	}

	return fmt.Sprintf(`// %s Agent - Auto-generated from SuperClaude persona

export interface %sAgent {
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  tools: string[];
  autoActivate?: string[];
  flags?: string[];
}

export const %sAgent: %sAgent = {
  name: "%s",
  description: "%s",
  systemPrompt: %s,
  model: "%s",
  temperature: %.1f,
  tools: %s,
  autoActivate: %s,
  flags: %s,
};
`,
		persona.Name,
		persona.Name,
		persona.Name,
		persona.Name,
		persona.Name,
		escapeStringPersona(persona.Description),
		formatMultilineString(persona.SystemPrompt),
		persona.Model,
		persona.Temperature,
		tools,
		formatStringArray(persona.AutoActivate),
		formatStringArray(persona.Flags),
	)
}

// generateConfig generates the agents configuration file
func (t *PersonaTransformer) generateConfig(personas []analyzer.Persona) string {
	var agents []string
	
	for _, persona := range personas {
		agents = append(agents, fmt.Sprintf(`    {
      "name": "%s",
      "description": "%s",
      "model": "%s",
      "temperature": %.1f,
      "enabled": true
    }`,
			persona.Name,
			escapeStringPersona(persona.Description),
			persona.Model,
			persona.Temperature,
		))
	}

	return fmt.Sprintf(`{
  "$schema": "https://opencode.dev/schemas/agents.json",
  "agents": [
%s
  ]
}`, strings.Join(agents, ",\n"))
}

// Helper functions

func escapeStringPersona(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, `"`, `\"`)
	s = strings.ReplaceAll(s, "\n", "\\n")
	return s
}

func formatMultilineString(s string) string {
	if strings.Contains(s, "\n") {
		lines := strings.Split(s, "\n")
		escaped := make([]string, len(lines))
		for i, line := range lines {
			escaped[i] = escapeStringPersona(line)
		}
		return "`" + strings.Join(lines, "\n") + "`"
	}
	return `"` + escapeStringPersona(s) + `"`
}

func formatStringArray(arr []string) string {
	if len(arr) == 0 {
		return "[]"
	}
	quoted := make([]string, len(arr))
	for i, s := range arr {
		quoted[i] = `"` + escapeStringPersona(s) + `"`
	}
	return "[" + strings.Join(quoted, ", ") + "]"
}