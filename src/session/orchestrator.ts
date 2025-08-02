// /Users/rob/Development/SuperCode/SuperCode/src/session/orchestrator.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { domainKeywords, intentKeywords } from './detection-patterns';
import { CommandParser, ParsedCommand } from '../tool/command-parser';
import { FlagResolver, ResolvedFlags } from '../tool/flag-resolver';

interface Persona {
    id: string;
    name: string;
    description: string;
    system_prompt: string;
}

interface ExecutionContext {
    command: string;
    parsedCommand: ParsedCommand;
    resolvedFlags: ResolvedFlags;
    persona?: Persona;
    userInput: string;
    sessionId?: string;
    startTime: number;
}

interface ExecutionUpdate {
    type: 'start' | 'progress' | 'update' | 'warning' | 'error' | 'complete';
    message: string;
    timestamp: number;
    data?: any;
    progress?: number; // 0-100
}

interface ExecutionResult {
    success: boolean;
    result: any;
    executionTime: number;
    updates: ExecutionUpdate[];
    warnings: string[];
    errors: string[];
}

export class Orchestrator {
    private static instance: Orchestrator;
    private personas: Record<string, Persona> = {};
    private sessionState: Map<string, any> = new Map();
    private activeExecutions: Map<string, ExecutionContext> = new Map();

    private constructor() {
        this.loadPersonas();
    }

    public static getInstance(): Orchestrator {
        if (!Orchestrator.instance) {
            Orchestrator.instance = new Orchestrator();
        }
        return Orchestrator.instance;
    }

    private async loadPersonas(): Promise<void> {
        try {
            const personasPath = path.join(import.meta.dir, '../personas.json');
            const fileContent = await fs.readFile(personasPath, 'utf-8');
            this.personas = JSON.parse(fileContent);
            console.log(`✅ ${Object.keys(this.personas).length} personas loaded successfully.`);
        } catch (error) {
            console.error('🔴 FATAL: Could not load personas.json.', error);
        }
    }

    public detectDomain(userInput: string): string | null {
        const scores: Record<string, number> = {};
        const words = userInput.toLowerCase().split(/\s+/);

        for (const domain in domainKeywords) {
            scores[domain] = 0;
            for (const keyword of domainKeywords[domain as keyof typeof domainKeywords]) {
                if (words.includes(keyword)) {
                    scores[domain]++;
                }
            }
        }

        let bestDomain: string | null = null;
        let maxScore = 0;
        for (const domain in scores) {
            if (scores[domain] > maxScore) {
                maxScore = scores[domain];
                bestDomain = domain;
            }
        }

        return bestDomain;
    }

    public detectIntent(userInput: string): string | null {
        const scores: Record<string, number> = {};
        const words = userInput.toLowerCase().split(/\s+/);

        for (const intent in intentKeywords) {
            scores[intent] = 0;
            for (const keyword of intentKeywords[intent as keyof typeof intentKeywords]) {
                if (words.includes(keyword)) {
                    scores[intent]++;
                }
            }
        }

        let bestIntent: string | null = null;
        let maxScore = 0;
        for (const intent in scores) {
            if (scores[intent] > maxScore) {
                maxScore = scores[intent];
                bestIntent = intent;
            }
        }

        return bestIntent;
    }

public detectPersona(userInput: string): string | null {
        const domain = this.detectDomain(userInput);
        const intent = this.detectIntent(userInput);

        // Architect has priority for design tasks
        if (userInput.includes("design") || userInput.includes("architecture")) {
            return "architect";
        }

        // Specific intent/domain combinations
        if (intent === "creation" && domain === "frontend") return "frontend";
        if (intent === "creation" && domain === "backend") return "backend";
        
        // Domain-first mapping
        if (domain === "security") return "security";
        if (domain === "infrastructure") return "devops";
        if (domain === "documentation") return "scribe";

        // Intent-based mapping
        if (intent === "analysis" || intent === "debugging") return "analyzer";
        if (intent === "modification") return "refactorer";
        
        // General purpose fallback
        return "analyzer";
    }

    /**
     * Execute SuperClaude command with streaming support
     */
    public async* executeSuperClaudeCommand(props: { 
        command: string; 
        args: string[]; 
        userInput: string;
        sessionId?: string;
    }): AsyncGenerator<ExecutionUpdate, ExecutionResult, unknown> {
        const startTime = Date.now();
        const executionId = `exec_${startTime}_${Math.random().toString(36).substr(2, 9)}`;
        const updates: ExecutionUpdate[] = [];
        const warnings: string[] = [];
        const errors: string[] = [];

        try {
            // Step 1: Parse command and arguments
            yield this.createUpdate('start', `Starting SuperClaude command: ${props.command}`);
            
            const commandString = `${props.command} ${props.args.join(' ')}`;
            const parsedCommand = CommandParser.parse(commandString);
            
            // Step 2: Validate command
            if (!CommandParser.validateCommand(parsedCommand.command)) {
                const error = `Unknown command: ${parsedCommand.command}`;
                errors.push(error);
                yield this.createUpdate('error', error);
                return this.createResult(false, null, startTime, updates, warnings, errors);
            }

            // Step 3: Resolve and validate flags
            yield this.createUpdate('progress', 'Resolving command flags...', 10);
            
            const flagResult = FlagResolver.resolve(parsedCommand.command, parsedCommand.flags);
            if (!flagResult.valid) {
                for (const error of flagResult.errors) {
                    errors.push(error);
                    yield this.createUpdate('error', error);
                }
                return this.createResult(false, null, startTime, updates, warnings, errors);
            }

            // Add warnings from flag resolution
            for (const warning of flagResult.warnings) {
                warnings.push(warning);
                yield this.createUpdate('warning', warning);
            }

            // Step 4: Detect persona (allow override from flags)
            yield this.createUpdate('progress', 'Detecting optimal persona...', 20);
            
            const personaId = (flagResult.resolved.persona as string) || this.detectPersona(props.userInput);
            const persona = personaId ? this.personas[personaId] : null;
            
            if (persona) {
                yield this.createUpdate('update', `Selected persona: ${persona.name} (${persona.id})`);
            } else {
                warnings.push('No specific persona selected, using default approach');
                yield this.createUpdate('warning', 'No specific persona selected, using default approach');
            }

            // Step 5: Create execution context
            const context: ExecutionContext = {
                command: parsedCommand.command,
                parsedCommand,
                resolvedFlags: flagResult.resolved,
                persona,
                userInput: props.userInput,
                sessionId: props.sessionId,
                startTime
            };

            this.activeExecutions.set(executionId, context);

            // Step 6: Check for help flag
            if (flagResult.resolved.help) {
                const helpText = FlagResolver.getHelp(parsedCommand.command);
                yield this.createUpdate('complete', 'Help displayed');
                return this.createResult(true, { help: helpText }, startTime, updates, warnings, errors);
            }

            // Step 7: Execute command with streaming
            yield this.createUpdate('progress', `Executing ${parsedCommand.command} command...`, 30);
            
            const commandResult = yield* this.executeCommandWithStreaming(context);
            
            // Step 8: Cleanup and return result
            this.activeExecutions.delete(executionId);
            yield this.createUpdate('complete', `Command ${parsedCommand.command} completed successfully`);
            
            return this.createResult(
                commandResult.success, 
                commandResult.result, 
                startTime, 
                [...updates, ...commandResult.updates], 
                [...warnings, ...commandResult.warnings], 
                [...errors, ...commandResult.errors]
            );

        } catch (error: any) {
            this.activeExecutions.delete(executionId);
            const errorMessage = `Unexpected error executing command: ${error.message}`;
            errors.push(errorMessage);
            yield this.createUpdate('error', errorMessage);
            
            return this.createResult(false, null, startTime, updates, warnings, errors);
        }
    }

    /**
     * Execute command with streaming updates
     */
    private async* executeCommandWithStreaming(context: ExecutionContext): AsyncGenerator<ExecutionUpdate, ExecutionResult, unknown> {
        const { command, parsedCommand, resolvedFlags } = context;
        const updates: ExecutionUpdate[] = [];
        const warnings: string[] = [];
        const errors: string[] = [];

        try {
            // Check for dry-run mode
            if (resolvedFlags['dry-run']) {
                yield this.createUpdate('update', 'DRY RUN MODE: Showing what would be executed without making changes');
                const dryRunResult = await this.simulateCommandExecution(context);
                return this.createResult(true, dryRunResult, 0, updates, warnings, errors);
            }

            // Load and execute command module
            const commandModule = await import(`../commands/${command}.ts`);
            const commandKey = Object.keys(commandModule).find(key => key.endsWith('Command'));
            
            if (!commandKey || !commandModule[commandKey] || typeof commandModule[commandKey].handler !== 'function') {
                throw new Error(`Command handler for '${command}' not found or invalid.`);
            }

            yield this.createUpdate('progress', `Executing command handler...`, 50);

            // Execute command with persona context
            const commandArgs = {
                ...parsedCommand,
                flags: resolvedFlags,
                persona: context.persona,
                sessionId: context.sessionId
            };

            // Stream command execution
            const result = await commandModule[commandKey].handler(commandArgs);
            
            yield this.createUpdate('progress', 'Command execution completed', 90);

            return this.createResult(true, result, 0, updates, warnings, errors);

        } catch (error: any) {
            const errorMessage = `Command execution failed: ${error.message}`;
            errors.push(errorMessage);
            yield this.createUpdate('error', errorMessage);
            
            return this.createResult(false, null, 0, updates, warnings, errors);
        }
    }

    /**
     * Simulate command execution for dry-run mode
     */
    private async simulateCommandExecution(context: ExecutionContext): Promise<any> {
        const { command, parsedCommand, resolvedFlags } = context;
        
        return {
            type: 'dry-run',
            command,
            target: parsedCommand.target,
            args: parsedCommand.args,
            flags: resolvedFlags,
            persona: context.persona?.name,
            description: `Would execute ${command} command with the specified parameters`
        };
    }

    /**
     * Create execution update
     */
    private createUpdate(
        type: ExecutionUpdate['type'], 
        message: string, 
        progress?: number, 
        data?: any
    ): ExecutionUpdate {
        return {
            type,
            message,
            timestamp: Date.now(),
            progress,
            data
        };
    }

    /**
     * Create execution result
     */
    private createResult(
        success: boolean,
        result: any,
        startTime: number,
        updates: ExecutionUpdate[],
        warnings: string[],
        errors: string[]
    ): ExecutionResult {
        return {
            success,
            result,
            executionTime: Date.now() - startTime,
            updates,
            warnings,
            errors
        };
    }

    /**
     * Legacy method for backwards compatibility
     */
    public async executeSuperClaudeCommandLegacy(props: { command: string, args: any, userInput: string }): Promise<{ updates: any[], result: any }> {
        const updates = [];
        let result;
        
        try {
            const commandArgs = Array.isArray(props.args) ? props.args : [props.args].filter(Boolean);
            const generator = this.executeSuperClaudeCommand({
                command: props.command,
                args: commandArgs,
                userInput: props.userInput
            });

            for await (const update of generator) {
                if ('type' in update && update.type !== 'complete') {
                    updates.push(update);
                } else {
                    result = update;
                    break;
                }
            }

            return { updates, result };
        } catch (error: any) {
            const errorUpdate = { type: "error", message: `Error executing command '${props.command}': ${error.message}` };
            updates.push(errorUpdate);
            result = { type: "result", result: "Command execution failed." };
            return { updates, result };
        }
    }
}
