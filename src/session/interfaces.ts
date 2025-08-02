// /Users/rob/Development/SuperCode/SuperCode/src/session/interfaces.ts
// Interface definitions for session components to avoid circular dependencies

export interface IOrchestrator {
    getInstance(): IOrchestrator;
    orchestrateCommand(
        input: string, 
        parsedCommand: any, 
        resolvedFlags: any, 
        sessionId: string, 
        workingDir: string
    ): Promise<{
        output: string;
        success: boolean;
        metadata: any;
    }>;
}

export interface ISessionManager {
    getInstance(): ISessionManager;
    createSession(sessionId?: string, workingDir?: string): string;
    getSession(sessionId: string): any;
    updateSession(sessionId: string, data: any): void;
}