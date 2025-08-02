/**
 * Flag Resolver for SuperClaude Commands
 * Resolves and validates command flags, applies defaults, and handles conflicts
 */

import { z } from "zod";
import { CommandFlag, COMMAND_FLAGS, UNIVERSAL_FLAGS } from "./command-parser";

export interface ResolvedFlags {
  [key: string]: string | boolean | number;
}

export interface FlagValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  resolved: ResolvedFlags;
}

export interface FlagConflict {
  flag1: string;
  flag2: string;
  reason: string;
  resolution: 'flag1' | 'flag2' | 'error';
}

/**
 * Flag conflict definitions
 */
const FLAG_CONFLICTS: Record<string, FlagConflict[]> = {
  global: [
    { flag1: 'verbose', flag2: 'quiet', reason: 'Cannot be both verbose and quiet', resolution: 'error' },
    { flag1: 'parallel', flag2: 'seq', reason: 'Cannot run both parallel and sequential', resolution: 'flag2' },
    { flag1: 'deep', flag2: 'quick', reason: 'Cannot be both deep and quick', resolution: 'flag1' },
    { flag1: 'dry-run', flag2: 'force', reason: 'Dry run conflicts with force execution', resolution: 'flag1' }
  ],
  analyze: [
    { flag1: 'comprehensive', flag2: 'quick', reason: 'Comprehensive analysis conflicts with quick mode', resolution: 'flag1' }
  ],
  build: [
    { flag1: 'clean', flag2: 'watch', reason: 'Clean build conflicts with watch mode', resolution: 'flag2' }
  ]
};

/**
 * Flag dependency definitions
 */
const FLAG_DEPENDENCIES: Record<string, Record<string, string[]>> = {
  analyze: {
    'forensic': ['evidence', 'deep'],
    'trace': ['logs', 'verbose'],
    'five-whys': ['deep'],
    'visual': ['comprehensive']
  },
  build: {
    'coverage': ['tests'],
    'e2e': ['tests'],
    'integration': ['tests'],
    'quality': ['tests', 'standards']
  },
  test: {
    'benchmark': ['performance'],
    'coverage': ['unit', 'integration']
  }
};

/**
 * Flag implications - when one flag is set, automatically set others
 */
const FLAG_IMPLICATIONS: Record<string, Record<string, Record<string, boolean | string>>> = {
  analyze: {
    'comprehensive': { 'deep': true, 'evidence': true },
    'forensic': { 'deep': true, 'trace': true, 'evidence': true },
    'security': { 'focus': 'security' }
  },
  build: {
    'tdd': { 'tests': true, 'validate': true },
    'ci': { 'clean': true, 'tests': true, 'quality': true }
  },
  test: {
    'benchmark': { 'type': 'performance' },
    'coverage': { 'verbose': true }
  }
};

/**
 * Performance budget flags - flags that affect performance
 */
const PERFORMANCE_FLAGS = new Set([
  'parallel', 'cache', 'quick', 'uc', 'deep', 'comprehensive', 'verbose'
]);

/**
 * Security-sensitive flags that require validation
 */
const SECURITY_FLAGS = new Set([
  'force', 'config', 'output', 'clean'
]);

/**
 * Flag resolver class
 */
export class FlagResolver {
  /**
   * Resolve and validate flags for a command
   */
  static resolve(command: string, flags: Record<string, string | boolean>): FlagValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let resolved: ResolvedFlags = { ...flags };

    try {
      // Step 1: Validate flag existence
      const validationResult = this.validateFlagExistence(command, flags);
      errors.push(...validationResult.errors);

      if (errors.length > 0) {
        return { valid: false, errors, warnings, resolved };
      }

      // Step 2: Apply type conversions
      resolved = this.applyTypeConversions(command, resolved);

      // Step 3: Check for conflicts
      const conflictResult = this.checkConflicts(command, resolved);
      errors.push(...conflictResult.errors);
      warnings.push(...conflictResult.warnings);
      resolved = conflictResult.resolved;

      // Step 4: Apply implications
      resolved = this.applyImplications(command, resolved);

      // Step 5: Check dependencies
      const depResult = this.checkDependencies(command, resolved);
      errors.push(...depResult.errors);
      warnings.push(...depResult.warnings);

      // Step 6: Apply defaults
      resolved = this.applyDefaults(command, resolved);

      // Step 7: Validate security constraints
      const securityResult = this.validateSecurity(resolved);
      errors.push(...securityResult.errors);
      warnings.push(...securityResult.warnings);

      // Step 8: Performance warnings
      const perfWarnings = this.checkPerformanceImplications(resolved);
      warnings.push(...perfWarnings);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        resolved
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Flag resolution error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings,
        resolved
      };
    }
  }

  /**
   * Validate that all provided flags exist for the command
   */
  private static validateFlagExistence(command: string, flags: Record<string, string | boolean>): {
    errors: string[];
  } {
    const availableFlags = this.getAvailableFlags(command);
    const validFlagNames = new Set(availableFlags.map(f => f.name));
    const errors: string[] = [];

    for (const flagName in flags) {
      if (!validFlagNames.has(flagName)) {
        const suggestions = this.suggestSimilarFlags(flagName, availableFlags);
        const suggestionText = suggestions.length > 0 ? ` Did you mean: ${suggestions.join(', ')}?` : '';
        errors.push(`Unknown flag: --${flagName}.${suggestionText}`);
      }
    }

    return { errors };
  }

  /**
   * Apply type conversions based on flag definitions
   */
  private static applyTypeConversions(command: string, flags: ResolvedFlags): ResolvedFlags {
    const availableFlags = this.getAvailableFlags(command);
    const flagTypeMap = new Map(availableFlags.map(f => [f.name, f.type]));
    const converted: ResolvedFlags = {};

    for (const [name, value] of Object.entries(flags)) {
      const flagType = flagTypeMap.get(name);
      
      if (flagType === 'boolean') {
        converted[name] = this.toBoolean(value);
      } else if (flagType === 'string') {
        converted[name] = String(value);
      } else {
        converted[name] = value;
      }
    }

    return converted;
  }

  /**
   * Check for flag conflicts and resolve them
   */
  private static checkConflicts(command: string, flags: ResolvedFlags): {
    errors: string[];
    warnings: string[];
    resolved: ResolvedFlags;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const resolved = { ...flags };

    const conflicts = [
      ...(FLAG_CONFLICTS.global || []),
      ...(FLAG_CONFLICTS[command] || [])
    ];

    for (const conflict of conflicts) {
      if (flags[conflict.flag1] && flags[conflict.flag2]) {
        if (conflict.resolution === 'error') {
          errors.push(`Conflicting flags: --${conflict.flag1} and --${conflict.flag2}. ${conflict.reason}`);
        } else if (conflict.resolution === 'flag1') {
          delete resolved[conflict.flag2];
          warnings.push(`Resolved conflict: Using --${conflict.flag1}, ignoring --${conflict.flag2}. ${conflict.reason}`);
        } else if (conflict.resolution === 'flag2') {
          delete resolved[conflict.flag1];
          warnings.push(`Resolved conflict: Using --${conflict.flag2}, ignoring --${conflict.flag1}. ${conflict.reason}`);
        }
      }
    }

    return { errors, warnings, resolved };
  }

  /**
   * Apply flag implications
   */
  private static applyImplications(command: string, flags: ResolvedFlags): ResolvedFlags {
    const resolved = { ...flags };
    const implications = FLAG_IMPLICATIONS[command] || {};

    for (const [triggerFlag, impliedFlags] of Object.entries(implications)) {
      if (resolved[triggerFlag]) {
        for (const [impliedFlag, impliedValue] of Object.entries(impliedFlags)) {
          if (!(impliedFlag in resolved)) {
            resolved[impliedFlag] = impliedValue;
          }
        }
      }
    }

    return resolved;
  }

  /**
   * Check flag dependencies
   */
  private static checkDependencies(command: string, flags: ResolvedFlags): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const dependencies = FLAG_DEPENDENCIES[command] || {};

    for (const [flag, requiredFlags] of Object.entries(dependencies)) {
      if (flags[flag]) {
        for (const requiredFlag of requiredFlags) {
          if (!flags[requiredFlag]) {
            warnings.push(`Flag --${flag} typically requires --${requiredFlag}. Consider adding it for optimal results.`);
          }
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Apply default values
   */
  private static applyDefaults(command: string, flags: ResolvedFlags): ResolvedFlags {
    const availableFlags = this.getAvailableFlags(command);
    const resolved = { ...flags };

    for (const flag of availableFlags) {
      if (flag.default !== undefined && !(flag.name in resolved)) {
        resolved[flag.name] = flag.default;
      }
    }

    return resolved;
  }

  /**
   * Validate security constraints
   */
  private static validateSecurity(flags: ResolvedFlags): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for potentially dangerous flag combinations
    if (flags['force'] && flags['clean']) {
      warnings.push('Using --force with --clean can be destructive. Ensure you have backups.');
    }

    // Validate file paths
    for (const flagName of ['config', 'output']) {
      const value = flags[flagName];
      if (typeof value === 'string' && value.includes('..')) {
        warnings.push(`Path traversal detected in --${flagName}. This may be a security risk.`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Check performance implications
   */
  private static checkPerformanceImplications(flags: ResolvedFlags): string[] {
    const warnings: string[] = [];

    // Check for performance-heavy flag combinations
    if (flags['comprehensive'] && flags['deep'] && flags['verbose']) {
      warnings.push('Performance warning: Using comprehensive + deep + verbose modes will be resource-intensive.');
    }

    if (flags['parallel'] && flags['verbose']) {
      warnings.push('Performance note: Verbose output with parallel processing may interleave output.');
    }

    if (!flags['cache'] && (flags['deep'] || flags['comprehensive'])) {
      warnings.push('Performance tip: Consider enabling --cache for deep analysis modes.');
    }

    return warnings;
  }

  /**
   * Get available flags for a command
   */
  private static getAvailableFlags(command: string): CommandFlag[] {
    const commandSpecific = COMMAND_FLAGS[command] || [];
    return [...UNIVERSAL_FLAGS, ...commandSpecific];
  }

  /**
   * Suggest similar flag names for typos
   */
  private static suggestSimilarFlags(input: string, availableFlags: CommandFlag[]): string[] {
    const suggestions: string[] = [];
    
    for (const flag of availableFlags) {
      const distance = this.levenshteinDistance(input, flag.name);
      if (distance <= 2 && distance < input.length / 2) {
        suggestions.push(`--${flag.name}`);
      }
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Calculate Levenshtein distance for typo suggestions
   */
  private static levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Convert value to boolean
   */
  private static toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on';
    }
    return Boolean(value);
  }

  /**
   * Get flag help text for a command
   */
  static getHelp(command: string): string {
    const flags = this.getAvailableFlags(command);
    const lines = [`Available flags for /${command}:`];

    // Group by category
    const universal = flags.filter(f => UNIVERSAL_FLAGS.some(uf => uf.name === f.name));
    const commandSpecific = flags.filter(f => !UNIVERSAL_FLAGS.some(uf => uf.name === f.name));

    if (commandSpecific.length > 0) {
      lines.push('\nCommand-specific flags:');
      for (const flag of commandSpecific) {
        const defaultText = flag.default !== undefined ? ` (default: ${flag.default})` : '';
        lines.push(`  --${flag.name.padEnd(20)} ${flag.description}${defaultText}`);
      }
    }

    lines.push('\nUniversal flags:');
    for (const flag of universal) {
      const defaultText = flag.default !== undefined ? ` (default: ${flag.default})` : '';
      lines.push(`  --${flag.name.padEnd(20)} ${flag.description}${defaultText}`);
    }

    return lines.join('\n');
  }

  /**
   * Create Zod schema for flag validation
   */
  static createSchema(command: string): z.ZodType<ResolvedFlags> {
    const flags = this.getAvailableFlags(command);
    const schemaObject: Record<string, z.ZodType> = {};

    for (const flag of flags) {
      let schema: z.ZodType;

      if (flag.type === 'boolean') {
        schema = z.boolean();
      } else if (flag.type === 'string') {
        schema = z.string();
      } else {
        schema = z.any();
      }

      if (flag.default !== undefined) {
        schema = schema.default(flag.default);
      } else {
        schema = schema.optional();
      }

      schemaObject[flag.name] = schema;
    }

    return z.object(schemaObject).passthrough();
  }
}