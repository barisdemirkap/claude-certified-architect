# Lab 1 — E-Commerce Customer Support Agent
⏱ Estimated time: 6h

## What You'll Build

A production-grade agentic customer support system for a fictional e-commerce platform called ShopFlow. The agent handles return requests and billing inquiries end-to-end: it retrieves customer and order data, attempts resolution within policy limits, and hands off to human agents when needed. The entire system is wired to enforce hard business rules at the infrastructure level — not inside the prompt.

## Real-World Scenario

**ShopFlow** is a mid-size e-commerce platform processing ~5,000 support tickets per day. Their current support flow is fully manual: agents look up orders, check refund eligibility, and decide whether to escalate. Leadership wants to automate 70% of tier-1 tickets (returns and billing), keeping humans in the loop only when the case requires judgment. The hard constraint: no automated refund above $200 — compliance requires this to be enforced by the system, not just requested in a prompt.

## Exam Domains Exercised

| Domain | Concepts Tested |
|---|---|
| D1 — Agent Architecture & Orchestration | Agentic loop termination (`stop_reason == "end_turn"`), multi-turn conversation management, escalation decision logic |
| D2 — Tool Design & MCP Integration | Tool schema design, structured return types, error vs. null distinctions, tool failure modes |
| D5 — Context Management & Reliability | PreToolUse hook enforcement, case-facts block pinning, context trimming at turn >10, retry vs. abort on tool failure |

## Prerequisites

Complete these modules before starting this lab:

- **M01** — Claude fundamentals and the agentic loop
- **M02** — Tool use: schemas, results, and error surfaces
- **M05** — Hooks, reliability patterns, and context management

## Milestones Overview

- **M1** — Agent calls `get_customer` + `lookup_order`, returns a grounded response, and exits ONLY when `stop_reason == "end_turn"`
- **M2** — PreToolUse hook blocks `process_refund` when `amount > $200` and returns a structured explanation to Claude
- **M3** — Escalation logic: acknowledge first, attempt resolution, escalate only when the customer reiterates dissatisfaction after a resolution attempt
- **M4** — Full system: structured handoff payload, tool-failure handling (timeout vs. null), and context trimming for conversations exceeding 10 turns
