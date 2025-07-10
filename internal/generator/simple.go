package generator

import (
	"fmt"
	"os"
	"path/filepath"
)

// Generator handles file generation
type Generator struct{}

// New creates a new generator
func New() *Generator {
	return &Generator{}
}

// WriteFile writes content to a file, creating directories as needed
func (g *Generator) WriteFile(filePath string, content []byte) error {
	// Create directory if it doesn't exist
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", dir, err)
	}

	// Write file
	if err := os.WriteFile(filePath, content, 0644); err != nil {
		return fmt.Errorf("failed to write file %s: %w", filePath, err)
	}

	return nil
}

// EnsureDir creates a directory if it doesn't exist
func (g *Generator) EnsureDir(path string) error {
	return os.MkdirAll(path, 0755)
}