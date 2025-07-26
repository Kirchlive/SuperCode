# SuperCode: SuperClaude-OpenCode Integration Pipeline

This repository contains the **SuperCode Integration Pipeline**, an advanced system designed to automatically translate the logic and commands of the [SuperClaude Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework) into native, idiomatic TypeScript for the [OpenCode](https://github.com/sst/opencode) ecosystem.

The primary goal is to create a robust, automated, and maintainable bridge between these two powerful systems, enabling OpenCode's autonomous AI agents to leverage the full capabilities of SuperClaude without requiring a Python runtime.

---

## Table of Contents

- [Vision & Core Concept](#vision--core-concept)
- [How It Works: The Pipeline Architecture](#how-it-works-the-pipeline-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
- [Usage](#usage)
  - [Running the Full Integration](#running-the-full-integration)
  - [Updating from SuperClaude](#updating-from-superclaude)
- [Project Principles](#project-principles)
- [Contributing](#contributing)
- [Repository Structure](#repository-structure)
- [Documentation](#documentation)

---

## Vision & Core Concept

Instead of a simple, manual integration, this project implements a sophisticated **transpilation and integration pipeline**. The core philosophy is **"Automation First, Manual Last."** We invest in automating the migration process itself, allowing for rapid, repeatable, and low-effort updates whenever the source SuperClaude framework evolves.

The pipeline reads the Python & Markdown source of SuperClaude and generates high-quality, native TypeScript code that seamlessly integrates with OpenCode's architecture.

## How It Works: The Pipeline Architecture

The pipeline is a multi-stage process that transforms the source code step-by-step:

1.  **Source Ingestion:** The SuperClaude repository is included as a version-pinned **Git Submodule**, ensuring stability and deliberate updates.
2.  **Command Generation:** A script parses the Markdown command definitions (`.md`) from SuperClaude to automatically generate the boilerplate for the TypeScript command files in OpenCode.
3.  **Logic Transpilation:** The core Python logic (`.py`) of SuperClaude is transpiled into raw, intermediate TypeScript.
4.  **AST-based Mapping:** This is the heart of the pipeline. Using `ts-morph`, we parse the raw TypeScript into an Abstract Syntax Tree (AST). We then traverse this tree and, using a custom `mapping.json`, intelligently replace calls to SuperClaude's core functions with their native equivalents in the OpenCode toolset.
5.  **Code Generation:** The final, clean, and idiomatic TypeScript code is generated and placed into the OpenCode source tree.

For a deep dive into the technical design, see the [**ARCHITECTURE.md**](ARCHITECTURE.md).

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.0 or higher)
- [Git](https://git-scm.com/)

### Installation & Setup

1.  **Clone the Repository:**
    Use the `--recurse-submodules` flag to ensure the SuperClaude submodule is cloned as well.
    ```bash
    git clone --recurse-submodules https://github.com/your-org/your-repo.git
    cd your-repo
    ```

2.  **Install Dependencies:**
    ```bash
    bun install
    ```

3.  **Run the Initial Integration:**
    This command executes the entire pipeline, generating the integrated code for the first time.
    ```bash
    bun run import-superclaude
    ```

## Usage

### Running the Full Integration

To run a clean, full integration at any time, use the main script defined in `package.json`:

```bash
bun run import-superclaude
```

### Updating from SuperClaude

When a new version of the SuperClaude framework is released and you want to integrate its changes:

1.  **Update the Submodule:**
    ```bash
    git submodule update --remote
    ```
2.  **Review the Changes:**
    Check the new code in `external/superclaude` and review the `git diff`.
3.  **Run the Pipeline:**
    ```bash
    bun run import-superclaude
    ```
4.  **Test and Commit:**
    Review the newly generated code and, if all tests pass, commit the changes, including the new submodule pointer.

## Project Principles

Our development is guided by three core principles. Please read our [**WORKFLOW.md**](WORKFLOW.md) to understand them fully.

1.  **Automation First, Manual Last:** We automate processes to reduce future manual work.
2.  **Clarity Over Cleverness:** We write simple, readable code, especially in the pipeline itself.
3.  **Stability and Security as a Feature:** We prioritize a secure and stable integration process.

## Contributing

We welcome contributions! Please read our [**CONTRIBUTING.md**](CONTRIBUTING.md) to learn about our development workflow, pull request process, and coding standards.

If you are working with an AI agent, please ensure it follows the protocol defined in [**AGENT.md**](AGENT.md).

## Repository Structure

The repository is organized to keep a clear separation between the pipeline's logic, the code, and test artifacts. High-level project documentation resides in the parent directory.

```
/ (Documentation Root)
├── SuperCode/ (This Repository Root)
│   ├── scripts/
│   │   └── pipeline/
│   ├── test_scripts/
│   ├── test_results/
│   └── ...
├── docs_adr/
└── ... (All other high-level documentation)
```

## High-Level Documentation

This project is documented extensively. The main documentation files (Roadmap, Workflow, etc.) are located in the parent directory, one level above this repository root. All documentation is written in English.
