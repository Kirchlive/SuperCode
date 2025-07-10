package analyzer

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/Kirchlive/SuperCode/internal/analyzer/types"
	"gopkg.in/yaml.v3"
)

// MCPDetector handles detection of MCP (Model Context Protocol) features
type MCPDetector struct {
}

// NewMCPDetector creates a new MCP detector
func NewMCPDetector() *MCPDetector {
	return &MCPDetector{}
}

// Detect searches for MCP features in SuperClaude
func (d *MCPDetector) Detect(superClaudePath string) (*types.MCPFeature, error) {
	// Starting MCP detection

	feature := &types.MCPFeature{
		Servers:          make(map[string]types.MCPServer),
		CommandDefaults:  make(map[string][]string),
		ContextTriggers:  make(map[string]types.MCPTrigger),
		QualityControl:   make(map[string]types.QualityCheck),
		ErrorRecovery:    make(map[string]types.Recovery),
	}

	// Check for MCP configuration files
	mcpFiles := []string{
		filepath.Join(superClaudePath, ".claude", "commands", "shared", "execution-patterns.yml"),
		filepath.Join(superClaudePath, ".claude", "shared", "superclaude-mcp.yml"),
		filepath.Join(superClaudePath, ".claude", "commands", "shared", "mcp-cache-patterns.yml"),
	}

	for _, file := range mcpFiles {
		if err := d.parseMCPFile(file, feature); err != nil {
			// Failed to parse MCP file: err
		}
	}

	// Detect MCP preferences in personas
	if err := d.detectPersonaMCPPreferences(superClaudePath, feature); err != nil {
		// Failed to detect persona MCP preferences: err
	}

	// Detect MCP usage in commands
	if err := d.detectCommandMCPUsage(superClaudePath, feature); err != nil {
		// Failed to detect command MCP usage: err
	}

	// MCP detection completed
	return feature, nil
}

// parseMCPFile parses a YAML file containing MCP configuration
func (d *MCPDetector) parseMCPFile(filePath string, feature *types.MCPFeature) error {
	content, err := readFile(filePath)
	if err != nil {
		return err
	}

	// Check if this is execution-patterns.yml which has YAML in code blocks
	if strings.Contains(filePath, "execution-patterns.yml") {
		return d.parseExecutionPatterns(content, feature)
	}
	
	// Check if this is superclaude-mcp.yml which needs special handling
	if strings.Contains(filePath, "superclaude-mcp.yml") {
		return d.parseSuperclaude(content, feature)
	}

	// For other files, try standard YAML parsing
	var data map[string]interface{}
	if err := yaml.Unmarshal([]byte(content), &data); err != nil {
		return fmt.Errorf("failed to parse YAML: %w", err)
	}

	// Extract servers from execution-patterns.yml
	if servers, ok := data["Servers"].(map[string]interface{}); ok {
		d.extractServers(servers, feature)
	}

	// Extract server capabilities from superclaude-mcp.yml
	if serverCaps, ok := data["Server_Capabilities_Extended"].(map[string]interface{}); ok {
		d.extractServerCapabilities(serverCaps, feature)
	}

	// Extract token economics
	if tokenEcon, ok := data["Token_Economics"].(map[string]interface{}); ok {
		d.extractTokenEconomics(tokenEcon, feature)
	}

	// Extract workflows
	if workflows, ok := data["Workflows"].(map[string]interface{}); ok {
		d.extractWorkflows(workflows, feature)
	}
	// Also check for renamed workflows section
	if workflows, ok := data["MCP_Workflows"].(map[string]interface{}); ok {
		d.extractWorkflows(workflows, feature)
	}

	// Extract quality control
	if qc, ok := data["Quality_Control"].(map[string]interface{}); ok {
		d.extractQualityControl(qc, feature)
	}

	// Extract command integration
	if cmdIntegration, ok := data["Command_Integration"].(map[string]interface{}); ok {
		d.extractCommandIntegration(cmdIntegration, feature)
	}

	// Extract error recovery
	if errorRecovery, ok := data["Error_Recovery"].(map[string]interface{}); ok {
		d.extractErrorRecovery(errorRecovery, feature)
	}

	// Extract context detection patterns
	if contextDetection, ok := data["Context_Detection_Patterns"].(map[string]interface{}); ok {
		d.extractContextTriggers(contextDetection, feature)
	}

	return nil
}

// extractServers extracts MCP server definitions
func (d *MCPDetector) extractServers(servers map[string]interface{}, feature *types.MCPFeature) {
	for name, serverData := range servers {
		if serverMap, ok := serverData.(map[string]interface{}); ok {
			server := types.MCPServer{
				Name: name,
			}

			if purpose, ok := serverMap["Purpose"].(string); ok {
				server.Purpose = purpose
			}
			if bestFor, ok := serverMap["Best_For"].([]interface{}); ok {
				server.BestFor = interfaceSliceToStringSlice(bestFor)
			}
			if tokenCost, ok := serverMap["Token_Cost"].(string); ok {
				server.TokenCost = tokenCost
			}
			if successRate, ok := serverMap["Success_Rate"].(string); ok {
				server.SuccessRate = successRate
			}
			if fallback, ok := serverMap["Fallback"].(string); ok {
				server.Fallback = fallback
			}
			if capabilities, ok := serverMap["Capabilities"].([]interface{}); ok {
				server.Capabilities = d.extractCapabilities(capabilities)
			}

			feature.Servers[name] = server
		}
	}
}

// extractServerCapabilities extracts extended server capabilities
func (d *MCPDetector) extractServerCapabilities(serverCaps map[string]interface{}, feature *types.MCPFeature) {
	for name, capData := range serverCaps {
		if capMap, ok := capData.(map[string]interface{}); ok {
			server := feature.Servers[name]
			
			if server.Name == "" {
				server = types.MCPServer{Name: name}
			}

			if purpose, ok := capMap["Purpose"].(string); ok {
				server.Purpose = purpose
			}
			if capabilities, ok := capMap["Capabilities"].(string); ok {
				server.Capabilities = append(server.Capabilities, capabilities)
			}
			if bestFor, ok := capMap["Best_For"].(string); ok {
				server.BestFor = append(server.BestFor, bestFor)
			}
			if use, ok := capMap["Use"].(string); ok {
				// Add use case to capabilities
				server.Capabilities = append(server.Capabilities, use)
			}
			if tokenCost, ok := capMap["Token_Cost"].(string); ok {
				server.TokenCost = tokenCost
			}
			if workflows, ok := capMap["Workflows"].(string); ok {
				// Parse workflow string
				if server.Workflows == nil {
					server.Workflows = make(map[string]types.MCPWorkflow)
				}
				server.Workflows["default"] = types.MCPWorkflow{
					Process: workflows,
				}
			}

			feature.Servers[name] = server
		}
	}
}

// extractCapabilities extracts capability strings
func (d *MCPDetector) extractCapabilities(capabilities []interface{}) []string {
	var result []string
	for _, cap := range capabilities {
		if capStr, ok := cap.(string); ok {
			// Extract capability name from format "capability_name: description"
			parts := strings.Split(capStr, ":")
			if len(parts) > 0 {
				result = append(result, strings.TrimSpace(parts[0]))
			}
		} else if capMap, ok := cap.(map[string]interface{}); ok {
			// Handle map format
			for key := range capMap {
				result = append(result, key)
			}
		}
	}
	return result
}

// extractTokenEconomics extracts token usage optimization settings
func (d *MCPDetector) extractTokenEconomics(tokenEcon map[string]interface{}, feature *types.MCPFeature) {
	te := types.TokenEconomics{}

	if budget, ok := tokenEcon["Budget_Allocation"].(string); ok {
		te.BudgetAllocation = budget
	}
	if escalation, ok := tokenEcon["Intelligent_Escalation"].(string); ok {
		te.IntelligentEscalation = escalation
	}
	if abort, ok := tokenEcon["Abort_Conditions"].(string); ok {
		te.AbortConditions = strings.Split(abort, " | ")
	}
	if efficiency, ok := tokenEcon["Efficiency_Patterns"].(string); ok {
		te.EfficiencyPatterns = strings.Split(efficiency, " | ")
	}

	feature.TokenEconomics = te
}

// extractWorkflows extracts workflow patterns
func (d *MCPDetector) extractWorkflows(workflows map[string]interface{}, feature *types.MCPFeature) {
	for workflowName, workflowData := range workflows {
		if workflowMap, ok := workflowData.(map[string]interface{}); ok {
			// Find the relevant server
			serverName := d.inferServerFromWorkflow(workflowName)
			if server, exists := feature.Servers[serverName]; exists {
				if server.Workflows == nil {
					server.Workflows = make(map[string]types.MCPWorkflow)
				}

				workflow := types.MCPWorkflow{}
				if trigger, ok := workflowMap["Trigger"].(string); ok {
					workflow.Trigger = strings.Split(trigger, " | ")
				}
				if process, ok := workflowMap["Process"].(string); ok {
					workflow.Process = process
				}
				if standards, ok := workflowMap["Standards"].(string); ok {
					workflow.Standards = strings.Split(standards, " | ")
				}
				if example, ok := workflowMap["Example"].(string); ok {
					workflow.Example = example
				}

				server.Workflows[workflowName] = workflow
				feature.Servers[serverName] = server
			}
		}
	}
}

// inferServerFromWorkflow infers the server name from workflow name
func (d *MCPDetector) inferServerFromWorkflow(workflowName string) string {
	workflowLower := strings.ToLower(workflowName)
	
	if strings.Contains(workflowLower, "library") || strings.Contains(workflowLower, "research") {
		return "Context7"
	}
	if strings.Contains(workflowLower, "complex") || strings.Contains(workflowLower, "analysis") {
		return "Sequential"
	}
	if strings.Contains(workflowLower, "ui") || strings.Contains(workflowLower, "component") {
		return "Magic"
	}
	if strings.Contains(workflowLower, "test") || strings.Contains(workflowLower, "browser") {
		return "Puppeteer"
	}
	
	return ""
}

// extractQualityControl extracts quality control settings
func (d *MCPDetector) extractQualityControl(qc map[string]interface{}, feature *types.MCPFeature) {
	for serverName, qcData := range qc {
		// Clean server name (remove _Validation suffix)
		cleanName := strings.TrimSuffix(serverName, "_Validation")
		
		if qcMap, ok := qcData.(map[string]interface{}); ok {
			check := types.QualityCheck{}
			
			if success, ok := qcMap["Success_Criteria"].(string); ok {
				check.SuccessCriteria = strings.Split(success, " | ")
			}
			if partial, ok := qcMap["Partial_Results"].(string); ok {
				check.PartialResults = strings.Split(partial, " | ")
			}
			if failure, ok := qcMap["Failure_Recovery"].(string); ok {
				check.FailureRecovery = strings.Split(failure, " | ")
			}
			
			feature.QualityControl[cleanName] = check
		}
	}
}

// extractCommandIntegration extracts command-specific MCP defaults
func (d *MCPDetector) extractCommandIntegration(cmdIntegration map[string]interface{}, feature *types.MCPFeature) {
	for category, commands := range cmdIntegration {
		// Handle both nested structure (Development_Commands, etc.) and flat structure
		if commandMap, ok := commands.(map[string]interface{}); ok {
			for cmd, usage := range commandMap {
				if usageStr, ok := usage.(string); ok {
					// Extract MCP servers mentioned
					servers := d.extractMCPServers(usageStr)
					if len(servers) > 0 {
						feature.CommandDefaults[cmd] = servers
					}
				}
			}
		} else if usageStr, ok := commands.(string); ok {
			// Direct command mapping
			servers := d.extractMCPServers(usageStr)
			if len(servers) > 0 {
				feature.CommandDefaults[category] = servers
			}
		}
	}
}

// extractMCPServers extracts MCP server names from a usage string
func (d *MCPDetector) extractMCPServers(usage string) []string {
	var servers []string
	seen := make(map[string]bool)
	
	// Look for server names (case-insensitive)
	usageLower := strings.ToLower(usage)
	
	if strings.Contains(usageLower, "magic") {
		if !seen["Magic"] {
			servers = append(servers, "Magic")
			seen["Magic"] = true
		}
	}
	if strings.Contains(usageLower, "c7") || strings.Contains(usageLower, "context7") {
		if !seen["Context7"] {
			servers = append(servers, "Context7")
			seen["Context7"] = true
		}
	}
	if strings.Contains(usageLower, "sequential") {
		if !seen["Sequential"] {
			servers = append(servers, "Sequential")
			seen["Sequential"] = true
		}
	}
	if strings.Contains(usageLower, "puppeteer") {
		if !seen["Puppeteer"] {
			servers = append(servers, "Puppeteer")
			seen["Puppeteer"] = true
		}
	}
	
	return servers
}

// extractErrorRecovery extracts error recovery strategies
func (d *MCPDetector) extractErrorRecovery(errorRecovery map[string]interface{}, feature *types.MCPFeature) {
	for serverName, recoveryData := range errorRecovery {
		// Clean server name (remove _Recovery suffix)
		cleanName := strings.TrimSuffix(serverName, "_Recovery")
		
		if recoveryMap, ok := recoveryData.(map[string]interface{}); ok {
			recovery := types.Recovery{
				Strategies: make(map[string]string),
			}
			
			for strategy, action := range recoveryMap {
				if actionStr, ok := action.(string); ok {
					recovery.Strategies[strategy] = actionStr
				}
			}
			
			feature.ErrorRecovery[cleanName] = recovery
		}
	}
}

// extractContextTriggers extracts automatic context detection patterns
func (d *MCPDetector) extractContextTriggers(contextDetection map[string]interface{}, feature *types.MCPFeature) {
	for triggerName, triggerData := range contextDetection {
		if triggerMap, ok := triggerData.(map[string]interface{}); ok {
			trigger := types.MCPTrigger{}
			
			if triggers, ok := triggerMap["Triggers"].([]interface{}); ok {
				trigger.Patterns = interfaceSliceToStringSlice(triggers)
			}
			if keywords, ok := triggerMap["Keywords"].([]interface{}); ok {
				trigger.Keywords = interfaceSliceToStringSlice(keywords)
			}
			if action, ok := triggerMap["Action"].(string); ok {
				trigger.Action = action
				trigger.Required = strings.Contains(action, "REQUIRED")
			}
			
			feature.ContextTriggers[triggerName] = trigger
		}
	}
}

// detectPersonaMCPPreferences detects MCP preferences in persona files
func (d *MCPDetector) detectPersonaMCPPreferences(superClaudePath string, feature *types.MCPFeature) error {
	personasPath := filepath.Join(superClaudePath, ".claude", "commands", "personas")
	
	// Read persona files
	files, err := filepath.Glob(filepath.Join(personasPath, "*.yml"))
	if err != nil {
		return err
	}

	mcpPattern := regexp.MustCompile(`MCP_Preferences?:\s*"([^"]+)"`)
	
	for _, file := range files {
		content, err := readFile(file)
		if err != nil {
			// Failed to read persona file: err
			continue
		}

		// Find MCP preferences
		matches := mcpPattern.FindAllStringSubmatch(content, -1)
		for _, match := range matches {
			if len(match) > 1 {
				_ = d.parseMCPPreference(match[1])
				// Store preference data for later use
				// Found MCP preference in file
			}
		}
	}

	return nil
}

// parseMCPPreference parses MCP preference string
func (d *MCPDetector) parseMCPPreference(prefStr string) types.MCPPreference {
	pref := types.MCPPreference{
		Secondary: []string{},
		Patterns:  []string{},
	}
	
	// Parse format like "Sequential(primary) + Context7(patterns)"
	parts := strings.Split(prefStr, "+")
	for i, part := range parts {
		part = strings.TrimSpace(part)
		
		// Extract server name and context
		if strings.Contains(part, "(") {
			serverName := strings.Split(part, "(")[0]
			context := strings.TrimSuffix(strings.Split(part, "(")[1], ")")
			
			if i == 0 {
				pref.Primary = serverName
			} else {
				pref.Secondary = append(pref.Secondary, serverName)
			}
			
			pref.Patterns = append(pref.Patterns, context)
		}
	}
	
	return pref
}

// detectCommandMCPUsage detects MCP usage in command files
func (d *MCPDetector) detectCommandMCPUsage(superClaudePath string, feature *types.MCPFeature) error {
	commandsPath := filepath.Join(superClaudePath, ".claude", "commands")
	
	// Read command files
	files, err := filepath.Glob(filepath.Join(commandsPath, "*.yml"))
	if err != nil {
		return err
	}

	// Patterns to detect MCP usage
	patterns := []struct {
		pattern *regexp.Regexp
		server  string
	}{
		{regexp.MustCompile(`--c7\b`), "Context7"},
		{regexp.MustCompile(`--seq\b`), "Sequential"},
		{regexp.MustCompile(`--magic\b`), "Magic"},
		{regexp.MustCompile(`--pup\b`), "Puppeteer"},
	}

	for _, file := range files {
		content, err := readFile(file)
		if err != nil {
			// Failed to read command file: err
			continue
		}

		cmdName := strings.TrimSuffix(filepath.Base(file), ".yml")
		
		// Check for MCP flags
		for _, p := range patterns {
			if p.pattern.MatchString(content) {
				if feature.CommandDefaults[cmdName] == nil {
					feature.CommandDefaults[cmdName] = []string{}
				}
				feature.CommandDefaults[cmdName] = append(feature.CommandDefaults[cmdName], p.server)
			}
		}
	}

	return nil
}

// interfaceSliceToStringSlice converts []interface{} to []string
func interfaceSliceToStringSlice(slice []interface{}) []string {
	result := make([]string, 0, len(slice))
	for _, item := range slice {
		if str, ok := item.(string); ok {
			result = append(result, str)
		}
	}
	return result
}

// readFile reads the content of a file
func readFile(filePath string) (string, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// preprocessMarkdownYAML converts markdown-style YAML (with ## headers) to standard YAML
func (d *MCPDetector) preprocessMarkdownYAML(content string) string {
	// Parse the markdown-style YAML and convert to proper YAML structure
	lines := strings.Split(content, "\n")
	result := []string{}
	inSection := false
	currentIndent := ""
	
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		
		// Skip empty lines and comments at the beginning
		if !inSection && (trimmed == "" || strings.HasPrefix(trimmed, "#") && !strings.HasPrefix(trimmed, "##")) {
			continue
		}
		
		// Check for markdown section headers
		if strings.HasPrefix(trimmed, "## ") {
			inSection = true
			sectionName := strings.TrimSpace(strings.TrimPrefix(trimmed, "##"))
			
			// Add the section as a top-level key
			result = append(result, sectionName+":")
			currentIndent = "  " // Set indent for section content
			
			// Special handling for sections that contain subsections
			if sectionName == "Command_Integration" || sectionName == "Error_Recovery" {
				// These sections have subsections that need proper indentation
				currentIndent = ""
			}
		} else if inSection {
			// Process content within sections
			if trimmed == "" {
				result = append(result, "")
			} else if strings.HasSuffix(trimmed, ":") && !strings.Contains(trimmed, ": ") {
				// This is a key (like "Development_Commands:")
				// Check if this should be at section level or subsection level
				if strings.Contains(line, "  ") && !strings.HasPrefix(line, "  ") {
					// This is indented but not at the standard 2-space level
					result = append(result, "  "+trimmed)
				} else {
					result = append(result, currentIndent+trimmed)
				}
			} else {
				// Regular content - preserve original indentation relative to section
				if currentIndent == "" {
					result = append(result, line)
				} else {
					// For sections that need adjustment, ensure proper indentation
					result = append(result, line)
				}
			}
		}
	}
	
	return strings.Join(result, "\n")
}

// parseSuperclaude parses the superclaude-mcp.yml file with its special structure
func (d *MCPDetector) parseSuperclaude(content string, feature *types.MCPFeature) error {
	lines := strings.Split(content, "\n")
	currentSection := ""
	
	for i := 0; i < len(lines); i++ {
		line := lines[i]
		trimmed := strings.TrimSpace(line)
		
		// Check for section headers
		if strings.HasPrefix(trimmed, "## ") {
			currentSection = strings.TrimSpace(strings.TrimPrefix(trimmed, "##"))
			continue
		}
		
		// Process Command_Integration section
		if currentSection == "Command_Integration" {
			// Look for command categories (Development_Commands, Analysis_Commands, etc.)
			if strings.HasSuffix(trimmed, "_Commands:") {
				i++
				
				// Process commands in this category
				for i < len(lines) && strings.HasPrefix(lines[i], "  ") {
					line = lines[i]
					trimmed = strings.TrimSpace(line)
					
					// Parse command: "servers description" format
					if strings.Contains(trimmed, ": \"") {
						parts := strings.SplitN(trimmed, ": \"", 2)
						if len(parts) == 2 {
							cmdName := strings.TrimSpace(parts[0])
							serverDesc := strings.TrimSuffix(parts[1], "\"")
							
							// Extract MCP servers from description
							servers := d.extractMCPServers(serverDesc)
							if len(servers) > 0 {
								feature.CommandDefaults[cmdName] = servers
							}
						}
					}
					i++
				}
				i-- // Back up one line since we'll increment in the main loop
			}
		}
		
		// Process Server_Capabilities_Extended section
		if currentSection == "Server_Capabilities_Extended" {
			// Extract server capabilities
			if !strings.HasPrefix(line, "  ") && strings.HasSuffix(trimmed, ":") && trimmed != "Server_Capabilities_Extended:" {
				serverName := strings.TrimSuffix(trimmed, ":")
				server := types.MCPServer{
					Name: serverName,
				}
				
				// Read server properties
				i++
				for i < len(lines) && strings.HasPrefix(lines[i], "  ") {
					line = lines[i]
					trimmed = strings.TrimSpace(line)
					
					if strings.HasPrefix(trimmed, "Purpose: ") {
						server.Purpose = d.extractQuotedValue(trimmed, "Purpose: ")
					} else if strings.HasPrefix(trimmed, "Capabilities: ") {
						capStr := d.extractQuotedValue(trimmed, "Capabilities: ")
						server.Capabilities = strings.Split(capStr, " | ")
					} else if strings.HasPrefix(trimmed, "Best_For: ") {
						bestForStr := d.extractQuotedValue(trimmed, "Best_For: ")
						server.BestFor = strings.Split(bestForStr, " | ")
					} else if strings.HasPrefix(trimmed, "Token_Cost: ") {
						server.TokenCost = d.extractQuotedValue(trimmed, "Token_Cost: ")
					} else if strings.HasPrefix(trimmed, "Success_Rate: ") {
						server.SuccessRate = d.extractQuotedValue(trimmed, "Success_Rate: ")
					} else if strings.HasPrefix(trimmed, "Fallback: ") {
						server.Fallback = d.extractQuotedValue(trimmed, "Fallback: ")
					}
					
					i++
				}
				i-- // Back up one line
				
				feature.Servers[serverName] = server
			}
		}
	}
	
	return nil
}

// extractQuotedValue extracts the quoted value from a YAML line
func (d *MCPDetector) extractQuotedValue(line, prefix string) string {
	value := strings.TrimPrefix(line, prefix)
	value = strings.TrimSpace(value)
	value = strings.Trim(value, "\"")
	return value
}

// parseExecutionPatterns parses execution-patterns.yml which has YAML inside code blocks
func (d *MCPDetector) parseExecutionPatterns(content string, feature *types.MCPFeature) error {
	// Extract YAML from code blocks
	lines := strings.Split(content, "\n")
	inCodeBlock := false
	codeBlockContent := []string{}
	
	for _, line := range lines {
		// Check for code block markers
		if strings.TrimSpace(line) == "```yaml" {
			inCodeBlock = true
			continue
		} else if strings.TrimSpace(line) == "```" && inCodeBlock {
			// Parse the collected YAML content
			yamlContent := strings.Join(codeBlockContent, "\n")
			
			var data map[string]interface{}
			if err := yaml.Unmarshal([]byte(yamlContent), &data); err == nil {
				// Check if this block contains Servers
				if servers, ok := data["Servers"].(map[string]interface{}); ok {
					d.extractServers(servers, feature)
				}
				
				// Check for other MCP-related data
				if mcpControl, ok := data["MCP_Control_Flags"].(map[string]interface{}); ok {
					// Extract MCP control flags information
					_ = mcpControl // For future use
				}
				
				// Check for Command_Integration
				if cmdIntegration, ok := data["Command_Integration"].(map[string]interface{}); ok {
					d.extractCommandIntegration(cmdIntegration, feature)
				}
				
				// Also check for commands in top-level keys (for execution-patterns.yml)
				for key, value := range data {
					if strings.Contains(key, "_Commands") {
						if cmdMap, ok := value.(map[string]interface{}); ok {
							d.extractCommandIntegration(map[string]interface{}{key: cmdMap}, feature)
						}
					}
				}
			}
			
			// Reset for next code block
			inCodeBlock = false
			codeBlockContent = []string{}
			continue
		}
		
		// Collect lines inside code blocks
		if inCodeBlock {
			codeBlockContent = append(codeBlockContent, line)
		}
	}
	
	return nil
}