# Lab 2: Library Catalog MCP Server

⏱ Estimated time: 5h

## What You'll Build

You will build a fully functional MCP server that exposes a fictional university library catalog to Claude. The server implements all three core MCP component types: tools (actions that can have side effects), resources (read-only data endpoints), and structured error handling that distinguishes retryable failures from permanent ones.

## Real-World Scenario

**LibraryLens** is a university library system at Meridian University. The library's IT department wants to let students and faculty interact with the catalog through Claude — searching holdings, checking availability, and reserving items — without giving Claude direct database access. Your job is to build the MCP server layer that sits between Claude and the catalog, enforcing business rules and returning structured responses the orchestrator can act on.

## Exam Domains Exercised

| Domain | Concepts Tested |
|---|---|
| D2 — Tool Design & MCP Integration (18%) | Tools vs resources distinction, tool input schema design, resource URI patterns, structured error shape (isError, errorCategory, isRetryable), .mcp.json vs ~/.claude.json, credential handling via env vars |
| D4 — Prompt Engineering & Structured Output (20%) | Input/output contracts, schema validation, empty-result vs error distinction |
| D5 — Context Management & Reliability (15%) | Retryable vs non-retryable errors, graceful degradation, rate-limit signaling |

## Prerequisites

Complete the following before starting this lab:

- **M02** — MCP fundamentals (tools, resources, server protocol)
- Familiarity with JSON Schema for tool input definitions
- Node.js or Python environment set up (see STARTER.md)

## Milestones Overview

- **M1** — MCP server skeleton with `search_catalog` tool; 0-result searches return a valid empty list, not an error
- **M2** — `reserve_item` tool with NOT_FOUND and ACCESS_DENIED structured errors and correct `isRetryable` values
- **M3** — Both read-only resources: available-items list and single-item lookup by ID
- **M4** — RATE_LIMITED error on `search_catalog` plus `.mcp.json` config with env-var credential reference
