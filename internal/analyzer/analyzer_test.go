package analyzer

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestYAMLParser_ParseFile(t *testing.T) {
	parser := NewYAMLParser()
	
	// Test parsing the test persona file
	testFile := filepath.Join("..", "..", "testdata", "superclaude", "personas", "architect.yml")
	data, err := parser.ParseFile(testFile)
	
	require.NoError(t, err)
	assert.NotNil(t, data)
	
	// Check expected fields
	assert.Equal(t, "architect", data["name"])
	assert.Equal(t, "System architecture specialist", data["description"])
	assert.NotEmpty(t, data["systemPrompt"])
}

func TestPersonaDetector_Detect(t *testing.T) {
	detector := NewPersonaDetector()
	
	// Use test data
	testRepo := filepath.Join("..", "..", "testdata", "superclaude")
	personas, err := detector.Detect(testRepo)
	
	require.NoError(t, err)
	assert.NotEmpty(t, personas)
	
	// Verify architect persona
	var architect *Persona
	for _, p := range personas {
		if p.Name == "architect" {
			architect = &p
			break
		}
	}
	
	require.NotNil(t, architect)
	assert.Equal(t, "System architecture specialist", architect.Description)
	assert.Equal(t, "claude-3-opus", architect.Model)
	assert.Equal(t, 0.7, architect.Temperature)
	assert.Contains(t, architect.Tools, "sequential")
}

func TestCommandDetector_Detect(t *testing.T) {
	detector := NewCommandDetector()
	
	// Create a test command file
	testRepo := filepath.Join("..", "..", "testdata", "superclaude")
	commands, err := detector.Detect(testRepo)
	
	// Even if no commands found, should not error
	assert.NoError(t, err)
	assert.NotNil(t, commands)
}

func TestAnalyzer_AnalyzeRepository(t *testing.T) {
	analyzer := NewAnalyzer()
	
	testRepo := filepath.Join("..", "..", "testdata", "superclaude")
	result, err := analyzer.AnalyzeRepository(testRepo)
	
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.Personas)
	
	// Should have found at least the architect persona
	assert.GreaterOrEqual(t, len(result.Personas), 1)
}

func TestCommandDetector_inferCategory(t *testing.T) {
	detector := NewCommandDetector()
	
	tests := []struct {
		name     string
		expected string
	}{
		{"build", "development"},
		{"dev-setup", "development"},
		{"test", "development"},
		{"deploy", "operations"},
		{"migrate", "operations"},
		{"analyze", "analysis"},
		{"review", "analysis"},
		{"design", "design"},
		{"document", "design"},
		{"random", "general"},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			category := detector.inferCategory(tt.name)
			assert.Equal(t, tt.expected, category)
		})
	}
}

func TestPersonaDetector_SuperClaudeFormat(t *testing.T) {
	detector := NewPersonaDetector()
	
	// Create test directory with SuperClaude format
	testDir := t.TempDir()
	claudeDir := filepath.Join(testDir, ".claude", "shared")
	os.MkdirAll(claudeDir, 0755)
	
	// Copy test file
	testData, _ := os.ReadFile("../../testdata/superclaude/superclaude-format-test.yml")
	os.WriteFile(filepath.Join(claudeDir, "superclaude-personas.yml"), testData, 0644)
	
	personas, err := detector.Detect(testDir)
	
	assert.NoError(t, err)
	assert.Len(t, personas, 2, "Should find 2 personas")
	
	// Check architect persona
	found := false
	for _, p := range personas {
		if p.Name == "architect" {
			found = true
			assert.Contains(t, p.Description, "Systems architect")
			assert.Contains(t, p.SystemPrompt, "Systems evolve")
			assert.Contains(t, p.Tools, "sequential")
			assert.Contains(t, p.Tools, "research")
			assert.Equal(t, "claude-3-opus", p.Model)
			break
		}
	}
	assert.True(t, found, "architect persona should be found")
	
	// Check frontend persona
	found = false
	for _, p := range personas {
		if p.Name == "frontend" {
			found = true
			assert.Contains(t, p.Description, "UX specialist")
			assert.Contains(t, p.Tools, "magic")
			assert.Contains(t, p.Tools, "browser")
			break
		}
	}
	assert.True(t, found, "frontend persona should be found")
}