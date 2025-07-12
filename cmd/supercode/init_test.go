package main

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/spf13/cobra"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestInitCommand(t *testing.T) {
	// Create temporary home directory
	tempHome := t.TempDir()
	os.Setenv("HOME", tempHome)
	defer os.Unsetenv("HOME")

	tests := []struct {
		name      string
		args      []string
		flags     map[string]string
		wantError bool
		checkFunc func(t *testing.T, configDir string)
	}{
		{
			name: "basic init",
			args: []string{},
			checkFunc: func(t *testing.T, configDir string) {
				// Check directories exist
				assert.DirExists(t, configDir)
				assert.DirExists(t, filepath.Join(configDir, "workspace"))
				assert.DirExists(t, filepath.Join(configDir, "templates"))
				assert.DirExists(t, filepath.Join(configDir, "logs"))
				
				// Check config file
				configPath := filepath.Join(configDir, "config.yaml")
				assert.FileExists(t, configPath)
				
				// Check example template
				templatePath := filepath.Join(configDir, "templates", "example.tmpl")
				assert.FileExists(t, templatePath)
			},
		},
		{
			name: "init with existing config",
			args: []string{},
			checkFunc: func(t *testing.T, configDir string) {
				// Create config first
				configPath := filepath.Join(configDir, "config.yaml")
				os.MkdirAll(configDir, 0755)
				os.WriteFile(configPath, []byte("existing"), 0644)
				
				// Run init
				cmd := &cobra.Command{RunE: runInit}
				err := runInit(cmd, []string{})
				assert.NoError(t, err)
				
				// Check that config wasn't overwritten
				content, _ := os.ReadFile(configPath)
				assert.Equal(t, "existing", string(content))
			},
		},
		{
			name:  "init with force flag",
			args:  []string{},
			flags: map[string]string{"force": "true"},
			checkFunc: func(t *testing.T, configDir string) {
				// Create config first
				configPath := filepath.Join(configDir, "config.yaml")
				os.MkdirAll(configDir, 0755)
				os.WriteFile(configPath, []byte("existing"), 0644)
				
				// Run init with force
				cmd := &cobra.Command{RunE: runInit}
				cmd.Flags().Bool("force", true, "")
				cmd.Flags().Set("force", "true")
				err := runInit(cmd, []string{})
				assert.NoError(t, err)
				
				// Check that config was overwritten
				content, _ := os.ReadFile(configPath)
				assert.Contains(t, string(content), "version:")
			},
		},
		{
			name:  "init with show flag",
			args:  []string{},
			flags: map[string]string{"show": "true"},
			checkFunc: func(t *testing.T, configDir string) {
				// Just check it runs without error
				cmd := &cobra.Command{RunE: runInit}
				cmd.Flags().Bool("show", true, "")
				cmd.Flags().Set("show", "true")
				err := runInit(cmd, []string{})
				assert.NoError(t, err)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Clean up any existing config
			configDir := filepath.Join(tempHome, ".supercode")
			os.RemoveAll(configDir)
			
			// Create command
			cmd := &cobra.Command{RunE: runInit}
			
			// Set flags
			for flag, value := range tt.flags {
				cmd.Flags().Bool(flag, false, "")
				cmd.Flags().Set(flag, value)
			}
			
			// Run command
			err := runInit(cmd, tt.args)
			
			if tt.wantError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}
			
			if tt.checkFunc != nil {
				tt.checkFunc(t, configDir)
			}
		})
	}
}

func TestInitConfig(t *testing.T) {
	tempHome := t.TempDir()
	os.Setenv("HOME", tempHome)
	defer os.Unsetenv("HOME")
	
	// Create test config
	configDir := filepath.Join(tempHome, ".supercode")
	os.MkdirAll(configDir, 0755)
	
	configContent := `version: "1.0"
repos:
  superclaude: "test-repo"
`
	configPath := filepath.Join(configDir, "config.yaml")
	os.WriteFile(configPath, []byte(configContent), 0644)
	
	// Test config loading
	cfgFile = ""
	initConfig()
	
	// Verify viper loaded the config
	// (In actual implementation, we'd check viper values)
}