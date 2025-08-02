// /Users/rob/Development/SuperCode/SuperCode/src/tool/superclaude.ts
import { z } from "zod";
import { Tool } from "./tool";
import type { IOrchestrator } from "../session/interfaces";
import { CommandParser } from "./command-parser";
import { FlagResolver } from "./flag-resolver";
import { ResponseFormatter, formatStreamingUpdate } from "./response-formatter";
import { SessionManager } from "./session-manager";

/**
 * Zod schema for SuperClaude tool arguments
 */
const SuperClaudeArgs = z.object({
    command: z.string()
        .min(1, "Command cannot be empty")
        .describe("The SuperClaude command to execute (e.g., 'analyze', 'build', 'implement')"),
    args: z.array(z.string())
        .default([])
        .describe("A list of arguments and flags for the command"),
    userInput: z.string()
        .optional()
        .describe("Original user input for context and persona detection"),
    sessionId: z.string()
        .optional()
        .describe("Session identifier for context persistence"),
    options: z.object({
        streaming: z.boolean().default(true).describe("Enable streaming responses"),
        validateOnly: z.boolean().default(false).describe("Only validate command without executing"),
        timeout: z.number().min(1000).max(300000).default(60000).describe("Execution timeout in milliseconds"),
        maxRetries: z.number().min(0).max(5).default(1).describe("Maximum retry attempts on failure")
    }).default({}).describe("Execution options")
});

type SuperClaudeProps = z.infer<typeof SuperClaudeArgs>;

/**
 * Response formatting based on flags
 */
interface FormattedResponse {
    type: 'success' | 'error' | 'help' | 'dry-run';
    command: string;
    result: any;
    executionTime?: number;
    warnings?: string[];
    errors?: string[];
    metadata?: {
        persona?: string;
        flags?: Record<string, any>;
        sessionId?: string;
    };
}

/**
 * SuperClaude tool execution function with comprehensive error handling
 */
async function* run(props: SuperClaudeProps): AsyncGenerator<any, any, any> {
    const startTime = Date.now();
    let orchestrator: IOrchestrator;
    let sessionManager: SessionManager;
    let retryCount = 0;
    const maxRetries = props.options?.maxRetries ?? 1;
    let sessionId = props.sessionId;
    let parsedCommand: any;
    let resolvedFlags: any;

    try {
        // Initialize components
        const { Orchestrator } = await import("../session/orchestrator");
        orchestrator = Orchestrator.getInstance();
        sessionManager = SessionManager.getInstance();

        // Create session if not provided
        if (!sessionId) {
            sessionId = sessionManager.createSession(undefined, process.cwd());
        }

        // Input validation and sanitization
        const validatedProps = await validateAndSanitizeInput({ ...props, sessionId });
        
        // Parse command and resolve flags early for session integration
        const commandString = `${validatedProps.command} ${validatedProps.args.join(' ')}`;
        parsedCommand = CommandParser.parse(commandString);
        const flagResult = FlagResolver.resolve(parsedCommand.command, parsedCommand.flags);
        
        if (!flagResult.valid) {
            for (const error of flagResult.errors) {
                yield {
                    type: "error",
                    message: error,
                    timestamp: Date.now()
                };
            }
            return formatResponse('error', validatedProps.command, { errors: flagResult.errors }, startTime);
        }

        resolvedFlags = flagResult.resolved;
        
        // Yield initial status with proper formatting
        const initialMessage = formatStreamingUpdate({
            type: "start",
            message: `Initializing SuperClaude command: ${validatedProps.command}`,
            timestamp: Date.now()
        }, resolvedFlags);

        if (initialMessage) {
            yield {
                type: "start",
                message: initialMessage,
                timestamp: Date.now(),
                metadata: {
                    command: validatedProps.command,
                    args: validatedProps.args,
                    sessionId: validatedProps.sessionId
                }
            };
        }

        // Check cache if enabled
        if (resolvedFlags.cache) {
            const cacheKey = SessionManager.generateCacheKey(
                parsedCommand.command, 
                parsedCommand.args, 
                resolvedFlags
            );
            const cachedResult = sessionManager.getCachedResult(sessionId, cacheKey);
            
            if (cachedResult && Date.now() - cachedResult.timestamp < cachedResult.ttl) {
                yield {
                    type: "update",
                    message: formatStreamingUpdate({
                        type: "update",
                        message: "Using cached result",
                        timestamp: Date.now()
                    }, resolvedFlags),
                    timestamp: Date.now()
                };
                
                return formatResponseWithFormatting(
                    'success', 
                    validatedProps.command, 
                    cachedResult.result, 
                    startTime,
                    resolvedFlags,
                    sessionId,
                    flagResult.warnings
                );
            }
        }

        // Validation-only mode
        if (validatedProps.options.validateOnly) {
            const validationResult = await validateCommand(validatedProps);
            return formatResponseWithFormatting(
                'success', 
                validatedProps.command, 
                validationResult, 
                startTime,
                resolvedFlags,
                sessionId
            );
        }

        // Get persona suggestion from session history
        const suggestedPersona = sessionManager.getPersonaSuggestion(sessionId, parsedCommand.command);
        if (suggestedPersona && !resolvedFlags.persona) {
            resolvedFlags.persona = suggestedPersona;
            yield {
                type: "update",
                message: formatStreamingUpdate({
                    type: "update",
                    message: `Using previously successful persona: ${suggestedPersona}`,
                    timestamp: Date.now()
                }, resolvedFlags),
                timestamp: Date.now()
            };
        }

        let executionResult: any;

        // Execute with retry logic
        while (retryCount <= maxRetries) {
            try {
                // Execute command with timeout
                executionResult = await executeWithTimeout(
                    orchestrator,
                    validatedProps,
                    validatedProps.options.timeout
                );

                // Stream results if enabled
                if (validatedProps.options.streaming) {
                    yield* streamResultsWithFormatting(executionResult, resolvedFlags);
                }

                break; // Success, exit retry loop

            } catch (error) {
                retryCount++;
                
                if (retryCount <= maxRetries && isRetryableError(error)) {
                    const retryMessage = formatStreamingUpdate({
                        type: "warning",
                        message: `Attempt ${retryCount} failed, retrying... (${error instanceof Error ? error.message : 'Unknown error'})`,
                        timestamp: Date.now()
                    }, resolvedFlags);

                    if (retryMessage) {
                        yield {
                            type: "warning",
                            message: retryMessage,
                            timestamp: Date.now()
                        };
                    }
                    
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                    continue;
                } else {
                    throw error;
                }
            }
        }

        // Update session with execution results
        const persona = executionResult?.result?.persona || resolvedFlags.persona;
        sessionManager.updateSessionWithExecution(
            sessionId,
            parsedCommand,
            resolvedFlags,
            persona,
            Date.now() - startTime,
            executionResult?.result?.success !== false,
            executionResult?.result?.errors || [],
            [...(flagResult.warnings || []), ...(executionResult?.result?.warnings || [])]
        );

        // Cache result if enabled and successful
        if (resolvedFlags.cache && executionResult?.result?.success !== false) {
            const cacheKey = SessionManager.generateCacheKey(
                parsedCommand.command, 
                parsedCommand.args, 
                resolvedFlags
            );
            sessionManager.setCachedResult(sessionId, cacheKey, executionResult.result);
        }

        return formatResponseWithFormatting(
            'success', 
            validatedProps.command, 
            executionResult.result, 
            startTime,
            resolvedFlags,
            sessionId,
            [...(flagResult.warnings || []), ...(executionResult?.result?.warnings || [])],
            executionResult?.result?.errors || []
        );

    } catch (error: any) {
        // Update session with error
        if (sessionId && parsedCommand && resolvedFlags) {
            sessionManager.updateSessionWithExecution(
                sessionId,
                parsedCommand,
                resolvedFlags,
                resolvedFlags.persona as string,
                Date.now() - startTime,
                false,
                [error.message],
                []
            );
        }

        // Comprehensive error handling
        const errorDetails = processError(error, props.command);
        
        const errorMessage = resolvedFlags ? formatStreamingUpdate({
            type: "error",
            message: errorDetails.message,
            timestamp: Date.now()
        }, resolvedFlags) : errorDetails.message;

        if (errorMessage) {
            yield {
                type: "error",
                message: errorMessage,
                timestamp: Date.now(),
                data: errorDetails.data
            };
        }

        return formatResponseWithFormatting(
            'error', 
            props.command, 
            errorDetails, 
            startTime,
            resolvedFlags || {},
            sessionId,
            [],
            [errorDetails.message]
        );
    }
}

/**
 * Validate and sanitize input parameters
 */
async function validateAndSanitizeInput(props: SuperClaudeProps): Promise<SuperClaudeProps> {
    try {
        // Validate with Zod schema
        const validated = SuperClaudeArgs.parse(props);
        
        // Additional command validation
        if (!CommandParser.validateCommand(validated.command)) {
            throw new Error(`Invalid command: ${validated.command}. Use 'help' to see available commands.`);
        }

        // Sanitize arguments (remove potentially harmful inputs)
        const sanitizedArgs = validated.args.map(arg => sanitizeArg(arg));

        return {
            ...validated,
            args: sanitizedArgs,
            userInput: validated.userInput || `${validated.command} ${sanitizedArgs.join(' ')}`
        };

    } catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
            throw new Error(`Input validation failed: ${messages.join(', ')}`);
        }
        throw error;
    }
}

/**
 * Validate command without execution
 */
async function validateCommand(props: SuperClaudeProps): Promise<any> {
    const commandString = `${props.command} ${props.args.join(' ')}`;
    const parsedCommand = CommandParser.parse(commandString);
    const flagResult = FlagResolver.resolve(parsedCommand.command, parsedCommand.flags);

    return {
        valid: flagResult.valid,
        parsedCommand,
        flagResult,
        help: flagResult.valid ? null : FlagResolver.getHelp(parsedCommand.command)
    };
}

/**
 * Execute command with timeout
 */
async function executeWithTimeout(
    orchestrator: IOrchestrator,
    props: SuperClaudeProps,
    timeout: number
): Promise<any> {
    return new Promise(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`Command execution timed out after ${timeout}ms`));
        }, timeout);

        try {
            const generator = orchestrator.executeSuperClaudeCommand({
                command: props.command,
                args: props.args,
                userInput: props.userInput!,
                sessionId: props.sessionId
            });

            let result;
            const updates = [];

            for await (const update of generator) {
                if ('success' in update) {
                    result = update;
                    break;
                } else {
                    updates.push(update);
                }
            }

            clearTimeout(timeoutId);
            resolve({ result, updates });
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        }
    });
}

/**
 * Stream execution results with formatting
 */
async function* streamResultsWithFormatting(executionResult: any, flags: any): AsyncGenerator<any, void, unknown> {
    if (executionResult.updates) {
        for (const update of executionResult.updates) {
            const formattedMessage = formatStreamingUpdate(update, flags);
            if (formattedMessage) {
                yield {
                    type: update.type || "update",
                    message: formattedMessage,
                    timestamp: update.timestamp || Date.now(),
                    progress: update.progress,
                    data: update.data
                };
            }
        }
    }
}

/**
 * Stream execution results (legacy)
 */
async function* streamResults(executionResult: any): AsyncGenerator<any, void, unknown> {
    if (executionResult.updates) {
        for (const update of executionResult.updates) {
            yield {
                type: update.type || "update",
                message: update.message,
                timestamp: update.timestamp || Date.now(),
                progress: update.progress,
                data: update.data
            };
        }
    }
}

/**
 * Format response with full formatting support
 */
function formatResponseWithFormatting(
    type: FormattedResponse['type'],
    command: string,
    result: any,
    startTime: number,
    flags: any = {},
    sessionId?: string,
    warnings: string[] = [],
    errors: string[] = []
): FormattedResponse {
    const executionTime = Date.now() - startTime;

    // Create formatting context
    const context = {
        command,
        flags,
        executionTime,
        sessionId
    };

    // Format the output using ResponseFormatter
    const formattedOutput = ResponseFormatter.format(result, context, warnings, errors);

    const response: FormattedResponse = {
        type,
        command,
        result: formattedOutput.content,
        executionTime,
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
            ...ResponseFormatter.createMetadata(context, result),
            format: formattedOutput.format,
            sessionId
        }
    };

    return response;
}

/**
 * Format response based on result type and flags (legacy)
 */
function formatResponse(
    type: FormattedResponse['type'],
    command: string,
    result: any,
    startTime: number,
    metadata?: any
): FormattedResponse {
    const executionTime = Date.now() - startTime;

    const response: FormattedResponse = {
        type,
        command,
        result: result?.result || result,
        executionTime,
        metadata: {
            ...metadata,
            executionTime
        }
    };

    // Add warnings and errors if present
    if (result?.warnings?.length > 0) {
        response.warnings = result.warnings;
    }
    
    if (result?.errors?.length > 0) {
        response.errors = result.errors;
    }

    return response;
}

/**
 * Process and categorize errors
 */
function processError(error: any, command: string): any {
    const errorInfo = {
        message: 'An unexpected error occurred',
        type: 'unknown',
        command,
        data: null as any
    };

    if (error instanceof Error) {
        errorInfo.message = error.message;
        
        // Categorize error types
        if (error.message.includes('timeout')) {
            errorInfo.type = 'timeout';
        } else if (error.message.includes('validation')) {
            errorInfo.type = 'validation';
        } else if (error.message.includes('permission') || error.message.includes('access')) {
            errorInfo.type = 'permission';
        } else if (error.message.includes('not found')) {
            errorInfo.type = 'not_found';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
            errorInfo.type = 'network';
        } else {
            errorInfo.type = 'execution';
        }

        // Include stack trace for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
            errorInfo.data = {
                stack: error.stack,
                name: error.name
            };
        }
    } else {
        errorInfo.message = String(error);
        errorInfo.data = error;
    }

    return errorInfo;
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error: any): boolean {
    if (!(error instanceof Error)) return false;
    
    const retryablePatterns = [
        /network/i,
        /connection/i,
        /timeout/i,
        /temporary/i,
        /rate limit/i,
        /service unavailable/i
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
}

/**
 * Sanitize individual argument
 */
function sanitizeArg(arg: string): string {
    // Remove potentially harmful patterns
    return arg
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:/gi, '') // Remove data: protocol
        .replace(/vbscript:/gi, '') // Remove vbscript: protocol
        .trim();
}

/**
 * Create and export the SuperClaude tool
 */
export const SuperClaudeTool = new Tool(
    "superclaude",
    "Execute SuperClaude commands for comprehensive development tasks including analysis, building, implementation, testing, and more. Supports all 17 SuperClaude commands with intelligent persona selection and streaming responses.",
    SuperClaudeArgs,
    run
);

/**
 * Export types for external use
 */
export type { SuperClaudeProps, FormattedResponse };

/**
 * Export utility functions for testing and external use
 */
export { 
    validateAndSanitizeInput, 
    validateCommand, 
    processError, 
    isRetryableError,
    formatResponseWithFormatting,
    streamResultsWithFormatting
};

/**
 * Export additional components for advanced usage
 */
export { CommandParser } from "./command-parser";
export { FlagResolver } from "./flag-resolver";
export { ResponseFormatter } from "./response-formatter";
export { SessionManager } from "./session-manager";
