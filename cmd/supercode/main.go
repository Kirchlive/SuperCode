package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
	"github.com/Kirchlive/SuperCode/internal/builder"
	"github.com/Kirchlive/SuperCode/internal/downloader"
	"github.com/Kirchlive/SuperCode/internal/transformer"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	// Version information set by build flags
	Version   = "dev"
	BuildTime = "unknown"
	
	cfgFile string
	verbose bool
)

// rootCmd represents the base command
var rootCmd = &cobra.Command{
	Use:   "supercode",
	Short: "SuperCode - Automated SuperClaude + OpenCode merger",
	Long: `SuperCode is a tool that automatically merges SuperClaude features
into OpenCode, creating a unified, enhanced AI CLI with all capabilities.`,
	Version: fmt.Sprintf("%s (built %s)", Version, BuildTime),
}

// mergeCmd represents the merge command
var mergeCmd = &cobra.Command{
	Use:   "merge",
	Short: "Merge SuperClaude and OpenCode into SuperCode",
	Long: `Downloads the current versions of SuperClaude and OpenCode,
detects all features, generates compatible code, and builds SuperCode.`,
	RunE: runMerge,
}

// initCmd represents the init command
var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize SuperCode configuration",
	Long: `Initialize SuperCode configuration directory and files.
Creates ~/.supercode/ with default configuration, templates, and workspace.`,
	RunE: runInit,
}

// detectCmd represents the detect command
var detectCmd = &cobra.Command{
	Use:   "detect [path]",
	Short: "Detect features in repositories",
	Long: `Analyze a repository to detect SuperClaude or OpenCode features.
Provides detailed information about personas, commands, MCP servers, and other capabilities.`,
	Args:  cobra.ExactArgs(1),
	RunE: runDetect,
}

func init() {
	cobra.OnInitialize(initConfig)

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.supercode/config.yaml)")
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")

	// Add commands
	rootCmd.AddCommand(mergeCmd)
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(detectCmd)

	// Merge command flags
	mergeCmd.Flags().Bool("dry-run", false, "preview what will be done without making changes")
	mergeCmd.Flags().StringSlice("features", []string{}, "specific features to merge")
	mergeCmd.Flags().StringSlice("skip", []string{}, "features to skip")
	mergeCmd.Flags().String("output", "./supercode-output", "output directory for generated files")
	mergeCmd.Flags().Bool("backup", true, "create backups of existing files")
	mergeCmd.Flags().Bool("force", false, "overwrite existing files without prompting")
	mergeCmd.Flags().Bool("skip-build", false, "skip building the binary")
	mergeCmd.Flags().Bool("skip-typescript", false, "skip TypeScript compilation")
	mergeCmd.Flags().Bool("skip-tests", false, "skip running tests")
	
	// Init command flags
	initInitFlags()
	
	// Detect command flags
	initDetectFlags()
}

// initConfig reads in config file and ENV variables if set
func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		home, err := os.UserHomeDir()
		cobra.CheckErr(err)

		viper.AddConfigPath(home + "/.supercode")
		viper.SetConfigType("yaml")
		viper.SetConfigName("config")
	}

	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err == nil && verbose {
		fmt.Println("Using config file:", viper.ConfigFileUsed())
	}
}

func runMerge(cmd *cobra.Command, args []string) error {
	fmt.Println("🚀 Starting SuperCode merge process...")

	// Get flags
	dryRun, _ := cmd.Flags().GetBool("dry-run")
	targetDir := "./merge-workspace"

	// Create absolute path
	absTargetDir, err := filepath.Abs(targetDir)
	if err != nil {
		return fmt.Errorf("failed to resolve target directory: %w", err)
	}

	// Step 1: Download repositories
	fmt.Println("\n📥 Downloading repositories...")
	dl := downloader.NewDownloader(absTargetDir, verbose)
	
	if err := dl.DownloadAll(); err != nil {
		return fmt.Errorf("failed to download repositories: %w", err)
	}

	// Step 2: Detect features
	fmt.Println("\n🔍 Detecting SuperClaude features...")
	analyzer := analyzer.NewAnalyzer()
	superClaudePath := filepath.Join(absTargetDir, "SuperClaude")
	
	detectionResult, err := analyzer.AnalyzeRepository(superClaudePath)
	if err != nil {
		return fmt.Errorf("failed to analyze repository: %w", err)
	}
	
	if verbose {
		analyzer.PrintSummary(detectionResult)
	} else {
		fmt.Printf("  - Found %d personas\n", len(detectionResult.Personas))
		fmt.Printf("  - Found %d commands\n", len(detectionResult.Commands))
		if detectionResult.MCPFeature != nil {
			fmt.Printf("  - Found %d MCP servers\n", len(detectionResult.MCPFeature.Servers))
		}
	}

	// Step 3: Transform features
	fmt.Println("\n⚙️  Transforming features to OpenCode format...")
	
	outputDir, _ := cmd.Flags().GetString("output")
	transformer := transformer.NewTransformer()
	
	if err := transformer.Transform(detectionResult, outputDir); err != nil {
		return fmt.Errorf("failed to transform features: %w", err)
	}
	
	// Generate summary
	if err := transformer.GenerateSummary(detectionResult, outputDir); err != nil {
		return fmt.Errorf("failed to generate summary: %w", err)
	}

	fmt.Printf("  - Transformation completed\n")

	// Step 4: Build binary
	skipBuild, _ := cmd.Flags().GetBool("skip-build")
	if !skipBuild && !dryRun {
		fmt.Println("\n🏗️  Building SuperCode...")
		
		skipTypeScript, _ := cmd.Flags().GetBool("skip-typescript")
		skipTests, _ := cmd.Flags().GetBool("skip-tests")
		
		// Create build configuration
		buildConfig := &builder.BuildConfig{
			WorkDir:        absTargetDir,
			OutputDir:      filepath.Join(outputDir, "bin"),
			OpenCodePath:   filepath.Join(absTargetDir, "OpenCode"),
			GeneratedPath:  outputDir,
			Verbose:        verbose,
			SkipTypeScript: skipTypeScript,
			SkipTests:      skipTests,
		}
		
		// Create builder and run build
		bldr := builder.NewDefaultBuilder(buildConfig)
		buildResult, err := bldr.Build()
		if err != nil {
			return fmt.Errorf("build failed: %w", err)
		}
		
		if buildResult.Success {
			fmt.Printf("  ✓ Binary built: %s\n", buildResult.BinaryPath)
			if buildResult.TypeScriptBuilt {
				fmt.Println("  ✓ TypeScript compiled")
			}
			if buildResult.TestsPassed {
				fmt.Println("  ✓ Tests passed")
			}
		}
	} else if !skipBuild && dryRun {
		fmt.Println("\n🏗️  [DRY RUN] Would build SuperCode binary")
	}

	fmt.Println("\n✅ Merge process completed successfully!")
	
	if dryRun {
		fmt.Println("\nThis was a dry run. No changes were made.")
		fmt.Println("Run without --dry-run to perform the actual merge.")
	}

	return nil
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}