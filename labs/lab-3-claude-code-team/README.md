# Lab 3: Claude Code Team Configuration

⏱ Estimated time: 4h

## What You'll Build

You will create a complete, production-realistic Claude Code configuration for a multi-developer team working on **Nexus**, a web application with a React frontend, a Node.js API layer, and a Stripe payments integration. The deliverable is the configuration artifact set itself — CLAUDE.md files, scoped rules, a code review skill, and an MCP server manifest — not a running application. By the end you will have a system that gives every team member and Claude session the right context at the right scope.

## Real-World Scenario

**Nexus Inc.** is a 12-person startup that recently onboarded three new engineers. Their codebase spans a React SPA, a Node.js REST API, and a Stripe integration that is in-scope for PCI DSS. The engineering lead wants Claude Code to act as an always-current onboarding document, a guardrail for the payments module, a consistent code-review assistant, and a database schema browser — without exposing secrets in version control.

## Exam Domains Exercised

| Domain | Concepts Tested |
|---|---|
| D3 — Claude Code Config & Workflows | 3-level CLAUDE.md hierarchy, paths glob conditional loading, rules vs directory CLAUDE.md, context:fork for skills, .mcp.json env-var credential pattern, allowed-tools scoping |
| D2 — Tool Design & MCP Integration | MCP server manifest structure, environment variable injection for secrets, schema inspection tool design |
| D4 — Prompt Engineering & Structured Output | Writing effective system-context instructions, argument-hint design, structured review output |

## Prerequisites

- Complete **Module 03** (Claude Code Config & Workflows) before starting this lab.
- Familiarity with YAML/JSON frontmatter syntax.
- No running infrastructure is required — you are authoring config files only.

## Milestones Overview

- **M1** — Write `.claude/CLAUDE.md` as a comprehensive new-teammate brief covering repo layout, conventions, and sensitive areas.
- **M2** — Write `api-rules.md` and `payments-rules.md` with correct `paths:` frontmatter so they load only for their respective source trees.
- **M3** — Write the `/review` skill with `context:fork` so it returns a contained report rather than starting an interactive session.
- **M4** — Write `.mcp.json` wiring a DB introspection server with the connection string supplied via environment variable.
