/**
 * Response Formatter for SuperClaude Commands
 * Formats command output based on flags and command context
 */

import { ResolvedFlags } from "./flag-resolver";

export interface FormattingContext {
    command: string;
    flags: ResolvedFlags;
    persona?: string;
    executionTime: number;
    sessionId?: string;
}

export interface FormattedOutput {
    content: string;
    metadata?: Record<string, any>;
    format: 'text' | 'json' | 'markdown' | 'html';
}

/**
 * Response formatter class
 */
export class ResponseFormatter {
    /**
     * Format command result based on flags
     */
    static format(
        result: any,
        context: FormattingContext,
        warnings: string[] = [],
        errors: string[] = []
    ): FormattedOutput {
        const format = (context.flags.format as string) || 'text';
        const verbose = Boolean(context.flags.verbose);
        const quiet = Boolean(context.flags.quiet);
        const uc = Boolean(context.flags.uc); // UltraCompressed mode

        if (uc) {
            return this.formatUltraCompressed(result, context);
        }

        switch (format) {
            case 'json':
                return this.formatJson(result, context, warnings, errors, verbose);
            case 'markdown':
                return this.formatMarkdown(result, context, warnings, errors, verbose, quiet);
            case 'html':
                return this.formatHtml(result, context, warnings, errors, verbose);
            default:
                return this.formatText(result, context, warnings, errors, verbose, quiet);
        }
    }

    /**
     * Format as plain text
     */
    private static formatText(
        result: any,
        context: FormattingContext,
        warnings: string[],
        errors: string[],
        verbose: boolean,
        quiet: boolean
    ): FormattedOutput {
        const lines: string[] = [];

        if (!quiet) {
            lines.push(`SuperClaude ${context.command} - Completed`);
            
            if (context.persona) {
                lines.push(`Persona: ${context.persona}`);
            }
            
            lines.push(`Execution time: ${context.executionTime}ms`);
            lines.push('');
        }

        // Add result content
        if (result) {
            if (typeof result === 'string') {
                lines.push(result);
            } else if (result.content || result.message) {
                lines.push(result.content || result.message);
            } else {
                lines.push(this.stringifyResult(result, verbose));
            }
        }

        // Add warnings
        if (warnings.length > 0 && !quiet) {
            lines.push('');
            lines.push('Warnings:');
            warnings.forEach(warning => lines.push(`  ⚠️  ${warning}`));
        }

        // Add errors
        if (errors.length > 0) {
            lines.push('');
            lines.push('Errors:');
            errors.forEach(error => lines.push(`  ❌ ${error}`));
        }

        // Add verbose information
        if (verbose && !quiet) {
            lines.push('');
            lines.push('Execution Details:');
            lines.push(`  Command: ${context.command}`);
            lines.push(`  Flags: ${JSON.stringify(context.flags, null, 2)}`);
            if (context.sessionId) {
                lines.push(`  Session: ${context.sessionId}`);
            }
        }

        return {
            content: lines.join('\n'),
            format: 'text'
        };
    }

    /**
     * Format as JSON
     */
    private static formatJson(
        result: any,
        context: FormattingContext,
        warnings: string[],
        errors: string[],
        verbose: boolean
    ): FormattedOutput {
        const output = {
            command: context.command,
            success: errors.length === 0,
            result,
            executionTime: context.executionTime,
            ...(warnings.length > 0 && { warnings }),
            ...(errors.length > 0 && { errors }),
            ...(context.persona && { persona: context.persona }),
            ...(context.sessionId && { sessionId: context.sessionId })
        };

        if (verbose) {
            output['flags'] = context.flags;
            output['timestamp'] = new Date().toISOString();
        }

        return {
            content: JSON.stringify(output, null, 2),
            format: 'json',
            metadata: output
        };
    }

    /**
     * Format as Markdown
     */
    private static formatMarkdown(
        result: any,
        context: FormattingContext,
        warnings: string[],
        errors: string[],
        verbose: boolean,
        quiet: boolean
    ): FormattedOutput {
        const lines: string[] = [];

        if (!quiet) {
            lines.push(`# SuperClaude ${context.command}`);
            lines.push('');
            
            if (context.persona) {
                lines.push(`**Persona:** ${context.persona}  `);
            }
            
            lines.push(`**Execution Time:** ${context.executionTime}ms  `);
            lines.push(`**Status:** ${errors.length === 0 ? '✅ Success' : '❌ Failed'}  `);
            lines.push('');
        }

        // Add result content
        if (result) {
            lines.push('## Result');
            lines.push('');
            
            if (typeof result === 'string') {
                lines.push(result);
            } else if (result.content || result.message) {
                lines.push(result.content || result.message);
            } else {
                lines.push('```json');
                lines.push(JSON.stringify(result, null, 2));
                lines.push('```');
            }
            lines.push('');
        }

        // Add warnings
        if (warnings.length > 0 && !quiet) {
            lines.push('## Warnings');
            lines.push('');
            warnings.forEach(warning => lines.push(`> ⚠️ ${warning}`));
            lines.push('');
        }

        // Add errors
        if (errors.length > 0) {
            lines.push('## Errors');
            lines.push('');
            errors.forEach(error => lines.push(`> ❌ ${error}`));
            lines.push('');
        }

        // Add verbose information
        if (verbose && !quiet) {
            lines.push('## Execution Details');
            lines.push('');
            lines.push(`- **Command:** \`${context.command}\``);
            lines.push(`- **Flags:** \`${Object.keys(context.flags).join(', ')}\``);
            if (context.sessionId) {
                lines.push(`- **Session:** \`${context.sessionId}\``);
            }
            lines.push('');
            
            lines.push('### Full Configuration');
            lines.push('```json');
            lines.push(JSON.stringify(context.flags, null, 2));
            lines.push('```');
        }

        return {
            content: lines.join('\n'),
            format: 'markdown'
        };
    }

    /**
     * Format as HTML
     */
    private static formatHtml(
        result: any,
        context: FormattingContext,
        warnings: string[],
        errors: string[],
        verbose: boolean
    ): FormattedOutput {
        const sections: string[] = [];

        // Header
        sections.push(`<h1>SuperClaude ${context.command}</h1>`);
        
        if (context.persona) {
            sections.push(`<p><strong>Persona:</strong> ${context.persona}</p>`);
        }
        
        sections.push(`<p><strong>Execution Time:</strong> ${context.executionTime}ms</p>`);
        sections.push(`<p><strong>Status:</strong> ${errors.length === 0 ? '<span style="color: green;">✅ Success</span>' : '<span style="color: red;">❌ Failed</span>'}</p>`);

        // Result
        if (result) {
            sections.push('<h2>Result</h2>');
            if (typeof result === 'string') {
                sections.push(`<pre>${this.escapeHtml(result)}</pre>`);
            } else {
                sections.push(`<pre><code>${this.escapeHtml(JSON.stringify(result, null, 2))}</code></pre>`);
            }
        }

        // Warnings
        if (warnings.length > 0) {
            sections.push('<h2>Warnings</h2>');
            sections.push('<ul>');
            warnings.forEach(warning => sections.push(`<li style="color: orange;">⚠️ ${this.escapeHtml(warning)}</li>`));
            sections.push('</ul>');
        }

        // Errors
        if (errors.length > 0) {
            sections.push('<h2>Errors</h2>');
            sections.push('<ul>');
            errors.forEach(error => sections.push(`<li style="color: red;">❌ ${this.escapeHtml(error)}</li>`));
            sections.push('</ul>');
        }

        // Verbose information
        if (verbose) {
            sections.push('<h2>Execution Details</h2>');
            sections.push(`<p><strong>Command:</strong> <code>${context.command}</code></p>`);
            sections.push(`<p><strong>Flags:</strong> <code>${Object.keys(context.flags).join(', ')}</code></p>`);
            if (context.sessionId) {
                sections.push(`<p><strong>Session:</strong> <code>${context.sessionId}</code></p>`);
            }
            
            sections.push('<h3>Full Configuration</h3>');
            sections.push(`<pre><code>${this.escapeHtml(JSON.stringify(context.flags, null, 2))}</code></pre>`);
        }

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>SuperClaude ${context.command} - Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 2px; }
        h1, h2, h3 { color: #333; }
        ul { padding-left: 20px; }
    </style>
</head>
<body>
    ${sections.join('\n    ')}
</body>
</html>`;

        return {
            content: html,
            format: 'html'
        };
    }

    /**
     * Format in UltraCompressed mode
     */
    private static formatUltraCompressed(
        result: any,
        context: FormattingContext
    ): FormattedOutput {
        // Ultra-compressed format: minimal output, essential info only
        let content = '';
        
        if (result) {
            if (typeof result === 'string') {
                content = result.substring(0, 200) + (result.length > 200 ? '...' : '');
            } else if (result.summary) {
                content = result.summary;
            } else if (result.content) {
                content = result.content.substring(0, 200) + (result.content.length > 200 ? '...' : '');
            } else {
                content = `${context.command}: OK (${context.executionTime}ms)`;
            }
        }

        return {
            content,
            format: 'text'
        };
    }

    /**
     * Format help output
     */
    static formatHelp(command: string, helpText: string): FormattedOutput {
        return {
            content: helpText,
            format: 'text'
        };
    }

    /**
     * Format dry-run output
     */
    static formatDryRun(context: FormattingContext, simulationResult: any): FormattedOutput {
        const lines = [
            `DRY RUN: ${context.command}`,
            '',
            'The following actions would be performed:',
            '',
            typeof simulationResult === 'string' ? simulationResult : JSON.stringify(simulationResult, null, 2),
            '',
            'No actual changes were made.'
        ];

        return {
            content: lines.join('\n'),
            format: 'text'
        };
    }

    /**
     * Stringify result with proper formatting
     */
    private static stringifyResult(result: any, verbose: boolean): string {
        if (result === null || result === undefined) {
            return 'No result';
        }

        if (typeof result === 'object') {
            return JSON.stringify(result, null, verbose ? 2 : 0);
        }

        return String(result);
    }

    /**
     * Escape HTML entities
     */
    private static escapeHtml(text: string): string {
        const div = { innerHTML: '' } as any;
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Create metadata for the response
     */
    static createMetadata(context: FormattingContext, result: any): Record<string, any> {
        return {
            command: context.command,
            persona: context.persona,
            executionTime: context.executionTime,
            timestamp: new Date().toISOString(),
            sessionId: context.sessionId,
            flags: context.flags,
            resultType: typeof result,
            hasResult: result !== null && result !== undefined
        };
    }
}

/**
 * Utility function to format streaming updates
 */
export function formatStreamingUpdate(update: any, flags: ResolvedFlags): string {
    const uc = Boolean(flags.uc);
    const verbose = Boolean(flags.verbose);
    const quiet = Boolean(flags.quiet);

    if (quiet && update.type !== 'error') {
        return '';
    }

    if (uc) {
        // Ultra-compressed: only show essential updates
        if (update.type === 'error' || update.type === 'complete') {
            return `${update.type}: ${update.message}`;
        }
        return '';
    }

    const timestamp = verbose ? `[${new Date(update.timestamp).toLocaleTimeString()}] ` : '';
    const progress = update.progress ? ` (${update.progress}%)` : '';
    const prefix = update.type === 'error' ? '❌' : 
                  update.type === 'warning' ? '⚠️' : 
                  update.type === 'complete' ? '✅' : 
                  '•';

    return `${timestamp}${prefix} ${update.message}${progress}`;
}