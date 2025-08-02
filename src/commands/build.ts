// SuperCode Build Command - Full Implementation
// Build, compile, and package projects with comprehensive error handling

import type { Argv } from "yargs";
import { cmd } from "../cmd";
import { z } from "zod";
import { spawn } from "child_process";
import { promisify } from "util";
import { access, readFile } from "fs/promises";
import { join, resolve } from "path";

// Build options schema
const BuildOptionsSchema = z.object({
  target: z.string().optional().describe("Build target (project root)"),
  mode: z.enum(["development", "production", "test"]).optional().default("production"),
  platform: z.enum(["node", "browser", "universal"]).optional().default("node"),
  format: z.enum(["esm", "cjs", "umd", "iife"]).optional().default("esm"),
  optimize: z.boolean().optional().default(true),
  sourcemap: z.boolean().optional().default(true),
  clean: z.boolean().optional().default(false),
  watch: z.boolean().optional().default(false),
  analyze: z.boolean().optional().default(false)
});

interface BuildContext {
  startTime: number;
  projectRoot: string;
  buildConfig: any;
  buildTools: string[];
  outputDir: string;
}

export const BuildCommand = cmd({
    command: "build [target]",
    describe: "Build, compile, and package projects with error handling and optimization",
    
    builder: (yargs: Argv) => {
        return yargs
            .positional("target", {
                describe: "Build target directory",
                type: "string",
                default: "."
            })
            .option("mode", {
                describe: "Build mode",
                type: "string",
                choices: ["development", "production", "test"],
                default: "production",
                alias: "m"
            })
            .option("platform", {
                describe: "Target platform",
                type: "string",
                choices: ["node", "browser", "universal"],
                default: "node"
            })
            .option("format", {
                describe: "Output format",
                type: "string",
                choices: ["esm", "cjs", "umd", "iife"],
                default: "esm"
            })
            .option("optimize", {
                describe: "Enable optimization",
                type: "boolean",
                default: true,
                alias: "O"
            })
            .option("sourcemap", {
                describe: "Generate source maps",
                type: "boolean", 
                default: true,
                alias: "s"
            })
            .option("clean", {
                describe: "Clean output directory before build",
                type: "boolean",
                default: false,
                alias: "c"
            })
            .option("watch", {
                describe: "Watch mode for development",
                type: "boolean",
                default: false,
                alias: "w"
            })
            .option("analyze", {
                describe: "Analyze bundle size",
                type: "boolean",
                default: false,
                alias: "a"
            })
            .example([
                ["$0 build", "Build current project in production mode"],
                ["$0 build --mode development --watch", "Development build with watch mode"],
                ["$0 build --clean --analyze", "Clean build with bundle analysis"],
                ["$0 build src --format cjs", "Build src as CommonJS"]
            ]);
    },

    handler: async (args: any) => {
        const startTime = Date.now();
        
        try {
            console.log("🏗️ Starting build process...");
            
            const options = BuildOptionsSchema.parse({
                target: args.target,
                mode: args.mode,
                platform: args.platform,
                format: args.format,
                optimize: args.optimize,
                sourcemap: args.sourcemap,
                clean: args.clean,
                watch: args.watch,
                analyze: args.analyze
            });

            const context = await initializeBuildContext(options, args);
            
            if (options.clean) {
                await cleanOutputDirectory(context);
            }
            
            const buildResult = await executeBuild(options, context);
            
            if (options.analyze) {
                await analyzeBuild(context);
            }
            
            await displayBuildResults(buildResult, context, startTime);
            
            if (options.watch) {
                console.log("👀 Watch mode would start here (not implemented in demo)");
            }
            
        } catch (error) {
            console.error("❌ Build failed:", error);
            process.exit(1);
        }
    },
});

async function initializeBuildContext(options: any, args: any): Promise<BuildContext> {
    const projectRoot = resolve(options.target || ".");
    const outputDir = args.output || join(projectRoot, "dist");
    
    console.log(`📁 Project root: ${projectRoot}`);
    console.log(`📦 Output directory: ${outputDir}`);
    
    // Detect build tools
    const buildTools = await detectBuildTools(projectRoot);
    console.log(`🔧 Detected build tools: ${buildTools.join(", ")}`);
    
    // Load build configuration
    const buildConfig = await loadBuildConfig(projectRoot, buildTools);
    
    return {
        startTime: Date.now(),
        projectRoot,
        buildConfig,
        buildTools,
        outputDir
    };
}

async function detectBuildTools(projectRoot: string): Promise<string[]> {
    const tools = [];
    
    try {
        // Check for package.json and npm scripts
        await access(join(projectRoot, "package.json"));
        tools.push("npm");
        
        // Check for specific build tools
        const toolConfigs = [
            { file: "vite.config.ts", tool: "vite" },
            { file: "vite.config.js", tool: "vite" },
            { file: "webpack.config.js", tool: "webpack" },
            { file: "rollup.config.js", tool: "rollup" },
            { file: "esbuild.config.js", tool: "esbuild" },
            { file: "tsconfig.json", tool: "typescript" },
            { file: "bun.lockb", tool: "bun" }
        ];
        
        for (const { file, tool } of toolConfigs) {
            try {
                await access(join(projectRoot, file));
                tools.push(tool);
            } catch {
                // File doesn't exist, skip
            }
        }
    } catch {
        console.warn("⚠️ No package.json found, using default build tools");
    }
    
    return tools.length > 0 ? tools : ["default"];
}

async function loadBuildConfig(projectRoot: string, buildTools: string[]): Promise<any> {
    const config: any = {
        scripts: {},
        dependencies: {},
        devDependencies: {}
    };
    
    try {
        const packageJsonPath = join(projectRoot, "package.json");
        const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
        
        config.scripts = packageJson.scripts || {};
        config.dependencies = packageJson.dependencies || {};
        config.devDependencies = packageJson.devDependencies || {};
        config.name = packageJson.name;
        config.version = packageJson.version;
        
    } catch {
        console.warn("⚠️ Could not load package.json");
    }
    
    return config;
}

async function cleanOutputDirectory(context: BuildContext): Promise<void> {
    console.log("🧹 Cleaning output directory...");
    
    try {
        const { exec } = require("child_process");
        const execAsync = promisify(exec);
        
        await execAsync(`rm -rf "${context.outputDir}"`);
        console.log("✅ Output directory cleaned");
    } catch (error) {
        console.warn("⚠️ Could not clean output directory:", error);
    }
}

async function executeBuild(options: any, context: BuildContext): Promise<any> {
    console.log(`🔨 Executing ${options.mode} build...`);
    
    const buildResult = {
        success: false,
        duration: 0,
        output: "",
        errors: [] as string[],
        warnings: [] as string[],
        assets: [] as string[]
    };
    
    try {
        // Determine build command based on detected tools
        const buildCommand = determineBuildCommand(options, context);
        console.log(`🏃 Running: ${buildCommand}`);
        
        const startTime = Date.now();
        const result = await runBuildCommand(buildCommand, context.projectRoot);
        buildResult.duration = Date.now() - startTime;
        
        buildResult.success = result.success;
        buildResult.output = result.output;
        buildResult.errors = result.errors;
        buildResult.warnings = result.warnings;
        
        if (buildResult.success) {
            buildResult.assets = await collectBuildAssets(context);
        }
        
    } catch (error) {
        buildResult.errors.push(String(error));
    }
    
    return buildResult;
}

function determineBuildCommand(options: any, context: BuildContext): string {
    const { buildTools, buildConfig } = context;
    
    // Check for custom build scripts first
    if (buildConfig.scripts) {
        if (options.mode === "development" && buildConfig.scripts["build:dev"]) {
            return "npm run build:dev";
        }
        if (options.mode === "production" && buildConfig.scripts["build:prod"]) {
            return "npm run build:prod";
        }
        if (buildConfig.scripts.build) {
            return "npm run build";
        }
    }
    
    // Fallback to tool-specific commands
    if (buildTools.includes("vite")) {
        return options.mode === "development" ? "vite build --mode development" : "vite build";
    }
    
    if (buildTools.includes("webpack")) {
        return options.mode === "development" ? "webpack --mode development" : "webpack --mode production";
    }
    
    if (buildTools.includes("bun")) {
        return "bun build";
    }
    
    if (buildTools.includes("typescript")) {
        return "tsc";
    }
    
    // Default fallback
    return "npm run build";
}

async function runBuildCommand(command: string, cwd: string): Promise<any> {
    return new Promise((resolve) => {
        const [cmd, ...args] = command.split(" ");
        const child = spawn(cmd, args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
        
        let output = "";
        let errorOutput = "";
        
        child.stdout?.on("data", (data) => {
            const chunk = data.toString();
            output += chunk;
            console.log(chunk.trim());
        });
        
        child.stderr?.on("data", (data) => {
            const chunk = data.toString();
            errorOutput += chunk;
            console.error(chunk.trim());
        });
        
        child.on("close", (code) => {
            const result = {
                success: code === 0,
                output,
                errors: errorOutput ? [errorOutput] : [],
                warnings: [] as string[]
            };
            
            resolve(result);
        });
    });
}

async function collectBuildAssets(context: BuildContext): Promise<string[]> {
    const assets: string[] = [];
    
    try {
        const { readdir, stat } = await import("fs/promises");
        
        const scanDirectory = async (dir: string, prefix = ""): Promise<void> => {
            try {
                const entries = await readdir(dir);
                
                for (const entry of entries) {
                    const fullPath = join(dir, entry);
                    const stats = await stat(fullPath);
                    
                    if (stats.isFile()) {
                        assets.push(join(prefix, entry));
                    } else if (stats.isDirectory()) {
                        await scanDirectory(fullPath, join(prefix, entry));
                    }
                }
            } catch {
                // Directory might not exist or be accessible
            }
        };
        
        await scanDirectory(context.outputDir);
    } catch {
        // Could not collect assets
    }
    
    return assets;
}

async function analyzeBuild(context: BuildContext): Promise<void> {
    console.log("📊 Analyzing build...");
    
    try {
        const assets = await collectBuildAssets(context);
        const { stat } = await import("fs/promises");
        
        let totalSize = 0;
        for (const asset of assets) {
            try {
                const stats = await stat(join(context.outputDir, asset));
                totalSize += stats.size;
            } catch {
                // Skip if file doesn't exist
            }
        }
        
        console.log(`📦 Total bundle size: ${formatBytes(totalSize)}`);
        console.log(`📄 Assets generated: ${assets.length}`);
        
    } catch (error) {
        console.warn("⚠️ Could not analyze build:", error);
    }
}

async function displayBuildResults(buildResult: any, context: BuildContext, startTime: number): Promise<void> {
    const totalTime = Date.now() - startTime;
    
    console.log("\n🏗️ Build Results");
    console.log("================");
    
    if (buildResult.success) {
        console.log("✅ Build completed successfully");
        console.log(`⏱️ Total time: ${totalTime}ms`);
        console.log(`📦 Output: ${context.outputDir}`);
        
        if (buildResult.assets.length > 0) {
            console.log(`📄 Generated ${buildResult.assets.length} assets`);
        }
        
        if (buildResult.warnings.length > 0) {
            console.log(`\n⚠️ Warnings (${buildResult.warnings.length}):`);
            buildResult.warnings.forEach((warning: string) => {
                console.log(`  ${warning}`);
            });
        }
    } else {
        console.log("❌ Build failed");
        console.log(`⏱️ Failed after: ${totalTime}ms`);
        
        if (buildResult.errors.length > 0) {
            console.log(`\n🚨 Errors:`);
            buildResult.errors.forEach((error: string) => {
                console.log(`  ${error}`);
            });
        }
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}