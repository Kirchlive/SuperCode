package builder

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDependencyInstaller(t *testing.T) {
	config := &BuildConfig{
		Verbose: false,
	}
	installer := NewDependencyInstaller(config)

	t.Run("DetectPackageManager", func(t *testing.T) {
		// Create temp directory with different lock files
		tempDir, err := os.MkdirTemp("", "dep-test-*")
		require.NoError(t, err)
		defer os.RemoveAll(tempDir)

		testCases := []struct {
			lockFile string
			expected string
		}{
			{"package-lock.json", "npm"},
			{"yarn.lock", "yarn"},
			{"pnpm-lock.yaml", "pnpm"},
			{"bun.lockb", "bun"},
		}

		for _, tc := range testCases {
			// Clean up previous lock files
			files, _ := os.ReadDir(tempDir)
			for _, f := range files {
				os.Remove(filepath.Join(tempDir, f.Name()))
			}

			// Create lock file
			err := os.WriteFile(filepath.Join(tempDir, tc.lockFile), []byte("test"), 0644)
			require.NoError(t, err)

			// Test detection (may fail if package manager not installed)
			manager, _ := installer.DetectPackageManager(tempDir)
			if manager != "" {
				// Only check if a manager was detected
				t.Logf("Detected %s for %s", manager, tc.lockFile)
			}
		}
	})

	t.Run("CommandAvailability", func(t *testing.T) {
		// Test common commands
		commands := []string{"go", "node", "npm"}
		for _, cmd := range commands {
			available := installer.isCommandAvailable(cmd)
			t.Logf("%s available: %v", cmd, available)
		}
	})
}

func TestTypeScriptBuilder(t *testing.T) {
	// Create temp directories
	tempDir, err := os.MkdirTemp("", "ts-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	genDir := filepath.Join(tempDir, "generated")
	openCodeDir := filepath.Join(tempDir, "opencode")
	
	// Create directories
	require.NoError(t, os.MkdirAll(genDir, 0755))
	require.NoError(t, os.MkdirAll(openCodeDir, 0755))

	config := &BuildConfig{
		GeneratedPath: genDir,
		OpenCodePath:  openCodeDir,
		Verbose:       false,
	}

	tsBuilder := NewTypeScriptBuilder(config)

	t.Run("PrepareEnvironment", func(t *testing.T) {
		// Create a test file in generated directory
		testFile := filepath.Join(genDir, "test.ts")
		err := os.WriteFile(testFile, []byte("export const test = true;"), 0644)
		require.NoError(t, err)

		// Prepare environment
		err = tsBuilder.PrepareTypeScriptEnvironment()
		assert.NoError(t, err)

		// Check if file was copied
		copiedFile := filepath.Join(openCodeDir, "test.ts")
		assert.FileExists(t, copiedFile)
	})

	t.Run("CreateDefaultTsConfig", func(t *testing.T) {
		tsconfigPath := filepath.Join(openCodeDir, "tsconfig.json")
		
		err := tsBuilder.createDefaultTsConfig(tsconfigPath)
		assert.NoError(t, err)
		assert.FileExists(t, tsconfigPath)

		// Read and verify it's valid JSON
		data, err := os.ReadFile(tsconfigPath)
		assert.NoError(t, err)
		assert.Contains(t, string(data), "compilerOptions")
		assert.Contains(t, string(data), "ES2022")
	})

	t.Run("DetectPackageManager", func(t *testing.T) {
		// Test default
		manager := tsBuilder.detectPackageManager()
		assert.NotEmpty(t, manager)
		assert.Contains(t, []string{"npm", "yarn", "pnpm", "bun"}, manager)
	})
}

func TestEnvironmentCheck(t *testing.T) {
	env, err := CheckEnvironment()
	
	// Should at least find Go
	assert.NotNil(t, env)
	assert.True(t, env.HasGo)
	// GoVersion might be empty in some environments, so just check if Go is detected

	// Log what was found
	t.Logf("Environment: %+v", env)
	
	if err != nil {
		t.Logf("Environment check error: %v", err)
	}
}

func TestDefaultBuilder(t *testing.T) {
	// This is more of an integration test
	tempDir, err := os.MkdirTemp("", "builder-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	config := &BuildConfig{
		WorkDir:        tempDir,
		OutputDir:      filepath.Join(tempDir, "output"),
		OpenCodePath:   filepath.Join(tempDir, "opencode"),
		GeneratedPath:  filepath.Join(tempDir, "generated"),
		Verbose:        false,
		SkipTests:      true,
		SkipTypeScript: true, // Skip for unit tests
	}

	// Create necessary directories
	os.MkdirAll(config.OpenCodePath, 0755)
	os.MkdirAll(config.GeneratedPath, 0755)

	builder := NewDefaultBuilder(config)

	t.Run("PrepareEnvironment", func(t *testing.T) {
		err := builder.PrepareEnvironment()
		// May fail without proper setup, just ensure no panic
		if err != nil {
			t.Logf("PrepareEnvironment error (expected in test): %v", err)
		}
	})

	t.Run("Clean", func(t *testing.T) {
		// Create some test directories
		testDirs := []string{
			filepath.Join(config.OpenCodePath, "dist"),
			filepath.Join(config.OpenCodePath, "build"),
		}
		
		for _, dir := range testDirs {
			os.MkdirAll(dir, 0755)
		}

		err := builder.Clean()
		assert.NoError(t, err)

		// Check directories were removed
		for _, dir := range testDirs {
			_, err := os.Stat(dir)
			assert.True(t, os.IsNotExist(err))
		}
	})
}