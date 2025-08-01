// /Users/rob/Development/SuperCode/SuperCode/test_scripts/test_detection_engine.ts
import { Orchestrator } from '../src/session/orchestrator';
import { expect, test, describe } from "bun:test";

describe("Detection Engine", () => {
    const orchestrator = Orchestrator.getInstance();

    test("should detect 'frontend' domain from UI keywords", () => {
        const userInput = "create a new react component for the login form";
        const domain = orchestrator.detectDomain(userInput);
        expect(domain).toBe("frontend");
    });

    test("should detect 'backend' domain from API keywords", () => {
        const userInput = "implement a new endpoint for the user database";
        const domain = orchestrator.detectDomain(userInput);
        expect(domain).toBe("backend");
    });

    test("should detect 'security' domain from vulnerability keywords", () => {
        const userInput = "audit the code for authentication vulnerabilities";
        const domain = orchestrator.detectDomain(userInput);
        expect(domain).toBe("security");
    });

    test("should return null for ambiguous input", () => {
        const userInput = "hello world";
        const domain = orchestrator.detectDomain(userInput);
        expect(domain).toBe(null);
    });

    test("should detect 'creation' intent from creation keywords", () => {
        const userInput = "create a new component";
        const intent = orchestrator.detectIntent(userInput);
        expect(intent).toBe("creation");
    });

    test("should detect 'modification' intent from modification keywords", () => {
        const userInput = "improve the performance of this function";
        const intent = orchestrator.detectIntent(userInput);
        expect(intent).toBe("modification");
    });

    test("should select 'frontend' persona for UI creation tasks", () => {
        const userInput = "create a new react component";
        const persona = orchestrator.detectPersona(userInput);
        expect(persona).toBe("frontend");
    });

    test("should select 'analyzer' persona for debugging tasks", () => {
        const userInput = "troubleshoot this error";
        const persona = orchestrator.detectPersona(userInput);
        expect(persona).toBe("analyzer");
    });

    test("should fallback to 'architect' for general tasks", () => {
        const userInput = "plan the project structure";
        const persona = orchestrator.detectPersona(userInput);
        expect(persona).toBe("architect");
    });
});
