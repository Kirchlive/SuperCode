package transformer

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/Kirchlive/SuperCode/internal/analyzer/types"
	"github.com/Kirchlive/SuperCode/internal/generator"
)

// MCPTransformer handles transformation of SuperClaude MCP features to OpenCode
type MCPTransformer struct {
	generator *generator.Generator
}

// NewMCPTransformer creates a new MCP transformer
func NewMCPTransformer(gen *generator.Generator) *MCPTransformer {
	return &MCPTransformer{
		generator: gen,
	}
}

// Transform converts MCP features to OpenCode format
func (t *MCPTransformer) Transform(feature *types.MCPFeature, outputDir string) error {
	// Starting MCP transformation

	// Create MCP server implementations
	if err := t.createMCPServers(feature, outputDir); err != nil {
		return fmt.Errorf("failed to create MCP servers: %w", err)
	}

	// Create MCP configuration
	if err := t.createMCPConfig(feature, outputDir); err != nil {
		return fmt.Errorf("failed to create MCP config: %w", err)
	}

	// Create command integrations
	if err := t.createCommandIntegrations(feature, outputDir); err != nil {
		return fmt.Errorf("failed to create command integrations: %w", err)
	}

	// MCP transformation completed
	return nil
}

// createMCPServers creates MCP server implementations
func (t *MCPTransformer) createMCPServers(feature *types.MCPFeature, outputDir string) error {
	for name, server := range feature.Servers {
		serverName := strings.ToLower(name)
		
		// Create server directory
		serverDir := filepath.Join(outputDir, "mcp-servers", serverName)
		
		// Generate server implementation
		serverImpl := t.generateServerImplementation(name, server)
		if err := t.generator.WriteFile(filepath.Join(serverDir, "index.ts"), serverImpl); err != nil {
			return fmt.Errorf("failed to write server %s: %w", name, err)
		}

		// Generate package.json
		packageJSON := t.generatePackageJSON(name, server)
		if err := t.generator.WriteFile(filepath.Join(serverDir, "package.json"), packageJSON); err != nil {
			return fmt.Errorf("failed to write package.json for %s: %w", name, err)
		}

		// Generate README
		readme := t.generateServerREADME(name, server)
		if err := t.generator.WriteFile(filepath.Join(serverDir, "README.md"), readme); err != nil {
			return fmt.Errorf("failed to write README for %s: %w", name, err)
		}

		// Created MCP server
	}

	return nil
}

// generateServerImplementation generates TypeScript implementation for an MCP server
func (t *MCPTransformer) generateServerImplementation(name string, server types.MCPServer) string {
	var capabilities []string
	for _, cap := range server.Capabilities {
		capabilities = append(capabilities, fmt.Sprintf(`
    {
      name: "%s",
      description: "%s capability",
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: async (args: any) => {
        // TODO: Implement %s
        return { success: true };
      },
    }`, cap, cap, cap))
	}

	return fmt.Sprintf(`import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// %s MCP Server
// Purpose: %s
// Token Cost: %s
// Success Rate: %s

const server = new Server(
  {
    name: "%s",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [%s
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
%s
    default:
      throw new Error(` + "`Unknown tool: ${name}`" + `);
  }
});

// Error handling
process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport);

console.error("%s MCP server started");
`,
		name,
		server.Purpose,
		server.TokenCost,
		server.SuccessRate,
		strings.ToLower(name),
		strings.Join(capabilities, ","),
		t.generateToolHandlers(server.Capabilities),
		name,
	)
}

// generateToolHandlers generates case statements for tool handlers
func (t *MCPTransformer) generateToolHandlers(capabilities []string) string {
	var handlers []string
	for _, cap := range capabilities {
		handlers = append(handlers, fmt.Sprintf(`    case "%s":
      // TODO: Implement %s
      return { success: true };`, cap, cap))
	}
	return strings.Join(handlers, "\n")
}

// generatePackageJSON generates package.json for an MCP server
func (t *MCPTransformer) generatePackageJSON(name string, server types.MCPServer) string {
	return fmt.Sprintf(`{
  "name": "@supercode/mcp-%s",
  "version": "1.0.0",
  "description": "%s",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.0"
  }
}`, strings.ToLower(name), server.Purpose)
}

// generateServerREADME generates README for an MCP server
func (t *MCPTransformer) generateServerREADME(name string, server types.MCPServer) string {
	bestFor := strings.Join(server.BestFor, "\n- ")
	capabilities := strings.Join(server.Capabilities, "\n- ")

	workflowsSection := ""
	if len(server.Workflows) > 0 {
		workflowsSection = "\n## Workflows\n\n"
		for wfName, wf := range server.Workflows {
			workflowsSection += fmt.Sprintf("### %s\n\n", wfName)
			if wf.Process != "" {
				workflowsSection += fmt.Sprintf("**Process**: %s\n\n", wf.Process)
			}
			if wf.Example != "" {
				workflowsSection += fmt.Sprintf("**Example**: %s\n\n", wf.Example)
			}
		}
	}

	return fmt.Sprintf(`# %s MCP Server

%s

## Overview

- **Token Cost**: %s
- **Success Rate**: %s
- **Fallback**: %s

## Best For

- %s

## Capabilities

- %s
%s
## Usage

Configure in your OpenCode settings:

` + "```json" + `
{
  "mcp": {
    "%s": {
      "type": "local",
      "command": ["node", "path/to/%s/dist/index.js"]
    }
  }
}
` + "```" + `

## Development

` + "```bash" + `
npm install
npm run build
npm start
` + "```" + `
`,
		name,
		server.Purpose,
		server.TokenCost,
		server.SuccessRate,
		server.Fallback,
		bestFor,
		capabilities,
		workflowsSection,
		strings.ToLower(name),
		strings.ToLower(name),
	)
}

// createMCPConfig creates OpenCode MCP configuration
func (t *MCPTransformer) createMCPConfig(feature *types.MCPFeature, outputDir string) error {
	config := t.generateMCPConfig(feature)
	
	configPath := filepath.Join(outputDir, "config", "mcp-config.json")
	if err := t.generator.WriteFile(configPath, config); err != nil {
		return fmt.Errorf("failed to write MCP config: %w", err)
	}

	// Also create example opencode.json
	exampleConfig := t.generateExampleConfig(feature)
	examplePath := filepath.Join(outputDir, "config", "opencode.example.json")
	if err := t.generator.WriteFile(examplePath, exampleConfig); err != nil {
		return fmt.Errorf("failed to write example config: %w", err)
	}

	return nil
}

// generateMCPConfig generates MCP configuration
func (t *MCPTransformer) generateMCPConfig(feature *types.MCPFeature) string {
	var servers []string
	
	for name := range feature.Servers {
		serverName := strings.ToLower(name)
		servers = append(servers, fmt.Sprintf(`    "%s": {
      "type": "local",
      "command": ["node", "./mcp-servers/%s/dist/index.js"],
      "enabled": true
    }`, serverName, serverName))
	}

	return fmt.Sprintf(`{
  "$schema": "https://opencode.dev/schemas/config.json",
  "mcp": {
%s
  }
}`, strings.Join(servers, ",\n"))
}

// generateExampleConfig generates example OpenCode configuration
func (t *MCPTransformer) generateExampleConfig(feature *types.MCPFeature) string {
	// Include command defaults
	var commandDefaults []string
	for cmd, servers := range feature.CommandDefaults {
		serverList := strings.Join(servers, ", ")
		commandDefaults = append(commandDefaults, 
			fmt.Sprintf(`    // %s: recommended servers: %s`, cmd, serverList))
	}

	return fmt.Sprintf(`{
  "$schema": "https://opencode.dev/schemas/config.json",
  "model": "anthropic/claude-3-5-sonnet-20241022",
  "mcp": {
    // MCP servers from SuperClaude
    "context7": {
      "type": "local",
      "command": ["node", "./mcp-servers/context7/dist/index.js"],
      "enabled": true
    },
    "sequential": {
      "type": "local", 
      "command": ["node", "./mcp-servers/sequential/dist/index.js"],
      "enabled": true
    },
    "magic": {
      "type": "local",
      "command": ["node", "./mcp-servers/magic/dist/index.js"],
      "enabled": true
    },
    "puppeteer": {
      "type": "local",
      "command": ["node", "./mcp-servers/puppeteer/dist/index.js"],
      "enabled": true
    }
  },
  // Command-specific MCP recommendations:
%s
}`, strings.Join(commandDefaults, "\n"))
}

// createCommandIntegrations creates command-specific MCP integrations
func (t *MCPTransformer) createCommandIntegrations(feature *types.MCPFeature, outputDir string) error {
	// Create command extensions that use MCP
	integrationsDir := filepath.Join(outputDir, "commands", "mcp-integrations")

	// Generate context detection helper
	contextHelper := t.generateContextDetectionHelper(feature)
	helperPath := filepath.Join(integrationsDir, "context-detection.ts")
	if err := t.generator.WriteFile(helperPath, contextHelper); err != nil {
		return fmt.Errorf("failed to write context detection helper: %w", err)
	}

	// Generate command integration helper
	cmdHelper := t.generateCommandIntegrationHelper(feature)
	cmdPath := filepath.Join(integrationsDir, "command-mcp.ts")
	if err := t.generator.WriteFile(cmdPath, cmdHelper); err != nil {
		return fmt.Errorf("failed to write command integration helper: %w", err)
	}

	// Generate quality control helper
	qcHelper := t.generateQualityControlHelper(feature)
	qcPath := filepath.Join(integrationsDir, "quality-control.ts")
	if err := t.generator.WriteFile(qcPath, qcHelper); err != nil {
		return fmt.Errorf("failed to write quality control helper: %w", err)
	}

	return nil
}

// generateContextDetectionHelper generates context detection helper
func (t *MCPTransformer) generateContextDetectionHelper(feature *types.MCPFeature) string {
	var triggers []string
	
	for name, trigger := range feature.ContextTriggers {
		patterns := strings.Join(trigger.Patterns, `", "`)
		keywords := strings.Join(trigger.Keywords, `", "`)
		
		triggers = append(triggers, fmt.Sprintf(`  {
    name: "%s",
    patterns: ["%s"],
    keywords: ["%s"],
    action: "%s",
    required: %t,
  }`, name, patterns, keywords, trigger.Action, trigger.Required))
	}

	return fmt.Sprintf(`// MCP Context Detection Helper
// Auto-generated from SuperClaude context triggers

export interface ContextTrigger {
  name: string;
  patterns: string[];
  keywords: string[];
  action: string;
  required: boolean;
}

export const contextTriggers: ContextTrigger[] = [
%s
];

export function detectMCPContext(content: string): string[] {
  const recommendations: string[] = [];
  
  for (const trigger of contextTriggers) {
    // Check patterns
    for (const pattern of trigger.patterns) {
      const regex = new RegExp(pattern, 'gm');
      if (regex.test(content)) {
        recommendations.push(trigger.action);
        break;
      }
    }
    
    // Check keywords
    for (const keyword of trigger.keywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        recommendations.push(trigger.action);
        break;
      }
    }
  }
  
  return [...new Set(recommendations)];
}

export function getMCPServersFromAction(action: string): string[] {
  const servers: string[] = [];
  
  if (action.includes("C7") || action.includes("Context7")) {
    servers.push("context7");
  }
  if (action.includes("Sequential")) {
    servers.push("sequential");
  }
  if (action.includes("Magic")) {
    servers.push("magic");
  }
  if (action.includes("Puppeteer")) {
    servers.push("puppeteer");
  }
  
  return servers;
}
`, strings.Join(triggers, ",\n"))
}

// generateCommandIntegrationHelper generates command integration helper
func (t *MCPTransformer) generateCommandIntegrationHelper(feature *types.MCPFeature) string {
	var defaults []string
	
	for cmd, servers := range feature.CommandDefaults {
		serverList := strings.Join(servers, `", "`)
		defaults = append(defaults, fmt.Sprintf(`  "%s": ["%s"]`, cmd, serverList))
	}

	return fmt.Sprintf(`// Command MCP Integration Helper
// Auto-generated from SuperClaude command defaults

export const commandMCPDefaults: Record<string, string[]> = {
%s
};

export function getRecommendedMCPServers(command: string): string[] {
  return commandMCPDefaults[command] || [];
}

export function shouldEnableMCP(command: string, flags: string[]): boolean {
  // Check if MCP is explicitly disabled
  if (flags.includes("--no-mcp")) {
    return false;
  }
  
  // Check if specific MCP is requested
  const mcpFlags = ["--c7", "--seq", "--magic", "--pup", "--all-mcp"];
  if (flags.some(flag => mcpFlags.includes(flag))) {
    return true;
  }
  
  // Check command defaults
  const recommended = getRecommendedMCPServers(command);
  return recommended.length > 0;
}
`, strings.Join(defaults, ",\n"))
}

// generateQualityControlHelper generates quality control helper
func (t *MCPTransformer) generateQualityControlHelper(feature *types.MCPFeature) string {
	var checks []string
	
	for server, qc := range feature.QualityControl {
		successCriteria := strings.Join(qc.SuccessCriteria, `", "`)
		partialResults := strings.Join(qc.PartialResults, `", "`)
		failureRecovery := strings.Join(qc.FailureRecovery, `", "`)
		
		checks = append(checks, fmt.Sprintf(`  "%s": {
    successCriteria: ["%s"],
    partialResults: ["%s"],
    failureRecovery: ["%s"],
  }`, server, successCriteria, partialResults, failureRecovery))
	}

	return fmt.Sprintf(`// MCP Quality Control Helper
// Auto-generated from SuperClaude quality control

export interface QualityCheck {
  successCriteria: string[];
  partialResults: string[];
  failureRecovery: string[];
}

export const qualityChecks: Record<string, QualityCheck> = {
%s
};

export function validateMCPResult(server: string, result: any): {
  status: 'success' | 'partial' | 'failure';
  recovery?: string;
} {
  const check = qualityChecks[server];
  if (!check) {
    return { status: 'success' };
  }
  
  // TODO: Implement actual validation logic based on criteria
  // This is a placeholder implementation
  
  if (!result || result.error) {
    return {
      status: 'failure',
      recovery: check.failureRecovery[0],
    };
  }
  
  return { status: 'success' };
}

// Token economics helper
export const tokenEconomics = {
  budgetAllocation: "%s",
  intelligentEscalation: "%s",
  abortConditions: [%s],
  efficiencyPatterns: [%s],
};

export function shouldAbortMCP(context: any): boolean {
  // Check abort conditions
  // TODO: Implement actual abort logic
  return false;
}
`,
		strings.Join(checks, ",\n"),
		feature.TokenEconomics.BudgetAllocation,
		feature.TokenEconomics.IntelligentEscalation,
		`"` + strings.Join(feature.TokenEconomics.AbortConditions, `", "`) + `"`,
		`"` + strings.Join(feature.TokenEconomics.EfficiencyPatterns, `", "`) + `"`,
	)
}