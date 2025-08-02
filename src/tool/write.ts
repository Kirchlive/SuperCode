// /Users/rob/Development/SuperCode/SuperCode/src/tool/write.ts
import * as fs from 'fs/promises';

export async function run(props: { filePath: string; content: string }): Promise<void> {
    return await fs.writeFile(props.filePath, props.content, 'utf-8');
}