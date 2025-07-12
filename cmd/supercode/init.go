package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
)

// Config represents the SuperCode configuration
type Config struct {
	Version string `yaml:"version"`
	Repos   struct {
		SuperClaude string `yaml:"superclaude"`
		OpenCode    string `yaml:"opencode"`
	} `yaml:"repos"`
	Features struct {
		Include []string `yaml:"include"`
		Exclude []string `yaml:"exclude"`
	} `yaml:"features"`
	Build struct {
		SkipTypeScript bool   `yaml:"skip_typescript"`
		SkipTests      bool   `yaml:"skip_tests"`
		OutputDir      string `yaml:"output_dir"`
	} `yaml:"build"`
	Merge struct {
		Backup bool `yaml:"backup"`
		Force  bool `yaml:"force"`
	} `yaml:"merge"`
}

// runInit implements the init command
func runInit(cmd *cobra.Command, args []string) error {
	fmt.Println("🔧 Initializing SuperCode configuration...")

	// Get home directory
	home, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}

	// Create config directory
	configDir := filepath.Join(home, ".supercode")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	// Check if config already exists
	configPath := filepath.Join(configDir, "config.yaml")
	force, _ := cmd.Flags().GetBool("force")
	
	if _, err := os.Stat(configPath); err == nil && !force {
		fmt.Printf("⚠️  Configuration already exists at %s\n", configPath)
		fmt.Println("Use --force to overwrite existing configuration")
		return nil
	}

	// Create default configuration
	config := Config{
		Version: "1.0",
	}
	config.Repos.SuperClaude = "https://github.com/NomenAK/SuperClaude.git"
	config.Repos.OpenCode = "https://github.com/sst/opencode.git"
	config.Features.Include = []string{"all"}
	config.Features.Exclude = []string{}
	config.Build.SkipTypeScript = false
	config.Build.SkipTests = false
	config.Build.OutputDir = "./supercode-output"
	config.Merge.Backup = true
	config.Merge.Force = false

	// Write configuration
	data, err := yaml.Marshal(&config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}

	// Create example workspace directory
	workspaceDir := filepath.Join(configDir, "workspace")
	if err := os.MkdirAll(workspaceDir, 0755); err != nil {
		return fmt.Errorf("failed to create workspace directory: %w", err)
	}

	// Create templates directory
	templatesDir := filepath.Join(configDir, "templates")
	if err := os.MkdirAll(templatesDir, 0755); err != nil {
		return fmt.Errorf("failed to create templates directory: %w", err)
	}

	// Create logs directory
	logsDir := filepath.Join(configDir, "logs")
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return fmt.Errorf("failed to create logs directory: %w", err)
	}

	// Create example template
	exampleTemplate := `// Example custom template for SuperCode
// Place your custom templates here to override default generation

export interface {{ .Name }}Config {
  // Your custom configuration
}
`
	templatePath := filepath.Join(templatesDir, "example.tmpl")
	if err := os.WriteFile(templatePath, []byte(exampleTemplate), 0644); err != nil {
		return fmt.Errorf("failed to write example template: %w", err)
	}

	// Print success message
	fmt.Println("\n✅ SuperCode initialized successfully!")
	fmt.Printf("\n📁 Configuration created at: %s\n", configPath)
	fmt.Println("\n📋 Directory structure:")
	fmt.Printf("   %s/\n", configDir)
	fmt.Println("   ├── config.yaml     # Main configuration file")
	fmt.Println("   ├── workspace/      # Working directory for repositories")
	fmt.Println("   ├── templates/      # Custom templates for code generation")
	fmt.Println("   └── logs/           # Log files")
	
	fmt.Println("\n🚀 Next steps:")
	fmt.Println("   1. Edit config.yaml to customize settings")
	fmt.Println("   2. Run 'supercode detect <path>' to analyze a repository")
	fmt.Println("   3. Run 'supercode merge' to start the merge process")

	// Show configuration
	showConfig, _ := cmd.Flags().GetBool("show")
	if showConfig {
		fmt.Println("\n📄 Configuration content:")
		fmt.Println(string(data))
	}

	return nil
}

// init flags for the init command
func initInitFlags() {
	initCmd.Flags().Bool("force", false, "overwrite existing configuration")
	initCmd.Flags().Bool("show", false, "show configuration after creation")
}