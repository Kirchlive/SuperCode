package analyzer

import (
	"fmt"
	"log"
)

// Analyzer coordinates all detection operations
type Analyzer struct {
	personaDetector     *PersonaDetector
	commandDetector     *CommandDetector
	mcpDetector         *MCPDetector
	compressionDetector *CompressionDetector
	yamlParser          *YAMLParser
}

// NewAnalyzer creates a new analyzer instance
func NewAnalyzer() *Analyzer {
	yamlParser := NewYAMLParser()
	return &Analyzer{
		personaDetector:     NewPersonaDetector(),
		commandDetector:     NewCommandDetector(),
		mcpDetector:         NewMCPDetector(),
		compressionDetector: NewCompressionDetector(yamlParser),
		yamlParser:          yamlParser,
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

	// Detect MCP features
	log.Println("Detecting MCP features...")
	mcpFeature, err := a.mcpDetector.Detect(repoPath)
	if err != nil {
		result.Errors = append(result.Errors, fmt.Errorf("MCP detection: %w", err))
	} else {
		result.MCPFeature = mcpFeature
		log.Printf("Found %d MCP servers", len(mcpFeature.Servers))
	}

	// Detect compression features
	log.Println("Detecting compression features...")
	compressionConfig, err := a.compressionDetector.Detect(repoPath)
	if err != nil {
		result.Errors = append(result.Errors, fmt.Errorf("compression detection: %w", err))
	} else {
		result.CompressionConfig = compressionConfig
		if compressionConfig.Enabled {
			log.Printf("Found compression feature with %d flags", len(compressionConfig.Flags))
		}
	}

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

	if result.MCPFeature != nil {
		fmt.Printf("\nMCP Servers (%d):\n", len(result.MCPFeature.Servers))
		for name, server := range result.MCPFeature.Servers {
			fmt.Printf("  - %s: %s\n", name, server.Purpose)
			fmt.Printf("    Token Cost: %s, Success Rate: %s\n", server.TokenCost, server.SuccessRate)
			fmt.Printf("    Capabilities: %v\n", server.Capabilities)
		}

		fmt.Printf("\nMCP Command Defaults:\n")
		for cmd, servers := range result.MCPFeature.CommandDefaults {
			fmt.Printf("  - %s: %v\n", cmd, servers)
		}
	}

	if result.CompressionConfig != nil && result.CompressionConfig.Enabled {
		fmt.Printf("\nCompression Feature:\n")
		fmt.Printf("  - Enabled: %v\n", result.CompressionConfig.Enabled)
		fmt.Printf("  - Flags: %v\n", result.CompressionConfig.Flags)
		fmt.Printf("  - Performance Target: %.0f%% reduction\n", result.CompressionConfig.PerformanceTarget*100)
		fmt.Printf("  - Natural Language Triggers: %v\n", result.CompressionConfig.Triggers.NaturalLanguage)
		fmt.Printf("  - Compression Rules: %d symbols, %d abbreviations\n", 
			len(result.CompressionConfig.Rules.Symbols), 
			len(result.CompressionConfig.Rules.Abbreviations))
	}

	if len(result.Errors) > 0 {
		fmt.Printf("\nErrors (%d):\n", len(result.Errors))
		for _, err := range result.Errors {
			fmt.Printf("  - %v\n", err)
		}
	}
}