# Lab 5: Multi-Agent Research System
⏱ Estimated time: 7h

## What You'll Build

You will build **Insight Engine**, a hub-and-spoke multi-agent research system where a coordinator Claude instance decomposes a research topic, dispatches specialized subagents in parallel, and synthesizes their output into a final report. Every claim in the report will carry a full provenance record — source URL, retrieval date, and confidence score — and the system will transparently annotate coverage gaps when a subagent fails or sources are unavailable.

## Real-World Scenario

**Meridian Intelligence** is a boutique competitive-analysis firm. Their analysts spend 60 % of their time hunting for and cross-referencing sources before they can write a single sentence of insight. The team needs an automated research backend: given a company name and a scope (e.g., "pricing strategy, 2023-2025"), it should fan out to live web sources and internal document archives simultaneously, reconcile conflicting findings, and produce a structured report that a human analyst can audit line-by-line — with every claim traceable to its origin.

## Exam Domains Exercised

| Domain | Concepts tested |
|---|---|
| D1 — Agent Architecture & Orchestration | Hub-and-spoke topology; coordinator as orchestrator; parallel vs serial dispatch; fork_session; error propagation strategy; partial-results handling |
| D2 — Tool Design & MCP Integration | Tool schema design for subagent result contracts; provenance record structure; typed output enforcement |
| D5 — Context Management & Reliability | Explicit context passing (subagents inherit nothing); context budget per subagent; coverage annotations; conflict preservation vs resolution |

## Prerequisites

Complete the following modules before starting this lab:

- **M01** — Claude API fundamentals and message construction
- **M02** — Tool use and structured output
- **M05** — Multi-agent patterns (orchestrator/subagent roles, Task invocation)

## Milestones Overview

- **M1** — Coordinator + one subagent: full context passed in Task invocation; subagent returns provenance-tagged results
- **M2** — Add a second subagent; run web search and document analysis concurrently; coordinator receives both result sets
- **M3** — Enforce the full four-field provenance record on every claim; wire results into the synthesis subagent
- **M4** — Conflict detection, coverage annotations, and graceful degradation when one subagent fails
