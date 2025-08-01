// /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_persona_activation.ts
import { Orchestrator } from '../src/session/orchestrator';
import { expect, test, describe } from "bun:test";

describe("Persona Activation", () => {
    const orchestrator = Orchestrator.getInstance();

    test("should activate 'frontend' for UI creation", () => {
        const userInput = "create a new react component";
        const persona = orchestrator.detectPersona(userInput);
        expect(persona).toBe("frontend");
    });

    test("should activate 'security' for vulnerability audit", () => {
        const userInput = "audit the authentication for vulnerabilities";
        const persona = orchestrator.detectPersona(userInput);
        expect(persona).toBe("security");
    });

    test("should activate 'refactorer' for code improvement", () => {
        const userInput = "improve this code";
        const persona = orchestrator.detectPersona(userInput);
        expect(persona).toBe("refactorer");
    });

    test("should activate 'architect' as fallback for general design", () => {
        const userInput = "design a new UI system";
        const persona = orchestrator.detectPersona(userInput);
        expect(persona).toBe("architect");
    });

    test("should activate 'analyzer' as general fallback", () => {
        const userInput = "what is this?";
        const persona = orchestrator.detectPersona(userInput);
        expect(persona).toBe("analyzer");
    });
});
