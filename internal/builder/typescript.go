package builder

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// TypeScriptBuilder handles TypeScript compilation
type TypeScriptBuilder struct {
	config *BuildConfig
}

// NewTypeScriptBuilder creates a new TypeScript builder
func NewTypeScriptBuilder(config *BuildConfig) *TypeScriptBuilder {
	return &TypeScriptBuilder{
		config: config,
	}
}

// PrepareTypeScriptEnvironment sets up the TypeScript build environment
func (b *TypeScriptBuilder) PrepareTypeScriptEnvironment() error {
	// Copy generated files to OpenCode project
	srcDir := b.config.GeneratedPath
	destDir := b.config.OpenCodePath

	if b.config.Verbose {
		fmt.Printf("Copying generated files from %s to %s\n", srcDir, destDir)
	}

	// Walk through generated files and copy them
	return filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Calculate relative path
		relPath, err := filepath.Rel(srcDir, path)
		if err != nil {
			return err
		}

		// Destination path
		destPath := filepath.Join(destDir, relPath)

		// Create destination directory
		destDir := filepath.Dir(destPath)
		if err := os.MkdirAll(destDir, 0755); err != nil {
			return fmt.Errorf("creating directory %s: %w", destDir, err)
		}

		// Copy file
		if err := copyFile(path, destPath); err != nil {
			return fmt.Errorf("copying %s: %w", relPath, err)
		}

		if b.config.Verbose {
			fmt.Printf("  Copied: %s\n", relPath)
		}

		return nil
	})
}

// UpdateTypeScriptConfig updates tsconfig.json to include new files
func (b *TypeScriptBuilder) UpdateTypeScriptConfig() error {
	tsconfigPath := filepath.Join(b.config.OpenCodePath, "tsconfig.json")
	
	// Read existing tsconfig
	data, err := os.ReadFile(tsconfigPath)
	if err != nil {
		// If tsconfig doesn't exist, create a basic one
		if os.IsNotExist(err) {
			return b.createDefaultTsConfig(tsconfigPath)
		}
		return fmt.Errorf("reading tsconfig.json: %w", err)
	}

	// Parse JSON
	var tsconfig map[string]interface{}
	if err := json.Unmarshal(data, &tsconfig); err != nil {
		return fmt.Errorf("parsing tsconfig.json: %w", err)
	}

	// Update include paths if needed
	if include, ok := tsconfig["include"].([]interface{}); ok {
		// Check if our paths are already included
		hasCliCmd := false
		for _, path := range include {
			if str, ok := path.(string); ok && strings.Contains(str, "src/cli/cmd") {
				hasCliCmd = true
				break
			}
		}

		// Add our paths if not present
		if !hasCliCmd {
			include = append(include, "src/cli/cmd/**/*", "src/cli/flags/**/*", "src/provider/personas/**/*")
			tsconfig["include"] = include
		}
	}

	// Write updated config
	updatedData, err := json.MarshalIndent(tsconfig, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling tsconfig.json: %w", err)
	}

	if err := os.WriteFile(tsconfigPath, updatedData, 0644); err != nil {
		return fmt.Errorf("writing tsconfig.json: %w", err)
	}

	if b.config.Verbose {
		fmt.Println("Updated tsconfig.json")
	}

	return nil
}

// CompileTypeScript runs TypeScript compilation
func (b *TypeScriptBuilder) CompileTypeScript() error {
	if b.config.SkipTypeScript {
		if b.config.Verbose {
			fmt.Println("Skipping TypeScript compilation")
		}
		return nil
	}

	// Detect package manager
	packageManager := b.detectPackageManager()
	
	// Run TypeScript compilation
	var cmd *exec.Cmd
	switch packageManager {
	case "bun":
		cmd = exec.Command("bun", "run", "build")
	case "pnpm":
		cmd = exec.Command("pnpm", "run", "build")
	case "yarn":
		cmd = exec.Command("yarn", "build")
	default:
		cmd = exec.Command("npm", "run", "build")
	}

	cmd.Dir = b.config.OpenCodePath
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if b.config.Verbose {
		fmt.Printf("Running TypeScript build with %s...\n", packageManager)
	}

	if err := cmd.Run(); err != nil {
		// Try direct tsc if build script fails
		return b.runDirectTypeScriptCompiler()
	}

	return nil
}

// runDirectTypeScriptCompiler runs tsc directly as fallback
func (b *TypeScriptBuilder) runDirectTypeScriptCompiler() error {
	// Try different ways to run TypeScript compiler
	commands := [][]string{
		{"npx", "tsc"},
		{"bunx", "tsc"},
		{"tsc"},
	}

	for _, cmdArgs := range commands {
		cmd := exec.Command(cmdArgs[0], cmdArgs[1:]...)
		cmd.Dir = b.config.OpenCodePath
		
		if b.config.Verbose {
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			fmt.Printf("Trying: %s\n", strings.Join(cmdArgs, " "))
		}

		if err := cmd.Run(); err == nil {
			return nil
		}
	}

	return fmt.Errorf("TypeScript compilation failed with all methods")
}

// detectPackageManager detects which package manager to use
func (b *TypeScriptBuilder) detectPackageManager() string {
	// Check for lock files
	checks := []struct {
		file    string
		manager string
	}{
		{"bun.lockb", "bun"},
		{"pnpm-lock.yaml", "pnpm"},
		{"yarn.lock", "yarn"},
		{"package-lock.json", "npm"},
	}

	for _, check := range checks {
		if _, err := os.Stat(filepath.Join(b.config.OpenCodePath, check.file)); err == nil {
			return check.manager
		}
	}

	// Check if package manager is specified in config
	if b.config.PackageManager != "" {
		return b.config.PackageManager
	}

	// Default to npm
	return "npm"
}

// createDefaultTsConfig creates a basic tsconfig.json
func (b *TypeScriptBuilder) createDefaultTsConfig(path string) error {
	defaultConfig := map[string]interface{}{
		"compilerOptions": map[string]interface{}{
			"target":     "ES2022",
			"module":     "commonjs",
			"lib":        []string{"ES2022"},
			"outDir":     "./dist",
			"rootDir":    "./src",
			"strict":     true,
			"esModuleInterop": true,
			"skipLibCheck": true,
			"forceConsistentCasingInFileNames": true,
			"resolveJsonModule": true,
			"declaration": true,
			"declarationMap": true,
			"sourceMap": true,
		},
		"include": []string{
			"src/**/*",
			"src/cli/cmd/**/*",
			"src/cli/flags/**/*",
			"src/provider/personas/**/*",
		},
		"exclude": []string{
			"node_modules",
			"dist",
			"**/*.test.ts",
			"**/*.spec.ts",
		},
	}

	data, err := json.MarshalIndent(defaultConfig, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}

// copyFile copies a file from src to dst
func copyFile(src, dst string) error {
	input, err := os.ReadFile(src)
	if err != nil {
		return err
	}

	return os.WriteFile(dst, input, 0644)
}