package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
	"github.com/spf13/cobra"
)

// DetectOutput represents the structured output of detection
type DetectOutput struct {
	Repository string                 `json:"repository"`
	Summary    DetectionSummary       `json:"summary"`
	Features   DetectedFeatures       `json:"features"`
	Suggestions []string              `json:"suggestions"`
}

// DetectionSummary provides high-level metrics
type DetectionSummary struct {
	TotalFeatures int    `json:"total_features"`
	Personas      int    `json:"personas"`
	Commands      int    `json:"commands"`
	MCPServers    int    `json:"mcp_servers"`
	Compression   bool   `json:"compression"`
	UIBuilder     bool   `json:"ui_builder"`
	Research      bool   `json:"research"`
	Context7      bool   `json:"context7"`
	RepoType      string `json:"repo_type"`
}

// DetectedFeatures contains detailed feature information
type DetectedFeatures struct {
	Personas    []PersonaInfo    `json:"personas,omitempty"`
	Commands    []CommandInfo    `json:"commands,omitempty"`
	MCPServers  []MCPServerInfo  `json:"mcp_servers,omitempty"`
	OtherFeatures map[string]bool `json:"other_features,omitempty"`
}

// PersonaInfo provides persona details
type PersonaInfo struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Tools       []string `json:"tools"`
}

// CommandInfo provides command details
type CommandInfo struct {
	Name     string `json:"name"`
	Purpose  string `json:"purpose"`
	Category string `json:"category"`
}

// MCPServerInfo provides MCP server details
type MCPServerInfo struct {
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	Executable  string   `json:"executable"`
}

// runDetect implements the detect command
func runDetect(cmd *cobra.Command, args []string) error {
	repoPath := args[0]
	
	// Create absolute path
	absPath, err := filepath.Abs(repoPath)
	if err != nil {
		return fmt.Errorf("failed to resolve path: %w", err)
	}

	// Check if path exists
	if _, err := os.Stat(absPath); os.IsNotExist(err) {
		return fmt.Errorf("path does not exist: %s", absPath)
	}

	fmt.Printf("🔍 Detecting features in: %s\n", absPath)
	
	// Create analyzer
	analyzer := analyzer.NewAnalyzer()
	
	// Analyze repository
	result, err := analyzer.AnalyzeRepository(absPath)
	if err != nil {
		return fmt.Errorf("failed to analyze repository: %w", err)
	}

	// Get output format
	format, _ := cmd.Flags().GetString("format")
	detailed, _ := cmd.Flags().GetBool("detailed")
	
	switch format {
	case "json":
		return outputJSON(result, absPath)
	case "yaml":
		return outputYAML(result, absPath)
	default:
		return outputText(result, absPath, detailed)
	}
}

// outputText prints human-readable output
func outputText(result *analyzer.DetectionResult, repoPath string, detailed bool) error {
	// Determine repository type
	repoType := detectRepoType(repoPath)
	
	fmt.Printf("\n📊 Detection Results for %s:\n", repoType)
	fmt.Println(strings.Repeat("─", 60))
	
	// Summary
	fmt.Println("\n📈 Summary:")
	totalFeatures := len(result.Personas) + len(result.Commands)
	if result.MCPFeature != nil {
		totalFeatures += len(result.MCPFeature.Servers)
	}
	// Count MCP servers as additional features
	totalFeatures += len(result.MCPServers)
	
	fmt.Printf("  Total Features: %d\n", totalFeatures)
	fmt.Printf("  Repository Type: %s\n", repoType)
	
	// Personas
	if len(result.Personas) > 0 {
		fmt.Printf("\n🎭 Personas (%d):\n", len(result.Personas))
		for _, persona := range result.Personas {
			fmt.Printf("  • %s", persona.Name)
			if persona.Description != "" {
				fmt.Printf(" - %s", persona.Description)
			}
			fmt.Println()
			if detailed {
				if len(persona.Tools) > 0 {
					fmt.Printf("    Tools: %s\n", strings.Join(persona.Tools, ", "))
				}
				if persona.Model != "" {
					fmt.Printf("    Model: %s\n", persona.Model)
				}
			}
		}
	}
	
	// Commands
	if len(result.Commands) > 0 {
		fmt.Printf("\n💻 Commands (%d):\n", len(result.Commands))
		
		// Group by category
		categories := make(map[string][]analyzer.Command)
		for _, cmd := range result.Commands {
			category := cmd.Category
			if category == "" {
				category = getCommandCategory(cmd.Name)
			}
			categories[category] = append(categories[category], cmd)
		}
		
		// Sort categories
		var catNames []string
		for cat := range categories {
			catNames = append(catNames, cat)
		}
		sort.Strings(catNames)
		
		for _, cat := range catNames {
			fmt.Printf("\n  %s:\n", cat)
			for _, cmd := range categories[cat] {
				fmt.Printf("    /%s", cmd.Name)
				if detailed && cmd.Purpose != "" {
					fmt.Printf(" - %s", cmd.Purpose)
				}
				fmt.Println()
			}
		}
	}
	
	// MCP Servers
	if result.MCPFeature != nil && len(result.MCPFeature.Servers) > 0 {
		fmt.Printf("\n🔌 MCP Servers (%d):\n", len(result.MCPFeature.Servers))
		for name, server := range result.MCPFeature.Servers {
			fmt.Printf("  • %s", name)
			if detailed && server.Purpose != "" {
				fmt.Printf(" - %s", server.Purpose)
			}
			fmt.Println()
		}
	}
	
	// Other Features
	fmt.Println("\n✨ Other Features:")
	// Check for specific command features
	hasCompression := false
	hasUIBuilder := false
	hasResearch := false
	hasContext7 := false
	
	for _, cmd := range result.Commands {
		switch cmd.Name {
		case "compress", "user:compress":
			hasCompression = true
		case "ui", "user:ui", "build":
			hasUIBuilder = true
		case "research", "user:research":
			hasResearch = true
		case "c7", "context7":
			hasContext7 = true
		}
	}
	
	if hasCompression {
		fmt.Printf("  ✅ Compression (UltraCompressed mode)\n")
	}
	if hasUIBuilder {
		fmt.Printf("  ✅ UI Builder (Component generation)\n")
	}
	if hasResearch {
		fmt.Printf("  ✅ Research Mode (Evidence-based)\n")
	}
	if hasContext7 {
		fmt.Printf("  ✅ Context7 (Documentation lookup)\n")
	}
	
	// Add MCP servers from old structure
	if len(result.MCPServers) > 0 {
		fmt.Printf("  ✅ %d Additional MCP Servers\n", len(result.MCPServers))
	}
	
	// Suggestions
	suggestions := generateSuggestions(result, repoType)
	if len(suggestions) > 0 {
		fmt.Println("\n💡 Suggestions:")
		for _, suggestion := range suggestions {
			fmt.Printf("  • %s\n", suggestion)
		}
	}
	
	// Configuration hint
	fmt.Println("\n📝 To generate a configuration based on these findings:")
	fmt.Printf("   supercode detect %s --format json > supercode-features.json\n", repoPath)
	
	return nil
}

// outputJSON prints JSON formatted output
func outputJSON(result *analyzer.DetectionResult, repoPath string) error {
	output := createDetectOutput(result, repoPath)
	
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	return encoder.Encode(output)
}

// outputYAML prints YAML formatted output
func outputYAML(result *analyzer.DetectionResult, repoPath string) error {
	// For simplicity, convert to JSON first
	output := createDetectOutput(result, repoPath)
	
	data, err := json.MarshalIndent(output, "", "  ")
	if err != nil {
		return err
	}
	
	// Print as formatted JSON (YAML conversion would require additional dependency)
	fmt.Println("# SuperCode Feature Detection")
	fmt.Printf("# Repository: %s\n", repoPath)
	fmt.Println(string(data))
	return nil
}

// createDetectOutput creates structured output
func createDetectOutput(result *analyzer.DetectionResult, repoPath string) DetectOutput {
	repoType := detectRepoType(repoPath)
	
	// Create summary
	summary := DetectionSummary{
		Personas:    len(result.Personas),
		Commands:    len(result.Commands),
		Compression: false,
		UIBuilder:   false,
		Research:    false,
		Context7:    false,
		RepoType:    repoType,
	}
	
	// Check for feature commands
	for _, cmd := range result.Commands {
		switch cmd.Name {
		case "compress", "user:compress":
			summary.Compression = true
		case "ui", "user:ui", "build":
			summary.UIBuilder = true
		case "research", "user:research":
			summary.Research = true
		case "c7", "context7":
			summary.Context7 = true
		}
	}
	
	if result.MCPFeature != nil {
		summary.MCPServers = len(result.MCPFeature.Servers)
	}
	
	summary.TotalFeatures = summary.Personas + summary.Commands + summary.MCPServers
	if summary.Compression {
		summary.TotalFeatures++
	}
	if summary.UIBuilder {
		summary.TotalFeatures++
	}
	if summary.Research {
		summary.TotalFeatures++
	}
	if summary.Context7 {
		summary.TotalFeatures++
	}
	
	// Create features
	features := DetectedFeatures{
		OtherFeatures: make(map[string]bool),
	}
	
	// Add personas
	for _, p := range result.Personas {
		features.Personas = append(features.Personas, PersonaInfo{
			Name:        p.Name,
			Description: p.Description,
			Tools:       p.Tools,
		})
	}
	
	// Add commands
	for _, c := range result.Commands {
		category := c.Category
		if category == "" {
			category = getCommandCategory(c.Name)
		}
		features.Commands = append(features.Commands, CommandInfo{
			Name:     c.Name,
			Purpose:  c.Purpose,
			Category: category,
		})
	}
	
	// Add MCP servers
	if result.MCPFeature != nil {
		for name, _ := range result.MCPFeature.Servers {
			features.MCPServers = append(features.MCPServers, MCPServerInfo{
				Name:       name,
				Type:       "mcp",
				Executable: "",
			})
		}
	}
	
	// Also add MCPServers from the old format
	for _, s := range result.MCPServers {
		features.MCPServers = append(features.MCPServers, MCPServerInfo{
			Name:       s.Name,
			Type:       "mcp",
			Executable: "",
		})
	}
	
	// Add other features
	features.OtherFeatures["compression"] = summary.Compression
	features.OtherFeatures["ui_builder"] = summary.UIBuilder
	features.OtherFeatures["research"] = summary.Research
	features.OtherFeatures["context7"] = summary.Context7
	
	return DetectOutput{
		Repository:  repoPath,
		Summary:     summary,
		Features:    features,
		Suggestions: generateSuggestions(result, repoType),
	}
}

// detectRepoType determines the repository type
func detectRepoType(repoPath string) string {
	base := filepath.Base(repoPath)
	switch strings.ToLower(base) {
	case "superclaude":
		return "SuperClaude"
	case "opencode":
		return "OpenCode"
	default:
		if strings.Contains(strings.ToLower(repoPath), "superclaude") {
			return "SuperClaude"
		}
		if strings.Contains(strings.ToLower(repoPath), "opencode") {
			return "OpenCode"
		}
		return "Unknown"
	}
}

// getCommandCategory categorizes commands
func getCommandCategory(cmdName string) string {
	switch {
	case strings.HasPrefix(cmdName, "user:"):
		return "AI Development"
	case strings.Contains(cmdName, "build"), strings.Contains(cmdName, "create"):
		return "Code Generation"
	case strings.Contains(cmdName, "fix"), strings.Contains(cmdName, "debug"):
		return "Debugging"
	case strings.Contains(cmdName, "help"), strings.Contains(cmdName, "explain"):
		return "Documentation"
	default:
		return "Utilities"
	}
}

// generateSuggestions creates helpful suggestions
func generateSuggestions(result *analyzer.DetectionResult, repoType string) []string {
	var suggestions []string
	
	if repoType == "SuperClaude" {
		suggestions = append(suggestions, "Run 'supercode merge' to integrate these features into OpenCode")
		
		if len(result.Personas) > 5 {
			suggestions = append(suggestions, "Consider selecting specific personas to reduce complexity")
		}
		
		if result.MCPFeature == nil || len(result.MCPFeature.Servers) == 0 {
			suggestions = append(suggestions, "Add MCP servers for better tool integration")
		}
	}
	
	if repoType == "OpenCode" {
		suggestions = append(suggestions, "This appears to be OpenCode - use merge with SuperClaude repo")
	}
	
	if len(result.Commands) > 15 {
		suggestions = append(suggestions, fmt.Sprintf("Found %d commands - consider categorizing for better organization", len(result.Commands)))
	}
	
	return suggestions
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// init flags for the detect command
func initDetectFlags() {
	detectCmd.Flags().StringP("format", "f", "text", "output format (text, json, yaml)")
	detectCmd.Flags().BoolP("detailed", "d", false, "show detailed information")
	detectCmd.Flags().StringP("output", "o", "", "write output to file instead of stdout")
}