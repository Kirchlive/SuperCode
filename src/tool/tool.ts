import { z } from "zod";

export class Tool {
    public name: string;
    public description: string;
    public args: z.ZodObject<any>;
    public run: (props: any) => AsyncGenerator<any, any, any>;

    constructor(name: string, description: string, args: z.ZodObject<any>, run: (props: any) => AsyncGenerator<any, any, any>) {
        this.name = name;
        this.description = description;
        this.args = args;
        this.run = run;
    }
}

