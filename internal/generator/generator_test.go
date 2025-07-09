package generator

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Kirchlive/SuperCode/internal/transformer"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDefaultWriter(t *testing.T) {
	// Create temp directory for tests
	tempDir, err := os.MkdirTemp("", "generator-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	config := &GeneratorConfig{
		OutputDir:     tempDir,
		CreateBackups: true,
		Verbose:       false,
	}

	writer := NewDefaultWriter(config)

	t.Run("WriteFile", func(t *testing.T) {
		content := []byte("test content")
		path := "test.txt"

		err := writer.WriteFile(path, content, FileModeNormal)
		assert.NoError(t, err)

		// Verify file was written
		fullPath := filepath.Join(tempDir, path)
		assert.True(t, writer.Exists(fullPath))

		// Verify content
		written, err := os.ReadFile(fullPath)
		assert.NoError(t, err)
		assert.Equal(t, content, written)
	})

	t.Run("CreateDirectory", func(t *testing.T) {
		path := "nested/deep/dir"
		
		err := writer.CreateDirectory(path)
		assert.NoError(t, err)

		// Verify directory was created
		fullPath := filepath.Join(tempDir, path)
		info, err := os.Stat(fullPath)
		assert.NoError(t, err)
		assert.True(t, info.IsDir())
	})

	t.Run("BackupFile", func(t *testing.T) {
		// Create a file to backup
		path := "backup-test.txt"
		content := []byte("original content")
		fullPath := filepath.Join(tempDir, path)
		
		err := os.WriteFile(fullPath, content, 0644)
		require.NoError(t, err)

		// Backup the file
		err = writer.BackupFile(fullPath)
		assert.NoError(t, err)

		// Verify backup was created
		files, err := os.ReadDir(tempDir)
		assert.NoError(t, err)
		
		backupFound := false
		for _, file := range files {
			if strings.Contains(file.Name(), "backup-test.txt") && strings.HasSuffix(file.Name(), ".backup") {
				backupFound = true
				break
			}
		}
		assert.True(t, backupFound, "Backup file not found")
	})

	t.Run("DryRun", func(t *testing.T) {
		dryRunConfig := &GeneratorConfig{
			OutputDir: tempDir,
			DryRun:    true,
			Verbose:   false,
		}
		dryWriter := NewDefaultWriter(dryRunConfig)

		// Try to write a file in dry-run mode
		err := dryWriter.WriteFile("dryrun.txt", []byte("should not exist"), FileModeNormal)
		assert.NoError(t, err)

		// Verify file was NOT written
		assert.False(t, dryWriter.Exists("dryrun.txt"))
	})
}

func TestGenerator(t *testing.T) {
	// Create temp directory for tests
	tempDir, err := os.MkdirTemp("", "generator-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	config := &GeneratorConfig{
		OutputDir:     tempDir,
		CreateBackups: false,
		Verbose:       false,
	}

	generator := NewGenerator(config)

	t.Run("Generate TypeScript Files", func(t *testing.T) {
		results := []transformer.TransformResult{
			{
				Type:    "typescript",
				Path:    "packages/opencode/src/cli/cmd/test-command.ts",
				Content: "export default function() {}",
			},
			{
				Type:    "typescript",
				Path:    "packages/opencode/src/cli/flags/test-flags.ts",
				Content: "export const flags = {}",
			},
		}

		genResult, err := generator.Generate(results)
		assert.NoError(t, err)
		assert.Len(t, genResult.FilesWritten, 2)
		assert.Empty(t, genResult.Errors)

		// Verify files exist
		for _, result := range results {
			fullPath := filepath.Join(tempDir, result.Path)
			assert.True(t, generator.writer.Exists(fullPath))
		}
	})

	t.Run("Generate JSON Files", func(t *testing.T) {
		results := []transformer.TransformResult{
			{
				Type:    "json",
				Path:    "configs/personas/test.json",
				Content: `{"name": "test"}`,
			},
			{
				Type:    "json",
				Path:    "opencode.supercode.json",
				Content: `{"supercode": {}}`,
				Metadata: map[string]interface{}{
					"merge": true,
				},
			},
		}

		genResult, err := generator.Generate(results)
		assert.NoError(t, err)
		assert.Len(t, genResult.FilesWritten, 2)
		assert.Empty(t, genResult.Errors)
	})

	t.Run("Skip Merge Files Without Force", func(t *testing.T) {
		// Create an existing file
		mergePath := "merge-test.json"
		fullPath := filepath.Join(tempDir, mergePath)
		err := os.WriteFile(fullPath, []byte(`{"existing": true}`), 0644)
		require.NoError(t, err)

		results := []transformer.TransformResult{
			{
				Type:    "json",
				Path:    mergePath,
				Content: `{"new": true}`,
				Metadata: map[string]interface{}{
					"merge": true,
				},
			},
		}

		genResult, err := generator.Generate(results)
		assert.NoError(t, err)
		assert.Len(t, genResult.FilesSkipped, 1)
		assert.Empty(t, genResult.FilesWritten)

		// Verify original content unchanged
		content, err := os.ReadFile(fullPath)
		assert.NoError(t, err)
		assert.Contains(t, string(content), "existing")
	})

	t.Run("Validate Output", func(t *testing.T) {
		// Create required structure
		results := []transformer.TransformResult{
			{
				Type:    "typescript",
				Path:    "packages/opencode/src/cli/cmd/supercode-index.ts",
				Content: "export {}",
			},
			{
				Type:    "typescript", 
				Path:    "packages/opencode/src/cli/flags/universal.ts",
				Content: "export {}",
			},
		}

		_, err := generator.Generate(results)
		require.NoError(t, err)

		// Validate output structure
		err = generator.ValidateOutput()
		assert.NoError(t, err)
	})
}

func TestGroupFilesByType(t *testing.T) {
	generator := NewGenerator(&GeneratorConfig{})
	
	results := []transformer.TransformResult{
		{Type: "typescript", Path: "file1.ts"},
		{Type: "typescript", Path: "file2.ts"},
		{Type: "json", Path: "config.json"},
		{Type: "yaml", Path: "data.yml"},
	}

	groups := generator.groupFilesByType(results)
	
	assert.Len(t, groups["typescript"], 2)
	assert.Len(t, groups["json"], 1)
	assert.Len(t, groups["yaml"], 1)
}