# Capstone Lab: CI/CD Code Review Bot

⏱ Estimated time: 8h

## What You'll Build

A CI pipeline integration that runs Claude Code as an automated code reviewer on every pull request. The bot invokes `claude -p` in non-interactive mode, produces structured JSON findings per file, and routes results through a severity-based merge-gate system. A second coordinator pass surfaces cross-file patterns the per-file passes cannot see.

## Real-World Scenario

**Company:** FinFlow Technologies — a mid-sized fintech building payment processing APIs across a polyglot monorepo (Python, TypeScript, Go). Their security team requires that every PR is scanned for logic errors, secrets exposure, and SQL injection patterns before merge. Manual review is a bottleneck; they need an automated first pass that catches regressions and escalates only the most critical findings to human reviewers.

## Exam Domains Exercised

| Domain | Concepts tested |
|---|---|
| D1 — Agent Architecture & Orchestration | Independent instances per file, coordinator aggregation, multi-pass architecture, avoiding shared context |
| D3 — Claude Code Config & Workflows | `claude -p` / `--print` flag for non-interactive CI, `--output-format json`, `--json-schema`, pipeline invocation patterns |
| D4 — Prompt Engineering & Structured Output | JSON schema enforcement, nullable fields, enum constraints, per-file vs aggregate prompts |
| D5 — Context Management & Reliability | Deduplication across PR runs, preventing context bleed between files, stateless invocations |

## Prerequisites

Complete all five domain modules before starting this lab:

- Module 1: Agent Architecture & Orchestration
- Module 2: Tool Design & MCP Integration
- Module 3: Claude Code Config & Workflows
- Module 4: Prompt Engineering & Structured Output
- Module 5: Context Management & Reliability

## Milestones Overview

- **M1** — Single-file review: invoke `claude -p` on one diff, parse JSON output matching the finding schema, display results.
- **M2** — Multi-file parallel review: spawn independent `claude -p` instances per file simultaneously, aggregate all findings.
- **M3** — Deduplication: persist previous-run findings, filter already-acknowledged issues from new output before surfacing.
- **M4** — Severity routing: comment INFO/WARNING findings on PR, block merge on ERROR, require human approval on CRITICAL.
