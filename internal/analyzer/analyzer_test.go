package analyzer

import (
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