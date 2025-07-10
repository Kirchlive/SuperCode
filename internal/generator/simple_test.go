package generator

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSimpleGenerator(t *testing.T) {
	// Create temp directory for tests
	tempDir, err := os.MkdirTemp("", "generator-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	g := New()

	t.Run("WriteFile", func(t *testing.T) {
		content := []byte("test content")
		path := filepath.Join(tempDir, "test.txt")

		err := g.WriteFile(path, content)
		assert.NoError(t, err)

		// Verify file was written
		written, err := os.ReadFile(path)
		assert.NoError(t, err)
		assert.Equal(t, content, written)

		// Verify file permissions
		info, err := os.Stat(path)
		assert.NoError(t, err)
		assert.Equal(t, os.FileMode(0644), info.Mode().Perm())
	})

	t.Run("WriteFile with nested directories", func(t *testing.T) {
		content := []byte("nested content")
		path := filepath.Join(tempDir, "nested", "deep", "test.txt")

		err := g.WriteFile(path, content)
		assert.NoError(t, err)

		// Verify file was written
		written, err := os.ReadFile(path)
		assert.NoError(t, err)
		assert.Equal(t, content, written)
	})

	t.Run("EnsureDir", func(t *testing.T) {
		path := filepath.Join(tempDir, "ensure", "nested", "dir")

		err := g.EnsureDir(path)
		assert.NoError(t, err)

		// Verify directory was created
		info, err := os.Stat(path)
		assert.NoError(t, err)
		assert.True(t, info.IsDir())
	})

	t.Run("EnsureDir with existing directory", func(t *testing.T) {
		path := filepath.Join(tempDir, "existing")
		
		// Create directory first
		err := os.MkdirAll(path, 0755)
		require.NoError(t, err)

		// Ensure it again (should not error)
		err = g.EnsureDir(path)
		assert.NoError(t, err)
	})
}