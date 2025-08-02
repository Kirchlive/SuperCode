/**
 * Command Parser for SuperClaude Commands
 * Parses command strings and extracts command, arguments, and flags
 */

import { z } from "zod";

export interface ParsedCommand {
  command: string;
  target?: string;
  args: string[];
  flags: Record<string, string | boolean>;
  rawArgs: string[];
}

export interface CommandFlag {
  name: string;
  type: 'boolean' | 'string';
  description: string;
  default?: string | boolean;
}

/**
 * Universal flags available to all SuperClaude commands
 */
export const UNIVERSAL_FLAGS: CommandFlag[] = [
  { name: 'help', type: 'boolean', description: 'Show command help' },
  { name: 'verbose', type: 'boolean', description: 'Enable verbose output' },
  { name: 'quiet', type: 'boolean', description: 'Suppress non-essential output' },
  { name: 'dry-run', type: 'boolean', description: 'Show what would be done without executing' },
  { name: 'format', type: 'string', description: 'Output format (text, json, markdown)', default: 'text' },
  { name: 'output', type: 'string', description: 'Output file path' },
  { name: 'config', type: 'string', description: 'Configuration file path' },
  { name: 'persona', type: 'string', description: 'Override persona selection' },
  { name: 'uc', type: 'boolean', description: 'Enable UltraCompressed mode' },
  { name: 'parallel', type: 'boolean', description: 'Enable parallel processing' },
  { name: 'cache', type: 'boolean', description: 'Enable caching', default: true },
  { name: 'seq', type: 'boolean', description: 'Force sequential processing' },
  { name: 'deep', type: 'boolean', description: 'Enable deep analysis mode' },
  { name: 'quick', type: 'boolean', description: 'Enable quick mode for faster results' },
  { name: 'comprehensive', type: 'boolean', description: 'Enable comprehensive analysis' },
  { name: 'evidence', type: 'boolean', description: 'Include evidence in output' },
  { name: 'c7', type: 'boolean', description: 'Enable Context7 integration' }
];

/**
 * Command-specific flags for each SuperClaude command
 */
export const COMMAND_FLAGS: Record<string, CommandFlag[]> = {
  analyze: [
    { name: 'focus', type: 'string', description: 'Focus area: quality|security|performance|architecture' },
    { name: 'depth', type: 'string', description: 'Analysis depth: quick|deep', default: 'deep' },
    { name: 'code', type: 'boolean', description: 'Analyze code quality' },
    { name: 'security', type: 'boolean', description: 'Analyze security vulnerabilities' },
    { name: 'performance', type: 'boolean', description: 'Analyze performance issues' },
    { name: 'architecture', type: 'boolean', description: 'Analyze architecture patterns' },
    { name: 'deps', type: 'boolean', description: 'Analyze dependencies' },
    { name: 'patterns', type: 'boolean', description: 'Analyze code patterns' },
    { name: 'forensic', type: 'boolean', description: 'Enable forensic analysis' },
    { name: 'trace', type: 'boolean', description: 'Enable execution tracing' },
    { name: 'logs', type: 'boolean', description: 'Include log analysis' },
    { name: 'five-whys', type: 'boolean', description: 'Apply five-whys methodology' },
    { name: 'timeline', type: 'boolean', description: 'Generate timeline analysis' },
    { name: 'report', type: 'boolean', description: 'Generate detailed report' },
    { name: 'visual', type: 'boolean', description: 'Include visual representations' },
    { name: 'summary', type: 'boolean', description: 'Generate executive summary' }
  ],
  build: [
    { name: 'type', type: 'string', description: 'Build type: dev|prod|test', default: 'dev' },
    { name: 'clean', type: 'boolean', description: 'Clean before building' },
    { name: 'optimize', type: 'boolean', description: 'Enable optimizations' },
    { name: 'watch', type: 'boolean', description: 'Watch for changes' },
    { name: 'feature', type: 'string', description: 'Build specific feature' },
    { name: 'tdd', type: 'boolean', description: 'Enable test-driven development' },
    { name: 'validate', type: 'boolean', description: 'Validate build output' },
    { name: 'tests', type: 'boolean', description: 'Run tests during build' },
    { name: 'coverage', type: 'boolean', description: 'Generate test coverage' },
    { name: 'ci', type: 'boolean', description: 'CI/CD optimized build' },
    { name: 'documentation', type: 'boolean', description: 'Generate documentation' },
    { name: 'examples', type: 'boolean', description: 'Build examples' },
    { name: 'integration', type: 'boolean', description: 'Run integration tests' },
    { name: 'e2e', type: 'boolean', description: 'Run end-to-end tests' },
    { name: 'quality', type: 'boolean', description: 'Quality checks' },
    { name: 'standards', type: 'boolean', description: 'Enforce coding standards' },
    { name: 'api', type: 'boolean', description: 'Build API components' }
  ],
  cleanup: [
    { name: 'type', type: 'string', description: 'Cleanup type: temp|cache|logs|all' },
    { name: 'force', type: 'boolean', description: 'Force cleanup without confirmation' },
    { name: 'preview', type: 'boolean', description: 'Preview what will be cleaned' }
  ],
  design: [
    { name: 'type', type: 'string', description: 'Design type: ui|api|database|system' },
    { name: 'interactive', type: 'boolean', description: 'Interactive design mode' },
    { name: 'template', type: 'string', description: 'Design template to use' }
  ],
  document: [
    { name: 'type', type: 'string', description: 'Documentation type: api|user|dev|readme' },
    { name: 'lang', type: 'string', description: 'Language for documentation', default: 'en' },
    { name: 'template', type: 'string', description: 'Documentation template' }
  ],
  estimate: [
    { name: 'type', type: 'string', description: 'Estimation type: time|cost|complexity' },
    { name: 'detail', type: 'string', description: 'Detail level: high|medium|low', default: 'medium' },
    { name: 'method', type: 'string', description: 'Estimation method: agile|waterfall|hybrid' }
  ],
  explain: [
    { name: 'level', type: 'string', description: 'Explanation level: beginner|intermediate|expert' },
    { name: 'detailed', type: 'boolean', description: 'Provide detailed explanations' },
    { name: 'examples', type: 'boolean', description: 'Include examples' }
  ],
  git: [
    { name: 'action', type: 'string', description: 'Git action: commit|push|pull|merge|branch' },
    { name: 'message', type: 'string', description: 'Commit message' },
    { name: 'branch', type: 'string', description: 'Branch name' }
  ],
  implement: [
    { name: 'type', type: 'string', description: 'Implementation type: feature|fix|refactor' },
    { name: 'test', type: 'boolean', description: 'Generate tests' },
    { name: 'docs', type: 'boolean', description: 'Generate documentation' }
  ],
  improve: [
    { name: 'focus', type: 'string', description: 'Improvement focus: performance|quality|security|architecture' },
    { name: 'perf', type: 'boolean', description: 'Performance improvements' },
    { name: 'quality', type: 'boolean', description: 'Code quality improvements' },
    { name: 'security', type: 'boolean', description: 'Security improvements' },
    { name: 'arch', type: 'boolean', description: 'Architecture improvements' }
  ],
  load: [
    { name: 'source', type: 'string', description: 'Data source to load from' },
    { name: 'format', type: 'string', description: 'Data format: json|csv|xml|yaml' },
    { name: 'validate', type: 'boolean', description: 'Validate loaded data' }
  ],
  spawn: [
    { name: 'type', type: 'string', description: 'Spawn type: process|service|container' },
    { name: 'config', type: 'string', description: 'Configuration for spawned entity' }
  ],
  task: [
    { name: 'action', type: 'string', description: 'Task action: create|update|complete|list' },
    { name: 'priority', type: 'string', description: 'Task priority: high|medium|low' },
    { name: 'assignee', type: 'string', description: 'Task assignee' }
  ],
  test: [
    { name: 'type', type: 'string', description: 'Test type: unit|integration|e2e|performance' },
    { name: 'coverage', type: 'boolean', description: 'Generate coverage report' },
    { name: 'watch', type: 'boolean', description: 'Watch mode for continuous testing' },
    { name: 'benchmark', type: 'boolean', description: 'Run performance benchmarks' }
  ],
  troubleshoot: [
    { name: 'focus', type: 'string', description: 'Troubleshooting focus area' },
    { name: 'logs', type: 'boolean', description: 'Analyze logs' },
    { name: 'trace', type: 'boolean', description: 'Enable tracing' }
  ],
  workflow: [
    { name: 'action', type: 'string', description: 'Workflow action: create|run|stop|status' },
    { name: 'config', type: 'string', description: 'Workflow configuration file' }
  ]
};

/**
 * Parses a command string into structured command data
 */
export class CommandParser {
  /**
   * Parse command string into structured format
   */
  static parse(commandString: string): ParsedCommand {
    const args = this.tokenize(commandString);
    
    if (args.length === 0) {
      throw new Error("No command provided");
    }

    const command = args[0];
    const remainingArgs = args.slice(1);
    
    // Separate flags from positional arguments
    const { positionalArgs, flags } = this.separateArgsAndFlags(remainingArgs);
    
    // First positional argument is typically the target
    const target = positionalArgs.length > 0 ? positionalArgs[0] : undefined;
    const additionalArgs = positionalArgs.slice(1);

    return {
      command,
      target,
      args: additionalArgs,
      flags,
      rawArgs: remainingArgs
    };
  }

  /**
   * Tokenize command string, handling quotes and escapes
   */
  private static tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let escaped = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        continue;
      }

      if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
        continue;
      }

      if (!inQuotes && /\s/.test(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  /**
   * Separate positional arguments from flags
   */
  private static separateArgsAndFlags(args: string[]): {
    positionalArgs: string[];
    flags: Record<string, string | boolean>;
  } {
    const positionalArgs: string[] = [];
    const flags: Record<string, string | boolean> = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        // Long flag
        const flagName = arg.slice(2);
        const nextArg = args[i + 1];
        
        if (nextArg && !nextArg.startsWith('-')) {
          // Flag with value
          flags[flagName] = nextArg;
          i++; // Skip next argument as it's the flag value
        } else {
          // Boolean flag
          flags[flagName] = true;
        }
      } else if (arg.startsWith('-') && arg.length > 1) {
        // Short flag(s)
        const shortFlags = arg.slice(1);
        for (const flag of shortFlags) {
          flags[flag] = true;
        }
      } else {
        // Positional argument
        positionalArgs.push(arg);
      }
    }

    return { positionalArgs, flags };
  }

  /**
   * Validate command exists
   */
  static validateCommand(command: string): boolean {
    const validCommands = [
      'analyze', 'build', 'cleanup', 'design', 'document', 'estimate',
      'explain', 'git', 'implement', 'improve', 'index', 'load',
      'spawn', 'task', 'test', 'troubleshoot', 'workflow'
    ];
    
    return validCommands.includes(command);
  }

  /**
   * Get available flags for a command
   */
  static getCommandFlags(command: string): CommandFlag[] {
    const commandSpecific = COMMAND_FLAGS[command] || [];
    return [...UNIVERSAL_FLAGS, ...commandSpecific];
  }

  /**
   * Validate flags for a command
   */
  static validateFlags(command: string, flags: Record<string, string | boolean>): {
    valid: boolean;
    errors: string[];
  } {
    const availableFlags = this.getCommandFlags(command);
    const validFlagNames = new Set(availableFlags.map(f => f.name));
    const errors: string[] = [];

    for (const flagName in flags) {
      if (!validFlagNames.has(flagName)) {
        errors.push(`Unknown flag: --${flagName}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Apply default values to flags
   */
  static applyDefaults(command: string, flags: Record<string, string | boolean>): Record<string, string | boolean> {
    const availableFlags = this.getCommandFlags(command);
    const result = { ...flags };

    for (const flag of availableFlags) {
      if (flag.default !== undefined && !(flag.name in result)) {
        result[flag.name] = flag.default;
      }
    }

    return result;
  }
}