# Detailed SuperClaude to OpenCode Feature Mapping

*Based on Repository Analysis - 2025-07-09*

## Overview

This document provides detailed mapping specifications based on the comprehensive analysis of both repositories. It serves as the technical blueprint for the SuperCode merger implementation.

## 1. Persona System Mapping

### Source Structure (SuperClaude)
- Location: `shared/superclaude-personas.yml`
- 9 personas with specialized behaviors
- Flag-based activation: `--persona-[name]`
- Context-aware auto-activation

### Target Implementation (OpenCode)

#### Provider-Based Persona System
```typescript
// packages/opencode/src/provider/personas/index.ts
export class PersonaProvider extends BaseProvider {
  personas = {
    architect: {
      systemPrompt: loadYaml('architect.yml'),
      model: 'claude-3-opus-20240229',
      temperature: 0.7,
      tools: ['sequential', 'research', 'diagram']
    },
    frontend: {
      systemPrompt: loadYaml('frontend.yml'),
      model: 'claude-3-sonnet-20240229',
      temperature: 0.8,
      tools: ['magic', 'browser', 'figma']
    }
    // ... other personas
  }
  
  activatePersona(name: string) {
    const persona = this.personas[name];
    this.setSystemPrompt(persona.systemPrompt);
    this.setModel(persona.model);
    this.setTools(persona.tools);
  }
}
```

#### Configuration Integration
```json
// opencode.json
{
  "provider": {
    "type": "personas",
    "defaultPersona": "architect",
    "autoActivation": {
      "*.architecture.md": "architect",
      "*.tsx": "frontend",
      "*.security.md": "security"
    }
  }
}
```

## 2. Command System Mapping

### Source Commands (SuperClaude)
18 slash commands organized in categories

### Target Implementation (OpenCode)

#### Command Registration Pattern
```typescript
// packages/opencode/src/cli/cmd/sc-[command].ts
import { defineCommand } from '../command';

export default defineCommand({
  name: 'sc-build',
  aliases: ['build', 'construct'],
  description: 'SuperClaude build orchestration',
  
  flags: {
    framework: {
      type: 'string',
      choices: ['react', 'vue', 'angular', 'next', 'nuxt']
    },
    typescript: {
      type: 'boolean',
      default: true
    },
    ...inheritUniversalFlags()
  },
  
  async execute(args, flags) {
    // Activate appropriate persona
    if (flags.persona) {
      await activatePersona(flags.persona);
    }
    
    // Execute build logic
    await executeBuildWorkflow(args, flags);
  }
});
```

#### Command Mapping Table

| SuperClaude | OpenCode Command | Implementation |
|-------------|------------------|----------------|
| `/build` | `opencode sc-build` | Build orchestration with project detection |
| `/dev-setup` | `opencode sc-setup` | Environment configuration |
| `/test` | `opencode sc-test` | Test runner with coverage |
| `/review` | `opencode sc-review` | Code review with scoring |
| `/analyze` | `opencode sc-analyze` | Multi-dimensional analysis |
| `/troubleshoot` | `opencode sc-debug` | Problem solver |
| `/improve` | `opencode sc-improve` | Enhancement suggester |
| `/explain` | `opencode sc-explain` | Code explainer |
| `/deploy` | `opencode sc-deploy` | Deployment automation |
| `/migrate` | `opencode sc-migrate` | Migration planner |
| `/scan` | `opencode sc-scan` | Security scanner |
| `/estimate` | `opencode sc-estimate` | Time estimator |
| `/cleanup` | `opencode sc-cleanup` | Code cleanup |
| `/git` | `opencode sc-git` | Git operations |
| `/design` | `opencode sc-design` | Architecture designer |
| `/spawn` | `opencode sc-new` | Project generator |
| `/document` | `opencode sc-docs` | Documentation generator |
| `/load` | `opencode sc-context` | Context loader |
| `/task` | `opencode sc-task` | Task manager |

## 3. MCP Server Implementations

### Context7 MCP Server
```typescript
// packages/opencode/mcp-servers/context7/index.ts
export class Context7Server implements MCPServer {
  name = 'context7';
  
  async capabilities() {
    return {
      tools: ['resolve_library', 'get_docs', 'search_api']
    };
  }
  
  async executeTool(tool: string, params: any) {
    switch(tool) {
      case 'resolve_library':
        return await this.resolveLibrary(params.name);
      case 'get_docs':
        return await this.getDocumentation(params.library, params.version);
      case 'search_api':
        return await this.searchAPI(params.query, params.library);
    }
  }
}
```

### MCP Server Configuration
```json
// opencode.json
{
  "mcp": {
    "context7": {
      "type": "local",
      "command": ["opencode", "mcp", "context7"],
      "autoActivate": ["*.js", "*.ts", "*.py"],
      "cache": "24h"
    },
    "sequential": {
      "type": "local", 
      "command": ["opencode", "mcp", "sequential"],
      "maxSteps": 10
    },
    "magic": {
      "type": "local",
      "command": ["opencode", "mcp", "magic"],
      "frameworks": ["react", "vue", "angular"]
    },
    "browser": {
      "type": "local",
      "command": ["opencode", "mcp", "browser"],
      "capabilities": ["screenshot", "test", "scrape"]
    }
  }
}
```

## 4. Flag System Implementation

### Universal Flags Mixin
```typescript
// packages/opencode/src/cli/flags/universal.ts
export const universalFlags = {
  // Thinking modes
  think: {
    type: 'boolean',
    description: 'Enable thoughtful analysis'
  },
  'think-hard': {
    type: 'boolean',
    description: 'Deep analysis mode'
  },
  ultrathink: {
    type: 'boolean',
    description: 'Maximum analysis depth'
  },
  
  // Compression
  uc: {
    type: 'boolean',
    description: 'UltraCompressed mode (70% reduction)'
  },
  
  // MCP control
  c7: { type: 'boolean', description: 'Enable Context7' },
  seq: { type: 'boolean', description: 'Enable Sequential' },
  magic: { type: 'boolean', description: 'Enable Magic UI' },
  pup: { type: 'boolean', description: 'Enable Puppeteer' },
  'all-mcp': { type: 'boolean', description: 'Enable all MCP' },
  'no-mcp': { type: 'boolean', description: 'Disable all MCP' },
  
  // Personas
  ...Object.fromEntries(
    personas.map(p => [`persona-${p}`, {
      type: 'boolean',
      description: `Use ${p} persona`
    }])
  ),
  
  // Introspection
  introspect: {
    type: 'boolean',
    description: 'Show reasoning process'
  }
};
```

## 5. Configuration System Enhancement

### Extended Schema
```typescript
// packages/opencode/src/config/schema.ts
export const supercodeSchema = z.object({
  // Existing OpenCode config...
  
  // SuperCode additions
  supercode: z.object({
    personas: z.object({
      default: z.string().optional(),
      autoActivation: z.record(z.string()).optional()
    }).optional(),
    
    compression: z.object({
      enabled: z.boolean().default(false),
      autoThreshold: z.number().default(0.7),
      dictionary: z.string().optional()
    }).optional(),
    
    research: z.object({
      mandatory: z.array(z.string()).default([]),
      cacheHours: z.number().default(24)
    }).optional(),
    
    taskManagement: z.object({
      enabled: z.boolean().default(true),
      persistSession: z.boolean().default(true)
    }).optional()
  }).optional()
});
```

## 6. Tool System Extensions

### SuperClaude Tool Adapter
```typescript
// packages/opencode/src/tool/supercode/index.ts
export class SuperCodeTool extends Tool {
  static compressionTool = Tool.define({
    id: 'compress',
    description: 'Apply UltraCompressed mode',
    parameters: z.object({
      text: z.string(),
      level: z.enum(['normal', 'ultra'])
    }),
    execute: async ({ text, level }) => {
      return applyCompression(text, level);
    }
  });
  
  static researchTool = Tool.define({
    id: 'research',
    description: 'Research library documentation',
    parameters: z.object({
      library: z.string(),
      query: z.string().optional()
    }),
    execute: async ({ library, query }) => {
      const c7 = await getMCPServer('context7');
      return c7.executeTool('get_docs', { library, query });
    }
  });
}
```

## 7. Feature Detection Patterns

### YAML Parser for Personas
```go
// internal/analyzer/persona_detector.go
func DetectPersonas(dir string) ([]Persona, error) {
    patterns := []string{
        "shared/superclaude-personas.yml",
        "personas/*.yml",
    }
    
    var personas []Persona
    for _, pattern := range patterns {
        files, _ := filepath.Glob(filepath.Join(dir, pattern))
        for _, file := range files {
            content, _ := ioutil.ReadFile(file)
            var p Persona
            yaml.Unmarshal(content, &p)
            personas = append(personas, p)
        }
    }
    return personas, nil
}
```

### Command Pattern Detector
```go
// internal/analyzer/command_detector.go
func DetectCommands(dir string) ([]Command, error) {
    cmdPattern := regexp.MustCompile(`/user:(\w+)`)
    includePattern := regexp.MustCompile(`@include\s+([^\s]+)`)
    
    var commands []Command
    filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
        if strings.HasSuffix(path, ".md") {
            content, _ := ioutil.ReadFile(path)
            matches := cmdPattern.FindAllStringSubmatch(string(content), -1)
            for _, match := range matches {
                commands = append(commands, Command{
                    Name: match[1],
                    File: path,
                })
            }
        }
        return nil
    })
    return commands, nil
}
```

## 8. Code Generation Templates

### Persona Generator Template
```go
// templates/persona.go.tmpl
package personas

type {{ .Name | title }}Persona struct {
    *BasePersona
}

func New{{ .Name | title }}Persona() *{{ .Name | title }}Persona {
    return &{{ .Name | title }}Persona{
        BasePersona: &BasePersona{
            Name:         "{{ .Name }}",
            SystemPrompt: `{{ .SystemPrompt }}`,
            Model:        "{{ .Model }}",
            Temperature:  {{ .Temperature }},
            Tools:        []string{ {{ range .Tools }}"{{ . }}", {{ end }} },
        },
    }
}
```

### Command Generator Template
```go
// templates/command.ts.tmpl
import { defineCommand } from '../command';

export default defineCommand({
  name: 'sc-{{ .Name }}',
  description: '{{ .Description }}',
  flags: {
    {{ range .Flags }}
    {{ .Name }}: {
      type: '{{ .Type }}',
      {{ if .Default }}default: {{ .Default }},{{ end }}
      {{ if .Choices }}choices: [{{ range .Choices }}'{{ . }}',{{ end }}],{{ end }}
    },
    {{ end }}
    ...inheritUniversalFlags()
  },
  async execute(args, flags) {
    {{ .Implementation }}
  }
});
```

## 9. Testing Strategy

### Feature Parity Tests
```typescript
// tests/parity/personas.test.ts
describe('Persona Feature Parity', () => {
  const requiredPersonas = [
    'architect', 'frontend', 'backend', 'analyzer',
    'security', 'mentor', 'refactorer', 'performance', 'qa'
  ];
  
  test.each(requiredPersonas)('persona %s exists', async (persona) => {
    const provider = new PersonaProvider();
    expect(provider.hasPersona(persona)).toBe(true);
  });
  
  test('persona activation changes system prompt', async () => {
    const provider = new PersonaProvider();
    const before = provider.getSystemPrompt();
    await provider.activatePersona('architect');
    const after = provider.getSystemPrompt();
    expect(after).not.toBe(before);
    expect(after).toContain('architect');
  });
});
```

### Command Integration Tests
```typescript
// tests/integration/commands.test.ts
describe('SuperCode Commands', () => {
  test('sc-build creates project structure', async () => {
    const result = await runCommand('sc-build', {
      framework: 'react',
      typescript: true
    });
    
    expect(result.exitCode).toBe(0);
    expect(fs.existsSync('src/App.tsx')).toBe(true);
    expect(fs.existsSync('package.json')).toBe(true);
  });
});
```

## 10. Migration Path

### Phase 1: Core Infrastructure
1. Implement MCP servers
2. Create persona provider
3. Set up command framework
4. Extend configuration schema

### Phase 2: Feature Implementation
1. Port all 9 personas
2. Implement 18 commands
3. Add compression system
4. Create research tools

### Phase 3: Integration
1. Universal flag system
2. Auto-activation logic
3. Session management
4. Task tracking

### Phase 4: Validation
1. Feature parity tests
2. Performance benchmarks
3. User acceptance testing
4. Documentation

## Conclusion

This detailed mapping provides a clear implementation path for merging SuperClaude features into OpenCode. The modular approach allows for incremental development while maintaining compatibility with both systems.