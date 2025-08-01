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

The core philosophy is **"Automation First, Manual Last."** We invest in automating the *bootstrapping* of commands and migration of configurations, allowing us to focus on the manual, high-value work of implementing the core logic in TypeScript.

## How It Works: The Pipeline Architecture

The pipeline is a **bootstrapper and configuration migrator**. Its goal is to create the necessary TypeScript boilerplate (the command skeletons) and migrate the conceptual features (like Personas) into a structured format, preparing the ground for a manual or AI-assisted implementation of the business logic in TypeScript.

The process involves two main automated steps:

1.  **Command Generation:** A script parses the Markdown command definitions from the `SuperClaude_Framework` submodule to generate the TypeScript command boilerplate files in `src/commands/`.
2.  **Config Migration:** A parallel script parses conceptual features like `PERSONAS.md` and converts them into structured JSON manifests (e.g., `src/personas.json`).

This automated bootstrapping ensures that the OpenCode environment is perfectly set up to inherit the intelligence of the SuperClaude Framework. The subsequent implementation of the core logic within the generated files is a manual or AI-assisted task for Phase 3.

For a deep dive into the project's design, see the [**ARCHITECTURE.md**](../ARCHITECTURE.md).

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
| [**guides/UPDATE_GUIDE.md**](../guides/UPDATE_GUIDE.md) | Step-by-step instructions for updating the SuperClaude submodule. |
| [**docs_adr/**](../docs_adr/) | A log of all major architectural decisions made during the project. |
