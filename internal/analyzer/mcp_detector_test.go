package analyzer

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMCPDetector_Detect(t *testing.T) {
	// Create test directory structure
	testDir := t.TempDir()
	claudeDir := filepath.Join(testDir, ".claude")
	sharedDir := filepath.Join(claudeDir, "shared")
	commandsDir := filepath.Join(claudeDir, "commands", "shared")

	require.NoError(t, os.MkdirAll(sharedDir, 0755))
	require.NoError(t, os.MkdirAll(commandsDir, 0755))

	// Create test MCP configuration file
	mcpContent := `
Server_Capabilities_Extended:
  Context7:
    Purpose: "Official library documentation & code examples | Research standards"
    Capabilities: "resolve-library-id | get-library-docs | version-specific documentation"
    Best_For: "API integration | Framework patterns | Library adoption | Official standards"
    Token_Cost: "Low-Medium | High accuracy | Authoritative sources"
    Workflows: "Library detection → resolve-id → get-docs → implement with citations"

  Sequential:
    Purpose: "Multi-step complex problem solving | Architectural thinking | Analysis"
    Capabilities: "sequentialthinking | adaptive reasoning | systematic problem decomposition"
    Best_For: "System design | Root cause analysis | Complex debugging | Architecture review"
    Token_Cost: "Medium-High | Comprehensive analysis | Insights"

Token_Economics:
  Budget_Allocation: "Native(0) | Light_MCP(minimal) | Medium_MCP(moderate) | Heavy_MCP(extensive)"
  Intelligent_Escalation: "Native→C7→Sequential→Multi-MCP | Cost-aware progression"
  Abort_Conditions: "High context usage | MCP timeout/error | Diminishing returns"
  Efficiency_Patterns: "Batch similar operations | Cache results | Progressive loading"

Workflows:
  Library_Research:
    Trigger: "External library detection | Import statement analysis | Framework questions"
    Process: "C7 resolve-library-id → validate documentation → extract patterns → implement with citations"
    Standards: "Official documentation required | Version compatibility checked | Best practices documented"
    Example: "'React hooks implementation' → C7('react') → get-docs('hooks') → implementation"

Quality_Control:
  Context7_Validation:
    Success_Criteria: "Relevant documentation found | Official sources confirmed | Version compatibility verified"
    Partial_Results: "Try alternative search terms | Validate with official sources | Document limitations"
    Failure_Recovery: "WebSearch official documentation | Cache partial results | Continue with warnings"

Command_Integration:
  Development_Commands:
    build: "Magic for UI components | C7 for framework documentation | Sequential for architecture"
    dev_setup: "C7 for tooling documentation | Sequential for environment optimization"
    test: "Puppeteer for E2E testing | C7 for testing frameworks | Sequential for coverage analysis"

Error_Recovery:
  Context7_Recovery:
    Library_Not_Found: "Broader search terms → WebSearch official docs → cache alternatives"
    Documentation_Incomplete: "Try specific topics → search recent versions → note limitations"
    API_Timeout: "Cache partial results → continue with native tools → document limitations"
`

	mcpPath := filepath.Join(sharedDir, "superclaude-mcp.yml")
	require.NoError(t, os.WriteFile(mcpPath, []byte(mcpContent), 0644))

	// Create execution patterns file
	execContent := `
Servers:
  Context7:
    Purpose: "Library documentation and code examples"
    Best_For: ["API usage", "framework patterns", "library integration"]
    Token_Cost: "Low-Medium usage"
    Capabilities:
      - resolve-library-id: "Find Context7-compatible library ID"
      - get-library-docs: "Fetch up-to-date documentation"
    Success_Rate: "Very high for popular libraries"
    Fallback: "WebSearch official docs"
    
  Sequential:
    Purpose: "Step-by-step complex problem solving"
    Best_For: ["Architecture", "debugging", "system design", "root cause analysis"]
    Token_Cost: "Medium-High usage"
    Capabilities:
      - sequentialthinking: "Adaptive multi-step reasoning"
    Success_Rate: "High for complex problems"
    Fallback: "Native step-by-step analysis"

Context_Detection_Patterns:
  Library_References:
    Triggers:
      - "import .* from ['\"][^./].*['\"]"
      - "require\\(['\"][^./].*['\"]\\)"
    Keywords: ["import", "require", "library", "package"]
    Action: "→ C7 resolve-library-id REQUIRED"
    
  Complex_Problem_Indicators:
    Keywords: ["architecture", "design", "system", "complex", "debug"]
    Action: "→ Sequential thinking RECOMMENDED"

MCP_Control_Flags:
  Individual:
    --c7: "Enable Context7 only"
    --seq: "Enable Sequential only"
`

	execPath := filepath.Join(commandsDir, "execution-patterns.yml")
	require.NoError(t, os.WriteFile(execPath, []byte(execContent), 0644))

	// Test detection
	detector := NewMCPDetector()
	result, err := detector.Detect(testDir)
	require.NoError(t, err)
	assert.NotNil(t, result)

	// Verify servers detected
	assert.Len(t, result.Servers, 2)
	
	// Check Context7
	c7, exists := result.Servers["Context7"]
	assert.True(t, exists)
	assert.Equal(t, "Context7", c7.Name)
	assert.Contains(t, strings.ToLower(c7.Purpose), "library documentation")
	assert.Contains(t, c7.Capabilities, "resolve-library-id")
	assert.Contains(t, c7.Capabilities, "get-library-docs")
	assert.Equal(t, "Low-Medium usage", c7.TokenCost)
	assert.Equal(t, "Very high for popular libraries", c7.SuccessRate)
	assert.Equal(t, "WebSearch official docs", c7.Fallback)

	// Check Sequential
	seq, exists := result.Servers["Sequential"]
	assert.True(t, exists)
	assert.Equal(t, "Sequential", seq.Name)
	assert.Contains(t, seq.Purpose, "problem solving")
	assert.Contains(t, seq.Capabilities, "sequentialthinking")

	// Verify token economics
	assert.Equal(t, "Native(0) | Light_MCP(minimal) | Medium_MCP(moderate) | Heavy_MCP(extensive)", result.TokenEconomics.BudgetAllocation)
	assert.Contains(t, result.TokenEconomics.IntelligentEscalation, "Native→C7→Sequential")
	assert.Len(t, result.TokenEconomics.AbortConditions, 3)

	// Verify command defaults
	assert.Contains(t, result.CommandDefaults["build"], "Magic")
	assert.Contains(t, result.CommandDefaults["build"], "Context7")
	assert.Contains(t, result.CommandDefaults["test"], "Puppeteer")

	// Verify context triggers
	libRef, exists := result.ContextTriggers["Library_References"]
	assert.True(t, exists)
	assert.True(t, libRef.Required)
	assert.Contains(t, libRef.Action, "C7")

	// Verify quality control
	c7QC, exists := result.QualityControl["Context7"]
	assert.True(t, exists)
	assert.Contains(t, c7QC.SuccessCriteria, "Relevant documentation found")
	assert.Contains(t, c7QC.FailureRecovery, "WebSearch official documentation")

	// Verify error recovery
	c7Recovery, exists := result.ErrorRecovery["Context7"]
	assert.True(t, exists)
	assert.Contains(t, c7Recovery.Strategies["Library_Not_Found"], "Broader search terms")
}

func TestMCPDetector_ParseMCPPreference(t *testing.T) {
	detector := NewMCPDetector()

	tests := []struct {
		name     string
		input    string
		expected struct {
			primary   string
			secondary []string
			patterns  []string
		}
	}{
		{
			name:  "Single server",
			input: "Sequential(primary)",
			expected: struct {
				primary   string
				secondary []string
				patterns  []string
			}{
				primary:   "Sequential",
				secondary: []string{},
				patterns:  []string{"primary"},
			},
		},
		{
			name:  "Multiple servers",
			input: "Sequential(primary) + Context7(patterns)",
			expected: struct {
				primary   string
				secondary []string
				patterns  []string
			}{
				primary:   "Sequential",
				secondary: []string{"Context7"},
				patterns:  []string{"primary", "patterns"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := detector.parseMCPPreference(tt.input)
			assert.Equal(t, tt.expected.primary, result.Primary)
			assert.Equal(t, tt.expected.secondary, result.Secondary)
			assert.Equal(t, tt.expected.patterns, result.Patterns)
		})
	}
}

func TestMCPDetector_ExtractMCPServers(t *testing.T) {
	detector := NewMCPDetector()

	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "Magic and C7",
			input:    "Magic for UI components | C7 for framework documentation",
			expected: []string{"Magic", "Context7"},
		},
		{
			name:     "Sequential only",
			input:    "Sequential for architectural thinking",
			expected: []string{"Sequential"},
		},
		{
			name:     "All servers",
			input:    "Magic UI | C7 docs | Sequential analysis | Puppeteer testing",
			expected: []string{"Magic", "Context7", "Sequential", "Puppeteer"},
		},
		{
			name:     "No servers",
			input:    "Native tools only",
			expected: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := detector.extractMCPServers(tt.input)
			assert.ElementsMatch(t, tt.expected, result)
		})
	}
}