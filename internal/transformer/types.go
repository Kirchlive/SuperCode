package transformer

// TransformResult represents the output of a transformation
type TransformResult struct {
	Type     string                 // "typescript", "json", "yaml"
	Path     string                 // Target file path
	Content  string                 // Generated content
	Metadata map[string]interface{} // Additional metadata
}

// ProviderConfig represents an OpenCode provider configuration
type ProviderConfig struct {
	Name         string            `json:"name"`
	Type         string            `json:"type"`
	SystemPrompt string            `json:"systemPrompt"`
	Model        string            `json:"model"`
	Temperature  float64           `json:"temperature"`
	Tools        []string          `json:"tools"`
	Config       map[string]string `json:"config"`
}

// YargsCommand represents a Yargs CLI command structure
type YargsCommand struct {
	Name        string                 `json:"name"`
	Aliases     []string               `json:"aliases,omitempty"`
	Description string                 `json:"description"`
	Category    string                 `json:"category"`
	Flags       map[string]YargsFlag   `json:"flags"`
	Handler     string                 `json:"handler"`
	Examples    []string               `json:"examples"`
}

// YargsFlag represents a Yargs command flag
type YargsFlag struct {
	Type        string   `json:"type"`
	Description string   `json:"description"`
	Default     any      `json:"default,omitempty"`
	Choices     []string `json:"choices,omitempty"`
	Alias       string   `json:"alias,omitempty"`
	Required    bool     `json:"required,omitempty"`
}

// MCPServerConfig represents an MCP server configuration
type MCPServerConfig struct {
	Name        string            `json:"name"`
	Type        string            `json:"type"`
	Command     []string          `json:"command"`
	Environment map[string]string `json:"env,omitempty"`
	Cache       string            `json:"cache,omitempty"`
	AutoStart   bool              `json:"autoStart,omitempty"`
}

// OpenCodeConfig represents the extended opencode.json structure
type OpenCodeConfig struct {
	Provider  *ProviderConfig            `json:"provider,omitempty"`
	MCP       map[string]MCPServerConfig `json:"mcp,omitempty"`
	SuperCode *SuperCodeSettings         `json:"supercode,omitempty"`
}

// SuperCodeSettings represents SuperCode-specific settings
type SuperCodeSettings struct {
	Personas    PersonaSettings     `json:"personas"`
	Compression CompressionSettings `json:"compression"`
	Research    ResearchSettings    `json:"research"`
}

// PersonaSettings for SuperCode
type PersonaSettings struct {
	Default       string            `json:"default,omitempty"`
	AutoActivate  map[string]string `json:"autoActivate,omitempty"`
}

// CompressionSettings for UltraCompressed mode
type CompressionSettings struct {
	Enabled       bool    `json:"enabled"`
	AutoThreshold float64 `json:"autoThreshold"`
	Dictionary    string  `json:"dictionary,omitempty"`
}

// ResearchSettings for mandatory research
type ResearchSettings struct {
	Mandatory   []string `json:"mandatory"`
	CacheHours  int      `json:"cacheHours"`
}

// TransformationContext holds shared context for transformations
type TransformationContext struct {
	SourceRepo   string
	TargetRepo   string
	DryRun       bool
	Verbose      bool
	Overrides    map[string]interface{}
}

// Transformer interface for all transformers
type Transformer interface {
	Name() string
	Transform(input interface{}, ctx *TransformationContext) ([]TransformResult, error)
	Validate(result TransformResult) error
}