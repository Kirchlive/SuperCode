package downloader

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewDownloader(t *testing.T) {
	d := NewDownloader("/tmp/test", true)
	assert.NotNil(t, d)
	assert.Equal(t, "/tmp/test", d.TargetDir)
	assert.Equal(t, "https://github.com/NomenAK/SuperClaude.git", d.SuperClaudeRepo)
	assert.Equal(t, "https://github.com/sst/opencode.git", d.OpenCodeRepo)
	assert.True(t, d.verbose)
}

func TestDownloader_DownloadAll(t *testing.T) {
	// Skip this test in CI since it requires network access
	if os.Getenv("CI") == "true" {
		t.Skip("Skipping test in CI environment")
	}

	// Create temporary directory for test
	tempDir, err := os.MkdirTemp("", "supercode-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	d := NewDownloader(tempDir, false)

	// Test download
	err = d.DownloadAll()
	assert.NoError(t, err)

	// Verify repositories were downloaded
	superClaudePath := filepath.Join(tempDir, "SuperClaude")
	openCodePath := filepath.Join(tempDir, "OpenCode")

	assert.DirExists(t, superClaudePath)
	assert.DirExists(t, openCodePath)

	// Verify git repositories
	assert.FileExists(t, filepath.Join(superClaudePath, ".git", "config"))
	assert.FileExists(t, filepath.Join(openCodePath, ".git", "config"))
}

func TestDownloader_Clean(t *testing.T) {
	// Create temporary directory
	tempDir, err := os.MkdirTemp("", "supercode-test-*")
	require.NoError(t, err)

	// Create some test files
	testFile := filepath.Join(tempDir, "test.txt")
	err = os.WriteFile(testFile, []byte("test"), 0644)
	require.NoError(t, err)

	d := NewDownloader(tempDir, false)

	// Clean should remove the directory
	err = d.Clean()
	assert.NoError(t, err)
	assert.NoDirExists(t, tempDir)
}

func TestDownloader_downloadRepo_Existing(t *testing.T) {
	// Create temporary directory
	tempDir, err := os.MkdirTemp("", "supercode-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a mock existing repo directory
	repoPath := filepath.Join(tempDir, "TestRepo")
	err = os.MkdirAll(filepath.Join(repoPath, ".git"), 0755)
	require.NoError(t, err)

	d := NewDownloader(tempDir, false)

	// This should attempt to update the existing repo
	// For unit testing, we expect it to fail since it's not a real git repo
	err = d.downloadRepo("TestRepo", "https://example.com/test.git")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to open repository")
}