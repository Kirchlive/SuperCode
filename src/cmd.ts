// /Users/rob/Development/SuperCode/SuperCode/src/cmd.ts
import type { Argv, CommandModule } from "yargs";

// This is a simplified version of the 'cmd' helper function found in the opencode project.
// It wraps a command definition object to make it compatible with yargs.
export function cmd<T extends object>(
    module: CommandModule<T, T>
): CommandModule<T, T> {
    return module;
}
