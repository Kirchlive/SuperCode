package transformer

import (
	"fmt"
	"log"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
)

// Engine coordinates all transformation operations
type Engine struct {
	personaTransformer *PersonaTransformer
	commandTransformer *CommandTransformer
	context            *TransformationContext
}

// NewEngine creates a new transformation engine
func NewEngine(ctx *TransformationContext) *Engine {
	return &Engine{
		personaTransformer: NewPersonaTransformer(),
		commandTransformer: NewCommandTransformer(),
		context:            ctx,
	}
}

// TransformAll transforms all detected features
func (e *Engine) TransformAll(detectionResult *analyzer.DetectionResult) (*TransformationResult, error) {
	result := &TransformationResult{
		Files:  []TransformResult{},
		Errors: []error{},
	}

	// Transform personas
	if len(detectionResult.Personas) > 0 {
		log.Printf("Transforming %d personas...", len(detectionResult.Personas))
		personaResults, err := e.personaTransformer.Transform(detectionResult.Personas, e.context)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Errorf("persona transformation: %w", err))
		} else {
			result.Files = append(result.Files, personaResults...)
			log.Printf("Generated %d files for personas", len(personaResults))
		}
	}

	// Transform commands
	if len(detectionResult.Commands) > 0 {
		log.Printf("Transforming %d commands...", len(detectionResult.Commands))
		commandResults, err := e.commandTransformer.Transform(detectionResult.Commands, e.context)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Errorf("command transformation: %w", err))
		} else {
			result.Files = append(result.Files, commandResults...)
			log.Printf("Generated %d files for commands", len(commandResults))
		}
	}

	// TODO: Transform MCP servers
	// TODO: Transform compression settings

	// Validate all results
	for _, file := range result.Files {
		if err := e.validateResult(file); err != nil {
			result.Errors = append(result.Errors, fmt.Errorf("validation failed for %s: %w", file.Path, err))
		}
	}

	return result, nil
}

// validateResult validates a single transformation result
func (e *Engine) validateResult(result TransformResult) error {
	// Use the appropriate transformer for validation
	switch result.Type {
	case "typescript":
		if result.Metadata["personas"] != nil {
			return e.personaTransformer.Validate(result)
		}
		if result.Metadata["command"] != nil {
			return e.commandTransformer.Validate(result)
		}
	case "json":
		// JSON validation is done in transformers
		return nil
	}

	return nil
}

// PrintSummary prints a summary of transformation results
func (e *Engine) PrintSummary(result *TransformationResult) {
	fmt.Println("\n=== Transformation Summary ===")
	
	// Group files by type
	typeCount := make(map[string]int)
	for _, file := range result.Files {
		typeCount[file.Type]++
	}

	fmt.Printf("\nGenerated Files (%d):\n", len(result.Files))
	for fileType, count := range typeCount {
		fmt.Printf("  - %s files: %d\n", fileType, count)
	}

	// List specific files
	fmt.Println("\nFile List:")
	for _, file := range result.Files {
		size := len(file.Content)
		fmt.Printf("  - %s (%s, %d bytes)\n", file.Path, file.Type, size)
	}

	if len(result.Errors) > 0 {
		fmt.Printf("\nErrors (%d):\n", len(result.Errors))
		for _, err := range result.Errors {
			fmt.Printf("  - %v\n", err)
		}
	}
}

// TransformationResult holds all transformation results
type TransformationResult struct {
	Files  []TransformResult
	Errors []error
}

// GetFilesByType returns all files of a specific type
func (r *TransformationResult) GetFilesByType(fileType string) []TransformResult {
	var files []TransformResult
	for _, file := range r.Files {
		if file.Type == fileType {
			files = append(files, file)
		}
	}
	return files
}

// GetFileByPath returns a file by its path
func (r *TransformationResult) GetFileByPath(path string) *TransformResult {
	for _, file := range r.Files {
		if file.Path == path {
			return &file
		}
	}
	return nil
}