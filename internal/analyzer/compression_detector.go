package analyzer

import (
	"fmt"
	"path/filepath"
	"strings"
)

// CompressionConfig represents the compression feature configuration
type CompressionConfig struct {
	Enabled           bool                   `yaml:"enabled"`
	Flags             []string               `yaml:"flags"`
	Triggers          CompressionTriggers    `yaml:"triggers"`
	Rules             CompressionRules       `yaml:"rules"`
	Pipeline          CompressionPipeline    `yaml:"pipeline"`
	Templates         map[string]string      `yaml:"templates"`
	PerformanceTarget float64                `yaml:"performance_target"`
}

// CompressionTriggers defines when compression should activate
type CompressionTriggers struct {
	ExplicitFlags    []string `yaml:"explicit_flags"`
	NaturalLanguage  []string `yaml:"natural_language"`
	AutomaticTriggers struct {
		HighContextUsage    string `yaml:"high_context_usage"`
		TokenBudgetPressure string `yaml:"token_budget_pressure"`
		LargeCodebases      string `yaml:"large_codebases"`
		LongSessions        string `yaml:"long_sessions"`
	} `yaml:"automatic_triggers"`
}

// CompressionRules defines how text is compressed
type CompressionRules struct {
	WordRemoval []string            `yaml:"word_removal"`
	Symbols     map[string]string   `yaml:"symbols"`
	Abbreviations map[string]string `yaml:"abbreviations"`
}

// CompressionPipeline defines the compression process
type CompressionPipeline struct {
	Phase1Structure map[string]string `yaml:"phase_1_structure"`
	Phase2Language  map[string]string `yaml:"phase_2_language"`
	Phase3Technical map[string]string `yaml:"phase_3_technical"`
}

// CompressionDetector detects compression features in the repository
type CompressionDetector struct {
	yamlParser *YAMLParser
}

// NewCompressionDetector creates a new compression detector
func NewCompressionDetector(yamlParser *YAMLParser) *CompressionDetector {
	return &CompressionDetector{
		yamlParser: yamlParser,
	}
}

// Detect searches for compression features in the repository
func (d *CompressionDetector) Detect(repoPath string) (*CompressionConfig, error) {
	// Search for compression configuration in multiple locations
	possiblePaths := []string{
		filepath.Join(repoPath, ".claude", "commands", "shared", "compression-performance-patterns.yml"),
		filepath.Join(repoPath, ".claude", "shared", "superclaude-core.yml"),
		filepath.Join(repoPath, ".claude", "CLAUDE.md"),
		filepath.Join(repoPath, "commands", "shared", "compression-performance-patterns.yml"),
	}

	var compressionConfig *CompressionConfig

	for _, path := range possiblePaths {
		// Try to find compression configuration
		sections, err := d.yamlParser.ParseFile(path)
		if err != nil {
			continue // File might not exist, try next
		}

		// Look for compression-related sections
		for sectionName, content := range sections {
			if d.isCompressionSection(sectionName) {
				config := d.extractCompressionConfig(content)
				if config != nil {
					compressionConfig = config
					break
				}
			}
		}

		if compressionConfig != nil {
			break
		}
	}

	// If no specific config found, create a default based on known patterns
	if compressionConfig == nil {
		compressionConfig = d.createDefaultConfig()
	}

	return compressionConfig, nil
}

// isCompressionSection checks if a section name relates to compression
func (d *CompressionDetector) isCompressionSection(name string) bool {
	compressionKeywords := []string{
		"compression",
		"ultracompressed",
		"token",
		"reduction",
		"uc_mode",
		"ultra_compressed",
	}

	lowerName := strings.ToLower(name)
	for _, keyword := range compressionKeywords {
		if strings.Contains(lowerName, keyword) {
			return true
		}
	}
	return false
}

// extractCompressionConfig extracts compression configuration from YAML content
func (d *CompressionDetector) extractCompressionConfig(content interface{}) *CompressionConfig {
	config := &CompressionConfig{
		Enabled: true,
		Flags:   []string{"--uc", "--ultracompressed"},
		PerformanceTarget: 0.7, // 70% token reduction
	}

	// Extract triggers
	config.Triggers = CompressionTriggers{
		ExplicitFlags:   []string{"--ultracompressed", "--uc"},
		NaturalLanguage: []string{"compress", "concise", "brief", "minimal", "telegram style"},
	}
	config.Triggers.AutomaticTriggers.HighContextUsage = "Context usage >75% → Auto-activate"
	config.Triggers.AutomaticTriggers.TokenBudgetPressure = "Approaching token limits → Auto-activate"
	config.Triggers.AutomaticTriggers.LargeCodebases = "Project >10k files → Recommend --uc"
	config.Triggers.AutomaticTriggers.LongSessions = "Session >2 hours → Suggest --uc"

	// Extract compression rules
	config.Rules = CompressionRules{
		WordRemoval: []string{"the", "a", "an", "and", "or", "but", "with", "to", "of", "in", "on", "at"},
		Symbols: map[string]string{
			"leads to":  "→",
			"and":       "&",
			"or":        "|",
			"because":   "∵",
			"therefore": "∴",
			"all":       "∀",
			"exists":    "∃",
			"member":    "∈",
			"subset":    "⊂",
			"start":     "▶",
			"pause":     "⏸",
			"stop":      "⏹",
			"fast":      "⚡",
			"cycle":     "🔄",
			"success":   "✅",
			"failure":   "❌",
		},
		Abbreviations: map[string]string{
			"configuration":   "cfg",
			"implementation":  "impl",
			"performance":     "perf",
			"development":     "dev",
			"production":      "prod",
			"environment":     "env",
			"repository":      "repo",
			"documentation":   "docs",
			"application":     "app",
			"authentication":  "auth",
			"authorization":   "authz",
			"information":     "info",
			"administrator":   "admin",
		},
	}

	// Extract pipeline phases
	config.Pipeline = CompressionPipeline{
		Phase1Structure: map[string]string{
			"convert_to_yaml":    "Transform prose → structured data",
			"table_optimization": "Multi-column data → compact tables",
			"list_compression":   "Paragraph lists → bullet points",
		},
		Phase2Language: map[string]string{
			"remove_articles":       "Systematic article removal where clear",
			"compress_conjunctions": "and→& | with→w/ | to→→",
			"symbol_substitution":   "Replace common phrases w/ symbols",
		},
		Phase3Technical: map[string]string{
			"abbreviate_terms":    "Use established technical abbreviations",
			"compress_patterns":   "Repeated patterns → @include references",
			"context_awareness":   "Maintain meaning despite compression",
		},
	}

	// Add output templates
	config.Templates = map[string]string{
		"status":   "✅ Done | ❌ Failed | ⚠ Warning | ℹ Info",
		"progress": "{COMPLETED}/{TOTAL} ({PERCENT}%)",
		"files":    "Modified: {MOD} | Added: {ADD} | Deleted: {DEL}",
		"task":     "T: {TITLE} | S: {STATUS} | P: {PRIORITY}",
		"focus":    "→ {CURRENT_ACTION}",
	}

	return config
}

// createDefaultConfig creates a default compression configuration
func (d *CompressionDetector) createDefaultConfig() *CompressionConfig {
	return &CompressionConfig{
		Enabled: true,
		Flags:   []string{"--uc", "--ultracompressed"},
		Triggers: CompressionTriggers{
			ExplicitFlags:   []string{"--ultracompressed", "--uc"},
			NaturalLanguage: []string{"compress", "concise", "brief", "minimal"},
		},
		Rules: CompressionRules{
			WordRemoval: []string{"the", "a", "an"},
			Symbols: map[string]string{
				"and": "&",
				"or":  "|",
			},
			Abbreviations: map[string]string{
				"configuration": "cfg",
				"implementation": "impl",
			},
		},
		PerformanceTarget: 0.7,
	}
}

// ValidateConfig validates the compression configuration
func (d *CompressionDetector) ValidateConfig(config *CompressionConfig) error {
	if config == nil {
		return fmt.Errorf("compression config is nil")
	}

	if len(config.Flags) == 0 {
		return fmt.Errorf("no compression flags defined")
	}

	if config.PerformanceTarget <= 0 || config.PerformanceTarget > 1 {
		return fmt.Errorf("invalid performance target: %f (should be between 0 and 1)", config.PerformanceTarget)
	}

	return nil
}