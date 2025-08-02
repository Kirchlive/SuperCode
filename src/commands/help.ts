// Help Command Implementation
// Context-aware help with examples, command suggestions, and fuzzy search

import type { Argv } from "yargs";
import { cmd } from "../cmd";

// Help system implementation
class HelpSystem {
  private commandRegistry: Map<string, any> = new Map();
  private helpCache: Map<string, any> = new Map();

  constructor() {
    this.initializeCommandRegistry();
  }

  private initializeCommandRegistry() {
    // Command metadata - this would be loaded from external/superclaude in real implementation
    const commands = {
      analyze: {
        description: "Analyze code and architecture with deep insights",
        usage: "/analyze [target] [options]",
        category: "analysis",
        frequency: 85,
        flags: [
          { name: "deep", description: "Enable deep analysis", type: "boolean" },
          { name: "patterns", description: "Analyze design patterns", type: "boolean" },
          { name: "metrics", description: "Include code metrics", type: "boolean" },
          { name: "format", description: "Output format", type: "string", choices: ["text", "json", "markdown"] }
        ],
        examples: [
          { description: "Analyze entire project", command: "/analyze . --deep --patterns" },
          { description: "Quick file analysis", command: "/analyze src/app.ts" },
          { description: "JSON output with metrics", command: "/analyze --format=json --metrics" }
        ],
        related_commands: ["explain", "review", "document"]
      },
      build: {
        description: "Build and compile projects with intelligent configuration",
        usage: "/build [target] [options]",
        category: "process",
        frequency: 72,
        flags: [
          { name: "watch", description: "Watch for changes", type: "boolean" },
          { name: "prod", description: "Production build", type: "boolean" },
          { name: "clean", description: "Clean before build", type: "boolean" }
        ],
        examples: [
          { description: "Development build with watch", command: "/build --watch" },
          { description: "Production build", command: "/build --prod --clean" }
        ],
        related_commands: ["test", "deploy", "optimize"]
      },
      search: {
        description: "Search files and content with semantic understanding",
        usage: "/search <query> [options]",
        category: "utility",
        frequency: 68,
        flags: [
          { name: "type", description: "Search type", type: "string", choices: ["files", "content", "both", "semantic"] },
          { name: "path", description: "Search path", type: "string" },
          { name: "regex", description: "Use regex pattern", type: "boolean" }
        ],
        examples: [
          { description: "Search for authentication code", command: "/search 'authentication' --type=both" },
          { description: "Semantic search", command: "/search 'user login flow' --semantic" }
        ],
        related_commands: ["grep", "find", "analyze"]
      },
      document: {
        description: "Generate comprehensive documentation",
        usage: "/document [target] [options]",
        category: "utility",
        frequency: 45,
        flags: [
          { name: "type", description: "Documentation type", type: "string", choices: ["api", "readme", "user", "dev"] },
          { name: "template", description: "Use template", type: "string" },
          { name: "format", description: "Output format", type: "string", choices: ["markdown", "html", "pdf"] }
        ],
        examples: [
          { description: "Generate API docs", command: "/document src/api --type=api" },
          { description: "Update README", command: "/document . --type=readme" }
        ],
        related_commands: ["explain", "analyze"]
      },
      spawn: {
        description: "Orchestrate complex tasks with sub-agents",
        usage: "/spawn <task> [options]",
        category: "utility",
        frequency: 35,
        flags: [
          { name: "strategy", description: "Execution strategy", type: "string", choices: ["sequential", "parallel", "auto"] },
          { name: "validate", description: "Enable validation", type: "boolean" },
          { name: "monitor", description: "Monitor progress", type: "boolean" }
        ],
        examples: [
          { description: "Build authentication system", command: "/spawn 'Build user auth system' --parallel --validate" },
          { description: "Refactor with monitoring", command: "/spawn 'Refactor legacy code' --monitor" }
        ],
        related_commands: ["task", "workflow", "orchestrate"]
      },
      help: {
        description: "Get help and guidance for SuperClaude commands",
        usage: "/help [command] [options]",
        category: "utility",
        frequency: 95,
        flags: [
          { name: "all", description: "Show all commands", type: "boolean" },
          { name: "quick", description: "Show quick start guide", type: "boolean" },
          { name: "search", description: "Search commands", type: "string" },
          { name: "examples", description: "Include examples", type: "boolean" },
          { name: "format", description: "Output format", type: "string", choices: ["text", "json", "markdown"] }
        ],
        examples: [
          { description: "Get help for analyze command", command: "/help analyze" },
          { description: "Show all commands", command: "/help --all" },
          { description: "Quick start guide", command: "/help --quick" },
          { description: "Search for commands", command: "/help --search='documentation'" }
        ],
        related_commands: []
      }
    };

    Object.entries(commands).forEach(([name, config]) => {
      this.commandRegistry.set(name, config);
    });
  }

  async getCommandHelp(command: string): Promise<any> {
    const cacheKey = `command:${command}`;
    if (this.helpCache.has(cacheKey)) {
      return this.helpCache.get(cacheKey);
    }

    const commandConfig = this.commandRegistry.get(command);
    if (!commandConfig) {
      throw new Error(`Command '${command}' not found`);
    }

    const help = {
      command,
      description: commandConfig.description,
      usage: commandConfig.usage,
      flags: commandConfig.flags,
      examples: commandConfig.examples,
      related_commands: commandConfig.related_commands,
      category: commandConfig.category,
      frequency: commandConfig.frequency
    };

    this.helpCache.set(cacheKey, help);
    return help;
  }

  async getAllCommands(): Promise<any> {
    const cacheKey = "all-commands";
    if (this.helpCache.has(cacheKey)) {
      return this.helpCache.get(cacheKey);
    }

    const categories: Record<string, string[]> = {};
    const commands: Record<string, any> = {};
    let total = 0;

    for (const [name, config] of this.commandRegistry.entries()) {
      const category = config.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(name);
      commands[name] = {
        description: config.description,
        frequency: config.frequency
      };
      total++;
    }

    // Sort commands by frequency within categories
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => {
        const freqA = this.commandRegistry.get(a)?.frequency || 0;
        const freqB = this.commandRegistry.get(b)?.frequency || 0;
        return freqB - freqA;
      });
    });

    const mostUsed = Array.from(this.commandRegistry.entries())
      .sort(([, a], [, b]) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, 4)
      .map(([name]) => name);

    const result = {
      categories,
      commands,
      total,
      most_used: mostUsed
    };

    this.helpCache.set(cacheKey, result);
    return result;
  }

  async getQuickStart(): Promise<any> {
    const cacheKey = "quick-start";
    if (this.helpCache.has(cacheKey)) {
      return this.helpCache.get(cacheKey);
    }

    const quickStart = {
      title: "SuperClaude Quick Start Guide",
      sections: [
        {
          title: "Getting Started",
          content: "Welcome to SuperClaude! Use `/help [command]` for specific help, or `/help --all` to see all available commands."
        },
        {
          title: "Most Common Commands",
          content: "• `/analyze` - Analyze code and architecture\n• `/build` - Build and compile projects\n• `/help` - Get help and guidance\n• `/search` - Search files and content"
        },
        {
          title: "Pro Tips",
          content: "• Use `--verbose` for detailed output\n• Try `/help --search='keyword'` to find relevant commands\n• Use personas like `--persona=architect` for specialized assistance"
        },
        {
          title: "Example Workflows",
          content: "1. Analyze project: `/analyze . --deep`\n2. Search for code: `/search 'function name' --type=content`\n3. Generate docs: `/document src/api --type=api`\n4. Build project: `/build --watch`"
        }
      ],
      estimated_read_time: "2 minutes"
    };

    this.helpCache.set(cacheKey, quickStart);
    return quickStart;
  }

  async searchCommands(query: string): Promise<any> {
    const queryLower = query.toLowerCase();
    const exactMatches: string[] = [];
    const fuzzyMatches: Array<{ command: string; similarity: number; reason: string }> = [];

    for (const [name, config] of this.commandRegistry.entries()) {
      // Exact match
      if (name === queryLower) {
        exactMatches.push(name);
        continue;
      }

      // Check description and keywords
      const description = config.description.toLowerCase();
      const category = config.category.toLowerCase();
      
      let similarity = 0;
      let reason = "";

      // Direct name similarity
      if (name.includes(queryLower) || queryLower.includes(name)) {
        similarity = 0.8;
        reason = "Name similarity";
      }
      // Description match
      else if (description.includes(queryLower)) {
        similarity = 0.7;
        reason = "Description match";
      }
      // Category match
      else if (category.includes(queryLower)) {
        similarity = 0.5;
        reason = "Category match";
      }
      // Fuzzy matching on related terms
      else if (this.fuzzyMatch(queryLower, name, description)) {
        similarity = 0.4;
        reason = "Related functionality";
      }

      if (similarity > 0) {
        fuzzyMatches.push({ command: name, similarity, reason });
      }
    }

    // Sort fuzzy matches by similarity
    fuzzyMatches.sort((a, b) => b.similarity - a.similarity);

    const suggestions = [];
    if (exactMatches.length === 0 && fuzzyMatches.length > 0) {
      suggestions.push(`Did you mean '${fuzzyMatches[0].command}'?`);
      if (fuzzyMatches.length > 1) {
        suggestions.push(`Also try: ${fuzzyMatches.slice(1, 3).map(m => `'${m.command}'`).join(", ")}`);
      }
    }

    return {
      query,
      exact_matches: exactMatches,
      fuzzy_matches: fuzzyMatches.slice(0, 5), // Limit results
      suggestions
    };
  }

  private fuzzyMatch(query: string, name: string, description: string): boolean {
    // Simple fuzzy matching - could be enhanced with better algorithms
    const terms = query.split(/\s+/);
    const text = `${name} ${description}`.toLowerCase();
    
    return terms.some(term => 
      text.includes(term) || 
      this.levenshteinDistance(term, name) <= 2
    );
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[b.length][a.length];
  }

  async getPersonalizedHelp(command: string, persona: string): Promise<any> {
    const baseHelp = await this.getCommandHelp(command);
    
    const personaEnhancements: Record<string, any> = {
      architect: {
        tips: [
          `As an architect, focus on ${command === "analyze" ? "architectural patterns and system design" : "design implications"}`,
          "Consider using --deep flag for comprehensive architectural analysis",
          "Look for design patterns and architectural decisions in the codebase"
        ],
        recommended_flags: ["--deep", "--patterns", "--architecture"],
        workflow_suggestions: [
          `Start with /${command} --help to understand all options`,
          `Use /${command} [target] --deep --patterns for architectural insights`,
          "Follow up with /document to capture architectural decisions"
        ]
      },
      developer: {
        tips: [
          `As a developer, focus on ${command === "analyze" ? "code quality and implementation details" : "practical implementation"}`,
          "Use --verbose for detailed implementation guidance",
          "Pay attention to code examples and practical usage patterns"
        ],
        recommended_flags: ["--verbose", "--examples", "--practical"],
        workflow_suggestions: [
          `Try /${command} --examples for practical code examples`,
          `Use /${command} [target] --verbose for detailed output`,
          "Combine with /test to validate implementations"
        ]
      },
      scribe: {
        tips: [
          `As a documentation specialist, focus on ${command === "document" ? "comprehensive documentation" : "documenting your findings"}`,
          "Always consider documentation impact of your actions",
          "Use --format=markdown for documentation-ready output"
        ],
        recommended_flags: ["--format=markdown", "--verbose", "--examples"],
        workflow_suggestions: [
          `Start with /${command} to gather information`,
          "Follow up with /document to create comprehensive documentation",
          "Use --format=markdown for documentation-ready output"
        ]
      }
    };

    const enhancement = personaEnhancements[persona] || {
      tips: [`Use /${command} effectively with appropriate flags`],
      recommended_flags: ["--verbose"],
      workflow_suggestions: [`Start with /${command} --help`]
    };

    return {
      command,
      persona,
      tips: enhancement.tips,
      recommended_flags: enhancement.recommended_flags,
      workflow_suggestions: enhancement.workflow_suggestions,
      base_help: baseHelp
    };
  }
}

// Output formatting functions
class HelpFormatter {
  static formatText(data: any, options: any = {}): string {
    if (data.type === "help-response") {
      return this.formatHelpResponse(data, options);
    }
    return JSON.stringify(data, null, 2);
  }

  static formatJson(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  static formatMarkdown(data: any): string {
    if (data.type === "help-response") {
      return this.formatHelpAsMarkdown(data);
    }
    return "```json\n" + JSON.stringify(data, null, 2) + "\n```";
  }

  private static formatHelpResponse(data: any, options: any): string {
    const { content, help_type } = data;
    let output = "";

    switch (help_type) {
      case "general":
        output += `${content.title}\n`;
        output += "=".repeat(content.title.length) + "\n\n";
        output += `${content.description}\n\n`;
        output += `Usage: ${content.usage}\n\n`;
        if (content.quick_start) {
          output += `Quick Start: ${content.quick_start}\n`;
        }
        break;

      case "command-specific":
        output += `Command: ${content.command}\n`;
        output += "-".repeat(`Command: ${content.command}`.length) + "\n\n";
        output += `${content.description}\n\n`;
        output += `Usage: ${content.usage}\n\n`;
        
        if (content.flags && content.flags.length > 0) {
          output += "Flags:\n";
          content.flags.forEach((flag: any) => {
            output += `  --${flag.name}  ${flag.description}`;
            if (flag.type) output += ` (${flag.type})`;
            if (flag.choices) output += ` [${flag.choices.join("|")}]`;
            output += "\n";
          });
          output += "\n";
        }

        if (content.examples && content.examples.length > 0) {
          output += "Examples:\n";
          content.examples.forEach((example: any) => {
            output += `  ${example.description}:\n    ${example.command}\n\n`;
          });
        }

        if (content.related_commands && content.related_commands.length > 0) {
          output += `Related commands: ${content.related_commands.join(", ")}\n`;
        }

        if (content.personalizedTips && options.persona) {
          output += "\nPersonalized Tips:\n";
          content.personalizedTips.forEach((tip: string) => {
            output += `  • ${tip}\n`;
          });
        }
        break;

      case "all-commands":
        output += `${content.title}\n`;
        output += "=".repeat(content.title.length) + "\n\n";
        output += `Total commands: ${content.total}\n\n`;
        
        Object.entries(content.categories).forEach(([category, commands]: [string, any]) => {
          output += `${category.charAt(0).toUpperCase() + category.slice(1)}:\n`;
          commands.forEach((cmd: string) => {
            const cmdInfo = content.commands[cmd];
            output += `  ${cmd.padEnd(12)} - ${cmdInfo.description}\n`;
          });
          output += "\n";
        });

        if (content.most_used) {
          output += `Most used: ${content.most_used.join(", ")}\n`;
        }
        break;

      case "quick-start":
        output += `${content.title}\n`;
        output += "=".repeat(content.title.length) + "\n\n";
        content.sections.forEach((section: any) => {
          output += `${section.title}\n`;
          output += "-".repeat(section.title.length) + "\n";
          output += `${section.content}\n\n`;
        });
        if (content.estimated_read_time) {
          output += `Estimated read time: ${content.estimated_read_time}\n`;
        }
        break;

      case "search-results":
        output += `Search results for "${content.query}"\n`;
        output += "=".repeat(`Search results for "${content.query}"`.length) + "\n\n";
        
        if (content.results.exact_matches && content.results.exact_matches.length > 0) {
          output += "Exact matches:\n";
          content.results.exact_matches.forEach((cmd: string) => {
            output += `  ${cmd}\n`;
          });
          output += "\n";
        }

        if (content.results.fuzzy_matches && content.results.fuzzy_matches.length > 0) {
          output += "Related commands:\n";
          content.results.fuzzy_matches.forEach((match: any) => {
            output += `  ${match.command} (${match.reason})\n`;
          });
          output += "\n";
        }

        if (content.results.suggestions && content.results.suggestions.length > 0) {
          output += "Suggestions:\n";
          content.results.suggestions.forEach((suggestion: string) => {
            output += `  ${suggestion}\n`;
          });
        }
        break;
    }

    return output;
  }

  private static formatHelpAsMarkdown(data: any): string {
    // Similar to formatHelpResponse but with Markdown formatting
    const { content, help_type } = data;
    let output = "";

    switch (help_type) {
      case "command-specific":
        output += `# ${content.command}\n\n`;
        output += `${content.description}\n\n`;
        output += `## Usage\n\n\`\`\`\n${content.usage}\n\`\`\`\n\n`;
        
        if (content.flags && content.flags.length > 0) {
          output += "## Flags\n\n";
          content.flags.forEach((flag: any) => {
            output += `- \`--${flag.name}\` - ${flag.description}`;
            if (flag.type) output += ` *(${flag.type})*`;
            output += "\n";
          });
          output += "\n";
        }

        if (content.examples && content.examples.length > 0) {
          output += "## Examples\n\n";
          content.examples.forEach((example: any) => {
            output += `**${example.description}:**\n\`\`\`\n${example.command}\n\`\`\`\n\n`;
          });
        }
        break;

      default:
        // Fallback to text format wrapped in code block
        output = "```\n" + this.formatText(data) + "\n```";
    }

    return output;
  }
}

// Main command handler
export const HelpCommand = cmd({
  command: "help [target]",
  describe: "Get help and guidance for SuperClaude commands",
  
  builder: (yargs: Argv) => {
    return yargs
      .positional("target", {
        describe: "Specific command to get help for",
        type: "string"
      })
      .option("all", {
        describe: "Show all available commands",
        type: "boolean",
        default: false
      })
      .option("quick", {
        describe: "Show quick start guide",
        type: "boolean", 
        default: false
      })
      .option("search", {
        describe: "Search for commands by keyword",
        type: "string"
      })
      .option("examples", {
        describe: "Include detailed examples",
        type: "boolean",
        default: false
      })
      .option("format", {
        describe: "Output format",
        type: "string",
        choices: ["text", "json", "markdown"],
        default: "text"
      })
      .option("verbose", {
        describe: "Enable verbose output",
        type: "boolean",
        default: false
      });
  },

  handler: async (args: any) => {
    try {
      const helpSystem = new HelpSystem();
      const startTime = Date.now();
      
      // Determine what help to show
      const targetCommand = args.target;
      const showAll = args.all || (!targetCommand && !args.quick && !args.search);
      const showQuick = args.quick;
      const searchQuery = args.search;

      let result: any;

      if (searchQuery) {
        // Search for commands
        console.log(`Searching commands for "${searchQuery}"...`);
        const searchResults = await helpSystem.searchCommands(searchQuery);
        
        result = {
          type: "help-response",
          help_type: "search-results",
          query: searchQuery,
          content: {
            query: searchQuery,
            results: searchResults
          },
          success: true
        };
      } else if (showQuick) {
        // Show quick start guide
        console.log("Loading quick start guide...");
        const quickStart = await helpSystem.getQuickStart();
        
        result = {
          type: "help-response",
          help_type: "quick-start",
          content: quickStart,
          success: true
        };
      } else if (showAll) {
        // Show all commands
        console.log("Loading all commands...");
        const allCommands = await helpSystem.getAllCommands();
        
        result = {
          type: "help-response",
          help_type: "all-commands",
          content: {
            title: "SuperClaude Command Reference",
            categories: allCommands.categories,
            commands: allCommands.commands,
            total: allCommands.total,
            most_used: allCommands.most_used,
            usage: "Use `/help [command]` to get specific help for a command"
          },
          success: true
        };
      } else if (targetCommand) {
        // Show specific command help
        console.log(`Loading help for '${targetCommand}'...`);
        
        try {
          const commandHelp = await helpSystem.getCommandHelp(targetCommand);
          
          // Enhance with persona-specific guidance if available
          // In real implementation, this would check for active persona
          const persona = (args as any).persona;
          if (persona) {
            const personalizedHelp = await helpSystem.getPersonalizedHelp(targetCommand, persona);
            commandHelp.personalizedTips = personalizedHelp.tips;
            commandHelp.recommendedFlags = personalizedHelp.recommended_flags;
            commandHelp.workflowSuggestions = personalizedHelp.workflow_suggestions;
          }

          result = {
            type: "help-response",
            help_type: "command-specific",
            command: targetCommand,
            content: commandHelp,
            success: true
          };
        } catch (error: any) {
          // Handle unknown command with suggestions
          const searchResults = await helpSystem.searchCommands(targetCommand);
          
          result = {
            type: "help-error",
            error: `Unknown command: ${targetCommand}`,
            suggestions: searchResults.suggestions,
            fuzzy_matches: searchResults.fuzzy_matches.slice(0, 3),
            success: false
          };
        }
      } else {
        // Default general help
        result = {
          type: "help-response",
          help_type: "general",
          content: {
            title: "SuperClaude Help",
            description: "AI-powered development assistant with intelligent command processing",
            usage: "Use /help [command] for specific help, or /help --all for all commands",
            quick_start: "/help --quick"
          },
          success: true
        };
      }

      // Format output according to requested format
      let output: string;
      switch (args.format) {
        case "json":
          output = HelpFormatter.formatJson(result);
          break;
        case "markdown":
          output = HelpFormatter.formatMarkdown(result);
          break;
        default:
          output = HelpFormatter.formatText(result, { persona: (args as any).persona });
      }

      const executionTime = Date.now() - startTime;
      
      console.log(output);
      
      if (args.verbose) {
        console.log(`\n[Help system: ${executionTime}ms execution time]`);
      }

      return result;

    } catch (error: any) {
      console.error("Help system error:", error.message);
      
      const errorResult = {
        type: "help-error",
        error: error.message,
        suggestions: [
          "Try /help --all to see all available commands",
          "Use /help --quick for a quick start guide",
          "Check your command spelling and try again"
        ],
        success: false
      };

      if (args.format === "json") {
        console.log(HelpFormatter.formatJson(errorResult));
      }

      return errorResult;
    }
  }
});