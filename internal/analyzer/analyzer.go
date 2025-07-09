package analyzer

import (
	"fmt"
	"log"
)

// Analyzer coordinates all detection operations
type Analyzer struct {
	personaDetector *PersonaDetector
	commandDetector *CommandDetector
	yamlParser      *YAMLParser
}

// NewAnalyzer creates a new analyzer instance
func NewAnalyzer() *Analyzer {
	return &Analyzer{
		personaDetector: NewPersonaDetector(),
		commandDetector: NewCommandDetector(),
		yamlParser:      NewYAMLParser(),
	}
}

// AnalyzeRepository performs complete analysis of SuperClaude repository
func (a *Analyzer) AnalyzeRepository(repoPath string) (*DetectionResult, error) {
	result := &DetectionResult{
		Errors: []error{},
	}

	// Detect personas
	log.Println("Detecting personas...")
	personas, err := a.personaDetector.Detect(repoPath)
	if err != nil {
		result.Errors = append(result.Errors, fmt.Errorf("persona detection: %w", err))
	} else {
		result.Personas = personas
		log.Printf("Found %d personas", len(personas))
	}

	// Detect commands
	log.Println("Detecting commands...")
	commands, err := a.commandDetector.Detect(repoPath)
	if err != nil {
		result.Errors = append(result.Errors, fmt.Errorf("command detection: %w", err))
	} else {
		result.Commands = commands
		log.Printf("Found %d commands", len(commands))
	}

	// TODO: Add MCP server detection
	// TODO: Add compression pattern detection

	return result, nil
}

// PrintSummary prints a summary of detection results
func (a *Analyzer) PrintSummary(result *DetectionResult) {
	fmt.Println("\n=== Detection Summary ===")
	
	fmt.Printf("\nPersonas (%d):\n", len(result.Personas))
	for _, p := range result.Personas {
		fmt.Printf("  - %s: %s\n", p.Name, p.Description)
		fmt.Printf("    Model: %s, Temperature: %.1f\n", p.Model, p.Temperature)
		fmt.Printf("    Tools: %v\n", p.Tools)
	}

	fmt.Printf("\nCommands (%d):\n", len(result.Commands))
	for _, c := range result.Commands {
		fmt.Printf("  - /%s: %s\n", c.Name, c.Purpose)
		fmt.Printf("    Category: %s, Flags: %d, Examples: %d\n", 
			c.Category, len(c.Flags), len(c.Examples))
	}

	if len(result.Errors) > 0 {
		fmt.Printf("\nErrors (%d):\n", len(result.Errors))
		for _, err := range result.Errors {
			fmt.Printf("  - %v\n", err)
		}
	}
}