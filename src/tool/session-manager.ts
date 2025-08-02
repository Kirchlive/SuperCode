/**
 * Session Manager for SuperClaude Commands
 * Manages session state, context persistence, and command history
 */

import { ResolvedFlags } from "./flag-resolver";
import { ParsedCommand } from "./command-parser";

export interface SessionContext {
    sessionId: string;
    userId?: string;
    workingDirectory: string;
    lastCommand?: string;
    commandHistory: CommandHistoryEntry[];
    personaHistory: PersonaUsage[];
    preferences: UserPreferences;
    cache: Map<string, any>;
    createdAt: number;
    lastAccessedAt: number;
    metadata: Record<string, any>;
}

export interface CommandHistoryEntry {
    timestamp: number;
    command: string;
    args: string[];
    flags: ResolvedFlags;
    persona?: string;
    executionTime: number;
    success: boolean;
    errors?: string[];
    warnings?: string[];
}

export interface PersonaUsage {
    personaId: string;
    usageCount: number;
    lastUsed: number;
    successRate: number;
    averageExecutionTime: number;
}

export interface UserPreferences {
    defaultFormat: 'text' | 'json' | 'markdown' | 'html';
    verboseMode: boolean;
    preferredPersona?: string;
    autoCache: boolean;
    maxHistoryEntries: number;
    streamingEnabled: boolean;
}

export interface SessionMetrics {
    totalCommands: number;
    successfulCommands: number;
    failedCommands: number;
    averageExecutionTime: number;
    mostUsedCommand: string;
    mostUsedPersona: string;
    sessionDuration: number;
}

/**
 * Session Manager class
 */
export class SessionManager {
    private static instance: SessionManager;
    private sessions: Map<string, SessionContext> = new Map();
    private readonly maxSessions = 100;
    private readonly sessionTTL = 24 * 60 * 60 * 1000; // 24 hours
    private cleanupInterval?: NodeJS.Timeout;

    private constructor() {
        this.startCleanupTimer();
    }

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    /**
     * Create a new session
     */
    createSession(userId?: string, workingDirectory: string = process.cwd()): string {
        const sessionId = this.generateSessionId();
        const now = Date.now();

        const session: SessionContext = {
            sessionId,
            userId,
            workingDirectory,
            commandHistory: [],
            personaHistory: [],
            preferences: this.getDefaultPreferences(),
            cache: new Map(),
            createdAt: now,
            lastAccessedAt: now,
            metadata: {}
        };

        this.sessions.set(sessionId, session);
        this.enforceSessionLimit();
        
        return sessionId;
    }

    /**
     * Get session by ID
     */
    getSession(sessionId: string): SessionContext | null {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastAccessedAt = Date.now();
            return session;
        }
        return null;
    }

    /**
     * Update session with command execution
     */
    updateSessionWithExecution(
        sessionId: string,
        command: ParsedCommand,
        flags: ResolvedFlags,
        persona: string | undefined,
        executionTime: number,
        success: boolean,
        errors: string[] = [],
        warnings: string[] = []
    ): void {
        const session = this.getSession(sessionId);
        if (!session) return;

        // Add to command history
        const historyEntry: CommandHistoryEntry = {
            timestamp: Date.now(),
            command: command.command,
            args: command.args,
            flags,
            persona,
            executionTime,
            success,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined
        };

        session.commandHistory.push(historyEntry);
        session.lastCommand = command.command;

        // Maintain history size limit
        if (session.commandHistory.length > session.preferences.maxHistoryEntries) {
            session.commandHistory = session.commandHistory.slice(-session.preferences.maxHistoryEntries);
        }

        // Update persona usage
        if (persona) {
            this.updatePersonaUsage(session, persona, executionTime, success);
        }

        // Update working directory if changed
        if (command.target && command.target.startsWith('/')) {
            session.workingDirectory = command.target;
        }
    }

    /**
     * Get session metrics
     */
    getSessionMetrics(sessionId: string): SessionMetrics | null {
        const session = this.getSession(sessionId);
        if (!session) return null;

        const history = session.commandHistory;
        const successful = history.filter(h => h.success);
        const failed = history.filter(h => !h.success);

        // Calculate averages
        const avgExecutionTime = history.length > 0 
            ? history.reduce((sum, h) => sum + h.executionTime, 0) / history.length 
            : 0;

        // Find most used command
        const commandCounts = new Map<string, number>();
        history.forEach(h => {
            commandCounts.set(h.command, (commandCounts.get(h.command) || 0) + 1);
        });
        const mostUsedCommand = Array.from(commandCounts.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

        // Find most used persona
        const mostUsedPersona = session.personaHistory
            .sort((a, b) => b.usageCount - a.usageCount)[0]?.personaId || '';

        return {
            totalCommands: history.length,
            successfulCommands: successful.length,
            failedCommands: failed.length,
            averageExecutionTime: Math.round(avgExecutionTime),
            mostUsedCommand,
            mostUsedPersona,
            sessionDuration: Date.now() - session.createdAt
        };
    }

    /**
     * Get command suggestions based on history
     */
    getCommandSuggestions(sessionId: string, currentInput: string): string[] {
        const session = this.getSession(sessionId);
        if (!session) return [];

        const suggestions: string[] = [];
        const lowerInput = currentInput.toLowerCase();

        // Get recent commands
        const recentCommands = session.commandHistory
            .slice(-10)
            .map(h => h.command)
            .filter(cmd => cmd.toLowerCase().includes(lowerInput));

        suggestions.push(...new Set(recentCommands));

        // Get frequent successful commands
        const successfulCommands = session.commandHistory
            .filter(h => h.success && h.command.toLowerCase().includes(lowerInput))
            .map(h => h.command);

        const commandFrequency = new Map<string, number>();
        successfulCommands.forEach(cmd => {
            commandFrequency.set(cmd, (commandFrequency.get(cmd) || 0) + 1);
        });

        const frequentCommands = Array.from(commandFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([cmd]) => cmd)
            .slice(0, 5);

        suggestions.push(...frequentCommands.filter(cmd => !suggestions.includes(cmd)));

        return suggestions.slice(0, 10);
    }

    /**
     * Get cached result if available
     */
    getCachedResult(sessionId: string, cacheKey: string): any {
        const session = this.getSession(sessionId);
        if (!session || !session.preferences.autoCache) return null;

        return session.cache.get(cacheKey);
    }

    /**
     * Cache command result
     */
    setCachedResult(sessionId: string, cacheKey: string, result: any): void {
        const session = this.getSession(sessionId);
        if (!session || !session.preferences.autoCache) return;

        // Limit cache size
        if (session.cache.size >= 50) {
            const firstKey = session.cache.keys().next().value;
            session.cache.delete(firstKey);
        }

        session.cache.set(cacheKey, {
            result,
            timestamp: Date.now(),
            ttl: 5 * 60 * 1000 // 5 minutes
        });
    }

    /**
     * Update user preferences
     */
    updatePreferences(sessionId: string, preferences: Partial<UserPreferences>): void {
        const session = this.getSession(sessionId);
        if (!session) return;

        session.preferences = { ...session.preferences, ...preferences };
    }

    /**
     * Get optimal persona suggestion based on command and history
     */
    getPersonaSuggestion(sessionId: string, command: string): string | null {
        const session = this.getSession(sessionId);
        if (!session) return null;

        // Check user preference first
        if (session.preferences.preferredPersona) {
            return session.preferences.preferredPersona;
        }

        // Find personas that have been successful with this command
        const commandHistory = session.commandHistory
            .filter(h => h.command === command && h.success && h.persona);

        if (commandHistory.length === 0) return null;

        // Calculate success rates by persona for this command
        const personaStats = new Map<string, { successes: number; total: number }>();
        
        commandHistory.forEach(h => {
            if (h.persona) {
                const stats = personaStats.get(h.persona) || { successes: 0, total: 0 };
                stats.total++;
                if (h.success) stats.successes++;
                personaStats.set(h.persona, stats);
            }
        });

        // Find persona with highest success rate (minimum 2 attempts)
        let bestPersona = null;
        let bestRate = 0;

        personaStats.forEach((stats, persona) => {
            if (stats.total >= 2) {
                const rate = stats.successes / stats.total;
                if (rate > bestRate) {
                    bestRate = rate;
                    bestPersona = persona;
                }
            }
        });

        return bestPersona;
    }

    /**
     * Clean expired sessions
     */
    private startCleanupTimer(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, 60000); // Run every minute
    }

    /**
     * Clean up expired sessions
     */
    private cleanupExpiredSessions(): void {
        const now = Date.now();
        const expiredSessions: string[] = [];

        this.sessions.forEach((session, sessionId) => {
            if (now - session.lastAccessedAt > this.sessionTTL) {
                expiredSessions.push(sessionId);
            }
        });

        expiredSessions.forEach(sessionId => {
            this.sessions.delete(sessionId);
        });
    }

    /**
     * Enforce maximum session limit
     */
    private enforceSessionLimit(): void {
        if (this.sessions.size <= this.maxSessions) return;

        // Remove oldest sessions
        const sortedSessions = Array.from(this.sessions.entries())
            .sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt);

        const toRemove = sortedSessions.slice(0, this.sessions.size - this.maxSessions);
        toRemove.forEach(([sessionId]) => {
            this.sessions.delete(sessionId);
        });
    }

    /**
     * Update persona usage statistics
     */
    private updatePersonaUsage(
        session: SessionContext,
        personaId: string,
        executionTime: number,
        success: boolean
    ): void {
        let personaUsage = session.personaHistory.find(p => p.personaId === personaId);
        
        if (!personaUsage) {
            personaUsage = {
                personaId,
                usageCount: 0,
                lastUsed: 0,
                successRate: 0,
                averageExecutionTime: 0
            };
            session.personaHistory.push(personaUsage);
        }

        const oldCount = personaUsage.usageCount;
        personaUsage.usageCount++;
        personaUsage.lastUsed = Date.now();

        // Update success rate
        const oldSuccessRate = personaUsage.successRate;
        personaUsage.successRate = ((oldSuccessRate * oldCount) + (success ? 1 : 0)) / personaUsage.usageCount;

        // Update average execution time
        const oldAvgTime = personaUsage.averageExecutionTime;
        personaUsage.averageExecutionTime = ((oldAvgTime * oldCount) + executionTime) / personaUsage.usageCount;
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `sc_${timestamp}_${random}`;
    }

    /**
     * Get default user preferences
     */
    private getDefaultPreferences(): UserPreferences {
        return {
            defaultFormat: 'text',
            verboseMode: false,
            autoCache: true,
            maxHistoryEntries: 100,
            streamingEnabled: true
        };
    }

    /**
     * Generate cache key for command
     */
    static generateCacheKey(command: string, args: string[], flags: ResolvedFlags): string {
        const normalized = {
            command,
            args: args.sort(),
            flags: Object.keys(flags).sort().reduce((obj, key) => {
                obj[key] = flags[key];
                return obj;
            }, {} as any)
        };
        
        return `cmd_${Buffer.from(JSON.stringify(normalized)).toString('base64')}`;
    }

    /**
     * Destroy session manager
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.sessions.clear();
    }
}