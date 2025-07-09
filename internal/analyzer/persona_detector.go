package analyzer

import (
	"fmt"
	"path/filepath"
)

// PersonaDetector detects personas from SuperClaude repository
type PersonaDetector struct {
	parser *YAMLParser
}

// NewPersonaDetector creates a new persona detector
func NewPersonaDetector() *PersonaDetector {
	return &PersonaDetector{
		parser: NewYAMLParser(),
	}
}

// Detect finds all personas in the repository
func (d *PersonaDetector) Detect(repoPath string) ([]Persona, error) {
	var allPersonas []Persona

	// Try multiple possible locations for persona file
	possiblePaths := []string{
		filepath.Join(repoPath, ".claude", "shared", "superclaude-personas.yml"),
		filepath.Join(repoPath, "shared", "superclaude-personas.yml"),
		filepath.Join(repoPath, "superclaude-personas.yml"),
	}
	
	var data map[string]interface{}
	var err error
	
	for _, path := range possiblePaths {
		data, err = d.parser.ParseFile(path)
		if err == nil {
			break
		}
	}
	if err == nil {
		personas, err := d.parser.ParsePersonas(data)
		if err != nil {
			return nil, fmt.Errorf("parsing personas: %w", err)
		}
		allPersonas = append(allPersonas, personas...)
	}

	// Also check individual persona files
	personaDir := filepath.Join(repoPath, ".claude", "personas")
	pattern := filepath.Join(personaDir, "*.yml")
	files, _ := filepath.Glob(pattern)

	for _, file := range files {
		data, err := d.parser.ParseFile(file)
		if err != nil {
			continue
		}

		// Try to parse as a single persona
		if name, ok := data["name"].(string); ok {
			persona := Persona{
				Name: name,
			}

			if desc, ok := data["description"].(string); ok {
				persona.Description = desc
			}
			if prompt, ok := data["systemPrompt"].(string); ok {
				persona.SystemPrompt = prompt
			}
			if model, ok := data["model"].(string); ok {
				persona.Model = model
			}
			if temp, ok := data["temperature"].(float64); ok {
				persona.Temperature = temp
			}

			// Parse tools
			if toolsData, ok := data["tools"].([]interface{}); ok {
				for _, tool := range toolsData {
					if toolStr, ok := tool.(string); ok {
						persona.Tools = append(persona.Tools, toolStr)
					}
				}
			}

			allPersonas = append(allPersonas, persona)
		}
	}

	return allPersonas, nil
}

// ValidatePersona checks if a persona has all required fields
func (d *PersonaDetector) ValidatePersona(p Persona) error {
	if p.Name == "" {
		return fmt.Errorf("persona missing name")
	}
	if p.SystemPrompt == "" {
		return fmt.Errorf("persona %s missing system prompt", p.Name)
	}
	if p.Model == "" {
		return fmt.Errorf("persona %s missing model", p.Name)
	}
	return nil
}