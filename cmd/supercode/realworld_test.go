package main

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
	"github.com/Kirchlive/SuperCode/internal/transformer"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestRealWorldRepositories tests the SuperCode merger with actual repositories
func TestRealWorldRepositories(t *testing.T) {
	// Skip if not explicitly enabled
	if os.Getenv("RUN_REALWORLD_TEST") != "true" {
		t.Skip("Skipping real-world test. Set RUN_REALWORLD_TEST=true to run")
	}

	// Get repository paths - use absolute paths
	superClaudePath := "/Users/rob/Development/SuperCode-Project/SuperClaude"
	openCodePath := "/Users/rob/Development/SuperCode-Project/OpenCode"

	// Verify repositories exist
	if _, err := os.Stat(superClaudePath); os.IsNotExist(err) {
		t.Fatalf("SuperClaude repository not found at %s", superClaudePath)
	}
	if _, err := os.Stat(openCodePath); os.IsNotExist(err) {
		t.Fatalf("OpenCode repository not found at %s", openCodePath)
	}

	t.Logf("Testing with repositories:")
	t.Logf("  SuperClaude: %s", superClaudePath)
	t.Logf("  OpenCode: %s", openCodePath)

	// Create analyzer
	analyzer := analyzer.NewAnalyzer()

	// Analyze SuperClaude repository
	t.Log("Analyzing SuperClaude repository...")
	result, err := analyzer.AnalyzeRepository(superClaudePath)
	require.NoError(t, err, "Failed to analyze SuperClaude repository")

	// Print analysis summary
	t.Log("\n=== Analysis Results ===")
	analyzer.PrintSummary(result)

	// Validate detection results
	t.Run("Detection", func(t *testing.T) {
		// Check personas detected
		assert.NotEmpty(t, result.Personas, "No personas detected")
		t.Logf("Detected %d personas", len(result.Personas))
		
		// Verify expected personas
		expectedPersonas := []string{
			"Architect", "Frontend", "Backend", "Analyzer",
			"Security", "Mentor", "Refactorer", "Performance", "QA",
		}
		
		personaNames := make(map[string]bool)
		for _, p := range result.Personas {
			personaNames[p.Name] = true
			t.Logf("  - %s: %s", p.Name, p.Description)
		}
		
		for _, expected := range expectedPersonas {
			assert.True(t, personaNames[expected], "Expected persona %s not found", expected)
		}

		// Check commands detected
		assert.NotEmpty(t, result.Commands, "No commands detected")
		t.Logf("Detected %d commands", len(result.Commands))
		
		// Verify some expected commands
		expectedCommands := []string{
			"build", "analyze", "test", "deploy", "troubleshoot",
			"improve", "explain", "design", "document",
		}
		
		commandNames := make(map[string]bool)
		for _, c := range result.Commands {
			commandNames[c.Name] = true
			t.Logf("  - /%s: %s (%d flags)", c.Name, c.Purpose, len(c.Flags))
		}
		
		for _, expected := range expectedCommands {
			assert.True(t, commandNames[expected], "Expected command %s not found", expected)
		}

		// Check MCP features detected
		if result.MCPFeature != nil {
			assert.NotEmpty(t, result.MCPFeature.Servers, "No MCP servers detected")
			t.Logf("Detected %d MCP servers", len(result.MCPFeature.Servers))
			
			// Verify expected MCP servers
			expectedServers := []string{"Context7", "Sequential", "Magic", "Puppeteer"}
			for _, expected := range expectedServers {
				server, exists := result.MCPFeature.Servers[expected]
				assert.True(t, exists, "Expected MCP server %s not found", expected)
				if exists {
					t.Logf("  - %s: %s", server.Name, server.Purpose)
					assert.NotEmpty(t, server.Capabilities, "No capabilities for %s", server.Name)
				}
			}

			// Check command defaults
			assert.NotEmpty(t, result.MCPFeature.CommandDefaults, "No command defaults detected")
			t.Logf("Detected command defaults for %d commands", len(result.MCPFeature.CommandDefaults))
		} else {
			t.Log("WARNING: MCPFeature is nil - MCP detection may have failed")
		}
	})

	// Test transformation
	t.Run("Transformation", func(t *testing.T) {
		outputDir := t.TempDir()
		t.Logf("Output directory: %s", outputDir)

		// Create transformer
		transformer := transformer.NewTransformer()

		// Transform detected features
		err := transformer.Transform(result, outputDir)
		require.NoError(t, err, "Transformation failed")

		// Verify output structure
		t.Run("OutputStructure", func(t *testing.T) {
			// Check agents directory
			agentsDir := filepath.Join(outputDir, "agents")
			assert.DirExists(t, agentsDir, "Agents directory not created")
			
			// Check for agent files
			agentFiles, err := filepath.Glob(filepath.Join(agentsDir, "*.ts"))
			require.NoError(t, err)
			assert.NotEmpty(t, agentFiles, "No agent files generated")
			t.Logf("Generated %d agent files", len(agentFiles))

			// Check commands directory
			commandsDir := filepath.Join(outputDir, "commands")
			assert.DirExists(t, commandsDir, "Commands directory not created")
			
			// Check for command files
			commandFiles, err := filepath.Glob(filepath.Join(commandsDir, "*.ts"))
			require.NoError(t, err)
			assert.NotEmpty(t, commandFiles, "No command files generated")
			t.Logf("Generated %d command files", len(commandFiles))

			// Check MCP servers directory only if MCP was detected
			if result.MCPFeature != nil && len(result.MCPFeature.Servers) > 0 {
				mcpDir := filepath.Join(outputDir, "mcp-servers")
				assert.DirExists(t, mcpDir, "MCP servers directory not created")
				
				// Check for MCP server directories
				mcpServers := []string{"context7", "sequential", "magic", "puppeteer"}
				for _, server := range mcpServers {
					serverDir := filepath.Join(mcpDir, server)
					if _, err := os.Stat(serverDir); err == nil {
						// Check for required files
						assert.FileExists(t, filepath.Join(serverDir, "index.ts"))
						assert.FileExists(t, filepath.Join(serverDir, "package.json"))
						assert.FileExists(t, filepath.Join(serverDir, "README.md"))
					}
				}
			}

			// Check configuration directory
			configDir := filepath.Join(outputDir, "config")
			assert.DirExists(t, configDir, "Config directory not created")
			
			// Check for config files
			assert.FileExists(t, filepath.Join(configDir, "agents.json"))
			assert.FileExists(t, filepath.Join(configDir, "commands.json"))
			
			// Only check for MCP config if MCP was detected
			if result.MCPFeature != nil && len(result.MCPFeature.Servers) > 0 {
				assert.FileExists(t, filepath.Join(configDir, "mcp-config.json"))
				assert.FileExists(t, filepath.Join(configDir, "opencode.example.json"))
			}
		})

		// Generate summary
		err = transformer.GenerateSummary(result, outputDir)
		require.NoError(t, err, "Failed to generate summary")
		
		summaryPath := filepath.Join(outputDir, "TRANSFORMATION_SUMMARY.md")
		assert.FileExists(t, summaryPath, "Summary not generated")
		
		// Read and log summary
		summaryContent, err := os.ReadFile(summaryPath)
		require.NoError(t, err)
		t.Logf("\n=== Transformation Summary ===\n%s", string(summaryContent))
	})

	// Report any errors encountered
	if len(result.Errors) > 0 {
		t.Logf("\n=== Errors Encountered ===")
		for _, err := range result.Errors {
			t.Logf("  - %v", err)
		}
	}
}

// TestRealWorldPerformance tests the performance with real repositories
func TestRealWorldPerformance(t *testing.T) {
	if os.Getenv("RUN_REALWORLD_TEST") != "true" {
		t.Skip("Skipping real-world test. Set RUN_REALWORLD_TEST=true to run")
	}

	superClaudePath := "/Users/rob/Development/SuperCode-Project/SuperClaude"

	// Measure analysis time
	analyzer := analyzer.NewAnalyzer()
	
	start := time.Now()
	result, err := analyzer.AnalyzeRepository(superClaudePath)
	analysisTime := time.Since(start)
	
	require.NoError(t, err)
	t.Logf("Analysis completed in %v", analysisTime)
	t.Logf("  - Personas: %d", len(result.Personas))
	t.Logf("  - Commands: %d", len(result.Commands))
	if result.MCPFeature != nil {
		t.Logf("  - MCP Servers: %d", len(result.MCPFeature.Servers))
	} else {
		t.Logf("  - MCP Feature: nil (not detected)")
	}

	// Measure transformation time
	outputDir := t.TempDir()
	transformer := transformer.NewTransformer()
	
	start = time.Now()
	err = transformer.Transform(result, outputDir)
	transformTime := time.Since(start)
	
	require.NoError(t, err)
	t.Logf("Transformation completed in %v", transformTime)
	
	// Count generated files
	var fileCount int
	err = filepath.Walk(outputDir, func(path string, info os.FileInfo, err error) error {
		if err == nil && !info.IsDir() {
			fileCount++
		}
		return nil
	})
	require.NoError(t, err)
	t.Logf("Generated %d files", fileCount)
	
	// Performance assertions
	assert.Less(t, analysisTime, 5*time.Second, "Analysis took too long")
	assert.Less(t, transformTime, 3*time.Second, "Transformation took too long")
}