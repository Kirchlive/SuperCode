package analyzer

import (
	"os"
	"path/filepath"
	"testing"
	
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseSuperClaudePersonas(t *testing.T) {
	// Create test file with SuperClaude format
	testDir := t.TempDir()
	testFile := filepath.Join(testDir, "test-personas.yml")
	
	content := `# Test file
## All_Personas
architect:
  Flag: "--persona-architect"
  Identity: "Systems architect | Scalability specialist"
  Core_Belief: "Systems evolve"
  Primary_Question: "How will this scale?"
  Problem_Solving: "Think in systems"
  MCP_Preferences: "Sequential(primary) + Context7(patterns)"
  Focus: "Scalability"

frontend:
  Flag: "--persona-frontend"
  Identity: "UX specialist"
  Core_Belief: "User experience matters"
  MCP_Preferences: "Magic(primary) + Puppeteer(testing)"

## Another_Section
some: other content
`
	
	err := os.WriteFile(testFile, []byte(content), 0644)
	require.NoError(t, err)
	
	// Parse the file
	personas, err := ParseSuperClaudePersonas(testFile)
	require.NoError(t, err)
	assert.Len(t, personas, 2)
	
	// Check architect
	var architect *Persona
	for i, p := range personas {
		if p.Name == "architect" {
			architect = &personas[i]
			break
		}
	}
	require.NotNil(t, architect)
	assert.Contains(t, architect.Description, "Systems architect")
	assert.Contains(t, architect.SystemPrompt, "Systems evolve")
	assert.Contains(t, architect.Tools, "sequential")
	assert.Contains(t, architect.Tools, "research")
	
	// Check frontend
	var frontend *Persona
	for i, p := range personas {
		if p.Name == "frontend" {
			frontend = &personas[i]
			break
		}
	}
	require.NotNil(t, frontend)
	assert.Contains(t, frontend.Description, "UX specialist")
	assert.Contains(t, frontend.Tools, "magic")
	assert.Contains(t, frontend.Tools, "browser")
}