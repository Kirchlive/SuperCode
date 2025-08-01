// /Users/rob/Development/SuperCode/SuperCode/src/tool/glob.ts
import { glob } from 'glob';

export async function run(props: { pattern: string }): Promise<string[]> {
    return await glob(props.pattern);
}
