package transformer

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/Kirchlive/SuperCode/internal/analyzer"
	"github.com/Kirchlive/SuperCode/internal/interfaces"
)

// CompressionTransformer transforms compression features to OpenCode format
type CompressionTransformer struct {
	generator interfaces.Generator
}

// NewCompressionTransformer creates a new compression transformer
func NewCompressionTransformer(generator interfaces.Generator) *CompressionTransformer {
	return &CompressionTransformer{
		generator: generator,
	}
}

// Transform converts compression configuration to OpenCode format
func (t *CompressionTransformer) Transform(config *analyzer.CompressionConfig, outputDir string) error {
	if config == nil || !config.Enabled {
		return nil
	}

	// Create compression directory
	compressionDir := filepath.Join(outputDir, "packages", "opencode", "src", "compression")
	if err := t.generator.EnsureDir(compressionDir); err != nil {
		return fmt.Errorf("failed to create compression directory: %w", err)
	}

	// Generate the main compression preprocessor
	if err := t.generatePreprocessor(config, compressionDir); err != nil {
		return fmt.Errorf("failed to generate preprocessor: %w", err)
	}

	// Generate compression rules configuration
	if err := t.generateRulesFile(config, compressionDir); err != nil {
		return fmt.Errorf("failed to generate rules file: %w", err)
	}

	// Generate compression utilities
	if err := t.generateUtilities(config, compressionDir); err != nil {
		return fmt.Errorf("failed to generate utilities: %w", err)
	}

	// Generate flag integration
	if err := t.generateFlagIntegration(config, compressionDir); err != nil {
		return fmt.Errorf("failed to generate flag integration: %w", err)
	}

	// Generate tests
	if err := t.generateTests(config, compressionDir); err != nil {
		return fmt.Errorf("failed to generate tests: %w", err)
	}

	return nil
}

// generatePreprocessor creates the main compression preprocessor file
func (t *CompressionTransformer) generatePreprocessor(config *analyzer.CompressionConfig, outputDir string) error {
	content := `import { CompressionRules } from './compression-rules';
import { CompressionUtils } from './compression-utils';

/**
 * UltraCompressed Mode Preprocessor
 * Achieves ~70% token reduction through intelligent text compression
 */
export class CompressionPreprocessor {
  private rules: CompressionRules;
  private utils: CompressionUtils;
  private enabled: boolean = false;
  private autoActivateThreshold: number = 0.75; // 75% context usage

  constructor() {
    this.rules = new CompressionRules();
    this.utils = new CompressionUtils();
  }

  /**
   * Enable compression mode
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable compression mode
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if compression should auto-activate
   */
  shouldAutoActivate(contextUsage: number, fileCount?: number, sessionDuration?: number): boolean {
    // High context usage
    if (contextUsage > this.autoActivateThreshold) {
      return true;
    }

    // Large codebase
    if (fileCount && fileCount > 10000) {
      return true;
    }

    // Long session
    if (sessionDuration && sessionDuration > 2 * 60 * 60 * 1000) { // 2 hours in ms
      return true;
    }

    return false;
  }

  /**
   * Compress text using the three-phase pipeline
   */
  compress(text: string): string {
    if (!this.enabled) {
      return text;
    }

    // Phase 1: Structure optimization
    let compressed = this.phase1Structure(text);

    // Phase 2: Language compression
    compressed = this.phase2Language(compressed);

    // Phase 3: Technical compression
    compressed = this.phase3Technical(compressed);

    return compressed;
  }

  /**
   * Phase 1: Structure optimization
   */
  private phase1Structure(text: string): string {
    let result = text;

    // Convert prose to structured data (YAML-like format)
    result = this.utils.convertToStructured(result);

    // Optimize tables
    result = this.utils.optimizeTables(result);

    // Compress lists
    result = this.utils.compressLists(result);

    return result;
  }

  /**
   * Phase 2: Language compression
   */
  private phase2Language(text: string): string {
    let result = text;

    // Remove articles
    result = this.rules.removeArticles(result);

    // Compress conjunctions
    result = this.rules.compressConjunctions(result);

    // Apply symbol substitutions
    result = this.rules.applySymbols(result);

    return result;
  }

  /**
   * Phase 3: Technical compression
   */
  private phase3Technical(text: string): string {
    let result = text;

    // Apply technical abbreviations
    result = this.rules.applyAbbreviations(result);

    // Compress repeated patterns
    result = this.utils.compressPatterns(result);

    // Ensure context awareness
    result = this.utils.preserveContext(result);

    return result;
  }

  /**
   * Format output using compressed templates
   */
  formatOutput(type: string, data: any): string {
    const templates = {
      status: (d: any) => ` + "`" + `${d.success ? '✅' : '❌'} ${d.message}` + "`" + `,
      progress: (d: any) => ` + "`" + `${d.completed}/${d.total} (${Math.round(d.completed/d.total*100)}%)` + "`" + `,
      files: (d: any) => ` + "`" + `Modified: ${d.modified} | Added: ${d.added} | Deleted: ${d.deleted}` + "`" + `,
      task: (d: any) => ` + "`" + `T: ${d.title} | S: ${d.status} | P: ${d.priority}` + "`" + `,
      focus: (d: any) => ` + "`" + `→ ${d.action}` + "`" + `
    };

    const template = templates[type as keyof typeof templates];
    return template ? template(data) : JSON.stringify(data);
  }

  /**
   * Check if text contains compression triggers
   */
  hasCompressionTrigger(text: string): boolean {
    const triggers = [%s];
    const lowerText = text.toLowerCase();
    return triggers.some(trigger => lowerText.includes(trigger));
  }
}
`
	// Insert natural language triggers
	triggers := make([]string, len(config.Triggers.NaturalLanguage))
	for i, trigger := range config.Triggers.NaturalLanguage {
		triggers[i] = fmt.Sprintf("'%s'", trigger)
	}
	content = fmt.Sprintf(content, strings.Join(triggers, ", "))

	filePath := filepath.Join(outputDir, "compression-preprocessor.ts")
	return t.generator.WriteFile(filePath, []byte(content))
}

// generateRulesFile creates the compression rules file
func (t *CompressionTransformer) generateRulesFile(config *analyzer.CompressionConfig, outputDir string) error {
	// Build word removal list
	wordRemovalList := strings.Join(config.Rules.WordRemoval, "', '")

	// Build symbols map
	symbolsMap := make([]string, 0)
	for from, to := range config.Rules.Symbols {
		symbolsMap = append(symbolsMap, fmt.Sprintf("    '%s': '%s'", from, to))
	}

	// Build abbreviations map
	abbrevMap := make([]string, 0)
	for from, to := range config.Rules.Abbreviations {
		abbrevMap = append(abbrevMap, fmt.Sprintf("    '%s': '%s'", from, to))
	}

	content := fmt.Sprintf(`/**
 * Compression Rules for UltraCompressed Mode
 * Token reduction through intelligent text transformation
 */
export class CompressionRules {
  private readonly articlesToRemove = ['%s'];
  
  private readonly symbols: { [key: string]: string } = {
%s
  };

  private readonly abbreviations: { [key: string]: string } = {
%s
  };

  /**
   * Remove articles from text
   */
  removeArticles(text: string): string {
    let result = text;
    this.articlesToRemove.forEach(article => {
      const regex = new RegExp('\\b' + article + '\\b', 'gi');
      result = result.replace(regex, '');
    });
    // Clean up multiple spaces
    return result.replace(/\s+/g, ' ').trim();
  }

  /**
   * Compress conjunctions and common phrases
   */
  compressConjunctions(text: string): string {
    let result = text;
    // Apply basic conjunctions from symbols
    result = result.replace(/\band\b/gi, '&');
    result = result.replace(/\bor\b/gi, '|');
    result = result.replace(/\bwith\b/gi, 'w/');
    return result;
  }

  /**
   * Apply symbol substitutions
   */
  applySymbols(text: string): string {
    let result = text;
    Object.entries(this.symbols).forEach(([phrase, symbol]) => {
      const regex = new RegExp('\\b' + phrase + '\\b', 'gi');
      result = result.replace(regex, symbol);
    });
    return result;
  }

  /**
   * Apply technical abbreviations
   */
  applyAbbreviations(text: string): string {
    let result = text;
    Object.entries(this.abbreviations).forEach(([word, abbrev]) => {
      const regex = new RegExp('\\b' + word + '\\b', 'gi');
      result = result.replace(regex, abbrev);
    });
    return result;
  }
}
`, wordRemovalList, strings.Join(symbolsMap, ",\n"), strings.Join(abbrevMap, ",\n"))

	filePath := filepath.Join(outputDir, "compression-rules.ts")
	return t.generator.WriteFile(filePath, []byte(content))
}

// generateUtilities creates compression utility functions
func (t *CompressionTransformer) generateUtilities(config *analyzer.CompressionConfig, outputDir string) error {
	content := `/**
 * Compression Utilities for UltraCompressed Mode
 */
export class CompressionUtils {
  /**
   * Convert prose to structured data
   */
  convertToStructured(text: string): string {
    // Simple heuristic: if text has multiple sentences, convert to bullet points
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 2) {
      return sentences.map(s => '• ' + s.trim()).join('\n');
    }
    return text;
  }

  /**
   * Optimize table representations
   */
  optimizeTables(text: string): string {
    // Look for table-like structures and compress them
    // This is a simplified implementation
    return text.replace(/\s*\|\s*/g, '|').replace(/\n\s*\n/g, '\n');
  }

  /**
   * Compress lists to bullet points
   */
  compressLists(text: string): string {
    // Convert numbered lists to bullet points for compression
    return text.replace(/^\d+\.\s*/gm, '• ');
  }

  /**
   * Compress repeated patterns
   */
  compressPatterns(text: string): string {
    // Find repeated phrases and replace with references
    const lines = text.split('\n');
    const patterns: { [key: string]: number } = {};
    
    // Count pattern occurrences
    lines.forEach(line => {
      if (line.length > 20) { // Only consider substantial lines
        patterns[line] = (patterns[line] || 0) + 1;
      }
    });

    // Replace repeated patterns
    let result = text;
    Object.entries(patterns).forEach(([pattern, count]) => {
      if (count > 2) {
        // Create a reference for repeated patterns
        const ref = '@' + this.createRef(pattern);
        result = result.replace(new RegExp(pattern, 'g'), ref);
        result = ref + ': ' + pattern + '\n' + result;
      }
    });

    return result;
  }

  /**
   * Preserve context while compressing
   */
  preserveContext(text: string): string {
    // Ensure critical information is preserved
    // This is a safety check to prevent over-compression
    const criticalWords = ['error', 'warning', 'failed', 'success', 'critical', 'important'];
    
    criticalWords.forEach(word => {
      const regex = new RegExp('\\b' + word + '\\b', 'gi');
      text = text.replace(regex, word.toUpperCase());
    });

    return text;
  }

  /**
   * Create a reference key for a pattern
   */
  private createRef(pattern: string): string {
    // Simple hash-like reference creation
    return pattern.substring(0, 10).replace(/\s/g, '_').toUpperCase();
  }
}
`

	filePath := filepath.Join(outputDir, "compression-utils.ts")
	return t.generator.WriteFile(filePath, []byte(content))
}

// generateFlagIntegration creates the flag integration for compression
func (t *CompressionTransformer) generateFlagIntegration(config *analyzer.CompressionConfig, outputDir string) error {
	content := `import { CompressionPreprocessor } from './compression-preprocessor';

/**
 * Compression flag integration for OpenCode CLI
 */
export interface CompressionFlags {
  ultracompressed?: boolean;
  uc?: boolean;
}

export class CompressionFlagHandler {
  private preprocessor: CompressionPreprocessor;

  constructor() {
    this.preprocessor = new CompressionPreprocessor();
  }

  /**
   * Process compression flags
   */
  processFlags(flags: CompressionFlags): void {
    if (flags.ultracompressed || flags.uc) {
      this.preprocessor.enable();
    }
  }

  /**
   * Get preprocessor instance
   */
  getPreprocessor(): CompressionPreprocessor {
    return this.preprocessor;
  }

  /**
   * Add compression flags to command
   */
  static addToCommand(command: any): void {
    command
      .option('--uc, --ultracompressed', 'Enable UltraCompressed mode (~70% token reduction)')
      .hook('preAction', (thisCommand: any) => {
        const options = thisCommand.opts();
        if (options.uc || options.ultracompressed) {
          console.log('🗜️  UltraCompressed mode enabled');
        }
      });
  }
}

// Export for universal flag integration
export const compressionFlags = {
  flags: {
    uc: {
      type: 'boolean',
      alias: 'ultracompressed',
      description: 'Enable UltraCompressed mode (~70% token reduction)'
    }
  },
  handler: CompressionFlagHandler
};
`

	filePath := filepath.Join(outputDir, "compression-flags.ts")
	return t.generator.WriteFile(filePath, []byte(content))
}

// generateTests creates test file for compression feature
func (t *CompressionTransformer) generateTests(config *analyzer.CompressionConfig, outputDir string) error {
	content := `import { CompressionPreprocessor } from './compression-preprocessor';
import { CompressionRules } from './compression-rules';
import { CompressionUtils } from './compression-utils';

describe('Compression Feature', () => {
  let preprocessor: CompressionPreprocessor;
  let rules: CompressionRules;
  let utils: CompressionUtils;

  beforeEach(() => {
    preprocessor = new CompressionPreprocessor();
    rules = new CompressionRules();
    utils = new CompressionUtils();
  });

  describe('CompressionPreprocessor', () => {
    it('should not compress when disabled', () => {
      const text = 'This is a test with the articles';
      expect(preprocessor.compress(text)).toBe(text);
    });

    it('should compress when enabled', () => {
      preprocessor.enable();
      const text = 'This is a test with the articles and conjunctions';
      const compressed = preprocessor.compress(text);
      expect(compressed).not.toBe(text);
      expect(compressed).not.toContain(' the ');
      expect(compressed).toContain('&');
    });

    it('should auto-activate on high context usage', () => {
      expect(preprocessor.shouldAutoActivate(0.8)).toBe(true);
      expect(preprocessor.shouldAutoActivate(0.5)).toBe(false);
    });

    it('should detect compression triggers', () => {
      expect(preprocessor.hasCompressionTrigger('Please compress this')).toBe(true);
      expect(preprocessor.hasCompressionTrigger('Be concise')).toBe(true);
      expect(preprocessor.hasCompressionTrigger('Normal text')).toBe(false);
    });
  });

  describe('CompressionRules', () => {
    it('should remove articles', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const compressed = rules.removeArticles(text);
      expect(compressed).toBe('quick brown fox jumps over lazy dog');
    });

    it('should compress conjunctions', () => {
      const text = 'cats and dogs or birds with wings';
      const compressed = rules.compressConjunctions(text);
      expect(compressed).toBe('cats & dogs | birds w/ wings');
    });

    it('should apply symbols', () => {
      const text = 'This leads to success because of hard work';
      const compressed = rules.applySymbols(text);
      expect(compressed).toContain('→');
      expect(compressed).toContain('✅');
      expect(compressed).toContain('∵');
    });

    it('should apply abbreviations', () => {
      const text = 'The configuration and implementation of the application';
      const compressed = rules.applyAbbreviations(text);
      expect(compressed).toContain('cfg');
      expect(compressed).toContain('impl');
      expect(compressed).toContain('app');
    });
  });

  describe('CompressionUtils', () => {
    it('should convert prose to structured format', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const structured = utils.convertToStructured(text);
      expect(structured).toContain('•');
    });

    it('should preserve context for critical words', () => {
      const text = 'This is an error in the system';
      const preserved = utils.preserveContext(text);
      expect(preserved).toContain('ERROR');
    });
  });

  describe('Performance', () => {
    it('should achieve target compression ratio', () => {
      preprocessor.enable();
      const longText = 'The configuration and implementation of the application requires careful consideration of the architecture and the development environment.';
      const compressed = preprocessor.compress(longText);
      const ratio = compressed.length / longText.length;
      expect(ratio).toBeLessThan(0.8); // Should achieve at least 20% reduction
    });
  });
});
`

	filePath := filepath.Join(outputDir, "compression.test.ts")
	return t.generator.WriteFile(filePath, []byte(content))
}

