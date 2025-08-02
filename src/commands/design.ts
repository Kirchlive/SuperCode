/**
 * Design Command Handler
 * System/API/component design with iterative refinement
 */

import { z } from "zod";
import type { Argv } from "yargs";
import { cmd } from "../cmd";
import { CommandParser, type ParsedCommand } from "../tool/command-parser";
import { FlagResolver, type ResolvedFlags } from "../tool/flag-resolver";
import * as glob from "../tool/glob";
import * as grep from "../tool/grep";
import * as read from "../tool/read";

// Design command schemas
const DesignOptionsSchema = z.object({
  type: z.enum(["api", "component", "architecture", "database", "service", "system", "integration", "framework"]).optional().default("api"),
  target: z.string().optional().describe("Target design name or description"),
  format: z.enum(["openapi", "json", "yaml", "markdown", "typescript"]).optional().default("openapi"),
  iterative: z.boolean().optional().describe("Enable iterative design refinement"),
  iterations: z.number().optional().default(3).describe("Number of refinement iterations"),
  feedback: z.array(z.string()).optional().describe("Feedback for design refinement"),
  validate: z.boolean().optional().describe("Validate design consistency"),
  constraints: z.array(z.string()).optional().describe("Design constraints"),
  optimize: z.boolean().optional().describe("Optimize design based on constraints"),
  patterns: z.array(z.string()).optional().describe("Design patterns to apply"),
  suggestPatterns: z.boolean().optional().describe("Suggest appropriate patterns"),
  validatePatterns: z.boolean().optional().describe("Validate pattern compatibility"),
  generate: z.boolean().optional().describe("Generate code from design"),
  language: z.enum(["typescript", "javascript", "python", "java"]).optional().default("typescript"),
  framework: z.string().optional().describe("Target framework"),
  stubs: z.boolean().optional().describe("Generate implementation stubs"),
  migrations: z.boolean().optional().describe("Generate database migrations"),
  documentation: z.boolean().optional().describe("Generate design documentation"),
  docType: z.enum(["markdown", "openapi", "asyncapi"]).optional().default("markdown"),
  diagrams: z.boolean().optional().describe("Generate design diagrams"),
  diagramType: z.enum(["sequence", "class", "component", "architecture"]).optional().default("sequence"),
  requirements: z.array(z.string()).optional().describe("Design requirements to validate"),
  security: z.boolean().optional().describe("Include security analysis"),
  performance: z.boolean().optional().describe("Include performance analysis"),
  maintainability: z.boolean().optional().describe("Include maintainability analysis"),
  analyze: z.boolean().optional().describe("Perform comprehensive design analysis"),
  dryRun: z.boolean().optional().describe("Preview design without generating files"),
  complexity: z.boolean().optional().describe("Analyze design complexity"),
  existing: z.string().optional().describe("Path to existing codebase for integration analysis"),
  integrate: z.boolean().optional().describe("Integrate with existing codebase"),
  refactor: z.boolean().optional().describe("Suggest refactoring for integration"),
  dbType: z.enum(["postgresql", "mysql", "mongodb", "sqlite"]).optional().default("postgresql")
});

export interface DesignResult {
  command: string;
  timestamp: string;
  options: z.infer<typeof DesignOptionsSchema>;
  designs: DesignSpec[];
  iterations?: IterativeDesign[];
  patterns: ArchitecturePattern[];
  patternSuggestions?: PatternSuggestion[];
  patternValidation?: PatternValidation;
  generated?: GeneratedArtifacts;
  documentation?: DesignDocumentation;
  diagrams?: DesignDiagram[];
  validation: {
    success: boolean;
    errors: string[];
    warnings: string[];
    requirements?: RequirementValidation;
    constraintConflicts?: ConstraintConflict[];
  };
  optimization?: DesignOptimization;
  analysis?: DesignAnalysis;
  preview?: DesignPreview;
  integration?: IntegrationAnalysis;
  refactoring?: RefactoringAnalysis;
  metrics: {
    designsGenerated: number;
    patternsApplied: number;
    filesGenerated: number;
  };
  metadata: {
    duration: number;
  };
}

export interface DesignSpec {
  type: string;
  format: string;
  specification: any;
  interface?: ComponentInterface;
  components?: ArchitectureComponent[];
  relationships?: ComponentRelationship[];
  dataFlow?: DataFlowSpec;
  schema?: DatabaseSchema;
  framework?: string;
}

export interface IterativeDesign {
  version: number;
  design: DesignSpec;
  feedback: FeedbackItem[];
  improvements: ImprovementItem[];
}

export interface FeedbackItem {
  type: string;
  description: string;
  priority: "low" | "medium" | "high";
}

export interface ImprovementItem {
  description: string;
  applied: boolean;
  impact: "low" | "medium" | "high";
}

export interface ArchitecturePattern {
  name: string;
  applied: boolean;
  rationale: string;
}

export interface PatternSuggestion {
  pattern: string;
  reason: string;
  benefits: string[];
}

export interface PatternValidation {
  compatibility: Record<string, boolean>;
  conflicts: string[];
}

export interface ComponentInterface {
  props: Record<string, any>;
  methods: InterfaceMethod[];
  events: InterfaceEvent[];
}

export interface InterfaceMethod {
  name: string;
  parameters: Parameter[];
  returnType: string;
}

export interface InterfaceEvent {
  name: string;
  payload: Record<string, any>;
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
}

export interface ArchitectureComponent {
  name: string;
  type: string;
  responsibilities: string[];
  interfaces: string[];
}

export interface ComponentRelationship {
  from: string;
  to: string;
  type: "depends" | "uses" | "extends" | "implements";
  description: string;
}

export interface DataFlowSpec {
  flows: DataFlow[];
  entities: DataEntity[];
}

export interface DataFlow {
  from: string;
  to: string;
  data: string;
  method: string;
}

export interface DataEntity {
  name: string;
  attributes: Record<string, string>;
}

export interface DatabaseSchema {
  tables: DatabaseTable[];
  relationships: TableRelationship[];
  indexes: DatabaseIndex[];
}

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  constraints: TableConstraint[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
}

export interface TableRelationship {
  from: string;
  to: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  foreignKey: string;
}

export interface DatabaseIndex {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
}

export interface TableConstraint {
  name: string;
  type: "primary" | "foreign" | "unique" | "check";
  columns: string[];
}

export interface GeneratedArtifacts {
  interfaces?: GeneratedInterface[];
  components?: GeneratedComponent[];
  stubs?: GeneratedStub[];
  migrations?: GeneratedMigration[];
}

export interface GeneratedInterface {
  file: string;
  content: string;
}

export interface GeneratedComponent {
  file: string;
  content: string;
}

export interface GeneratedStub {
  endpoint: string;
  method: string;
  implementation: string;
}

export interface GeneratedMigration {
  file: string;
  content: string;
}

export interface DesignDocumentation {
  sections: DocumentationSection[];
  apiSpec?: any;
}

export interface DocumentationSection {
  title: string;
  content: string;
}

export interface DesignDiagram {
  type: string;
  format: string;
  content: string;
}

export interface RequirementValidation {
  met: number;
  missing: string[];
}

export interface ConstraintConflict {
  constraints: string[];
  conflict: string;
  resolution: string;
}

export interface DesignOptimization {
  constraintsConsidered: string[];
  strategies: OptimizationStrategy[];
}

export interface OptimizationStrategy {
  area: string;
  approach: string;
  benefit: string;
}

export interface DesignAnalysis {
  security?: SecurityAnalysis;
  performance?: PerformanceAnalysis;
  maintainability?: MaintainabilityAnalysis;
}

export interface SecurityAnalysis {
  threats: SecurityThreat[];
  mitigations: SecurityMitigation[];
  score: number;
}

export interface SecurityThreat {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface SecurityMitigation {
  threat: string;
  mitigation: string;
  implemented: boolean;
}

export interface PerformanceAnalysis {
  bottlenecks: PerformanceBottleneck[];
  optimizations: PerformanceOptimization[];
  scalability: ScalabilityAssessment;
}

export interface PerformanceBottleneck {
  component: string;
  issue: string;
  impact: "low" | "medium" | "high";
}

export interface PerformanceOptimization {
  area: string;
  optimization: string;
  expectedGain: string;
}

export interface ScalabilityAssessment {
  horizontal: boolean;
  vertical: boolean;
  constraints: string[];
}

export interface MaintainabilityAnalysis {
  score: number;
  factors: MaintainabilityFactor[];
}

export interface MaintainabilityFactor {
  factor: string;
  score: number;
  impact: string;
}

export interface DesignPreview {
  designOverview: string;
  filesWouldBeGenerated: number;
  complexity?: ComplexityAnalysis;
  estimatedEffort?: number;
}

export interface ComplexityAnalysis {
  score: number;
  factors: string[];
}

export interface IntegrationAnalysis {
  existingCode: ExistingCodeAnalysis;
  compatibilityIssues: CompatibilityIssue[];
  migrationStrategy: MigrationStrategy;
}

export interface ExistingCodeAnalysis {
  patterns: string[];
  architecture: string;
  frameworks: string[];
}

export interface CompatibilityIssue {
  component: string;
  issue: string;
  severity: "low" | "medium" | "high";
  solution: string;
}

export interface MigrationStrategy {
  approach: string;
  steps: string[];
  risk: "low" | "medium" | "high";
}

export interface RefactoringAnalysis {
  suggestions: RefactoringSuggestion[];
  impact: RefactoringImpact;
}

export interface RefactoringSuggestion {
  area: string;
  suggestion: string;
  benefit: string;
}

export interface RefactoringImpact {
  filesAffected: number;
  effort: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
}

/**
 * Main design command handler
 */
export async function handleDesignCommand(
  parsedCommand: ParsedCommand,
  resolvedFlags: ResolvedFlags
): Promise<DesignResult> {
  const startTime = Date.now();
  const options = DesignOptionsSchema.parse({ ...parsedCommand.args, ...resolvedFlags });
  
  const target = options.target || parsedCommand.target;

  if (!target) {
    throw new Error("Invalid design target. Please provide a design description or target.");
  }

  const result: DesignResult = {
    command: "design",
    timestamp: new Date().toISOString(),
    options,
    designs: [],
    patterns: [],
    validation: {
      success: false,
      errors: [],
      warnings: []
    },
    metrics: {
      designsGenerated: 0,
      patternsApplied: 0,
      filesGenerated: 0
    },
    metadata: {
      duration: 0
    }
  };

  try {
    // Phase 1: Generate initial design specification
    await generateDesignSpecification(target, result, options);
    
    // Phase 2: Apply design patterns
    await applyDesignPatterns(result, options);
    
    // Phase 3: Iterative refinement
    if (options.iterative) {
      await performIterativeRefinement(result, options);
    }
    
    // Phase 4: Optimization
    if (options.optimize && options.constraints) {
      await optimizeDesign(result, options);
    }
    
    // Phase 5: Validation
    if (options.validate) {
      await validateDesign(result, options);
    }
    
    // Phase 6: Analysis
    if (options.analyze || options.security || options.performance || options.maintainability) {
      await analyzeDesign(result, options);
    }
    
    // Phase 7: Integration analysis
    if (options.existing) {
      await analyzeIntegration(result, options);
    }
    
    // Phase 8: Code generation or preview
    if (options.generate && !options.dryRun) {
      await generateArtifacts(result, options);
    } else if (options.dryRun) {
      await previewDesign(result, options);
    }
    
    // Phase 9: Documentation generation
    if (options.documentation) {
      await generateDocumentation(result, options);
    }

    result.validation.success = result.validation.errors.length === 0;
    result.metadata.duration = Date.now() - startTime;

    return result;
    
  } catch (error) {
    result.validation.success = false;
    result.validation.errors.push(`Design generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.metadata.duration = Date.now() - startTime;
    return result;
  }
}

/**
 * Generate design specification based on target and type
 */
async function generateDesignSpecification(
  target: string,
  result: DesignResult,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<void> {
  let design: DesignSpec;

  switch (options.type) {
    case "api":
      design = await generateApiDesign(target, options);
      break;
    case "component":
      design = await generateComponentDesign(target, options);
      break;
    case "architecture":
      design = await generateArchitectureDesign(target, options);
      break;
    case "database":
      design = await generateDatabaseDesign(target, options);
      break;
    case "system":
    case "service":
      design = await generateSystemDesign(target, options);
      break;
    default:
      design = await generateGenericDesign(target, options);
  }

  result.designs.push(design);
  result.metrics.designsGenerated++;
}

/**
 * Generate API design specification
 */
async function generateApiDesign(
  target: string,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<DesignSpec> {
  const apiSpec = {
    openapi: "3.0.0",
    info: {
      title: target,
      version: "1.0.0",
      description: `API specification for ${target}`
    },
    paths: generateApiPaths(target),
    components: {
      schemas: generateApiSchemas(target),
      responses: generateApiResponses(),
      securitySchemes: generateSecuritySchemes()
    }
  };

  return {
    type: "api",
    format: options.format,
    specification: apiSpec
  };
}

/**
 * Generate API paths based on target
 */
function generateApiPaths(target: string): Record<string, any> {
  const entityName = target.replace(/\s+/g, '').toLowerCase();
  
  return {
    [`/${entityName}`]: {
      get: {
        summary: `List ${target}`,
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: `#/components/schemas/${capitalize(entityName)}` }
                }
              }
            }
          }
        }
      },
      post: {
        summary: `Create ${target}`,
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${capitalize(entityName)}Input` }
            }
          }
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${capitalize(entityName)}` }
              }
            }
          }
        }
      }
    },
    [`/${entityName}/{id}`]: {
      get: {
        summary: `Get ${target} by ID`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${capitalize(entityName)}` }
              }
            }
          }
        }
      }
    }
  };
}

/**
 * Generate API schemas
 */
function generateApiSchemas(target: string): Record<string, any> {
  const entityName = capitalize(target.replace(/\s+/g, ''));
  
  return {
    [entityName]: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" }
      },
      required: ["id", "name"]
    },
    [`${entityName}Input`]: {
      type: "object",
      properties: {
        name: { type: "string" }
      },
      required: ["name"]
    }
  };
}

/**
 * Generate API responses
 */
function generateApiResponses(): Record<string, any> {
  return {
    BadRequest: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" }
            }
          }
        }
      }
    },
    Unauthorized: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" }
            }
          }
        }
      }
    }
  };
}

/**
 * Generate security schemes
 */
function generateSecuritySchemes(): Record<string, any> {
  return {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT"
    },
    apiKey: {
      type: "apiKey",
      in: "header",
      name: "X-API-Key"
    }
  };
}

/**
 * Generate component design specification
 */
async function generateComponentDesign(
  target: string,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<DesignSpec> {
  const componentName = capitalize(target.replace(/\s+/g, ''));
  
  const componentInterface: ComponentInterface = {
    props: generateComponentProps(target),
    methods: generateComponentMethods(target),
    events: generateComponentEvents(target)
  };

  return {
    type: "component",
    format: options.format,
    specification: {
      name: componentName,
      description: `${target} component`,
      framework: options.framework || "react"
    },
    interface: componentInterface,
    framework: options.framework || "react"
  };
}

/**
 * Generate component props
 */
function generateComponentProps(target: string): Record<string, any> {
  const baseName = target.toLowerCase().replace(/\s+/g, '');
  
  return {
    [`${baseName}Data`]: {
      type: "object",
      required: true,
      description: `Data for ${target}`
    },
    onAction: {
      type: "function",
      required: false,
      description: `Callback for ${target} actions`
    },
    variant: {
      type: "string",
      required: false,
      default: "default",
      options: ["default", "compact", "detailed"]
    }
  };
}

/**
 * Generate component methods
 */
function generateComponentMethods(target: string): InterfaceMethod[] {
  return [
    {
      name: "refresh",
      parameters: [],
      returnType: "void"
    },
    {
      name: "update",
      parameters: [
        { name: "data", type: "object", required: true }
      ],
      returnType: "void"
    }
  ];
}

/**
 * Generate component events
 */
function generateComponentEvents(target: string): InterfaceEvent[] {
  const baseName = target.toLowerCase().replace(/\s+/g, '');
  
  return [
    {
      name: `${baseName}Changed`,
      payload: {
        data: "object",
        timestamp: "string"
      }
    },
    {
      name: `${baseName}Error`,
      payload: {
        error: "string",
        context: "object"
      }
    }
  ];
}

/**
 * Generate architecture design specification
 */
async function generateArchitectureDesign(
  target: string,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<DesignSpec> {
  const components = generateArchitectureComponents(target);
  const relationships = generateComponentRelationships(components);
  const dataFlow = generateDataFlow(components);

  return {
    type: "architecture",
    format: options.format,
    specification: {
      name: target,
      pattern: options.patterns?.[0] || "layered",
      description: `Architecture design for ${target}`
    },
    components,
    relationships,
    dataFlow
  };
}

/**
 * Generate architecture components
 */
function generateArchitectureComponents(target: string): ArchitectureComponent[] {
  const systemName = target.toLowerCase().replace(/\s+/g, '-');
  
  return [
    {
      name: `${systemName}-api`,
      type: "service",
      responsibilities: ["Handle HTTP requests", "Validate input", "Route to business logic"],
      interfaces: ["REST API", "GraphQL"]
    },
    {
      name: `${systemName}-core`,
      type: "service",
      responsibilities: ["Business logic", "Data processing", "Validation"],
      interfaces: ["Internal API"]
    },
    {
      name: `${systemName}-data`,
      type: "repository",
      responsibilities: ["Data access", "Query optimization", "Caching"],
      interfaces: ["Database interface"]
    },
    {
      name: `${systemName}-auth`,
      type: "service",
      responsibilities: ["Authentication", "Authorization", "Token management"],
      interfaces: ["Auth API"]
    }
  ];
}

/**
 * Generate component relationships
 */
function generateComponentRelationships(components: ArchitectureComponent[]): ComponentRelationship[] {
  return [
    {
      from: components[0].name,
      to: components[1].name,
      type: "depends",
      description: "API layer depends on business logic"
    },
    {
      from: components[1].name,
      to: components[2].name,
      type: "uses",
      description: "Business logic uses data layer"
    },
    {
      from: components[0].name,
      to: components[3].name,
      type: "uses",
      description: "API uses authentication service"
    }
  ];
}

/**
 * Generate data flow specification
 */
function generateDataFlow(components: ArchitectureComponent[]): DataFlowSpec {
  return {
    flows: [
      {
        from: "client",
        to: components[0].name,
        data: "HTTP request",
        method: "REST/GraphQL"
      },
      {
        from: components[0].name,
        to: components[1].name,
        data: "Business request",
        method: "Function call"
      },
      {
        from: components[1].name,
        to: components[2].name,
        data: "Data query",
        method: "Repository pattern"
      }
    ],
    entities: [
      {
        name: "User",
        attributes: {
          id: "string",
          email: "string",
          role: "string"
        }
      },
      {
        name: "Request",
        attributes: {
          id: "string",
          payload: "object",
          timestamp: "datetime"
        }
      }
    ]
  };
}

/**
 * Generate database design specification
 */
async function generateDatabaseDesign(
  target: string,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<DesignSpec> {
  const schema = generateDatabaseSchema(target, options.dbType);

  return {
    type: "database",
    format: options.format,
    specification: {
      name: `${target} Database`,
      type: options.dbType,
      description: `Database schema for ${target}`
    },
    schema
  };
}

/**
 * Generate database schema
 */
function generateDatabaseSchema(target: string, dbType: string): DatabaseSchema {
  const tableName = target.toLowerCase().replace(/\s+/g, '_');
  
  const tables: DatabaseTable[] = [
    {
      name: tableName,
      columns: [
        { name: "id", type: "UUID", nullable: false, primaryKey: true },
        { name: "name", type: "VARCHAR(255)", nullable: false, primaryKey: false },
        { name: "description", type: "TEXT", nullable: true, primaryKey: false },
        { name: "created_at", type: "TIMESTAMP", nullable: false, primaryKey: false },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, primaryKey: false }
      ],
      constraints: [
        { name: `${tableName}_pkey`, type: "primary", columns: ["id"] },
        { name: `${tableName}_name_unique`, type: "unique", columns: ["name"] }
      ]
    }
  ];

  const relationships: TableRelationship[] = [];
  
  const indexes: DatabaseIndex[] = [
    { name: `idx_${tableName}_name`, table: tableName, columns: ["name"], unique: true },
    { name: `idx_${tableName}_created_at`, table: tableName, columns: ["created_at"], unique: false }
  ];

  return { tables, relationships, indexes };
}

/**
 * Generate system design specification
 */
async function generateSystemDesign(
  target: string,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<DesignSpec> {
  const components = generateSystemComponents(target, options);
  const relationships = generateSystemRelationships(components);

  return {
    type: "system",
    format: options.format,
    specification: {
      name: target,
      type: "distributed-system",
      description: `System design for ${target}`
    },
    components,
    relationships
  };
}

/**
 * Generate system components
 */
function generateSystemComponents(target: string, options: z.infer<typeof DesignOptionsSchema>): ArchitectureComponent[] {
  const systemName = target.toLowerCase().replace(/\s+/g, '-');
  
  const baseComponents = [
    {
      name: `${systemName}-gateway`,
      type: "api-gateway",
      responsibilities: ["Request routing", "Load balancing", "Rate limiting"],
      interfaces: ["HTTP", "WebSocket"]
    },
    {
      name: `${systemName}-service`,
      type: "microservice",
      responsibilities: ["Core business logic", "Data processing"],
      interfaces: ["REST API", "gRPC"]
    },
    {
      name: `${systemName}-database`,
      type: "database",
      responsibilities: ["Data persistence", "Query execution"],
      interfaces: ["SQL", "Connection pool"]
    }
  ];

  // Add constraint-specific components
  if (options.constraints?.includes("high-availability")) {
    baseComponents.push({
      name: `${systemName}-cache`,
      type: "cache",
      responsibilities: ["Data caching", "Session storage"],
      interfaces: ["Redis API"]
    });
  }

  if (options.constraints?.includes("scalable")) {
    baseComponents.push({
      name: `${systemName}-queue`,
      type: "message-queue",
      responsibilities: ["Async processing", "Event distribution"],
      interfaces: ["Message broker"]
    });
  }

  return baseComponents;
}

/**
 * Generate system relationships
 */
function generateSystemRelationships(components: ArchitectureComponent[]): ComponentRelationship[] {
  const relationships: ComponentRelationship[] = [];
  
  // Standard relationships
  const gateway = components.find(c => c.type === "api-gateway");
  const service = components.find(c => c.type === "microservice");
  const database = components.find(c => c.type === "database");
  
  if (gateway && service) {
    relationships.push({
      from: gateway.name,
      to: service.name,
      type: "depends",
      description: "Gateway routes requests to service"
    });
  }
  
  if (service && database) {
    relationships.push({
      from: service.name,
      to: database.name,
      type: "uses",
      description: "Service reads/writes data"
    });
  }

  return relationships;
}

/**
 * Generate generic design specification
 */
async function generateGenericDesign(
  target: string,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<DesignSpec> {
  return {
    type: options.type,
    format: options.format,
    specification: {
      name: target,
      description: `Design specification for ${target}`,
      type: options.type
    }
  };
}

/**
 * Apply design patterns to the specification
 */
async function applyDesignPatterns(
  result: DesignResult,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<void> {
  const patterns = options.patterns || [];
  
  if (options.suggestPatterns) {
    const suggestions = suggestPatternsForDesign(result.designs[0], options);
    result.patternSuggestions = suggestions;
    
    // Auto-apply highly relevant patterns
    const autoApply = suggestions.filter(s => s.reason.includes("essential") || s.reason.includes("critical"));
    patterns.push(...autoApply.map(s => s.pattern));
  }

  for (const patternName of patterns) {
    const pattern = applyPattern(patternName, result.designs[0]);
    result.patterns.push(pattern);
    
    if (pattern.applied) {
      result.metrics.patternsApplied++;
    }
  }

  if (options.validatePatterns && patterns.length > 0) {
    result.patternValidation = validatePatternCompatibility(patterns);
  }
}

/**
 * Suggest patterns for design type
 */
function suggestPatternsForDesign(design: DesignSpec, options: z.infer<typeof DesignOptionsSchema>): PatternSuggestion[] {
  const suggestions: PatternSuggestion[] = [];

  switch (design.type) {
    case "api":
      suggestions.push({
        pattern: "facade",
        reason: "Simplify complex API interactions",
        benefits: ["Reduced complexity", "Better maintainability"]
      });
      suggestions.push({
        pattern: "repository",
        reason: "Abstract data access layer",
        benefits: ["Testability", "Flexibility"]
      });
      break;
    case "architecture":
      suggestions.push({
        pattern: "layered",
        reason: "Organize system into logical layers",
        benefits: ["Separation of concerns", "Maintainability"]
      });
      suggestions.push({
        pattern: "microservices",
        reason: "Scale components independently",
        benefits: ["Scalability", "Technology diversity"]
      });
      break;
    case "component":
      if (options.framework === "react") {
        suggestions.push({
          pattern: "container-component",
          reason: "Separate logic from presentation",
          benefits: ["Reusability", "Testability"]
        });
      }
      break;
  }

  return suggestions;
}

/**
 * Apply a specific pattern to the design
 */
function applyPattern(patternName: string, design: DesignSpec): ArchitecturePattern {
  // Simulate pattern application
  const pattern: ArchitecturePattern = {
    name: patternName,
    applied: true,
    rationale: `${patternName} pattern applied for better ${getPatternBenefit(patternName)}`
  };

  return pattern;
}

/**
 * Get primary benefit of a pattern
 */
function getPatternBenefit(patternName: string): string {
  const benefits: Record<string, string> = {
    facade: "simplicity and encapsulation",
    repository: "data access abstraction",
    layered: "separation of concerns",
    microservices: "scalability and modularity",
    observer: "loose coupling",
    strategy: "algorithm flexibility",
    factory: "object creation flexibility",
    singleton: "single instance management"
  };

  return benefits[patternName] || "design quality";
}

/**
 * Validate pattern compatibility
 */
function validatePatternCompatibility(patterns: string[]): PatternValidation {
  const compatibility: Record<string, boolean> = {};
  const conflicts: string[] = [];

  // Check for known conflicts
  if (patterns.includes("singleton") && patterns.includes("microservices")) {
    conflicts.push("Singleton pattern conflicts with microservices architecture");
    compatibility["singleton-microservices"] = false;
  }

  // Most patterns are generally compatible
  patterns.forEach(pattern => {
    if (!Object.keys(compatibility).some(key => key.includes(pattern))) {
      compatibility[pattern] = true;
    }
  });

  return { compatibility, conflicts };
}

/**
 * Perform iterative design refinement
 */
async function performIterativeRefinement(
  result: DesignResult,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<void> {
  const iterations: IterativeDesign[] = [];
  let currentDesign = result.designs[0];

  for (let i = 0; i < (options.iterations || 3); i++) {
    const feedback = generateFeedback(currentDesign, options.feedback, i);
    const improvements = applyFeedback(currentDesign, feedback);
    
    currentDesign = refineDesign(currentDesign, improvements);
    
    iterations.push({
      version: i + 1,
      design: currentDesign,
      feedback,
      improvements
    });
  }

  result.iterations = iterations;
  
  // Update main design with final iteration
  if (iterations.length > 0) {
    result.designs[0] = iterations[iterations.length - 1].design;
  }
}

/**
 * Generate feedback for current design iteration
 */
function generateFeedback(
  design: DesignSpec,
  userFeedback: string[] = [],
  iteration: number
): FeedbackItem[] {
  const feedback: FeedbackItem[] = [];

  // Add user feedback
  userFeedback.forEach(item => {
    feedback.push({
      type: "user",
      description: item,
      priority: "high"
    });
  });

  // Add automatic feedback based on iteration
  switch (iteration) {
    case 0:
      feedback.push({
        type: "validation",
        description: "Add input validation to all endpoints",
        priority: "high"
      });
      break;
    case 1:
      feedback.push({
        type: "performance",
        description: "Consider caching strategies for frequently accessed data",
        priority: "medium"
      });
      break;
    case 2:
      feedback.push({
        type: "security",
        description: "Implement rate limiting and authentication",
        priority: "high"
      });
      break;
  }

  return feedback;
}

/**
 * Apply feedback to generate improvements
 */
function applyFeedback(design: DesignSpec, feedback: FeedbackItem[]): ImprovementItem[] {
  return feedback.map(item => ({
    description: `Applied: ${item.description}`,
    applied: true,
    impact: item.priority === "high" ? "high" : item.priority === "medium" ? "medium" : "low"
  }));
}

/**
 * Refine design based on improvements
 */
function refineDesign(design: DesignSpec, improvements: ImprovementItem[]): DesignSpec {
  // In a real implementation, this would modify the design specification
  // For now, we'll return the original design with version increment
  return {
    ...design,
    specification: {
      ...design.specification,
      version: (design.specification.version || "1.0.0").replace(/(\d+)$/, (match) => String(parseInt(match) + 1))
    }
  };
}

/**
 * Optimize design based on constraints
 */
async function optimizeDesign(
  result: DesignResult,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<void> {
  const constraints = options.constraints || [];
  const strategies: OptimizationStrategy[] = [];

  constraints.forEach(constraint => {
    switch (constraint) {
      case "low-latency":
        strategies.push({
          area: "performance",
          approach: "Add caching layer and optimize database queries",
          benefit: "Reduced response times"
        });
        break;
      case "high-availability":
        strategies.push({
          area: "reliability",
          approach: "Implement redundancy and failover mechanisms",
          benefit: "Improved uptime"
        });
        break;
      case "scalable":
        strategies.push({
          area: "scalability",
          approach: "Design for horizontal scaling with load balancing",
          benefit: "Handle increased load"
        });
        break;
    }
  });

  result.optimization = {
    constraintsConsidered: constraints,
    strategies
  };
}

/**
 * Validate design consistency and requirements
 */
async function validateDesign(
  result: DesignResult,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<void> {
  const design = result.designs[0];
  
  // Validate consistency
  result.validation.consistency = {
    checked: true,
    issues: []
  };

  // Validate requirements if provided
  if (options.requirements) {
    const met = options.requirements.filter(req => 
      JSON.stringify(design).toLowerCase().includes(req.toLowerCase())
    );
    
    result.validation.requirements = {
      met: met.length,
      missing: options.requirements.filter(req => !met.includes(req))
    };
  }

  // Check for constraint conflicts
  if (options.constraints && options.constraints.length > 1) {
    const conflicts = detectConstraintConflicts(options.constraints);
    if (conflicts.length > 0) {
      result.validation.constraintConflicts = conflicts;
    }
  }
}

/**
 * Detect conflicts between constraints
 */
function detectConstraintConflicts(constraints: string[]): ConstraintConflict[] {
  const conflicts: ConstraintConflict[] = [];

  // Check for known conflicts
  if (constraints.includes("high-performance") && constraints.includes("low-memory")) {
    conflicts.push({
      constraints: ["high-performance", "low-memory"],
      conflict: "High performance typically requires more memory for caching and optimization",
      resolution: "Balance performance optimizations with memory usage monitoring"
    });
  }

  if (constraints.includes("simple") && constraints.includes("high-availability")) {
    conflicts.push({
      constraints: ["simple", "high-availability"],
      conflict: "High availability requires complex redundancy and failover mechanisms",
      resolution: "Prioritize availability while keeping individual components simple"
    });
  }

  return conflicts;
}

/**
 * Analyze design for various aspects
 */
async function analyzeDesign(
  result: DesignResult,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<void> {
  const analysis: DesignAnalysis = {};

  if (options.security) {
    analysis.security = analyzeSecurityAspects(result.designs[0]);
  }

  if (options.performance) {
    analysis.performance = analyzePerformanceAspects(result.designs[0]);
  }

  if (options.maintainability) {
    analysis.maintainability = analyzeMaintainabilityAspects(result.designs[0]);
  }

  result.analysis = analysis;
}

/**
 * Analyze security aspects of the design
 */
function analyzeSecurityAspects(design: DesignSpec): SecurityAnalysis {
  const threats: SecurityThreat[] = [
    {
      type: "injection",
      severity: "high",
      description: "SQL injection through unvalidated inputs"
    },
    {
      type: "authentication",
      severity: "medium",
      description: "Weak authentication mechanisms"
    }
  ];

  const mitigations: SecurityMitigation[] = threats.map(threat => ({
    threat: threat.type,
    mitigation: threat.type === "injection" ? "Use parameterized queries and input validation" : "Implement strong authentication",
    implemented: false
  }));

  return {
    threats,
    mitigations,
    score: 75 // Simulated security score
  };
}

/**
 * Analyze performance aspects of the design
 */
function analyzePerformanceAspects(design: DesignSpec): PerformanceAnalysis {
  const bottlenecks: PerformanceBottleneck[] = [
    {
      component: "database",
      issue: "Lack of indexing on frequently queried columns",
      impact: "high"
    },
    {
      component: "api",
      issue: "No response caching mechanism",
      impact: "medium"
    }
  ];

  const optimizations: PerformanceOptimization[] = [
    {
      area: "database",
      optimization: "Add database indexes and query optimization",
      expectedGain: "50% faster query response"
    },
    {
      area: "caching",
      optimization: "Implement Redis caching layer",
      expectedGain: "80% reduction in API response time"
    }
  ];

  const scalability: ScalabilityAssessment = {
    horizontal: true,
    vertical: true,
    constraints: ["Database connection limits", "Memory usage"]
  };

  return { bottlenecks, optimizations, scalability };
}

/**
 * Analyze maintainability aspects of the design
 */
function analyzeMaintainabilityAspects(design: DesignSpec): MaintainabilityAnalysis {
  const factors: MaintainabilityFactor[] = [
    {
      factor: "modularity",
      score: 8,
      impact: "Well-separated components improve maintainability"
    },
    {
      factor: "documentation",
      score: 6,
      impact: "Good documentation but could be more comprehensive"
    },
    {
      factor: "testability",
      score: 7,
      impact: "Design supports testing but needs more test hooks"
    }
  ];

  const overallScore = Math.round(factors.reduce((sum, f) => sum + f.score, 0) / factors.length);

  return { score: overallScore, factors };
}

/**
 * Analyze integration with existing codebase
 */
async function analyzeIntegration(
  result: DesignResult,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<void> {
  // This would analyze the existing codebase
  const existingCodeAnalysis: ExistingCodeAnalysis = {
    patterns: ["MVC", "Repository"],
    architecture: "Layered",
    frameworks: ["Express", "React"]
  };

  const compatibilityIssues: CompatibilityIssue[] = [
    {
      component: "authentication",
      issue: "Different auth mechanisms",
      severity: "medium",
      solution: "Create auth adapter layer"
    }
  ];

  const migrationStrategy: MigrationStrategy = {
    approach: "Gradual migration with adapter pattern",
    steps: [
      "Create compatibility layer",
      "Migrate authentication",
      "Update data layer",
      "Refactor API endpoints"
    ],
    risk: "medium"
  };

  result.integration = {
    existingCode: existingCodeAnalysis,
    compatibilityIssues,
    migrationStrategy
  };

  if (options.refactor) {
    result.refactoring = {
      suggestions: [
        {
          area: "authentication",
          suggestion: "Unify authentication mechanisms",
          benefit: "Simplified security model"
        }
      ],
      impact: {
        filesAffected: 15,
        effort: "medium",
        risk: "low"
      }
    };
  }
}

/**
 * Generate code artifacts from design
 */
async function generateArtifacts(
  result: DesignResult,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<void> {
  const generated: GeneratedArtifacts = {};

  // Generate TypeScript interfaces
  if (options.language === "typescript" || options.generate) {
    generated.interfaces = await generateTypeScriptInterfaces(result.designs[0]);
    result.metrics.filesGenerated += generated.interfaces.length;
  }

  // Generate React components
  if (options.framework === "react" && result.designs[0].type === "component") {
    generated.components = await generateReactComponents(result.designs[0]);
    result.metrics.filesGenerated += generated.components.length;
  }

  // Generate API stubs
  if (options.stubs && result.designs[0].type === "api") {
    generated.stubs = await generateApiStubs(result.designs[0], options.framework);
  }

  // Generate database migrations
  if (options.migrations && result.designs[0].type === "database") {
    generated.migrations = await generateDatabaseMigrations(result.designs[0], options.dbType);
    result.metrics.filesGenerated += generated.migrations.length;
  }

  result.generated = generated;
}

/**
 * Generate TypeScript interfaces
 */
async function generateTypeScriptInterfaces(design: DesignSpec): Promise<GeneratedInterface[]> {
  if (design.type === "api" && design.specification.components?.schemas) {
    const interfaces: GeneratedInterface[] = [];
    
    Object.entries(design.specification.components.schemas).forEach(([name, schema]: [string, any]) => {
      const content = generateTypeScriptInterface(name, schema);
      interfaces.push({
        file: `types/${name}.ts`,
        content
      });
    });
    
    return interfaces;
  }
  
  return [];
}

/**
 * Generate TypeScript interface content
 */
function generateTypeScriptInterface(name: string, schema: any): string {
  const properties = Object.entries(schema.properties || {})
    .map(([prop, def]: [string, any]) => {
      const optional = schema.required?.includes(prop) ? '' : '?';
      return `  ${prop}${optional}: ${mapSchemaTypeToTypeScript(def.type)};`;
    })
    .join('\n');

  return `export interface ${name} {
${properties}
}`;
}

/**
 * Map OpenAPI schema types to TypeScript types
 */
function mapSchemaTypeToTypeScript(schemaType: string): string {
  const typeMap: Record<string, string> = {
    string: 'string',
    number: 'number',
    integer: 'number',
    boolean: 'boolean',
    array: 'any[]',
    object: 'object'
  };
  
  return typeMap[schemaType] || 'any';
}

/**
 * Generate React components
 */
async function generateReactComponents(design: DesignSpec): Promise<GeneratedComponent[]> {
  if (design.type === "component" && design.interface) {
    const componentName = design.specification.name;
    const content = generateReactComponentContent(componentName, design.interface);
    
    return [{
      file: `components/${componentName}.tsx`,
      content
    }];
  }
  
  return [];
}

/**
 * Generate React component content
 */
function generateReactComponentContent(name: string, componentInterface: ComponentInterface): string {
  const propsInterface = generatePropsInterface(name, componentInterface.props);
  const component = generateReactFunctionalComponent(name, componentInterface);
  
  return `import React from 'react';

${propsInterface}

export function ${name}(props: ${name}Props) {
${component}
}`;
}

/**
 * Generate props interface
 */
function generatePropsInterface(name: string, props: Record<string, any>): string {
  const properties = Object.entries(props)
    .map(([prop, def]) => {
      const optional = def.required ? '' : '?';
      const type = def.type === 'function' ? '() => void' : def.type;
      return `  ${prop}${optional}: ${type};`;
    })
    .join('\n');

  return `interface ${name}Props {
${properties}
}`;
}

/**
 * Generate React functional component
 */
function generateReactFunctionalComponent(name: string, componentInterface: ComponentInterface): string {
  const methods = componentInterface.methods.map(method => 
    `  const ${method.name} = () => {
    // TODO: Implement ${method.name}
  };`
  ).join('\n\n');

  return `${methods}

  return (
    <div className="${name.toLowerCase()}">
      <h2>{props.${Object.keys(componentInterface.props)[0] || 'data'}?.name || '${name}'}</h2>
      {/* TODO: Implement component UI */}
    </div>
  );`;
}

/**
 * Generate API implementation stubs
 */
async function generateApiStubs(design: DesignSpec, framework?: string): Promise<GeneratedStub[]> {
  if (design.type === "api" && design.specification.paths) {
    const stubs: GeneratedStub[] = [];
    
    Object.entries(design.specification.paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, spec]: [string, any]) => {
        const implementation = generateStubImplementation(path, method, spec, framework);
        stubs.push({
          endpoint: path,
          method: method.toUpperCase(),
          implementation
        });
      });
    });
    
    return stubs;
  }
  
  return [];
}

/**
 * Generate stub implementation
 */
function generateStubImplementation(path: string, method: string, spec: any, framework?: string): string {
  if (framework === "express") {
    return `app.${method}('${path}', async (req, res) => {
  try {
    // TODO: Implement ${spec.summary || `${method} ${path}`}
    res.json({ message: 'Not implemented' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`;
  }
  
  return `// TODO: Implement ${method.toUpperCase()} ${path}`;
}

/**
 * Generate database migrations
 */
async function generateDatabaseMigrations(design: DesignSpec, dbType: string): Promise<GeneratedMigration[]> {
  if (design.type === "database" && design.schema) {
    const migrations: GeneratedMigration[] = [];
    
    design.schema.tables.forEach(table => {
      const content = generateMigrationContent(table, dbType);
      migrations.push({
        file: `migrations/${Date.now()}_create_${table.name}.sql`,
        content
      });
    });
    
    return migrations;
  }
  
  return [];
}

/**
 * Generate migration content
 */
function generateMigrationContent(table: DatabaseTable, dbType: string): string {
  const columns = table.columns.map(col => 
    `  ${col.name} ${col.type}${col.nullable ? '' : ' NOT NULL'}${col.primaryKey ? ' PRIMARY KEY' : ''}`
  ).join(',\n');
  
  let sql = `CREATE TABLE ${table.name} (\n${columns}\n);`;
  
  // Add indexes
  table.constraints?.forEach(constraint => {
    if (constraint.type === 'unique') {
      sql += `\n\nCREATE UNIQUE INDEX ${constraint.name} ON ${table.name} (${constraint.columns.join(', ')});`;
    }
  });
  
  return sql;
}

/**
 * Preview design without generating files
 */
async function previewDesign(
  result: DesignResult,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<void> {
  const design = result.designs[0];
  let filesWouldBeGenerated = 0;
  
  // Count files that would be generated
  if (options.generate) {
    if (design.type === "api" && design.specification.components?.schemas) {
      filesWouldBeGenerated += Object.keys(design.specification.components.schemas).length;
    }
    if (design.type === "component") {
      filesWouldBeGenerated += 1;
    }
    if (design.type === "database" && design.schema) {
      filesWouldBeGenerated += design.schema.tables.length;
    }
  }

  let complexity: ComplexityAnalysis | undefined;
  if (options.complexity) {
    complexity = {
      score: calculateComplexityScore(design),
      factors: ["Component count", "Relationship complexity", "Interface complexity"]
    };
  }

  result.preview = {
    designOverview: `${design.type} design for ${design.specification.name || 'target system'}`,
    filesWouldBeGenerated,
    complexity,
    estimatedEffort: Math.ceil(filesWouldBeGenerated * 0.5) // Estimate 0.5 hours per file
  };
}

/**
 * Calculate design complexity score
 */
function calculateComplexityScore(design: DesignSpec): number {
  let score = 0;
  
  // Base complexity
  score += 1;
  
  // Component count
  if (design.components) {
    score += design.components.length * 2;
  }
  
  // Relationship complexity
  if (design.relationships) {
    score += design.relationships.length;
  }
  
  // Interface complexity
  if (design.interface) {
    score += Object.keys(design.interface.props || {}).length;
    score += (design.interface.methods || []).length;
    score += (design.interface.events || []).length;
  }
  
  return Math.min(10, score); // Cap at 10
}

/**
 * Generate design documentation
 */
async function generateDocumentation(
  result: DesignResult,
  options: z.infer<typeof DesignOptionsSchema>
): Promise<void> {
  const design = result.designs[0];
  const sections: DocumentationSection[] = [];

  // Overview section
  sections.push({
    title: `${capitalize(design.type)} Overview`,
    content: `This document describes the ${design.type} design for ${design.specification.name || 'the target system'}.`
  });

  // Architecture section
  if (design.components) {
    sections.push({
      title: "Architecture",
      content: generateArchitectureDocumentation(design.components, design.relationships)
    });
  }

  // API documentation
  if (design.type === "api" && options.docType === "openapi") {
    result.documentation = {
      sections,
      apiSpec: design.specification
    };
    return;
  }

  // Patterns section
  if (result.patterns.length > 0) {
    sections.push({
      title: "Design Patterns",
      content: generatePatternsDocumentation(result.patterns)
    });
  }

  // Analysis section
  if (result.analysis) {
    sections.push({
      title: "Analysis",
      content: generateAnalysisDocumentation(result.analysis)
    });
  }

  result.documentation = { sections };

  // Generate diagrams if requested
  if (options.diagrams) {
    result.diagrams = await generateDesignDiagrams(design, options.diagramType);
  }
}

/**
 * Generate architecture documentation
 */
function generateArchitectureDocumentation(
  components: ArchitectureComponent[], 
  relationships?: ComponentRelationship[]
): string {
  let content = "## Components\n\n";
  
  components.forEach(component => {
    content += `### ${component.name}\n`;
    content += `Type: ${component.type}\n\n`;
    content += `Responsibilities:\n`;
    component.responsibilities.forEach(resp => {
      content += `- ${resp}\n`;
    });
    content += `\n`;
  });

  if (relationships && relationships.length > 0) {
    content += "## Relationships\n\n";
    relationships.forEach(rel => {
      content += `- ${rel.from} ${rel.type} ${rel.to}: ${rel.description}\n`;
    });
  }

  return content;
}

/**
 * Generate patterns documentation
 */
function generatePatternsDocumentation(patterns: ArchitecturePattern[]): string {
  let content = "## Applied Patterns\n\n";
  
  patterns.forEach(pattern => {
    content += `### ${pattern.name}\n`;
    content += `Applied: ${pattern.applied ? 'Yes' : 'No'}\n`;
    content += `Rationale: ${pattern.rationale}\n\n`;
  });

  return content;
}

/**
 * Generate analysis documentation
 */
function generateAnalysisDocumentation(analysis: DesignAnalysis): string {
  let content = "## Design Analysis\n\n";
  
  if (analysis.security) {
    content += `### Security\n`;
    content += `Score: ${analysis.security.score}/100\n`;
    content += `Threats identified: ${analysis.security.threats.length}\n\n`;
  }

  if (analysis.performance) {
    content += `### Performance\n`;
    content += `Bottlenecks identified: ${analysis.performance.bottlenecks.length}\n`;
    content += `Optimizations suggested: ${analysis.performance.optimizations.length}\n\n`;
  }

  if (analysis.maintainability) {
    content += `### Maintainability\n`;
    content += `Score: ${analysis.maintainability.score}/10\n\n`;
  }

  return content;
}

/**
 * Generate design diagrams
 */
async function generateDesignDiagrams(design: DesignSpec, diagramType: string): Promise<DesignDiagram[]> {
  const diagrams: DesignDiagram[] = [];

  if (diagramType === "sequence" && design.dataFlow) {
    diagrams.push({
      type: "sequence",
      format: "mermaid",
      content: generateSequenceDiagram(design.dataFlow)
    });
  }

  if (diagramType === "component" && design.components) {
    diagrams.push({
      type: "component",
      format: "mermaid", 
      content: generateComponentDiagram(design.components, design.relationships)
    });
  }

  return diagrams;
}

/**
 * Generate sequence diagram content
 */
function generateSequenceDiagram(dataFlow: DataFlowSpec): string {
  let content = "sequenceDiagram\n";
  
  dataFlow.flows.forEach(flow => {
    content += `    ${flow.from}->>+${flow.to}: ${flow.data}\n`;
  });

  return content;
}

/**
 * Generate component diagram content
 */
function generateComponentDiagram(
  components: ArchitectureComponent[], 
  relationships?: ComponentRelationship[]
): string {
  let content = "graph TD\n";
  
  components.forEach(component => {
    content += `    ${component.name}[${component.name}]\n`;
  });

  relationships?.forEach(rel => {
    content += `    ${rel.from} --> ${rel.to}\n`;
  });

  return content;
}

/**
 * Utility function to capitalize strings
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Export the command
export const DesignCommand = cmd({
    command: "design [target]",
    describe: "System/API/component design with iterative refinement",
    
    builder: (yargs: Argv) => {
        return yargs
            .positional("target", {
                describe: "Target design name or description",
                type: "string"
            })
            .option("type", {
                describe: "Type of design to generate",
                choices: ["api", "component", "architecture", "database", "service", "system", "integration", "framework"],
                default: "api",
                type: "string"
            })
            .option("format", {
                describe: "Output format for the design",
                choices: ["openapi", "json", "yaml", "markdown", "typescript"],
                default: "openapi",
                type: "string"
            })
            .option("iterative", {
                describe: "Enable iterative design refinement",
                type: "boolean",
                default: false
            })
            .option("iterations", {
                describe: "Number of refinement iterations",
                type: "number",
                default: 3
            })
            .option("feedback", {
                describe: "Feedback for design refinement",
                type: "array",
                default: []
            })
            .option("validate", {
                describe: "Validate design consistency",
                type: "boolean",
                default: false
            })
            .option("constraints", {
                describe: "Design constraints",
                type: "array",
                default: []
            })
            .option("optimize", {
                describe: "Optimize design based on constraints",
                type: "boolean",
                default: false
            })
            .option("patterns", {
                describe: "Design patterns to apply",
                type: "array",
                default: []
            })
            .option("suggestPatterns", {
                describe: "Suggest appropriate patterns",
                type: "boolean",
                default: false
            })
            .option("validatePatterns", {
                describe: "Validate pattern compatibility",
                type: "boolean",
                default: false
            })
            .option("generate", {
                describe: "Generate code from design",
                type: "boolean",
                default: false
            })
            .option("language", {
                describe: "Target programming language",
                choices: ["typescript", "javascript", "python", "java"],
                default: "typescript",
                type: "string"
            })
            .option("framework", {
                describe: "Target framework",
                type: "string"
            })
            .option("stubs", {
                describe: "Generate implementation stubs",
                type: "boolean",
                default: false
            })
            .option("migrations", {
                describe: "Generate database migrations",
                type: "boolean",
                default: false
            })
            .option("documentation", {
                describe: "Generate design documentation",
                type: "boolean",
                default: false
            })
            .option("docType", {
                describe: "Documentation type",
                choices: ["markdown", "openapi", "asyncapi"],
                default: "markdown",
                type: "string"
            })
            .option("diagrams", {
                describe: "Generate design diagrams",
                type: "boolean",
                default: false
            })
            .option("diagramType", {
                describe: "Type of diagram to generate",
                choices: ["sequence", "class", "component", "architecture"],
                default: "sequence",
                type: "string"
            })
            .option("requirements", {
                describe: "Design requirements to validate",
                type: "array",
                default: []
            })
            .option("security", {
                describe: "Include security analysis",
                type: "boolean",
                default: false
            })
            .option("performance", {
                describe: "Include performance analysis",
                type: "boolean",
                default: false
            })
            .option("maintainability", {
                describe: "Include maintainability analysis",
                type: "boolean",
                default: false
            })
            .option("analyze", {
                describe: "Perform comprehensive design analysis",
                type: "boolean",
                default: false
            })
            .option("dryRun", {
                describe: "Preview design without generating files",
                type: "boolean",
                default: false
            })
            .option("complexity", {
                describe: "Analyze design complexity",
                type: "boolean",
                default: false
            })
            .option("existing", {
                describe: "Path to existing codebase for integration analysis",
                type: "string"
            })
            .option("integrate", {
                describe: "Integrate with existing codebase",
                type: "boolean",
                default: false
            })
            .option("refactor", {
                describe: "Suggest refactoring for integration",
                type: "boolean",
                default: false
            })
            .option("dbType", {
                describe: "Database type for schema generation",
                choices: ["postgresql", "mysql", "mongodb", "sqlite"],
                default: "postgresql",
                type: "string"
            });
    },

    handler: async (args) => {
        try {
            // Parse the command using CommandParser
            const parsedCommand: ParsedCommand = {
                command: "design",
                target: args.target as string,
                args: [],
                flags: args,
                rawArgs: []
            };

            // Resolve flags using FlagResolver
            const flagResult = FlagResolver.resolve("design", parsedCommand.flags);
            
            if (!flagResult.valid) {
                console.error("Flag validation errors:");
                flagResult.errors.forEach(error => console.error(`  - ${error}`));
                process.exit(1);
            }

            if (flagResult.warnings.length > 0) {
                console.warn("Flag warnings:");
                flagResult.warnings.forEach(warning => console.warn(`  - ${warning}`));
            }

            // Execute the design generation
            const result = await handleDesignCommand(parsedCommand, flagResult.resolved);
            
            // Display results
            displayDesignResults(result);
            
            // Exit with appropriate code
            if (!result.validation.success) {
                process.exit(1);
            }
            
        } catch (error) {
            console.error(`Design generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    },
});

/**
 * Display design results in human-readable format
 */
function displayDesignResults(result: DesignResult): void {
    console.log("\n🎨 Design Results");
    console.log("=================");
    console.log(`Type: ${result.options.type}`);
    console.log(`Format: ${result.options.format}`);
    console.log(`Duration: ${result.metadata.duration}ms`);
    console.log(`Success: ${result.validation.success ? '✅' : '❌'}`);
    
    if (result.preview) {
        console.log("\n👁️ Preview Mode:");
        console.log(`  Design overview: ${result.preview.designOverview}`);
        console.log(`  Files would be generated: ${result.preview.filesWouldBeGenerated}`);
        if (result.preview.complexity) {
            console.log(`  Complexity score: ${result.preview.complexity.score}/10`);
        }
        if (result.preview.estimatedEffort) {
            console.log(`  Estimated effort: ${result.preview.estimatedEffort} hours`);
        }
    }
    
    console.log("\n📋 Design Specifications:");
    result.designs.forEach((design, index) => {
        console.log(`  ${index + 1}. ${design.type.toUpperCase()}: ${design.specification.name || 'Unnamed'}`);
        console.log(`     Format: ${design.format}`);
        if (design.components) {
            console.log(`     Components: ${design.components.length}`);
        }
        if (design.interface) {
            console.log(`     Props: ${Object.keys(design.interface.props || {}).length}`);
            console.log(`     Methods: ${(design.interface.methods || []).length}`);
            console.log(`     Events: ${(design.interface.events || []).length}`);
        }
    });
    
    if (result.patterns.length > 0) {
        console.log("\n🏗️ Design Patterns:");
        result.patterns.forEach((pattern, index) => {
            const statusIcon = pattern.applied ? '✅' : '⏳';
            console.log(`  ${index + 1}. ${statusIcon} ${pattern.name}`);
            console.log(`     Rationale: ${pattern.rationale}`);
        });
    }
    
    if (result.patternSuggestions && result.patternSuggestions.length > 0) {
        console.log("\n💡 Pattern Suggestions:");
        result.patternSuggestions.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion.pattern}`);
            console.log(`     Reason: ${suggestion.reason}`);
            console.log(`     Benefits: ${suggestion.benefits.join(', ')}`);
        });
    }
    
    if (result.iterations && result.iterations.length > 0) {
        console.log("\n🔄 Iterative Refinement:");
        result.iterations.forEach((iteration, index) => {
            console.log(`  Version ${iteration.version}:`);
            console.log(`    Feedback items: ${iteration.feedback.length}`);
            console.log(`    Improvements: ${iteration.improvements.length}`);
            const appliedImprovements = iteration.improvements.filter(i => i.applied).length;
            console.log(`    Applied: ${appliedImprovements}/${iteration.improvements.length}`);
        });
    }
    
    if (result.generated) {
        console.log("\n📁 Generated Artifacts:");
        if (result.generated.interfaces) {
            console.log(`  Interfaces: ${result.generated.interfaces.length} files`);
            result.generated.interfaces.slice(0, 3).forEach(iface => {
                console.log(`    • ${iface.file}`);
            });
        }
        if (result.generated.components) {
            console.log(`  Components: ${result.generated.components.length} files`);
            result.generated.components.slice(0, 3).forEach(comp => {
                console.log(`    • ${comp.file}`);
            });
        }
        if (result.generated.stubs) {
            console.log(`  API Stubs: ${result.generated.stubs.length} endpoints`);
        }
        if (result.generated.migrations) {
            console.log(`  Migrations: ${result.generated.migrations.length} files`);
        }
    }
    
    if (result.analysis) {
        console.log("\n📊 Design Analysis:");
        if (result.analysis.security) {
            console.log(`  Security Score: ${result.analysis.security.score}/100`);
            console.log(`  Threats: ${result.analysis.security.threats.length} identified`);
        }
        if (result.analysis.performance) {
            console.log(`  Performance Bottlenecks: ${result.analysis.performance.bottlenecks.length}`);
            console.log(`  Optimizations: ${result.analysis.performance.optimizations.length} suggested`);
        }
        if (result.analysis.maintainability) {
            console.log(`  Maintainability Score: ${result.analysis.maintainability.score}/10`);
        }
    }
    
    if (result.optimization) {
        console.log("\n⚡ Optimization:");
        console.log(`  Constraints considered: ${result.optimization.constraintsConsidered.join(', ')}`);
        console.log(`  Strategies: ${result.optimization.strategies.length}`);
        result.optimization.strategies.forEach(strategy => {
            console.log(`    • ${strategy.area}: ${strategy.approach}`);
        });
    }
    
    if (result.integration) {
        console.log("\n🔗 Integration Analysis:");
        console.log(`  Existing patterns: ${result.integration.existingCode.patterns.join(', ')}`);
        console.log(`  Architecture: ${result.integration.existingCode.architecture}`);
        console.log(`  Compatibility issues: ${result.integration.compatibilityIssues.length}`);
        console.log(`  Migration approach: ${result.integration.migrationStrategy.approach}`);
    }
    
    if (result.documentation) {
        console.log("\n📚 Documentation:");
        console.log(`  Sections: ${result.documentation.sections.length}`);
        result.documentation.sections.forEach(section => {
            console.log(`    • ${section.title}`);
        });
        if (result.documentation.apiSpec) {
            console.log(`  API Specification: OpenAPI format`);
        }
    }
    
    if (result.diagrams && result.diagrams.length > 0) {
        console.log("\n📈 Diagrams:");
        result.diagrams.forEach(diagram => {
            console.log(`  • ${diagram.type} diagram (${diagram.format})`);
        });
    }
    
    if (result.validation.warnings.length > 0) {
        console.log("\n⚠️ Warnings:");
        result.validation.warnings.forEach(warning => {
            console.log(`  ⚠️ ${warning}`);
        });
    }
    
    if (result.validation.errors.length > 0) {
        console.log("\n❌ Errors:");
        result.validation.errors.forEach(error => {
            console.log(`  ❌ ${error}`);
        });
    }
    
    if (result.validation.constraintConflicts && result.validation.constraintConflicts.length > 0) {
        console.log("\n⚔️ Constraint Conflicts:");
        result.validation.constraintConflicts.forEach(conflict => {
            console.log(`  Constraints: ${conflict.constraints.join(' vs ')}`);
            console.log(`  Conflict: ${conflict.conflict}`);
            console.log(`  Resolution: ${conflict.resolution}`);
        });
    }
    
    console.log("\n📊 Summary:");
    console.log(`  Designs generated: ${result.metrics.designsGenerated}`);
    console.log(`  Patterns applied: ${result.metrics.patternsApplied}`);
    console.log(`  Files generated: ${result.metrics.filesGenerated}`);
    
    console.log(`\n${result.validation.success ? '✅' : '❌'} Design generation ${result.validation.success ? 'completed successfully' : 'failed'}!\n`);
}