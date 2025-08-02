import { z } from "zod";

export class Tool {
    public name: string;
    public description: string;
    public args: z.ZodObject<any>;
    public run: (props: any) => AsyncGenerator<any, any, any>;

    constructor(name: string, description: string, args: z.ZodObject<any>, run: (props: any) => AsyncGenerator<any, any, any>) {
        // Validate constructor parameters
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error("Tool name cannot be empty");
        }
        
        if (!description || typeof description !== 'string' || description.trim() === '') {
            throw new Error("Tool description cannot be empty");
        }
        
        if (!args || typeof args.parse !== 'function') {
            throw new Error("Tool args must be a Zod schema");
        }
        
        if (!run || typeof run !== 'function') {
            throw new Error("Tool run must be an async generator function");
        }
        
        // Check if it's an async generator function by testing its constructor name
        // This is a basic check - in practice, the TypeScript types ensure correctness
        const runResult = run({});
        if (!runResult || typeof runResult.next !== 'function' || typeof runResult[Symbol.asyncIterator] !== 'function') {
            throw new Error("Tool run must be an async generator function");
        }

        this.name = name.trim();
        this.description = description.trim();
        this.args = args;
        this.run = run;
    }
}

