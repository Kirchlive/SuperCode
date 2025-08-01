// /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_command_router.test.ts
import { Orchestrator } from '../src/session/orchestrator';
import { expect, test, describe } from "bun:test";

describe("Command Router", () => {
    const orchestrator = Orchestrator.getInstance();

    test("should route to the 'analyze' command and pass arguments", async () => {
        const props = {
            command: "analyze",
            args: { target: "src/", focus: "security" },
            userInput: "analyze the security of src/"
        };

        const { updates, result } = await orchestrator.executeSuperClaudeCommand(props);
        
        const updateMessages = updates.map(o => o.message);

        // Check if the persona was detected
        expect(updateMessages).toContain("Detected Persona: Security");

        // Check if the routing message was sent
        expect(updateMessages).toContain("Routing to command: analyze");

        // Check if the final result is successful
        expect(result?.result).toBe("Successfully executed analyze.");
    });

    test("should handle non-existent commands gracefully", async () => {
        const props = {
            command: "nonexistent",
            args: {},
            userInput: "do something nonexistent"
        };

        const { updates, result } = await orchestrator.executeSuperClaudeCommand(props);
        const errorMessages = updates.filter(o => o.type === 'error').map(o => o.message);

        expect(errorMessages[0]).toContain("Error executing command 'nonexistent'");
        expect(result?.result).toBe("Command execution failed.");
    });
});
