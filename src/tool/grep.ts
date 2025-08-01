// /Users/rob/Development/SuperCode/SuperCode/src/tool/grep.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function run(props: { pattern: string, include: string }): Promise<string[]> {
    try {
        const { stdout } = await execAsync(`grep -l "${props.pattern}" ${props.include}`);
        return stdout.split('\n').filter(Boolean);
    } catch (error) {
        // Grep returns a non-zero exit code if no lines are selected.
        return [];
    }
}
