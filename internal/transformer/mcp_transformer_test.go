package transformer

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Kirchlive/SuperCode/internal/analyzer/types"
	"github.com/Kirchlive/SuperCode/internal/generator"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMCPTransformer_Transform(t *testing.T) {
	outputDir := t.TempDir()
	gen := generator.New()
	transformer := NewMCPTransformer(gen)

	// Create test MCP feature
	feature := &types.MCPFeature{
		Servers: map[string]types.MCPServer{
			"Context7": {
				Name:         "Context7",
				Purpose:      "Library documentation and code examples",
				Capabilities: []string{"resolve-library-id", "get-library-docs"},
				BestFor:      []string{"API usage", "framework patterns"},
				TokenCost:    "Low-Medium",
				SuccessRate:  "Very high",
				Fallback:     "WebSearch",
				Workflows: map[string]types.MCPWorkflow{
					"Library_Research": {
						Trigger:   []string{"External library detection"},
						Process:   "C7 resolve → get docs → implement",
						Standards: []string{"Official docs required"},
						Example:   "React hooks → C7('react') → implementation",
					},
				},
			},
			"Sequential": {
				Name:         "Sequential",
				Purpose:      "Complex problem solving",
				Capabilities: []string{"sequentialthinking"},
				BestFor:      []string{"Architecture", "debugging"},
				TokenCost:    "Medium-High",
				SuccessRate:  "High",
				Fallback:     "Native analysis",
			},
		},
		CommandDefaults: map[string][]string{
			"build":   {"Magic", "Context7"},
			"analyze": {"Sequential"},
		},
		ContextTriggers: map[string]types.MCPTrigger{
			"Library_References": {
				Patterns: []string{"import .* from ['\"][^./].*['\"]"},
				Keywords: []string{"import", "require"},
				Action:   "→ C7 REQUIRED",
				Required: true,
			},
		},
		QualityControl: map[string]types.QualityCheck{
			"Context7": {
				SuccessCriteria: []string{"Docs found"},
				PartialResults:  []string{"Try alternatives"},
				FailureRecovery: []string{"WebSearch"},
			},
		},
		ErrorRecovery: map[string]types.Recovery{
			"Context7": {
				Strategies: map[string]string{
					"Library_Not_Found": "Broader search",
					"Timeout":           "Cache and continue",
				},
			},
		},
		TokenEconomics: types.TokenEconomics{
			BudgetAllocation:      "Native → Light → Heavy",
			IntelligentEscalation: "Progressive",
			AbortConditions:       []string{"High usage", "Timeout"},
			EfficiencyPatterns:    []string{"Batch", "Cache"},
		},
	}

	// Transform
	err := transformer.Transform(feature, outputDir)
	require.NoError(t, err)

	// Verify Context7 server created
	c7IndexPath := filepath.Join(outputDir, "mcp-servers", "context7", "index.ts")
	assert.FileExists(t, c7IndexPath)
	
	c7Content, err := os.ReadFile(c7IndexPath)
	require.NoError(t, err)
	c7String := string(c7Content)
	
	assert.Contains(t, c7String, "Context7 MCP Server")
	assert.Contains(t, c7String, "Purpose: Library documentation and code examples")
	assert.Contains(t, c7String, "resolve-library-id")
	assert.Contains(t, c7String, "get-library-docs")

	// Verify package.json
	c7PackagePath := filepath.Join(outputDir, "mcp-servers", "context7", "package.json")
	assert.FileExists(t, c7PackagePath)
	
	pkgContent, err := os.ReadFile(c7PackagePath)
	require.NoError(t, err)
	assert.Contains(t, string(pkgContent), "@supercode/mcp-context7")
	assert.Contains(t, string(pkgContent), "@modelcontextprotocol/sdk")

	// Verify README
	c7ReadmePath := filepath.Join(outputDir, "mcp-servers", "context7", "README.md")
	assert.FileExists(t, c7ReadmePath)
	
	readmeContent, err := os.ReadFile(c7ReadmePath)
	require.NoError(t, err)
	readmeString := string(readmeContent)
	
	assert.Contains(t, readmeString, "Context7 MCP Server")
	assert.Contains(t, readmeString, "**Token Cost**: Low-Medium")
	assert.Contains(t, readmeString, "**Success Rate**: Very high")
	assert.Contains(t, readmeString, "Library_Research")

	// Verify Sequential server
	seqIndexPath := filepath.Join(outputDir, "mcp-servers", "sequential", "index.ts")
	assert.FileExists(t, seqIndexPath)

	// Verify MCP config
	configPath := filepath.Join(outputDir, "config", "mcp-config.json")
	assert.FileExists(t, configPath)
	
	configContent, err := os.ReadFile(configPath)
	require.NoError(t, err)
	assert.Contains(t, string(configContent), "context7")
	assert.Contains(t, string(configContent), "sequential")

	// Verify example config
	examplePath := filepath.Join(outputDir, "config", "opencode.example.json")
	assert.FileExists(t, examplePath)
	
	exampleContent, err := os.ReadFile(examplePath)
	require.NoError(t, err)
	assert.Contains(t, string(exampleContent), "build: recommended servers: Magic, Context7")

	// Verify context detection helper
	contextPath := filepath.Join(outputDir, "commands", "mcp-integrations", "context-detection.ts")
	assert.FileExists(t, contextPath)
	
	contextContent, err := os.ReadFile(contextPath)
	require.NoError(t, err)
	contextString := string(contextContent)
	
	assert.Contains(t, contextString, "Library_References")
	assert.Contains(t, contextString, "import .* from")
	assert.Contains(t, contextString, "detectMCPContext")

	// Verify command integration helper
	cmdPath := filepath.Join(outputDir, "commands", "mcp-integrations", "command-mcp.ts")
	assert.FileExists(t, cmdPath)
	
	cmdContent, err := os.ReadFile(cmdPath)
	require.NoError(t, err)
	assert.Contains(t, string(cmdContent), "build")
	assert.Contains(t, string(cmdContent), "getRecommendedMCPServers")

	// Verify quality control helper
	qcPath := filepath.Join(outputDir, "commands", "mcp-integrations", "quality-control.ts")
	assert.FileExists(t, qcPath)
	
	qcContent, err := os.ReadFile(qcPath)
	require.NoError(t, err)
	assert.Contains(t, string(qcContent), "validateMCPResult")
	assert.Contains(t, string(qcContent), "tokenEconomics")
}

func TestMCPTransformer_GenerateServerImplementation(t *testing.T) {
	gen := generator.New()
	transformer := NewMCPTransformer(gen)

	server := types.MCPServer{
		Name:         "TestServer",
		Purpose:      "Test purpose",
		Capabilities: []string{"test-cap-1", "test-cap-2"},
		TokenCost:    "Low",
		SuccessRate:  "High",
	}

	result := transformer.generateServerImplementation("TestServer", server)

	// Verify structure
	assert.Contains(t, result, "import { Server }")
	assert.Contains(t, result, "TestServer MCP Server")
	assert.Contains(t, result, "Purpose: Test purpose")
	assert.Contains(t, result, "test-cap-1")
	assert.Contains(t, result, "test-cap-2")
	assert.Contains(t, result, "case \"test-cap-1\":")
	assert.Contains(t, result, "case \"test-cap-2\":")
}

func TestMCPTransformer_GenerateContextDetectionHelper(t *testing.T) {
	gen := generator.New()
	transformer := NewMCPTransformer(gen)

	feature := &types.MCPFeature{
		ContextTriggers: map[string]types.MCPTrigger{
			"Test_Trigger": {
				Patterns: []string{"test.*pattern"},
				Keywords: []string{"test", "keyword"},
				Action:   "→ TestServer REQUIRED",
				Required: true,
			},
		},
	}

	result := transformer.generateContextDetectionHelper(feature)

	// Verify content
	assert.Contains(t, result, "Test_Trigger")
	assert.Contains(t, result, "test.*pattern")
	assert.Contains(t, result, "test\", \"keyword")
	assert.Contains(t, result, "→ TestServer REQUIRED")
	assert.Contains(t, result, "required: true")
}

func TestMCPTransformer_ServerNameNormalization(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Context7", "context7"},
		{"Sequential", "sequential"},
		{"Magic", "magic"},
		{"Puppeteer", "puppeteer"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := strings.ToLower(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}