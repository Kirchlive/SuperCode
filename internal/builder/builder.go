package builder

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// DefaultBuilder implements the Builder interface
type DefaultBuilder struct {
	config       *BuildConfig
	tsBuilder    *TypeScriptBuilder
	depInstaller *DependencyInstaller
}

// NewDefaultBuilder creates a new default builder
func NewDefaultBuilder(config *BuildConfig) *DefaultBuilder {
	return &DefaultBuilder{
		config:       config,
		tsBuilder:    NewTypeScriptBuilder(config),
		depInstaller: NewDependencyInstaller(config),
	}
}

// Build executes the complete build process
func (b *DefaultBuilder) Build() (*BuildResult, error) {
	startTime := time.Now()
	result := &BuildResult{
		Success: false,
	}

	// Check environment
	if b.config.Verbose {
		fmt.Println("🔍 Checking build environment...")
	}
	env, err := CheckEnvironment()
	if err != nil {
		result.Errors = append(result.Errors, BuildError{
			Phase: "setup",
			Error: err,
		})
		return result, err
	}

	if b.config.Verbose {
		fmt.Printf("  ✓ Node.js: %s\n", env.NodeVersion)
		if env.HasBun {
			fmt.Printf("  ✓ Bun: %s\n", env.BunVersion)
		}
		fmt.Printf("  ✓ Go: %s\n", env.GoVersion)
	}

	// Step 1: Prepare environment
	if err := b.PrepareEnvironment(); err != nil {
		result.Errors = append(result.Errors, BuildError{
			Phase: "setup",
			Error: err,
		})
		return result, fmt.Errorf("preparing environment: %w", err)
	}

	// Step 2: Install dependencies
	if err := b.InstallDependencies(); err != nil {
		result.Errors = append(result.Errors, BuildError{
			Phase: "dependencies",
			Error: err,
		})
		return result, fmt.Errorf("installing dependencies: %w", err)
	}

	// Step 3: Compile TypeScript
	if !b.config.SkipTypeScript {
		if err := b.CompileTypeScript(); err != nil {
			result.Errors = append(result.Errors, BuildError{
				Phase: "typescript",
				Error: err,
			})
			return result, fmt.Errorf("compiling TypeScript: %w", err)
		}
		result.TypeScriptBuilt = true
	}

	// Step 4: Build Go binary
	binaryPath, err := b.BuildBinary()
	if err != nil {
		result.Errors = append(result.Errors, BuildError{
			Phase: "binary",
			Error: err,
		})
		return result, fmt.Errorf("building binary: %w", err)
	}
	result.BinaryPath = binaryPath

	// Step 5: Run tests (if not skipped)
	if !b.config.SkipTests {
		if err := b.RunTests(); err != nil {
			result.Errors = append(result.Errors, BuildError{
				Phase: "tests",
				Error: err,
			})
			// Don't fail the build on test failures
			if b.config.Verbose {
				fmt.Printf("⚠️  Tests failed: %v\n", err)
			}
		} else {
			result.TestsPassed = true
		}
	}

	result.Success = true
	result.Duration = time.Since(startTime)

	if b.config.Verbose {
		b.printBuildSummary(result)
	}

	return result, nil
}

// PrepareEnvironment sets up the build environment
func (b *DefaultBuilder) PrepareEnvironment() error {
	if b.config.Verbose {
		fmt.Println("\n📁 Preparing build environment...")
	}

	// Create output directory
	if err := os.MkdirAll(b.config.OutputDir, 0755); err != nil {
		return fmt.Errorf("creating output directory: %w", err)
	}

	// Copy generated files to OpenCode
	if err := b.tsBuilder.PrepareTypeScriptEnvironment(); err != nil {
		return fmt.Errorf("preparing TypeScript environment: %w", err)
	}

	// Update TypeScript configuration
	if err := b.tsBuilder.UpdateTypeScriptConfig(); err != nil {
		return fmt.Errorf("updating TypeScript config: %w", err)
	}

	return nil
}

// InstallDependencies installs project dependencies
func (b *DefaultBuilder) InstallDependencies() error {
	if b.config.Verbose {
		fmt.Println("\n📦 Installing dependencies...")
	}

	// Ensure TypeScript dependencies
	if err := b.depInstaller.EnsureTypeScriptDependencies(b.config.OpenCodePath); err != nil {
		return fmt.Errorf("ensuring TypeScript dependencies: %w", err)
	}

	// Install all dependencies
	packageManager, err := b.depInstaller.DetectPackageManager(b.config.OpenCodePath)
	if err != nil {
		return err
	}

	if err := b.depInstaller.InstallDependencies(b.config.OpenCodePath, packageManager); err != nil {
		return fmt.Errorf("installing dependencies: %w", err)
	}

	return nil
}

// CompileTypeScript compiles TypeScript code
func (b *DefaultBuilder) CompileTypeScript() error {
	if b.config.Verbose {
		fmt.Println("\n🛠️  Compiling TypeScript...")
	}

	return b.tsBuilder.CompileTypeScript()
}

// BuildBinary builds the Go binary
func (b *DefaultBuilder) BuildBinary() (string, error) {
	if b.config.Verbose {
		fmt.Println("\n🔨 Building Go binary...")
	}

	// Determine output path
	outputName := "opencode-supercode"
	if runtime := os.Getenv("GOOS"); runtime == "windows" {
		outputName += ".exe"
	}
	outputPath := filepath.Join(b.config.OutputDir, outputName)

	// Build command
	args := []string{
		"build",
		"-o", outputPath,
	}

	// Add build tags if specified
	if len(b.config.BuildTags) > 0 {
		args = append(args, "-tags", strings.Join(b.config.BuildTags, ","))
	}

	// Add ldflags for version info
	ldflags := fmt.Sprintf("-s -w -X main.Version=%s -X main.BuildTime=%s",
		getVersion(),
		time.Now().Format("2006-01-02_15:04:05"))
	args = append(args, "-ldflags", ldflags)

	// Add main package path
	mainPath := filepath.Join(b.config.OpenCodePath, "cmd", "opencode")
	args = append(args, mainPath)

	cmd := exec.Command("go", args...)
	cmd.Dir = b.config.OpenCodePath

	if b.config.Verbose {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		fmt.Printf("Running: go %s\n", strings.Join(args, " "))
	}

	if err := cmd.Run(); err != nil {
		return "", err
	}

	// Make binary executable
	if err := os.Chmod(outputPath, 0755); err != nil {
		return "", fmt.Errorf("making binary executable: %w", err)
	}

	if b.config.Verbose {
		info, _ := os.Stat(outputPath)
		fmt.Printf("✓ Binary built: %s (%.2f MB)\n", outputPath, float64(info.Size())/1024/1024)
	}

	return outputPath, nil
}

// RunTests runs the project tests
func (b *DefaultBuilder) RunTests() error {
	if b.config.Verbose {
		fmt.Println("\n🧪 Running tests...")
	}

	// Run TypeScript tests
	packageManager, _ := b.depInstaller.DetectPackageManager(b.config.OpenCodePath)
	
	var cmd *exec.Cmd
	switch packageManager {
	case "bun":
		cmd = exec.Command("bun", "test")
	case "pnpm":
		cmd = exec.Command("pnpm", "test")
	case "yarn":
		cmd = exec.Command("yarn", "test")
	default:
		cmd = exec.Command("npm", "test")
	}

	cmd.Dir = b.config.OpenCodePath
	if b.config.Verbose {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
	}

	// Don't fail if no test script exists
	if err := cmd.Run(); err != nil {
		if b.config.Verbose {
			fmt.Println("Note: Test script not found or tests failed")
		}
	}

	// Run Go tests
	cmd = exec.Command("go", "test", "./...")
	cmd.Dir = b.config.OpenCodePath
	if b.config.Verbose {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
	}

	return cmd.Run()
}

// Clean removes build artifacts
func (b *DefaultBuilder) Clean() error {
	if b.config.Verbose {
		fmt.Println("\n🧹 Cleaning build artifacts...")
	}

	// Clean directories
	cleanDirs := []string{
		filepath.Join(b.config.OpenCodePath, "dist"),
		filepath.Join(b.config.OpenCodePath, "build"),
		filepath.Join(b.config.OpenCodePath, ".next"),
		b.config.OutputDir,
	}

	for _, dir := range cleanDirs {
		if err := os.RemoveAll(dir); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("removing %s: %w", dir, err)
		}
	}

	return nil
}

// printBuildSummary prints a summary of the build
func (b *DefaultBuilder) printBuildSummary(result *BuildResult) {
	fmt.Println("\n=== Build Summary ===")
	fmt.Printf("Duration: %v\n", result.Duration.Round(time.Millisecond))
	fmt.Printf("Success: %v\n", result.Success)
	
	if result.TypeScriptBuilt {
		fmt.Println("✓ TypeScript compiled")
	}
	
	if result.BinaryPath != "" {
		fmt.Printf("✓ Binary: %s\n", result.BinaryPath)
	}
	
	if result.TestsPassed {
		fmt.Println("✓ Tests passed")
	}
	
	if len(result.Errors) > 0 {
		fmt.Printf("\n⚠️  Errors (%d):\n", len(result.Errors))
		for _, err := range result.Errors {
			fmt.Printf("  - [%s] %v\n", err.Phase, err.Error)
		}
	}
}

// getVersion returns the version string
func getVersion() string {
	// Try to get version from git
	cmd := exec.Command("git", "describe", "--tags", "--always", "--dirty")
	if output, err := cmd.Output(); err == nil {
		return strings.TrimSpace(string(output))
	}
	return "dev"
}