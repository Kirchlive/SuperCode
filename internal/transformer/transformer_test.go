package transformer

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPersonaTransformer_Transform(t *testing.T) {
	transformer := NewPersonaTransformer()
	ctx := &TransformationContext{
		SourceRepo: "/test/superclaude",
		TargetRepo: "/test/opencode",
		DryRun:     false,
		Verbose:    true,
	}

	personas := []analyzer.Persona{
		{
			Name:         "architect",
			Description:  "System architecture specialist",
			SystemPrompt: "You are a system architect",
			Model:        "claude-3-opus",
			Temperature:  0.7,
			Tools:        []string{"sequential", "research"},
			AutoActivate: []string{"*.architecture.md"},
		},
	}

	results, err := transformer.Transform(personas, ctx)
	require.NoError(t, err)
	assert.NotEmpty(t, results)

	// Check TypeScript provider file
	var tsResult *TransformResult
	for _, r := range results {
		if r.Type == "typescript" && strings.Contains(r.Path, "provider") {
			tsResult = &r
			break
		}
	}

	require.NotNil(t, tsResult)
	assert.Contains(t, tsResult.Content, "export class PersonaProvider")
	assert.Contains(t, tsResult.Content, "architect")
	assert.Contains(t, tsResult.Content, "claude-3-opus-20240229") // Mapped model

	// Check JSON config
	var jsonResult *TransformResult
	for _, r := range results {
		if r.Type == "json" && strings.Contains(r.Path, "architect.json") {
			jsonResult = &r
			break
		}
	}

	require.NotNil(t, jsonResult)
	
	var config ProviderConfig
	err = json.Unmarshal([]byte(jsonResult.Content), &config)
	require.NoError(t, err)
	assert.Equal(t, "persona-architect", config.Name)
	assert.Equal(t, "personas", config.Type)
}

func TestCommandTransformer_Transform(t *testing.T) {
	transformer := NewCommandTransformer()
	ctx := &TransformationContext{
		SourceRepo: "/test/superclaude",
		TargetRepo: "/test/opencode",
	}

	commands := []analyzer.Command{
		{
			Name:     "build",
			Purpose:  "Build a project",
			Category: "development",
			Flags: map[string]analyzer.Flag{
				"framework": {
					Name:        "framework",
					Type:        "string",
					Description: "Target framework",
				},
				"typescript": {
					Name:        "typescript", 
					Type:        "boolean",
					Description: "Use TypeScript",
				},
			},
			Examples: []analyzer.Example{
				{
					Command:     "/build --framework react",
					Description: "Build React app",
				},
			},
		},
	}

	results, err := transformer.Transform(commands, ctx)
	require.NoError(t, err)
	assert.NotEmpty(t, results)

	// Check command file
	var cmdResult *TransformResult
	for _, r := range results {
		if strings.Contains(r.Path, "sc-build.ts") {
			cmdResult = &r
			break
		}
	}

	require.NotNil(t, cmdResult)
	assert.Contains(t, cmdResult.Content, "export default defineCommand")
	assert.Contains(t, cmdResult.Content, "sc-build")
	assert.Contains(t, cmdResult.Content, "framework")
	assert.Contains(t, cmdResult.Content, "typescript")

	// Check universal flags
	var flagsResult *TransformResult
	for _, r := range results {
		if strings.Contains(r.Path, "universal.ts") {
			flagsResult = &r
			break
		}
	}

	require.NotNil(t, flagsResult)
	assert.Contains(t, flagsResult.Content, "UniversalFlags")
	assert.Contains(t, flagsResult.Content, "think")
	assert.Contains(t, flagsResult.Content, "ultrathink")
	assert.Contains(t, flagsResult.Content, "persona")
}

func TestEngine_TransformAll(t *testing.T) {
	ctx := &TransformationContext{
		SourceRepo: "/test/superclaude",
		TargetRepo: "/test/opencode",
		Verbose:    true,
	}

	engine := NewEngine(ctx)
	
	detectionResult := &analyzer.DetectionResult{
		Personas: []analyzer.Persona{
			{
				Name:         "frontend",
				Description:  "UI specialist",
				SystemPrompt: "You are a frontend expert",
				Model:        "claude-3-sonnet",
				Temperature:  0.8,
				Tools:        []string{"magic", "browser"},
			},
		},
		Commands: []analyzer.Command{
			{
				Name:     "test",
				Purpose:  "Run tests",
				Category: "development",
				Flags:    map[string]analyzer.Flag{},
			},
		},
	}

	result, err := engine.TransformAll(detectionResult)
	require.NoError(t, err)
	assert.NotEmpty(t, result.Files)
	assert.Empty(t, result.Errors)

	// Verify we got files for both personas and commands
	tsFiles := result.GetFilesByType("typescript")
	jsonFiles := result.GetFilesByType("json")
	
	assert.NotEmpty(t, tsFiles)
	assert.NotEmpty(t, jsonFiles)
}

func TestPersonaTransformer_mapModel(t *testing.T) {
	transformer := NewPersonaTransformer()

	tests := []struct {
		input    string
		expected string
	}{
		{"claude-3-opus", "claude-3-opus-20240229"},
		{"claude-3-sonnet", "claude-3-sonnet-20240229"},
		{"claude-3-haiku", "claude-3-haiku-20240307"},
		{"custom-model", "custom-model"}, // Unknown models pass through
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := transformer.mapModel(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestCommandTransformer_convertToYargsCommand(t *testing.T) {
	transformer := NewCommandTransformer()

	cmd := analyzer.Command{
		Name:     "deploy",
		Purpose:  "Deploy application",
		Category: "operations",
		Flags: map[string]analyzer.Flag{
			"environment": {
				Name:        "environment",
				Type:        "string",
				Description: "Target environment",
				Choices:     []string{"dev", "staging", "prod"},
			},
		},
		Examples: []analyzer.Example{
			{
				Command:     "/deploy --environment prod",
				Description: "Deploy to production",
			},
		},
	}

	yargs := transformer.convertToYargsCommand(cmd)

	assert.Equal(t, "sc-deploy", yargs.Name)
	assert.Equal(t, "Deploy application", yargs.Description)
	assert.Equal(t, "operations", yargs.Category)
	assert.Contains(t, yargs.Aliases, "d")
	
	// Check flag conversion
	envFlag, ok := yargs.Flags["environment"]
	require.True(t, ok)
	assert.Equal(t, "string", envFlag.Type)
	assert.Equal(t, []string{"dev", "staging", "prod"}, envFlag.Choices)

	// Check example conversion
	assert.Contains(t, yargs.Examples[0], "opencode sc-deploy")
	assert.NotContains(t, yargs.Examples[0], "/deploy")
}