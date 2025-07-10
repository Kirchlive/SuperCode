package main

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestVersion(t *testing.T) {
	// Test that version variables are set
	assert.NotEmpty(t, Version, "Version should not be empty")
}

func TestRootCommand(t *testing.T) {
	// Test that root command can be created
	assert.NotNil(t, rootCmd, "Root command should not be nil")
	assert.Equal(t, "supercode", rootCmd.Use, "Root command should be 'supercode'")
}

func TestCommands(t *testing.T) {
	// Test that subcommands are registered
	commands := rootCmd.Commands()
	
	// Map to track which commands we found
	foundCommands := make(map[string]bool)
	for _, cmd := range commands {
		// Extract command name without arguments
		cmdName := cmd.Use
		if spaceIdx := strings.Index(cmdName, " "); spaceIdx > 0 {
			cmdName = cmdName[:spaceIdx]
		}
		foundCommands[cmdName] = true
	}
	
	// Check expected commands
	expectedCommands := []string{"merge", "init", "detect"}
	for _, expected := range expectedCommands {
		assert.True(t, foundCommands[expected], "Command '%s' should be registered", expected)
	}
}