package analyzer

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

// YAMLParser handles parsing of SuperClaude YAML files
type YAMLParser struct {
	includePattern *regexp.Regexp
	cache          map[string]interface{}
}

// NewYAMLParser creates a new YAML parser
func NewYAMLParser() *YAMLParser {
	return &YAMLParser{
		includePattern: regexp.MustCompile(`@include\s+([^\s]+?)(?:#([^\s]+))?`),
		cache:          make(map[string]interface{}),
	}
}

// ParseFile parses a YAML file and resolves @include directives
func (p *YAMLParser) ParseFile(filePath string) (map[string]interface{}, error) {
	// Check cache
	if cached, ok := p.cache[filePath]; ok {
		return cached.(map[string]interface{}), nil
	}

	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("reading file %s: %w", filePath, err)
	}

	// Parse @include directives first
	processedContent := p.processIncludes(string(content), filepath.Dir(filePath))

	// Parse YAML
	var result map[string]interface{}
	if err := yaml.Unmarshal([]byte(processedContent), &result); err != nil {
		return nil, fmt.Errorf("parsing YAML %s: %w", filePath, err)
	}

	// Cache result
	p.cache[filePath] = result

	return result, nil
}

// processIncludes resolves @include directives in content
func (p *YAMLParser) processIncludes(content string, baseDir string) string {
	lines := strings.Split(content, "\n")
	var processed []string

	for _, line := range lines {
		if matches := p.includePattern.FindStringSubmatch(line); matches != nil {
			includePath := matches[1]
			section := ""
			if len(matches) > 2 {
				section = matches[2]
			}

			// Resolve include
			included := p.resolveInclude(filepath.Join(baseDir, includePath), section)
			processed = append(processed, included)
		} else {
			processed = append(processed, line)
		}
	}

	return strings.Join(processed, "\n")
}

// resolveInclude loads and optionally extracts a section from an included file
func (p *YAMLParser) resolveInclude(path string, section string) string {
	content, err := ioutil.ReadFile(path)
	if err != nil {
		return fmt.Sprintf("# Error including %s: %v", path, err)
	}

	if section == "" {
		return string(content)
	}

	// Extract specific section
	return p.extractSection(string(content), section)
}

// extractSection extracts a named section from YAML content
func (p *YAMLParser) extractSection(content string, section string) string {
	lines := strings.Split(content, "\n")
	var inSection bool
	var sectionLines []string
	sectionPattern := fmt.Sprintf(`^%s:`, section)
	sectionRegex := regexp.MustCompile(sectionPattern)

	for i, line := range lines {
		if sectionRegex.MatchString(line) {
			inSection = true
			sectionLines = append(sectionLines, line)
			continue
		}

		if inSection {
			// Check if we've hit another top-level key
			if i > 0 && len(line) > 0 && line[0] != ' ' && line[0] != '\t' && strings.Contains(line, ":") {
				break
			}
			sectionLines = append(sectionLines, line)
		}
	}

	return strings.Join(sectionLines, "\n")
}

// ParsePersonas parses personas from YAML data
func (p *YAMLParser) ParsePersonas(data map[string]interface{}) ([]Persona, error) {
	var personas []Persona

	// Try different keys for personas
	personasData, ok := data["personas"]
	if !ok {
		// Try SuperClaude format
		personasData, ok = data["All_Personas"]
		if !ok {
			return nil, nil
		}
	}

	personasMap, ok := personasData.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("personas is not a map")
	}

	for name, personaData := range personasMap {
		personaMap, ok := personaData.(map[string]interface{})
		if !ok {
			continue
		}

		persona := Persona{
			Name: name,
		}

		// Parse fields - try multiple field names for compatibility
		if desc, ok := personaMap["description"].(string); ok {
			persona.Description = desc
		} else if identity, ok := personaMap["Identity"].(string); ok {
			persona.Description = identity
		}
		
		if prompt, ok := personaMap["systemPrompt"].(string); ok {
			persona.SystemPrompt = prompt
		} else if coreBelief, ok := personaMap["Core_Belief"].(string); ok {
			// For SuperClaude, combine multiple fields to create system prompt
			persona.SystemPrompt = coreBelief
			if primaryQ, ok := personaMap["Primary_Question"].(string); ok {
				persona.SystemPrompt += "\n\nPrimary Question: " + primaryQ
			}
			if problemSolving, ok := personaMap["Problem_Solving"].(string); ok {
				persona.SystemPrompt += "\n\nProblem Solving: " + problemSolving
			}
		}
		
		if model, ok := personaMap["model"].(string); ok {
			persona.Model = model
		} else {
			// Default model for SuperClaude personas
			persona.Model = "claude-3-opus"
		}
		
		if temp, ok := personaMap["temperature"].(float64); ok {
			persona.Temperature = temp
		} else {
			// Default temperature
			persona.Temperature = 0.7
		}

		// Parse tools array
		if toolsData, ok := personaMap["tools"].([]interface{}); ok {
			for _, tool := range toolsData {
				if toolStr, ok := tool.(string); ok {
					persona.Tools = append(persona.Tools, toolStr)
				}
			}
		} else if mcpPrefs, ok := personaMap["MCP_Preferences"].(string); ok {
			// Parse MCP preferences from SuperClaude format
			// Extract tools from MCP_Preferences string
			if strings.Contains(mcpPrefs, "Sequential") {
				persona.Tools = append(persona.Tools, "sequential")
			}
			if strings.Contains(mcpPrefs, "Context7") {
				persona.Tools = append(persona.Tools, "research")
			}
			if strings.Contains(mcpPrefs, "Magic") {
				persona.Tools = append(persona.Tools, "magic")
			}
			if strings.Contains(mcpPrefs, "Puppeteer") {
				persona.Tools = append(persona.Tools, "browser")
			}
		}

		// Parse autoActivate array
		if autoData, ok := personaMap["autoActivate"].([]interface{}); ok {
			for _, auto := range autoData {
				if autoStr, ok := auto.(string); ok {
					persona.AutoActivate = append(persona.AutoActivate, autoStr)
				}
			}
		}

		personas = append(personas, persona)
	}

	return personas, nil
}