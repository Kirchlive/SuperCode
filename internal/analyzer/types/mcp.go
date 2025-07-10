package types

// MCPServer represents a detected MCP server configuration
type MCPServer struct {
	Name         string                 `json:"name"`
	Purpose      string                 `json:"purpose"`
	Capabilities []string               `json:"capabilities"`
	BestFor      []string               `json:"best_for"`
	TokenCost    string                 `json:"token_cost"`
	SuccessRate  string                 `json:"success_rate"`
	Fallback     string                 `json:"fallback"`
	Workflows    map[string]MCPWorkflow `json:"workflows,omitempty"`
}

// MCPWorkflow represents a workflow pattern for an MCP server
type MCPWorkflow struct {
	Trigger   []string `json:"trigger"`
	Process   string   `json:"process"`
	Standards []string `json:"standards"`
	Example   string   `json:"example"`
}

// MCPFeature represents all detected MCP features
type MCPFeature struct {
	Servers          map[string]MCPServer    `json:"servers"`
	CommandDefaults  map[string][]string     `json:"command_defaults"`
	ContextTriggers  map[string]MCPTrigger   `json:"context_triggers"`
	QualityControl   map[string]QualityCheck `json:"quality_control"`
	ErrorRecovery    map[string]Recovery     `json:"error_recovery"`
	TokenEconomics   TokenEconomics          `json:"token_economics"`
}

// MCPTrigger represents an automatic trigger for MCP servers
type MCPTrigger struct {
	Patterns []string `json:"patterns"`
	Keywords []string `json:"keywords"`
	Action   string   `json:"action"`
	Required bool     `json:"required"`
}

// QualityCheck represents quality validation criteria
type QualityCheck struct {
	SuccessCriteria  []string `json:"success_criteria"`
	PartialResults   []string `json:"partial_results"`
	FailureRecovery  []string `json:"failure_recovery"`
}

// Recovery represents error recovery strategies
type Recovery struct {
	Strategies map[string]string `json:"strategies"`
}

// TokenEconomics represents token usage optimization
type TokenEconomics struct {
	BudgetAllocation     string   `json:"budget_allocation"`
	IntelligentEscalation string   `json:"intelligent_escalation"`
	AbortConditions      []string `json:"abort_conditions"`
	EfficiencyPatterns   []string `json:"efficiency_patterns"`
}

// MCPPreference represents MCP preferences found in personas
type MCPPreference struct {
	Primary    string   `json:"primary"`
	Secondary  []string `json:"secondary"`
	Patterns   []string `json:"patterns"`
}