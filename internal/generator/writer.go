package generator

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// DefaultWriter implements FileWriter with standard file operations
type DefaultWriter struct {
	config *GeneratorConfig
}

// NewDefaultWriter creates a new file writer
func NewDefaultWriter(config *GeneratorConfig) *DefaultWriter {
	return &DefaultWriter{
		config: config,
	}
}

// WriteFile writes content to the specified path
func (w *DefaultWriter) WriteFile(path string, content []byte, mode FileMode) error {
	// In dry-run mode, just log what would be written
	if w.config.DryRun {
		if w.config.Verbose {
			fmt.Printf("[DRY-RUN] Would write %d bytes to %s\n", len(content), path)
		}
		return nil
	}

	// Ensure output directory exists
	fullPath := filepath.Join(w.config.OutputDir, path)
	dir := filepath.Dir(fullPath)
	
	if err := w.CreateDirectory(dir); err != nil {
		return fmt.Errorf("creating directory: %w", err)
	}

	// Backup existing file if requested
	if w.config.CreateBackups && w.Exists(fullPath) {
		if err := w.BackupFile(fullPath); err != nil {
			return fmt.Errorf("backing up file: %w", err)
		}
	}

	// Write the file
	if err := os.WriteFile(fullPath, content, os.FileMode(mode)); err != nil {
		return fmt.Errorf("writing file: %w", err)
	}

	if w.config.Verbose {
		fmt.Printf("Wrote %d bytes to %s\n", len(content), fullPath)
	}

	return nil
}

// CreateDirectory creates a directory and all parent directories
func (w *DefaultWriter) CreateDirectory(path string) error {
	if w.config.DryRun {
		if w.config.Verbose {
			fmt.Printf("[DRY-RUN] Would create directory: %s\n", path)
		}
		return nil
	}

	if !filepath.IsAbs(path) {
		path = filepath.Join(w.config.OutputDir, path)
	}

	if err := os.MkdirAll(path, 0755); err != nil {
		return fmt.Errorf("creating directory %s: %w", path, err)
	}

	return nil
}

// BackupFile creates a backup of an existing file
func (w *DefaultWriter) BackupFile(path string) error {
	if w.config.DryRun {
		if w.config.Verbose {
			fmt.Printf("[DRY-RUN] Would backup: %s\n", path)
		}
		return nil
	}

	// Read original file
	content, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("reading file for backup: %w", err)
	}

	// Create backup filename with timestamp
	timestamp := time.Now().Format("20060102-150405")
	backupName := fmt.Sprintf("%s.%s.backup", filepath.Base(path), timestamp)
	
	// Determine backup path
	var backupPath string
	if w.config.BackupDir != "" {
		// Use specified backup directory
		if err := w.CreateDirectory(w.config.BackupDir); err != nil {
			return fmt.Errorf("creating backup directory: %w", err)
		}
		backupPath = filepath.Join(w.config.BackupDir, backupName)
	} else {
		// Use same directory as original file
		backupPath = filepath.Join(filepath.Dir(path), backupName)
	}

	// Write backup
	if err := os.WriteFile(backupPath, content, 0644); err != nil {
		return fmt.Errorf("writing backup: %w", err)
	}

	// Preserve timestamps if requested
	if w.config.PreserveTime {
		if stat, err := os.Stat(path); err == nil {
			os.Chtimes(backupPath, stat.ModTime(), stat.ModTime())
		}
	}

	if w.config.Verbose {
		fmt.Printf("Backed up %s to %s\n", path, backupPath)
	}

	return nil
}

// Exists checks if a file or directory exists
func (w *DefaultWriter) Exists(path string) bool {
	if !filepath.IsAbs(path) {
		path = filepath.Join(w.config.OutputDir, path)
	}
	
	_, err := os.Stat(path)
	return err == nil
}

// WriteTransformResults writes all transformation results to disk
func WriteTransformResults(results []interface{}, config *GeneratorConfig) (*GenerationResult, error) {
	writer := NewDefaultWriter(config)
	genResult := &GenerationResult{
		StartTime: time.Now(),
	}

	// Process each result
	for _, result := range results {
		// Type assert to get the actual result type
		// This would normally come from the transformer package
		type TransformResult struct {
			Type     string
			Path     string
			Content  string
			Metadata map[string]interface{}
		}
		
		tr, ok := result.(TransformResult)
		if !ok {
			// Handle the case where we have a pointer or different type
			if trPtr, ok := result.(*TransformResult); ok {
				tr = *trPtr
			} else {
				continue
			}
		}

		// Determine file mode based on type
		mode := FileModeNormal
		if tr.Type == "executable" {
			mode = FileModeExecutable
		} else if strings.Contains(tr.Path, "config") || strings.Contains(tr.Path, "secret") {
			mode = FileModeConfig
		}

		// Check if file should be merged with existing
		if merge, ok := tr.Metadata["merge"].(bool); ok && merge {
			if writer.Exists(tr.Path) && !config.Force {
				genResult.FilesSkipped = append(genResult.FilesSkipped, tr.Path)
				if config.Verbose {
					fmt.Printf("Skipping %s (merge required, use --force to overwrite)\n", tr.Path)
				}
				continue
			}
		}

		// Write the file
		if err := writer.WriteFile(tr.Path, []byte(tr.Content), mode); err != nil {
			genResult.Errors = append(genResult.Errors, GenerationError{
				Path:  tr.Path,
				Error: err,
				Phase: "write",
			})
			continue
		}

		genResult.FilesWritten = append(genResult.FilesWritten, tr.Path)
	}

	genResult.EndTime = time.Now()
	return genResult, nil
}

// CleanupBackups removes old backup files
func CleanupBackups(backupDir string, keepDays int) error {
	if backupDir == "" {
		return nil
	}

	cutoff := time.Now().AddDate(0, 0, -keepDays)
	
	return filepath.Walk(backupDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		
		// Skip directories and non-backup files
		if info.IsDir() || !strings.HasSuffix(path, ".backup") {
			return nil
		}
		
		// Remove old backups
		if info.ModTime().Before(cutoff) {
			if err := os.Remove(path); err != nil {
				return fmt.Errorf("removing old backup %s: %w", path, err)
			}
		}
		
		return nil
	})
}

// CopyFile copies a file from src to dst
func CopyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return err
	}

	// Copy file permissions
	sourceInfo, err := os.Stat(src)
	if err == nil {
		err = os.Chmod(dst, sourceInfo.Mode())
	}
	
	return err
}