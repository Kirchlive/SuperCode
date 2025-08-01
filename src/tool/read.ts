// /Users/rob/Development/SuperCode/SuperCode/src/tool/read.ts
import * as fs from 'fs/promises';

export async function run(props: { filePath: string }): Promise<string> {
    return await fs.readFile(props.filePath, 'utf-8');
}
