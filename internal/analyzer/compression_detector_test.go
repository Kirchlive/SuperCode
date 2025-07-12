package analyzer

import (
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCompressionDetector(t *testing.T) {
	// Create YAML parser
	yamlParser := NewYAMLParser()

	tests := []struct {
		name     string
		repoPath string
		wantErr  bool
		validate func(t *testing.T, config *CompressionConfig)
	}{
		{
			name:     "detect compression with default config",
			repoPath: filepath.Join("testdata", "superclaude"),
			wantErr:  false,
			validate: func(t *testing.T, config *CompressionConfig) {
				assert.NotNil(t, config)
				assert.True(t, config.Enabled)
				assert.Contains(t, config.Flags, "--uc")
				assert.Contains(t, config.Flags, "--ultracompressed")
				assert.Equal(t, 0.7, config.PerformanceTarget)
			},
		},
		{
			name:     "detect with empty repo",
			repoPath: filepath.Join("testdata", "empty"),
			wantErr:  false,
			validate: func(t *testing.T, config *CompressionConfig) {
				assert.NotNil(t, config)
				// Should return default config
				assert.True(t, config.Enabled)
				assert.Len(t, config.Flags, 2)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			detector := NewCompressionDetector(yamlParser)
			config, err := detector.Detect(tt.repoPath)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				tt.validate(t, config)
			}
		})
	}
}

func TestCompressionDetector_isCompressionSection(t *testing.T) {
	detector := NewCompressionDetector(nil)

	tests := []struct {
		name     string
		section  string
		expected bool
	}{
		{"compression section", "Compression_Settings", true},
		{"ultracompressed section", "UltraCompressed_Mode", true},
		{"token section", "Token_Reduction", true},
		{"uc mode section", "UC_Mode_Config", true},
		{"unrelated section", "General_Settings", false},
		{"empty section", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := detector.isCompressionSection(tt.section)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestCompressionDetector_ValidateConfig(t *testing.T) {
	detector := NewCompressionDetector(nil)

	tests := []struct {
		name    string
		config  *CompressionConfig
		wantErr bool
		errMsg  string
	}{
		{
			name:    "nil config",
			config:  nil,
			wantErr: true,
			errMsg:  "compression config is nil",
		},
		{
			name: "no flags",
			config: &CompressionConfig{
				Enabled:           true,
				Flags:             []string{},
				PerformanceTarget: 0.7,
			},
			wantErr: true,
			errMsg:  "no compression flags defined",
		},
		{
			name: "invalid performance target - too low",
			config: &CompressionConfig{
				Enabled:           true,
				Flags:             []string{"--uc"},
				PerformanceTarget: 0,
			},
			wantErr: true,
			errMsg:  "invalid performance target",
		},
		{
			name: "invalid performance target - too high",
			config: &CompressionConfig{
				Enabled:           true,
				Flags:             []string{"--uc"},
				PerformanceTarget: 1.5,
			},
			wantErr: true,
			errMsg:  "invalid performance target",
		},
		{
			name: "valid config",
			config: &CompressionConfig{
				Enabled:           true,
				Flags:             []string{"--uc", "--ultracompressed"},
				PerformanceTarget: 0.7,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := detector.ValidateConfig(tt.config)
			if tt.wantErr {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestCompressionDetector_extractCompressionConfig(t *testing.T) {
	detector := NewCompressionDetector(nil)

	// Test extraction creates proper config
	config := detector.extractCompressionConfig(map[string]interface{}{
		"enabled": true,
		"flags":   []string{"--uc"},
	})

	assert.NotNil(t, config)
	assert.True(t, config.Enabled)
	assert.Contains(t, config.Flags, "--uc")
	assert.Contains(t, config.Flags, "--ultracompressed")

	// Verify triggers
	assert.NotEmpty(t, config.Triggers.ExplicitFlags)
	assert.NotEmpty(t, config.Triggers.NaturalLanguage)
	assert.Contains(t, config.Triggers.NaturalLanguage, "compress")
	assert.Contains(t, config.Triggers.NaturalLanguage, "concise")

	// Verify rules
	assert.NotEmpty(t, config.Rules.WordRemoval)
	assert.Contains(t, config.Rules.WordRemoval, "the")
	assert.NotEmpty(t, config.Rules.Symbols)
	assert.Equal(t, "→", config.Rules.Symbols["leads to"])
	assert.NotEmpty(t, config.Rules.Abbreviations)
	assert.Equal(t, "cfg", config.Rules.Abbreviations["configuration"])

	// Verify pipeline
	assert.NotEmpty(t, config.Pipeline.Phase1Structure)
	assert.NotEmpty(t, config.Pipeline.Phase2Language)
	assert.NotEmpty(t, config.Pipeline.Phase3Technical)

	// Verify templates
	assert.NotEmpty(t, config.Templates)
	assert.Contains(t, config.Templates, "status")
	assert.Contains(t, config.Templates, "progress")
}

func TestCompressionDetector_createDefaultConfig(t *testing.T) {
	detector := NewCompressionDetector(nil)
	config := detector.createDefaultConfig()

	assert.NotNil(t, config)
	assert.True(t, config.Enabled)
	assert.Contains(t, config.Flags, "--uc")
	assert.Contains(t, config.Flags, "--ultracompressed")
	assert.Equal(t, 0.7, config.PerformanceTarget)

	// Verify basic structure
	assert.NotEmpty(t, config.Triggers.ExplicitFlags)
	assert.NotEmpty(t, config.Triggers.NaturalLanguage)
	assert.NotEmpty(t, config.Rules.WordRemoval)
	assert.NotEmpty(t, config.Rules.Symbols)
	assert.NotEmpty(t, config.Rules.Abbreviations)
}