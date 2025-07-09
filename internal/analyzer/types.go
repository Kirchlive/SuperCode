package analyzer

import "time"

// Feature represents a detected feature from SuperClaude
type Feature struct {
	Name        string
	Type        string
	Source      string
	Content     interface{}
	DetectedAt  time.Time
	Confidence  float64
}

// Persona represents a SuperClaude persona configuration
type Persona struct {
	Name         string   `yaml:"name"`
	Description  string   `yaml:"description"`
	SystemPrompt string   `yaml:"systemPrompt"`
	Model        string   `yaml:"model"`
	Temperature  float64  `yaml:"temperature"`
	Tools        []string `yaml:"tools"`
	AutoActivate []string `yaml:"autoActivate"`
	Flags        []string `yaml:"flags"`
}

// Command represents a SuperClaude slash command
type Command struct {
	Name        string            `yaml:"name"`
	Purpose     string            `yaml:"purpose"`
	Category    string            `yaml:"category"`
	Flags       map[string]Flag   `yaml:"flags"`
	Examples    []Example         `yaml:"examples"`
	Integration []string          `yaml:"integration"`
	Content     string            // Raw markdown content
}

// Flag represents a command flag
type Flag struct {
	Name        string   `yaml:"name"`
	Type        string   `yaml:"type"`
	Description string   `yaml:"description"`
	Default     string   `yaml:"default"`
	Choices     []string `yaml:"choices"`
}

// Example represents a command usage example
type Example struct {
	Command     string `yaml:"command"`
	Description string `yaml:"description"`
}

// IncludeDirective represents an @include directive
type IncludeDirective struct {
	Path    string
	Section string
	Line    int
	File    string
}

// MCPServer represents an MCP server configuration
type MCPServer struct {
	Name         string            `yaml:"name"`
	Trigger      string            `yaml:"trigger"`
	APIs         []string          `yaml:"apis"`
	Cache        string            `yaml:"cache"`
	AutoActivate bool              `yaml:"autoActivate"`
	Environment  map[string]string `yaml:"env"`
}

// DetectionResult holds all detected features
type DetectionResult struct {
	Personas   []Persona
	Commands   []Command
	MCPServers []MCPServer
	Includes   []IncludeDirective
	Errors     []error
}