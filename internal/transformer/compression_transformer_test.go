package transformer

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
	"github.com/Kirchlive/SuperCode/internal/generator"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCompressionTransformer_Transform(t *testing.T) {
	// Create temp directory for test output
	tempDir, err := os.MkdirTemp("", "compression-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	generator := generator.New()
	transformer := NewCompressionTransformer(generator)

	tests := []struct {
		name    string
		config  *analyzer.CompressionConfig
		wantErr bool
		validate func(t *testing.T, outputDir string)
	}{
		{
			name:    "nil config returns without error",
			config:  nil,
			wantErr: false,
			validate: func(t *testing.T, outputDir string) {
				// Should not create any files
				files, err := os.ReadDir(filepath.Join(outputDir, "packages", "opencode", "src", "compression"))
				if err == nil {
					assert.Empty(t, files)
				}
			},
		},
		{
			name: "disabled config returns without error",
			config: &analyzer.CompressionConfig{
				Enabled: false,
			},
			wantErr: false,
			validate: func(t *testing.T, outputDir string) {
				// Should not create any files
				files, err := os.ReadDir(filepath.Join(outputDir, "packages", "opencode", "src", "compression"))
				if err == nil {
					assert.Empty(t, files)
				}
			},
		},
		{
			name: "enabled config generates all files",
			config: &analyzer.CompressionConfig{
				Enabled: true,
				Flags:   []string{"--uc", "--ultracompressed"},
				Triggers: analyzer.CompressionTriggers{
					ExplicitFlags:   []string{"--uc", "--ultracompressed"},
					NaturalLanguage: []string{"compress", "concise", "brief"},
				},
				Rules: analyzer.CompressionRules{
					WordRemoval: []string{"the", "a", "an"},
					Symbols: map[string]string{
						"and": "&",
						"or":  "|",
					},
					Abbreviations: map[string]string{
						"configuration": "cfg",
						"implementation": "impl",
					},
				},
				PerformanceTarget: 0.7,
			},
			wantErr: false,
			validate: func(t *testing.T, outputDir string) {
				compressionDir := filepath.Join(outputDir, "packages", "opencode", "src", "compression")
				
				// Check for all expected files
				expectedFiles := []string{
					"compression-preprocessor.ts",
					"compression-rules.ts",
					"compression-utils.ts",
					"compression-flags.ts",
					"compression.test.ts",
				}

				for _, fileName := range expectedFiles {
					filePath := filepath.Join(compressionDir, fileName)
					assert.FileExists(t, filePath, "Expected file %s not found", fileName)
					
					// Check file is not empty
					content, err := os.ReadFile(filePath)
					require.NoError(t, err)
					assert.NotEmpty(t, content)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a unique output dir for each test
			outputDir := filepath.Join(tempDir, tt.name)
			
			err := transformer.Transform(tt.config, outputDir)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				tt.validate(t, outputDir)
			}
		})
	}
}

func TestCompressionTransformer_FileContent(t *testing.T) {
	// Create temp directory for test output
	tempDir, err := os.MkdirTemp("", "compression-content-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	generator := generator.New()
	transformer := NewCompressionTransformer(generator)
	
	config := &analyzer.CompressionConfig{
		Enabled: true,
		Triggers: analyzer.CompressionTriggers{
			NaturalLanguage: []string{"compress", "concise", "brief"},
		},
		Rules: analyzer.CompressionRules{
			WordRemoval: []string{"the", "a", "an"},
			Symbols: map[string]string{
				"and":       "&",
				"or":        "|",
				"leads to":  "→",
				"success":   "✅",
			},
			Abbreviations: map[string]string{
				"configuration":  "cfg",
				"implementation": "impl",
				"application":    "app",
			},
		},
	}

	err = transformer.Transform(config, tempDir)
	require.NoError(t, err)
	
	compressionDir := filepath.Join(tempDir, "packages", "opencode", "src", "compression")
	
	t.Run("preprocessor content", func(t *testing.T) {
		content, err := os.ReadFile(filepath.Join(compressionDir, "compression-preprocessor.ts"))
		require.NoError(t, err)
		
		// Verify content includes key elements
		assert.Contains(t, string(content), "class CompressionPreprocessor")
		assert.Contains(t, string(content), "enable()")
		assert.Contains(t, string(content), "compress(text: string)")
		assert.Contains(t, string(content), "phase1Structure")
		assert.Contains(t, string(content), "phase2Language")
		assert.Contains(t, string(content), "phase3Technical")
		assert.Contains(t, string(content), "'compress'")
		assert.Contains(t, string(content), "'concise'")
		assert.Contains(t, string(content), "'brief'")
	})
	
	t.Run("rules content", func(t *testing.T) {
		content, err := os.ReadFile(filepath.Join(compressionDir, "compression-rules.ts"))
		require.NoError(t, err)
		
		// Verify content includes rules
		assert.Contains(t, string(content), "class CompressionRules")
		assert.Contains(t, string(content), "'the', 'a', 'an'")
		assert.Contains(t, string(content), "'and': '&'")
		assert.Contains(t, string(content), "'or': '|'")
		assert.Contains(t, string(content), "'leads to': '→'")
		assert.Contains(t, string(content), "'success': '✅'")
		assert.Contains(t, string(content), "'configuration': 'cfg'")
		assert.Contains(t, string(content), "'implementation': 'impl'")
		assert.Contains(t, string(content), "'application': 'app'")
	})
	
	t.Run("utilities content", func(t *testing.T) {
		content, err := os.ReadFile(filepath.Join(compressionDir, "compression-utils.ts"))
		require.NoError(t, err)
		
		// Verify content includes utilities
		assert.Contains(t, string(content), "class CompressionUtils")
		assert.Contains(t, string(content), "convertToStructured")
		assert.Contains(t, string(content), "optimizeTables")
		assert.Contains(t, string(content), "compressLists")
		assert.Contains(t, string(content), "compressPatterns")
		assert.Contains(t, string(content), "preserveContext")
	})
	
	t.Run("flag integration content", func(t *testing.T) {
		content, err := os.ReadFile(filepath.Join(compressionDir, "compression-flags.ts"))
		require.NoError(t, err)
		
		// Verify content includes flag integration
		assert.Contains(t, string(content), "interface CompressionFlags")
		assert.Contains(t, string(content), "ultracompressed?: boolean")
		assert.Contains(t, string(content), "uc?: boolean")
		assert.Contains(t, string(content), "class CompressionFlagHandler")
		assert.Contains(t, string(content), "--uc, --ultracompressed")
		assert.Contains(t, string(content), "Enable UltraCompressed mode")
	})
	
	t.Run("tests content", func(t *testing.T) {
		content, err := os.ReadFile(filepath.Join(compressionDir, "compression.test.ts"))
		require.NoError(t, err)
		
		// Verify test content
		assert.Contains(t, string(content), "describe('Compression Feature'")
		assert.Contains(t, string(content), "CompressionPreprocessor")
		assert.Contains(t, string(content), "CompressionRules")
		assert.Contains(t, string(content), "CompressionUtils")
		assert.Contains(t, string(content), "should not compress when disabled")
		assert.Contains(t, string(content), "should compress when enabled")
		assert.Contains(t, string(content), "should achieve target compression ratio")
	})
}