package generator

import (
	"fmt"
	"path/filepath"
	"time"

	"github.com/Kirchlive/SuperCode/internal/transformer"
)

// Generator coordinates the code generation process
type Generator struct {
	config *GeneratorConfig
	writer FileWriter
}

// NewGenerator creates a new generator
func NewGenerator(config *GeneratorConfig) *Generator {
	return &Generator{
		config: config,
		writer: NewDefaultWriter(config),
	}
}

// Generate writes all transformation results to disk
func (g *Generator) Generate(transformResults []transformer.TransformResult) (*GenerationResult, error) {
	result := &GenerationResult{
		StartTime: time.Now(),
	}

	if g.config.Verbose {
		fmt.Printf("Generating %d files to %s\n", len(transformResults), g.config.OutputDir)
		if g.config.DryRun {
			fmt.Println("[DRY-RUN MODE] No files will be written")
		}
	}

	// Group files by type for organized output
	filesByType := g.groupFilesByType(transformResults)

	// Process TypeScript files
	if tsFiles, ok := filesByType["typescript"]; ok {
		if err := g.processTypeScriptFiles(tsFiles, result); err != nil {
			return result, fmt.Errorf("processing TypeScript files: %w", err)
		}
	}

	// Process JSON configuration files
	if jsonFiles, ok := filesByType["json"]; ok {
		if err := g.processJSONFiles(jsonFiles, result); err != nil {
			return result, fmt.Errorf("processing JSON files: %w", err)
		}
	}

	// Process other file types
	for fileType, files := range filesByType {
		if fileType != "typescript" && fileType != "json" {
			if err := g.processGenericFiles(files, fileType, result); err != nil {
				return result, fmt.Errorf("processing %s files: %w", fileType, err)
			}
		}
	}

	result.EndTime = time.Now()

	// Print summary
	if g.config.Verbose {
		g.printSummary(result)
	}

	return result, nil
}

// groupFilesByType organizes transform results by file type
func (g *Generator) groupFilesByType(results []transformer.TransformResult) map[string][]transformer.TransformResult {
	groups := make(map[string][]transformer.TransformResult)
	
	for _, result := range results {
		groups[result.Type] = append(groups[result.Type], result)
	}
	
	return groups
}

// processTypeScriptFiles handles TypeScript file generation
func (g *Generator) processTypeScriptFiles(files []transformer.TransformResult, result *GenerationResult) error {
	// Ensure TypeScript directories exist
	tsDirs := []string{
		"packages/opencode/src/cli/cmd",
		"packages/opencode/src/cli/flags",
		"packages/opencode/src/provider/personas",
	}
	
	for _, dir := range tsDirs {
		if err := g.writer.CreateDirectory(dir); err != nil {
			result.Errors = append(result.Errors, GenerationError{
				Path:  dir,
				Error: err,
				Phase: "create_dir",
			})
		}
	}

	// Write TypeScript files
	for _, file := range files {
		if err := g.writeFile(file, FileModeNormal, result); err != nil {
			continue // Error already recorded in writeFile
		}
	}

	return nil
}

// processJSONFiles handles JSON configuration file generation
func (g *Generator) processJSONFiles(files []transformer.TransformResult, result *GenerationResult) error {
	// Ensure config directories exist
	configDirs := []string{
		"configs/personas",
		"configs/mcp",
	}
	
	for _, dir := range configDirs {
		if err := g.writer.CreateDirectory(dir); err != nil {
			result.Errors = append(result.Errors, GenerationError{
				Path:  dir,
				Error: err,
				Phase: "create_dir",
			})
		}
	}

	// Write JSON files
	for _, file := range files {
		// Check if this is a merge file
		if merge, ok := file.Metadata["merge"].(bool); ok && merge {
			if g.writer.Exists(file.Path) && !g.config.Force {
				result.FilesSkipped = append(result.FilesSkipped, file.Path)
				if g.config.Verbose {
					fmt.Printf("Skipping %s (requires merge, use --force to overwrite)\n", file.Path)
				}
				continue
			}
		}

		if err := g.writeFile(file, FileModeConfig, result); err != nil {
			continue // Error already recorded in writeFile
		}
	}

	return nil
}

// processGenericFiles handles other file types
func (g *Generator) processGenericFiles(files []transformer.TransformResult, fileType string, result *GenerationResult) error {
	for _, file := range files {
		mode := FileModeNormal
		if fileType == "executable" || fileType == "script" {
			mode = FileModeExecutable
		}

		if err := g.writeFile(file, mode, result); err != nil {
			continue // Error already recorded in writeFile
		}
	}

	return nil
}

// writeFile writes a single file and updates the result
func (g *Generator) writeFile(file transformer.TransformResult, mode FileMode, result *GenerationResult) error {
	// Backup existing file if needed
	fullPath := filepath.Join(g.config.OutputDir, file.Path)
	if g.config.CreateBackups && g.writer.Exists(fullPath) {
		if err := g.writer.BackupFile(fullPath); err != nil {
			result.Errors = append(result.Errors, GenerationError{
				Path:  file.Path,
				Error: err,
				Phase: "backup",
			})
		} else {
			result.FilesBackedUp = append(result.FilesBackedUp, file.Path)
		}
	}

	// Write the file
	if err := g.writer.WriteFile(file.Path, []byte(file.Content), mode); err != nil {
		result.Errors = append(result.Errors, GenerationError{
			Path:  file.Path,
			Error: err,
			Phase: "write",
		})
		return err
	}

	result.FilesWritten = append(result.FilesWritten, file.Path)
	return nil
}

// printSummary prints a summary of the generation results
func (g *Generator) printSummary(result *GenerationResult) {
	duration := result.EndTime.Sub(result.StartTime)
	
	fmt.Println("\n=== Generation Summary ===")
	fmt.Printf("Duration: %v\n", duration.Round(time.Millisecond))
	fmt.Printf("Files written: %d\n", len(result.FilesWritten))
	
	if len(result.FilesSkipped) > 0 {
		fmt.Printf("Files skipped: %d\n", len(result.FilesSkipped))
	}
	
	if len(result.FilesBackedUp) > 0 {
		fmt.Printf("Files backed up: %d\n", len(result.FilesBackedUp))
	}
	
	if len(result.Errors) > 0 {
		fmt.Printf("Errors: %d\n", len(result.Errors))
		for _, err := range result.Errors {
			fmt.Printf("  - %s (%s): %v\n", err.Path, err.Phase, err.Error)
		}
	}
	
	if g.config.DryRun {
		fmt.Println("\n[DRY-RUN] No files were actually written")
	}
}

// ValidateOutput checks if the generated output is valid
func (g *Generator) ValidateOutput() error {
	// Check required directories exist
	requiredDirs := []string{
		"packages/opencode/src/cli/cmd",
		"packages/opencode/src/cli/flags",
		"packages/opencode/src/provider/personas",
	}

	for _, dir := range requiredDirs {
		fullPath := filepath.Join(g.config.OutputDir, dir)
		if !g.writer.Exists(fullPath) {
			return fmt.Errorf("required directory missing: %s", dir)
		}
	}

	// Check for key files
	keyFiles := []string{
		"packages/opencode/src/cli/cmd/supercode-index.ts",
		"packages/opencode/src/cli/flags/universal.ts",
	}

	for _, file := range keyFiles {
		fullPath := filepath.Join(g.config.OutputDir, file)
		if !g.writer.Exists(fullPath) {
			return fmt.Errorf("required file missing: %s", file)
		}
	}

	return nil
}