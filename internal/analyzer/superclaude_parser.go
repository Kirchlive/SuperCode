package analyzer

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	
	"gopkg.in/yaml.v3"
)

// ParseSuperClaudePersonas parses the SuperClaude personas file format
func ParseSuperClaudePersonas(filePath string) ([]Persona, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var personas []Persona
	scanner := bufio.NewScanner(file)
	
	// Find the All_Personas section
	inSection := false
	var sectionContent strings.Builder
	
	for scanner.Scan() {
		line := scanner.Text()
		
		// Check for section start
		if strings.TrimSpace(line) == "## All_Personas" {
			inSection = true
			continue
		}
		
		// Check for section end (new section starting with ##)
		if inSection && strings.HasPrefix(strings.TrimSpace(line), "##") {
			break
		}
		
		// Collect section content
		if inSection {
			sectionContent.WriteString(line + "\n")
		}
	}
	
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	
	// Parse the YAML content
	var data map[string]interface{}
	if err := yaml.Unmarshal([]byte(sectionContent.String()), &data); err != nil {
		return nil, fmt.Errorf("parsing YAML content: %w", err)
	}
	
	// Convert to personas
	for name, personaData := range data {
		personaMap, ok := personaData.(map[string]interface{})
		if !ok {
			continue
		}
		
		persona := Persona{
			Name:        name,
			Model:       "claude-3-opus", // Default
			Temperature: 0.7,              // Default
		}
		
		// Parse Identity as Description
		if identity, ok := personaMap["Identity"].(string); ok {
			persona.Description = identity
		}
		
		// Build system prompt from multiple fields
		var promptParts []string
		
		if identity, ok := personaMap["Identity"].(string); ok {
			promptParts = append(promptParts, fmt.Sprintf("You are: %s", identity))
		}
		
		if coreBelief, ok := personaMap["Core_Belief"].(string); ok {
			promptParts = append(promptParts, fmt.Sprintf("\nCore Belief: %s", coreBelief))
		}
		
		if primaryQ, ok := personaMap["Primary_Question"].(string); ok {
			promptParts = append(promptParts, fmt.Sprintf("\nPrimary Question: %s", primaryQ))
		}
		
		if decisionFramework, ok := personaMap["Decision_Framework"].(string); ok {
			promptParts = append(promptParts, fmt.Sprintf("\nDecision Framework: %s", decisionFramework))
		}
		
		if problemSolving, ok := personaMap["Problem_Solving"].(string); ok {
			promptParts = append(promptParts, fmt.Sprintf("\nProblem Solving: %s", problemSolving))
		}
		
		if focus, ok := personaMap["Focus"].(string); ok {
			promptParts = append(promptParts, fmt.Sprintf("\nFocus: %s", focus))
		}
		
		persona.SystemPrompt = strings.Join(promptParts, "\n")
		
		// Parse MCP preferences for tools
		if mcpPrefs, ok := personaMap["MCP_Preferences"].(string); ok {
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
		
		personas = append(personas, persona)
	}
	
	return personas, nil
}