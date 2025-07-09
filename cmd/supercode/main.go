package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
	"github.com/Kirchlive/SuperCode/internal/downloader"
	"github.com/Kirchlive/SuperCode/internal/generator"
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
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("🔧 Initializing SuperCode configuration...")
		// TODO: Create config directory and files
		fmt.Println("✅ Configuration initialized at ~/.supercode/")
		return nil
	},
}

// detectCmd represents the detect command
var detectCmd = &cobra.Command{
	Use:   "detect",
	Short: "Detect features in repositories",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("🔍 Detecting features...")
		// TODO: Implement detection logic
		return nil
	},
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
	}

	// Step 3: Transform features
	fmt.Println("\n⚙️  Transforming features to OpenCode format...")
	
	transformCtx := &transformer.TransformationContext{
		SourceRepo: superClaudePath,
		TargetRepo: filepath.Join(absTargetDir, "OpenCode"),
		DryRun:     dryRun,
		Verbose:    verbose,
	}
	
	transformEngine := transformer.NewEngine(transformCtx)
	transformResult, err := transformEngine.TransformAll(detectionResult)
	if err != nil {
		return fmt.Errorf("failed to transform features: %w", err)
	}
	
	if verbose {
		transformEngine.PrintSummary(transformResult)
	} else {
		fmt.Printf("  - Generated %d files\n", len(transformResult.Files))
	}
	
	// Step 4: Generate code
	fmt.Println("\n📝 Generating files...")
	
	// Get output directory from flags
	outputDir, _ := cmd.Flags().GetString("output")
	createBackups, _ := cmd.Flags().GetBool("backup")
	force, _ := cmd.Flags().GetBool("force")
	
	// Create generator configuration
	genConfig := &generator.GeneratorConfig{
		OutputDir:     outputDir,
		BackupDir:     filepath.Join(outputDir, ".backups"),
		DryRun:        dryRun,
		Force:         force,
		CreateBackups: createBackups,
		Verbose:       verbose,
	}
	
	// Create generator and write files
	gen := generator.NewGenerator(genConfig)
	genResult, err := gen.Generate(transformResult.Files)
	if err != nil {
		return fmt.Errorf("failed to generate files: %w", err)
	}
	
	if !dryRun {
		fmt.Printf("  - Wrote %d files\n", len(genResult.FilesWritten))
		if len(genResult.FilesSkipped) > 0 {
			fmt.Printf("  - Skipped %d files (use --force to overwrite)\n", len(genResult.FilesSkipped))
		}
		if len(genResult.Errors) > 0 {
			fmt.Printf("  - ⚠️  %d errors occurred\n", len(genResult.Errors))
		}
	}

	// Step 4: Build binary (to be implemented)
	if !dryRun {
		fmt.Println("\n🔨 Building SuperCode binary...")
		// TODO: Implement build process
	} else {
		fmt.Println("\n🔨 [DRY RUN] Would build SuperCode binary")
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