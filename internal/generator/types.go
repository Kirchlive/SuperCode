package generator

import (
	"time"
)

// FileWriter handles writing transformation results to disk
type FileWriter interface {
	WriteFile(path string, content []byte, mode FileMode) error
	CreateDirectory(path string) error
	BackupFile(path string) error
	Exists(path string) bool
}

// FileMode represents file permissions
type FileMode int

const (
	FileModeNormal FileMode = 0644
	FileModeExecutable FileMode = 0755
	FileModeConfig FileMode = 0600
)

// GeneratorConfig contains configuration for code generation
type GeneratorConfig struct {
	OutputDir        string
	BackupDir        string
	DryRun          bool
	Force           bool
	CreateBackups   bool
	PreserveTime    bool
	Verbose         bool
}

// GenerationResult represents the result of generating files
type GenerationResult struct {
	FilesWritten   []string
	FilesSkipped   []string
	FilesBackedUp  []string
	Errors         []GenerationError
	StartTime      time.Time
	EndTime        time.Time
}

// GenerationError represents an error during generation
type GenerationError struct {
	Path    string
	Error   error
	Phase   string // "backup", "create_dir", "write"
}

// BuildConfig represents configuration for building the final binary
type BuildConfig struct {
	SourceDir      string
	OutputPath     string
	GOOS          string
	GOARCH        string
	BuildTags     []string
	LDFlags       string
	Verbose       bool
}

// BuildResult represents the result of building
type BuildResult struct {
	BinaryPath   string
	Size         int64
	BuildTime    time.Duration
	Success      bool
	Error        error
}