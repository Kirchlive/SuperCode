package builder

import (
	"time"
)

// Builder handles the build process for the generated code
type Builder interface {
	PrepareEnvironment() error
	InstallDependencies() error
	CompileTypeScript() error
	BuildBinary() error
	RunTests() error
	Clean() error
}

// BuildConfig contains configuration for the build process
type BuildConfig struct {
	WorkDir          string   // Working directory for build
	OutputDir        string   // Output directory for artifacts
	OpenCodePath     string   // Path to OpenCode repository
	GeneratedPath    string   // Path to generated files
	BuildTags        []string // Build tags for Go compilation
	Verbose          bool     // Verbose output
	SkipTests        bool     // Skip test execution
	SkipTypeScript   bool     // Skip TypeScript compilation
	Clean            bool     // Clean build artifacts
	PackageManager   string   // npm, yarn, pnpm, or bun
}

// BuildResult represents the result of a build operation
type BuildResult struct {
	Success         bool
	TypeScriptBuilt bool
	BinaryPath      string
	TestsPassed     bool
	Duration        time.Duration
	Errors          []BuildError
}

// BuildError represents an error during the build process
type BuildError struct {
	Phase   string // "setup", "dependencies", "typescript", "binary", "tests"
	Command string
	Error   error
	Output  string
}

// TypeScriptConfig represents TypeScript build configuration
type TypeScriptConfig struct {
	TsconfigPath string
	OutDir       string
	SourceMap    bool
	Declaration  bool
	Target       string // es2020, es2022, etc.
	Module       string // commonjs, esnext, etc.
}

// DependencyManager handles package installation
type DependencyManager interface {
	DetectPackageManager(projectPath string) (string, error)
	InstallDependencies(projectPath string, packageManager string) error
	AddDependency(projectPath string, dependency string, dev bool) error
}

// Environment represents the build environment
type Environment struct {
	NodeVersion    string
	BunVersion     string
	GoVersion      string
	TypeScriptPath string
	HasBun         bool
	HasNode        bool
	HasGo          bool
}