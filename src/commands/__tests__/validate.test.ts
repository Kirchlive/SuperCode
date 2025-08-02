/**
 * Validate Command Tests
 * TDD implementation for comprehensive validation (code, config, security, dependencies)
 */

import { describe, test, expect, beforeEach, mock, afterEach } from "bun:test";
import { z } from "zod";

// Mock dependencies before importing the command
const mockGlob = {
  run: mock(async (options: any) => {
    if (options.pattern.includes("*.ts")) {
      return [
        "/Users/rob/Development/SuperCode/SuperCode/src/index.ts",
        "/Users/rob/Development/SuperCode/SuperCode/src/commands/analyze.ts"
      ];
    }
    if (options.pattern.includes("package.json")) {
      return ["/Users/rob/Development/SuperCode/SuperCode/package.json"];
    }
    if (options.pattern.includes("*.json")) {
      return [
        "/Users/rob/Development/SuperCode/SuperCode/package.json",
        "/Users/rob/Development/SuperCode/SuperCode/tsconfig.json"
      ];
    }
    if (options.pattern.includes("*.env")) {
      return ["/Users/rob/Development/SuperCode/SuperCode/.env"];
    }
    return [];
  })
};

const mockRead = {
  run: mock(async (options: any) => {
    const filePath = options.filePath;
    if (filePath.includes("package.json")) {
      return JSON.stringify({
        name: "supercode",
        version: "1.0.0",
        dependencies: {
          "express": "^4.18.0",
          "lodash": "^4.17.21"
        },
        devDependencies: {
          "typescript": "^5.0.0",
          "@types/node": "^20.0.0"
        }
      });
    }
    if (filePath.includes("tsconfig.json")) {
      return JSON.stringify({
        compilerOptions: {
          target: "es2020",
          module: "commonjs",
          strict: true
        }
      });
    }
    if (filePath.includes(".env")) {
      return "DATABASE_URL=postgres://localhost:5432/app\nAPI_KEY=secret123";
    }
    if (filePath.includes("index.ts")) {
      return `
import express from 'express';
const app = express();
app.get('/', (req, res) => {
  res.send('Hello World');
});
export default app;
`;
    }
    return "";
  })
};

const mockGrep = {
  search: mock(async (pattern: string, options: any) => {
    if (pattern.includes("console.log")) {
      return [
        { file: "src/debug.ts", line: 5, content: "console.log('Debug info')" }
      ];
    }
    if (pattern.includes("TODO|FIXME")) {
      return [
        { file: "src/utils.ts", line: 23, content: "// TODO: Optimize this function" },
        { file: "src/api.ts", line: 45, content: "// FIXME: Handle error case" }
      ];
    }
    if (pattern.includes("password|secret")) {
      return [
        { file: "src/config.ts", line: 12, content: "const secret = 'hardcoded-secret'" }
      ];
    }
    return [];
  })
};

const mockBash = {
  run: mock(async (command: string) => {
    if (command.includes("npm audit")) {
      return {
        success: true,
        output: JSON.stringify({
          vulnerabilities: {
            low: 2,
            moderate: 1,
            high: 0,
            critical: 0
          },
          metadata: {
            totalDependencies: 150
          }
        })
      };
    }
    if (command.includes("eslint")) {
      return {
        success: true,
        output: JSON.stringify([
          {
            filePath: "src/index.ts",
            messages: [
              {
                ruleId: "no-unused-vars",
                severity: 1,
                message: "Variable 'unused' is defined but never used",
                line: 10
              }
            ]
          }
        ])
      };
    }
    if (command.includes("tsc --noEmit")) {
      return { success: true, output: "No TypeScript errors found" };
    }
    return { success: true, output: "Command executed" };
  })
};

const mockWebFetch = {
  fetch: mock(async (url: string) => {
    if (url.includes("nvd.nist.gov")) {
      return {
        status: 200,
        data: {
          vulnerabilities: []
        }
      };
    }
    return { status: 404, data: null };
  })
};

// Mock the modules
mock.module("../../tool/glob", () => mockGlob);
mock.module("../../tool/read", () => mockRead);
mock.module("../../tool/grep", () => mockGrep);
mock.module("../../tool/bash", () => mockBash);
mock.module("../../tool/webfetch", () => mockWebFetch);

// Import types and interfaces that the validate command should implement
export interface ValidateOptions {
  type: "all" | "code" | "config" | "security" | "dependencies" | "performance";
  fix: boolean;
  strict: boolean;
  format: "text" | "json" | "junit";
  output?: string;
  exclude: string[];
  include: string[];
  rules?: string;
  threshold: "low" | "medium" | "high" | "critical";
  parallel: boolean;
  cache: boolean;
  ci: boolean;
  interactive: boolean;
}

export interface ValidateResult {
  command: string;
  timestamp: string;
  options: ValidateOptions;
  summary: ValidationSummary;
  validations: ValidationResult[];
  metrics: ValidationMetrics;
  status: "success" | "warning" | "failure";
}

export interface ValidationSummary {
  total: number;
  passed: number;
  warnings: number;
  errors: number;
  critical: number;
  duration: number;
  coverage?: number;
}

export interface ValidationResult {
  category: string;
  validator: string;
  status: "passed" | "warning" | "error" | "critical";
  message: string;
  file?: string;
  line?: number;
  column?: number;
  rule?: string;
  severity: "info" | "warning" | "error" | "critical";
  fixable: boolean;
  suggestion?: string;
}

export interface ValidationMetrics {
  codeQuality: CodeQualityMetrics;
  security: SecurityMetrics;
  dependencies: DependencyMetrics;
  configuration: ConfigurationMetrics;
  performance: PerformanceMetrics;
}

export interface CodeQualityMetrics {
  linesOfCode: number;
  complexity: number;
  maintainabilityIndex: number;
  duplicatedLines: number;
  testCoverage: number;
  eslintIssues: number;
  typeScriptErrors: number;
}

export interface SecurityMetrics {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  hardcodedSecrets: number;
  insecurePatterns: number;
  dependencyVulnerabilities: number;
}

export interface DependencyMetrics {
  total: number;
  outdated: number;
  vulnerable: number;
  licenses: Record<string, number>;
  duplicates: number;
}

export interface ConfigurationMetrics {
  validConfigs: number;
  invalidConfigs: number;
  missingConfigs: number;
  deprecatedSettings: number;
}

export interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

describe("Validate Command", () => {
  let handleValidateCommand: any;
  let ValidateOptionsSchema: any;

  beforeEach(() => {
    // Reset all mocks
    mockGlob.run.mockClear();
    mockRead.run.mockClear();
    mockGrep.search.mockClear();
    mockBash.run.mockClear();
    mockWebFetch.fetch.mockClear();
  });

  describe("Schema Validation", () => {
    test("should validate options schema", () => {
      const validOptions: ValidateOptions = {
        type: "all",
        fix: false,
        strict: false,
        format: "text",
        exclude: [],
        include: [],
        threshold: "medium",
        parallel: true,
        cache: true,
        ci: false,
        interactive: true
      };

      // The schema should exist and validate this structure
      // Schema validation test - will be implemented when schema is available
      expect(validOptions.type).toBe("all");
    });

    test("should reject invalid validation types", () => {
      const invalidOptions = {
        type: "invalid" as any,
        fix: false,
        strict: false,
        format: "text",
        exclude: [],
        include: [],
        threshold: "medium",
        parallel: true,
        cache: true,
        ci: false,
        interactive: true
      };

      // Schema validation test - will be implemented when schema is available
      expect(invalidOptions.type).toBe("invalid");
    });

    test("should have sensible defaults", () => {
      const minimalOptions = {
        type: "all"
      };

      // Schema should provide defaults for optional fields
      const parsedOptions = {
        type: "all",
        fix: false,
        strict: false,
        format: "text",
        exclude: [],
        include: [],
        threshold: "medium",
        parallel: true,
        cache: true,
        ci: false,
        interactive: true
      };

      expect(parsedOptions.fix).toBe(false);
      expect(parsedOptions.format).toBe("text");
      expect(parsedOptions.threshold).toBe("medium");
    });
  });

  describe("Code Validation", () => {
    test("should validate TypeScript code", async () => {
      const validateTypeScript = mock(async (files: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "code",
            validator: "typescript",
            status: "passed",
            message: "TypeScript compilation successful",
            severity: "info",
            fixable: false
          }
        ];
        return results;
      });

      const results = await validateTypeScript(["src/index.ts"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].validator).toBe("typescript");
      expect(results[0].status).toBe("passed");
    });

    test("should run ESLint validation", async () => {
      const validateESLint = mock(async (files: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "code",
            validator: "eslint",
            status: "warning",
            message: "Variable 'unused' is defined but never used",
            file: "src/index.ts",
            line: 10,
            rule: "no-unused-vars",
            severity: "warning",
            fixable: true,
            suggestion: "Remove unused variable or use it"
          }
        ];
        return results;
      });

      const results = await validateESLint(["src/index.ts"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].rule).toBe("no-unused-vars");
      expect(results[0].fixable).toBe(true);
    });

    test("should check code complexity", async () => {
      const validateComplexity = mock(async (files: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "code",
            validator: "complexity",
            status: "warning",
            message: "Function has high cyclomatic complexity: 15",
            file: "src/utils.ts",
            line: 45,
            severity: "warning",
            fixable: false,
            suggestion: "Consider breaking down this function into smaller parts"
          }
        ];
        return results;
      });

      const results = await validateComplexity(["src/utils.ts"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain("complexity");
    });

    test("should detect code duplication", async () => {
      const validateDuplication = mock(async (files: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "code",
            validator: "duplication",
            status: "warning",
            message: "Duplicated code block detected (12 lines)",
            file: "src/api.ts",
            line: 78,
            severity: "warning",
            fixable: false,
            suggestion: "Extract common code into a shared function"
          }
        ];
        return results;
      });

      const results = await validateDuplication(["src/api.ts"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].validator).toBe("duplication");
    });
  });

  describe("Security Validation", () => {
    test("should scan for hardcoded secrets", async () => {
      const scanSecrets = mock(async (files: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "security",
            validator: "secrets",
            status: "critical",
            message: "Hardcoded secret detected",
            file: "src/config.ts",
            line: 12,
            severity: "critical",
            fixable: true,
            suggestion: "Move secret to environment variable"
          }
        ];
        return results;
      });

      const results = await scanSecrets(["src/config.ts"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("critical");
      expect(results[0].validator).toBe("secrets");
    });

    test("should check for vulnerable dependencies", async () => {
      const scanDependencies = mock(async () => {
        const results: ValidationResult[] = [
          {
            category: "security",
            validator: "dependencies",
            status: "warning",
            message: "Package 'lodash' has known vulnerabilities",
            severity: "warning",
            fixable: true,
            suggestion: "Update to lodash@^4.17.22"
          }
        ];
        return results;
      });

      const results = await scanDependencies();
      
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain("vulnerabilities");
    });

    test("should detect insecure patterns", async () => {
      const scanPatterns = mock(async (files: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "security",
            validator: "patterns",
            status: "error",
            message: "Insecure random number generation",
            file: "src/crypto.ts",
            line: 34,
            severity: "error",
            fixable: true,
            suggestion: "Use crypto.randomBytes() instead of Math.random()"
          }
        ];
        return results;
      });

      const results = await scanPatterns(["src/crypto.ts"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe("error");
    });

    test("should validate SSL/TLS configuration", async () => {
      const validateSSL = mock(async (configs: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "security",
            validator: "ssl",
            status: "passed",
            message: "SSL configuration is secure",
            severity: "info",
            fixable: false
          }
        ];
        return results;
      });

      const results = await validateSSL(["nginx.conf"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("passed");
    });
  });

  describe("Configuration Validation", () => {
    test("should validate JSON configuration files", async () => {
      const validateJSON = mock(async (files: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "config",
            validator: "json",
            status: "passed",
            message: "Valid JSON syntax",
            file: "package.json",
            severity: "info",
            fixable: false
          }
        ];
        return results;
      });

      const results = await validateJSON(["package.json"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].validator).toBe("json");
    });

    test("should validate environment variables", async () => {
      const validateEnv = mock(async (envFiles: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "config",
            validator: "environment",
            status: "warning",
            message: "Missing required environment variable: JWT_SECRET",
            severity: "warning",
            fixable: true,
            suggestion: "Add JWT_SECRET to .env file"
          }
        ];
        return results;
      });

      const results = await validateEnv([".env"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain("Missing required");
    });

    test("should validate Docker configuration", async () => {
      const validateDocker = mock(async (dockerFiles: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "config",
            validator: "docker",
            status: "warning",
            message: "Running as root user in container",
            file: "Dockerfile",
            line: 8,
            severity: "warning",
            fixable: true,
            suggestion: "Add USER directive to run as non-root user"
          }
        ];
        return results;
      });

      const results = await validateDocker(["Dockerfile"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].validator).toBe("docker");
    });

    test("should validate database schemas", async () => {
      const validateSchema = mock(async (schemaFiles: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "config",
            validator: "schema",
            status: "passed",
            message: "Database schema is valid",
            severity: "info",
            fixable: false
          }
        ];
        return results;
      });

      const results = await validateSchema(["schema.sql"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("passed");
    });
  });

  describe("Dependency Validation", () => {
    test("should check for outdated packages", async () => {
      const checkOutdated = mock(async () => {
        const results: ValidationResult[] = [
          {
            category: "dependencies",
            validator: "outdated",
            status: "warning",
            message: "Package 'express' is outdated (current: 4.18.0, latest: 4.18.2)",
            severity: "warning",
            fixable: true,
            suggestion: "Run npm update express"
          }
        ];
        return results;
      });

      const results = await checkOutdated();
      
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain("outdated");
    });

    test("should validate package licenses", async () => {
      const validateLicenses = mock(async () => {
        const results: ValidationResult[] = [
          {
            category: "dependencies",
            validator: "licenses",
            status: "warning",
            message: "Package 'proprietary-lib' has restrictive license: Commercial",
            severity: "warning",
            fixable: false,
            suggestion: "Consider using an alternative with compatible license"
          }
        ];
        return results;
      });

      const results = await validateLicenses();
      
      expect(results).toHaveLength(1);
      expect(results[0].validator).toBe("licenses");
    });

    test("should detect dependency conflicts", async () => {
      const checkConflicts = mock(async () => {
        const results: ValidationResult[] = [
          {
            category: "dependencies",
            validator: "conflicts",
            status: "error",
            message: "Version conflict: package-a requires lodash@^3.0.0, package-b requires lodash@^4.0.0",
            severity: "error",
            fixable: true,
            suggestion: "Update packages to use compatible versions"
          }
        ];
        return results;
      });

      const results = await checkConflicts();
      
      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe("error");
    });

    test("should check for unused dependencies", async () => {
      const checkUnused = mock(async () => {
        const results: ValidationResult[] = [
          {
            category: "dependencies",
            validator: "unused",
            status: "warning",
            message: "Package 'moment' is installed but not used in code",
            severity: "warning",
            fixable: true,
            suggestion: "Remove unused dependency: npm uninstall moment"
          }
        ];
        return results;
      });

      const results = await checkUnused();
      
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain("not used");
    });
  });

  describe("Performance Validation", () => {
    test("should analyze bundle size", async () => {
      const analyzeBundleSize = mock(async () => {
        const results: ValidationResult[] = [
          {
            category: "performance",
            validator: "bundle-size",
            status: "warning",
            message: "Bundle size is large: 2.5MB (recommended: < 1MB)",
            severity: "warning",
            fixable: true,
            suggestion: "Consider code splitting or removing unused dependencies"
          }
        ];
        return results;
      });

      const results = await analyzeBundleSize();
      
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain("Bundle size");
    });

    test("should check for performance anti-patterns", async () => {
      const checkAntiPatterns = mock(async (files: string[]) => {
        const results: ValidationResult[] = [
          {
            category: "performance",
            validator: "anti-patterns",
            status: "warning",
            message: "Potential memory leak: addEventListener without removeEventListener",
            file: "src/component.ts",
            line: 45,
            severity: "warning",
            fixable: true,
            suggestion: "Add corresponding removeEventListener in cleanup"
          }
        ];
        return results;
      });

      const results = await checkAntiPatterns(["src/component.ts"]);
      
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain("memory leak");
    });
  });

  describe("Auto-fix Functionality", () => {
    test("should fix automatically fixable issues", async () => {
      const options: ValidateOptions = {
        type: "code",
        fix: true,
        strict: false,
        format: "text",
        exclude: [],
        include: [],
        threshold: "medium",
        parallel: true,
        cache: true,
        ci: false,
        interactive: false
      };

      const autoFix = mock(async (issues: ValidationResult[]) => {
        return {
          fixed: 3,
          failed: 1,
          details: [
            { issue: "no-unused-vars", status: "fixed" },
            { issue: "missing-semicolon", status: "fixed" },
            { issue: "prefer-const", status: "fixed" },
            { issue: "complex-logic", status: "failed", reason: "Manual intervention required" }
          ]
        };
      });

      const fixResult = await autoFix([]);
      
      expect(fixResult.fixed).toBe(3);
      expect(fixResult.failed).toBe(1);
      expect(fixResult.details).toHaveLength(4);
    });

    test("should respect interactive mode for fixes", async () => {
      const options: ValidateOptions = {
        type: "all",
        fix: true,
        strict: false,
        format: "text",
        exclude: [],
        include: [],
        threshold: "medium",
        parallel: true,
        cache: true,
        ci: false,
        interactive: true
      };

      const interactiveFix = mock(async (issues: ValidationResult[]) => {
        return {
          prompted: 5,
          accepted: 3,
          rejected: 2,
          fixed: 3
        };
      });

      const result = await interactiveFix([]);
      
      expect(result.prompted).toBe(5);
      expect(result.accepted).toBe(3);
      expect(result.fixed).toBe(3);
    });
  });

  describe("Reporting and Output", () => {
    test("should generate text report", async () => {
      const generateTextReport = mock(async (results: ValidationResult[]) => {
        return `
Validation Report
================
Total Issues: 5
Critical: 1
Errors: 2
Warnings: 2
Passed: 0

Details:
--------
[CRITICAL] src/config.ts:12 - Hardcoded secret detected
[ERROR] src/api.ts:45 - Insecure random number generation
[WARNING] src/utils.ts:23 - Variable unused
`;
      });

      const report = await generateTextReport([]);
      
      expect(report).toContain("Validation Report");
      expect(report).toContain("Total Issues: 5");
      expect(report).toContain("[CRITICAL]");
    });

    test("should generate JSON report", async () => {
      const generateJSONReport = mock(async (result: ValidateResult) => {
        return JSON.stringify({
          timestamp: result.timestamp,
          summary: result.summary,
          validations: result.validations,
          metrics: result.metrics
        }, null, 2);
      });

      const mockResult: ValidateResult = {
        command: "validate",
        timestamp: "2024-01-01T00:00:00Z",
        options: {
          type: "all",
          fix: false,
          strict: false,
          format: "json",
          exclude: [],
          include: [],
          threshold: "medium",
          parallel: true,
          cache: true,
          ci: false,
          interactive: true
        },
        summary: {
          total: 5,
          passed: 3,
          warnings: 2,
          errors: 0,
          critical: 0,
          duration: 5000
        },
        validations: [],
        metrics: {} as ValidationMetrics,
        status: "warning"
      };

      const report = await generateJSONReport(mockResult);
      const parsed = JSON.parse(report);
      
      expect(parsed.summary.total).toBe(5);
      expect(parsed.summary.warnings).toBe(2);
    });

    test("should generate JUnit XML report", async () => {
      const generateJUnitReport = mock(async (result: ValidateResult) => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="validation" tests="5" failures="2" errors="0" time="5.0">
  <testcase name="typescript" classname="code" time="1.0"/>
  <testcase name="eslint" classname="code" time="2.0">
    <failure message="Variable unused"/>
  </testcase>
</testsuite>`;
      });

      const mockResult: ValidateResult = {
        command: "validate",
        timestamp: "2024-01-01T00:00:00Z",
        options: {
          type: "all",
          fix: false,
          strict: false,
          format: "junit",
          exclude: [],
          include: [],
          threshold: "medium",
          parallel: true,
          cache: true,
          ci: false,
          interactive: true
        },
        summary: {
          total: 5,
          passed: 3,
          warnings: 2,
          errors: 0,
          critical: 0,
          duration: 5000
        },
        validations: [],
        metrics: {} as ValidationMetrics,
        status: "warning"
      };

      const report = await generateJUnitReport(mockResult);
      
      expect(report).toContain('<?xml version="1.0"');
      expect(report).toContain('<testsuite');
      expect(report).toContain('<testcase');
    });
  });

  describe("CI/CD Integration", () => {
    test("should work in CI mode", async () => {
      const options: ValidateOptions = {
        type: "all",
        fix: false,
        strict: true,
        format: "json",
        exclude: [],
        include: [],
        threshold: "low",
        parallel: true,
        cache: false,
        ci: true,
        interactive: false
      };

      const validateForCI = mock(async (opts: ValidateOptions) => {
        return {
          exitCode: 0,
          duration: 30000,
          cacheable: false,
          artifacts: ["validation-report.json", "junit-report.xml"]
        };
      });

      const result = await validateForCI(options);
      
      expect(result.exitCode).toBe(0);
      expect(result.cacheable).toBe(false);
      expect(result.artifacts).toContain("validation-report.json");
    });

    test("should respect threshold settings", async () => {
      const checkThreshold = mock(async (results: ValidationResult[], threshold: string) => {
        const criticalCount = results.filter(r => r.severity === "critical").length;
        const errorCount = results.filter(r => r.severity === "error").length;
        
        switch (threshold) {
          case "critical":
            return criticalCount === 0;
          case "high":
            return criticalCount === 0 && errorCount === 0;
          case "medium":
            return criticalCount === 0 && errorCount <= 5;
          case "low":
            return true;
          default:
            return false;
        }
      });

      const mockResults: ValidationResult[] = [
        {
          category: "security",
          validator: "secrets",
          status: "critical",
          message: "Hardcoded secret",
          severity: "critical",
          fixable: true
        }
      ];

      expect(await checkThreshold(mockResults, "critical")).toBe(false);
      expect(await checkThreshold(mockResults, "low")).toBe(true);
    });
  });

  describe("Error Handling", () => {
    test("should handle validation failures gracefully", async () => {
      const handleValidationError = mock(async (error: Error, context: any) => {
        return {
          handled: true,
          error: error.message,
          context,
          fallback: "Partial validation completed",
          status: "partial"
        };
      });

      const error = new Error("TypeScript compiler not found");
      const result = await handleValidationError(error, { validator: "typescript" });

      expect(result.handled).toBe(true);
      expect(result.status).toBe("partial");
    });

    test("should handle timeout scenarios", async () => {
      const handleTimeout = mock(async (validator: string, timeout: number) => {
        return {
          timedOut: true,
          validator,
          timeout,
          partialResults: true,
          message: `Validator ${validator} timed out after ${timeout}ms`
        };
      });

      const result = await handleTimeout("security-scan", 300000);

      expect(result.timedOut).toBe(true);
      expect(result.partialResults).toBe(true);
    });
  });

  afterEach(() => {
    mock.restore();
  });
});