// SuperCode Universal Flags
export interface UniversalFlags {
  // Thinking modes
  think?: boolean;
  'think-hard'?: boolean;
  ultrathink?: boolean;
  
  // Compression
  uc?: boolean;
  
  // MCP control
  c7?: boolean;
  seq?: boolean;
  magic?: boolean;
  pup?: boolean;
  'all-mcp'?: boolean;
  'no-mcp'?: boolean;
  
  // Personas
  'persona-architect'?: boolean;
  'persona-frontend'?: boolean;
  'persona-backend'?: boolean;
  'persona-analyzer'?: boolean;
  'persona-security'?: boolean;
  'persona-mentor'?: boolean;
  'persona-refactorer'?: boolean;
  'persona-performance'?: boolean;
  'persona-qa'?: boolean;
  persona?: string;
  
  // Introspection
  introspect?: boolean;
}

export function inheritUniversalFlags(): Record<string, any> {
  return {
    // Thinking modes
    'think': {
      type: 'boolean',
      description: 'Enable thoughtful analysis',
    },
    'think-hard': {
      type: 'boolean',
      description: 'Deep analysis mode',
    },
    'ultrathink': {
      type: 'boolean',
      description: 'Maximum analysis depth',
    },
    
    // Compression
    'uc': {
      type: 'boolean',
      description: 'UltraCompressed mode (70% token reduction)',
    },
    
    // MCP control
    'c7': {
      type: 'boolean',
      description: 'Enable Context7 documentation lookup',
    },
    'seq': {
      type: 'boolean',
      description: 'Enable Sequential reasoning',
    },
    'magic': {
      type: 'boolean',
      description: 'Enable Magic UI generation',
    },
    'pup': {
      type: 'boolean',
      description: 'Enable Puppeteer browser automation',
    },
    'all-mcp': {
      type: 'boolean',
      description: 'Enable all MCP servers',
    },
    'no-mcp': {
      type: 'boolean',
      description: 'Disable all MCP servers',
    },
    
    // Persona selection
    'persona': {
      type: 'string',
      description: 'Activate specific persona',
      choices: ['architect', 'frontend', 'backend', 'analyzer', 'security', 'mentor', 'refactorer', 'performance', 'qa'],
    },
    
    // Introspection
    'introspect': {
      type: 'boolean',
      description: 'Show reasoning process',
    },
  };
}

// Helper to extract persona from flags
export function getActivePersona(flags: UniversalFlags): string | null {
  if (flags.persona) return flags.persona;
  
  const personaFlags = [
    'persona-architect', 'persona-frontend', 'persona-backend',
    'persona-analyzer', 'persona-security', 'persona-mentor',
    'persona-refactorer', 'persona-performance', 'persona-qa'
  ];
  
  for (const flag of personaFlags) {
    if (flags[flag as keyof UniversalFlags]) {
      return flag.replace('persona-', '');
    }
  }
  
  return null;
}
