package builder

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// DependencyInstaller handles package installation
type DependencyInstaller struct {
	config *BuildConfig
}

// NewDependencyInstaller creates a new dependency installer
func NewDependencyInstaller(config *BuildConfig) *DependencyInstaller {
	return &DependencyInstaller{
		config: config,
	}
}

// DetectPackageManager detects which package manager is available
func (d *DependencyInstaller) DetectPackageManager(projectPath string) (string, error) {
	// Check for lock files
	lockFiles := map[string]string{
		"bun.lockb":        "bun",
		"pnpm-lock.yaml":   "pnpm",
		"yarn.lock":        "yarn",
		"package-lock.json": "npm",
	}

	for lockFile, manager := range lockFiles {
		if _, err := os.Stat(filepath.Join(projectPath, lockFile)); err == nil {
			// Verify the package manager is installed
			if d.isCommandAvailable(manager) {
				return manager, nil
			}
		}
	}

	// Check for available package managers
	managers := []string{"bun", "pnpm", "yarn", "npm"}
	for _, manager := range managers {
		if d.isCommandAvailable(manager) {
			return manager, nil
		}
	}

	return "", fmt.Errorf("no package manager found")
}

// InstallDependencies installs project dependencies
func (d *DependencyInstaller) InstallDependencies(projectPath string, packageManager string) error {
	if packageManager == "" {
		var err error
		packageManager, err = d.DetectPackageManager(projectPath)
		if err != nil {
			return err
		}
	}

	// Build install command
	var cmd *exec.Cmd
	switch packageManager {
	case "bun":
		cmd = exec.Command("bun", "install")
	case "pnpm":
		cmd = exec.Command("pnpm", "install")
	case "yarn":
		cmd = exec.Command("yarn", "install")
	default:
		cmd = exec.Command("npm", "install")
	}

	cmd.Dir = projectPath
	
	if d.config.Verbose {
		fmt.Printf("Installing dependencies with %s in %s\n", packageManager, projectPath)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
	}

	return cmd.Run()
}

// AddDependency adds a new dependency to the project
func (d *DependencyInstaller) AddDependency(projectPath string, dependency string, dev bool) error {
	packageManager, err := d.DetectPackageManager(projectPath)
	if err != nil {
		return err
	}

	// Build add command
	var args []string
	switch packageManager {
	case "bun":
		args = []string{"add"}
		if dev {
			args = append(args, "-d")
		}
	case "pnpm":
		args = []string{"add"}
		if dev {
			args = append(args, "-D")
		}
	case "yarn":
		args = []string{"add"}
		if dev {
			args = append(args, "-D")
		}
	default:
		args = []string{"install"}
		if dev {
			args = append(args, "--save-dev")
		}
	}
	args = append(args, dependency)

	cmd := exec.Command(packageManager, args...)
	cmd.Dir = projectPath

	if d.config.Verbose {
		fmt.Printf("Adding dependency %s with %s\n", dependency, packageManager)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
	}

	return cmd.Run()
}

// EnsureTypeScriptDependencies ensures TypeScript and related packages are installed
func (d *DependencyInstaller) EnsureTypeScriptDependencies(projectPath string) error {
	// Check if TypeScript is already installed
	packageJsonPath := filepath.Join(projectPath, "package.json")
	if _, err := os.Stat(packageJsonPath); err != nil {
		// No package.json, create one
		if err := d.initializePackageJson(projectPath); err != nil {
			return fmt.Errorf("initializing package.json: %w", err)
		}
	}

	// Check if TypeScript is installed
	if !d.hasPackage(projectPath, "typescript") {
		if d.config.Verbose {
			fmt.Println("TypeScript not found, installing...")
		}
		
		dependencies := []string{
			"typescript",
			"@types/node",
			"@types/yargs",
		}

		for _, dep := range dependencies {
			if err := d.AddDependency(projectPath, dep, true); err != nil {
				return fmt.Errorf("installing %s: %w", dep, err)
			}
		}
	}

	return nil
}

// isCommandAvailable checks if a command is available in PATH
func (d *DependencyInstaller) isCommandAvailable(command string) bool {
	cmd := exec.Command("which", command)
	if err := cmd.Run(); err != nil {
		// Try Windows where command
		cmd = exec.Command("where", command)
		return cmd.Run() == nil
	}
	return true
}

// hasPackage checks if a package is installed
func (d *DependencyInstaller) hasPackage(projectPath string, packageName string) bool {
	// Simple check - look for package in node_modules
	packagePath := filepath.Join(projectPath, "node_modules", packageName)
	_, err := os.Stat(packagePath)
	return err == nil
}

// initializePackageJson creates a basic package.json
func (d *DependencyInstaller) initializePackageJson(projectPath string) error {
	packageJson := `{
  "name": "opencode-supercode",
  "version": "1.0.0",
  "description": "OpenCode with SuperClaude features",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "test": "jest"
  },
  "devDependencies": {},
  "dependencies": {}
}
`
	return os.WriteFile(filepath.Join(projectPath, "package.json"), []byte(packageJson), 0644)
}

// CheckEnvironment checks the build environment
func CheckEnvironment() (*Environment, error) {
	env := &Environment{}

	// Check Node.js
	if cmd := exec.Command("node", "--version"); cmd.Run() == nil {
		output, _ := cmd.Output()
		env.HasNode = true
		env.NodeVersion = strings.TrimSpace(string(output))
	}

	// Check Bun
	if cmd := exec.Command("bun", "--version"); cmd.Run() == nil {
		output, _ := cmd.Output()
		env.HasBun = true
		env.BunVersion = strings.TrimSpace(string(output))
	}

	// Check Go
	if cmd := exec.Command("go", "version"); cmd.Run() == nil {
		output, _ := cmd.Output()
		env.HasGo = true
		parts := strings.Fields(string(output))
		if len(parts) >= 3 {
			env.GoVersion = parts[2]
		}
	}

	// Check TypeScript
	if cmd := exec.Command("tsc", "--version"); cmd.Run() == nil {
		env.TypeScriptPath = "tsc"
	} else if cmd := exec.Command("npx", "tsc", "--version"); cmd.Run() == nil {
		env.TypeScriptPath = "npx tsc"
	}

	// Validate minimum requirements
	if !env.HasNode && !env.HasBun {
		return env, fmt.Errorf("neither Node.js nor Bun found. Please install one of them")
	}

	if !env.HasGo {
		return env, fmt.Errorf("Go not found. Please install Go 1.21 or later")
	}

	return env, nil
}