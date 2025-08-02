# Strategy to Fix Remaining Placeholder Commands

## Status Summary
- **Fixed:** 1/12 placeholders (analyze.ts)
- **Remaining:** 11 placeholders
- **Test Status:** Integration tests failing due to placeholder implementations

## Immediate Actions Required

### Option 1: Quick Fix (Recommended for Testing)
1. Copy the handler implementations from `build/supercode/.../handlers/analysis.ts`
2. Adapt them to the yargs command structure
3. Focus on critical commands first: explain, build, git, spawn

### Option 2: Complete Rewrite (Time-intensive)
1. Use the TDD test files as specifications
2. Implement each command based on test expectations
3. Ensure all 17 commands have full functionality

## Commands Needing Implementation

| Command | Current Status | Priority | Estimated Time |
|---------|---------------|----------|----------------|
| explain | Placeholder | High | 30 mins |
| git | Placeholder | High | 45 mins |
| spawn | Placeholder | High | 60 mins |
| document | Placeholder | Medium | 45 mins |
| implement | Placeholder | Medium | 60 mins |
| improve | Placeholder | Medium | 45 mins |
| cleanup | Placeholder | Low | 30 mins |
| design | Placeholder | Low | 45 mins |
| estimate | Placeholder | Low | 30 mins |
| troubleshoot | Placeholder | Low | 30 mins |
| workflow | Placeholder | Low | 45 mins |

## Quick Implementation Template

```typescript
import type { Argv } from "yargs";
import { cmd } from "../cmd";
import * as glob from "../tool/glob";
import * as grep from "../tool/grep";
import * as read from "../tool/read";
import { z } from "zod";

const CommandOptionsSchema = z.object({
  // Define options based on command needs
});

export const CommandNameCommand = cmd({
    command: "commandname [args]",
    describe: "Command description",
    
    builder: (yargs: Argv) => {
        return yargs
            .positional("args", {
                describe: "Arguments",
                type: "string",
            })
            .option("flag", {
                describe: "Flag description",
                type: "string",
            });
    },

    handler: async (args) => {
        try {
            const options = CommandOptionsSchema.parse(args);
            
            // Implementation logic here
            
            return { success: true, result: "Command completed" };
        } catch (error) {
            console.error("❌ Command failed:", error.message);
            return { error: error.message };
        }
    },
});
```

## Testing Strategy

1. **Unit Tests:** Run individual command tests
2. **Integration Tests:** Fix orchestrator routing issues
3. **E2E Tests:** Test complete command flow

## Next Steps

1. Prioritize high-impact commands (explain, git, spawn)
2. Use handler implementations from build directory as reference
3. Ensure consistent return values for test compatibility
4. Update import paths as needed
5. Run tests after each implementation

## Estimated Total Time
- Quick fixes for critical commands: 3-4 hours
- Complete implementation of all commands: 8-10 hours
- Full testing and validation: 2-3 hours