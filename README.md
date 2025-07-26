# SuperCode: SuperClaude-OpenCode Integration Pipeline

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository contains the **SuperCode Integration Pipeline**, an advanced system designed to automatically translate the logic and commands of the [SuperClaude Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework) into native, idiomatic TypeScript for the [OpenCode](https://github.com/sst/opencode) ecosystem.

---

## Table of Contents

- [Vision & Core Concept](#vision--core-concept)
- [How It Works: The Pipeline Architecture](#how-it-works-the-pipeline-architecture)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Principles](#project-principles)
- [Contributing](#contributing)
- [Repository Structure](#repository-structure)
- [High-Level Documentation](#high-level-documentation)

---

## Vision & Core Concept

The primary goal is to create a robust, automated, and maintainable bridge between these two powerful systems. This allows OpenCode's autonomous AI agents to leverage the full capabilities of SuperClaude—including its specialized commands, cognitive personas, and MCP integrations—without requiring a Python runtime.

The core philosophy is **"Automation First, Manual Last."** We invest in automating the migration process itself, allowing for rapid, repeatable, and low-effort updates.

## How It Works: The Pipeline Architecture

The pipeline is a multi-stage process that transforms the source code and configurations:

1.  **Source Ingestion:** The SuperClaude repository is included as a version-pinned **Git Submodule**.
2.  **Command Generation:** A script parses Markdown command definitions to generate TypeScript command boilerplate.
3.  **Logic Transpilation:** The core Python logic of SuperClaude is transpiled into raw, intermediate TypeScript.
4.  **AST-based Mapping:** The heart of the pipeline. It intelligently replaces calls to SuperClaude's core functions (including MCP calls) with their native OpenCode equivalents.
5.  **Config Migration:** A parallel step parses and converts conceptual features like Personas into structured JSON manifests.
6.  **Logic Injection:** The final step injects the translated logic into the command boilerplate.

For a deep dive, see the [**ARCHITECTURE.md**](../ARCHITECTURE.md).

## Getting Started

Follow the instructions in the [**CONTRIBUTING.md**](../CONTRIBUTING.md) to set up your development environment.

## Usage

All pipeline commands are run via `bun run`. Refer to the [**PIPELINE_USAGE.md**](../PIPELINE_USAGE.md) for detailed instructions.

-   **Run the full integration:** `bun run import`
-   **Run a specific step:** `bun run generate:commands`

## Project Principles

Our development is guided by four core principles, including **"Inherit Intelligence"**. Please read our [**WORKFLOW.md**](../WORKFLOW.md) to understand them fully.

## Contributing

We welcome contributions! Please read our [**CONTRIBUTING.md**](../CONTRIBUTING.md) to learn about our development workflow and how to add new features like Personas.

## Repository Structure

The repository is organized to keep a clear separation between the pipeline's logic, the code, and test artifacts. High-level project documentation resides in the parent directory.

```
/ (Documentation Root)
├── SuperCode/ (This Repository Root)
│   ├── scripts/
│   │   └── pipeline/
│   ├── src/
│   │   ├── commands/
│   │   └── core-generated/
│   ├── test_fixtures/
│   ├── test_scripts/
│   └── ...
├── guides/               # User guides for features like Personas
├── docs_adr/             # Log of all major architectural decisions
└── ...                   # All other high-level documentation
```

## High-Level Documentation

This project is documented extensively. The main documentation files are located in the parent directory, one level above this repository root.

| Document | Purpose |
| :--- | :--- |
| [**ROADMAP.md**](../ROADMAP.md) | Outlines the vision, phases, and long-term goals. |
| [**ARCHITECTURE.md**](../ARCHITECTURE.md) | A deep dive into the technical design of the pipeline. |
| [**WORKFLOW.md**](../WORKFLOW.md) | The guiding principles for our development process. |
| [**guides/**](../guides/) | User and developer guides for migrated features like Personas and MCP. |
| [**CONTRIBUTING.md**](../CONTRIBUTING.md) | How to contribute to the project. |
| [**AGENT.md**](../AGENT.md) | The mandatory protocol for AI agents. |
| [**docs_adr/**](../docs_adr/) | A log of all major architectural decisions made during the project. |
