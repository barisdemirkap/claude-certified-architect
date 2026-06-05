# Scenario 1: Customer Support Agent

## Overview

A customer support agent handles inbound service requests for an e-commerce platform — looking up orders, processing refunds, and escalating edge cases to human agents. It operates autonomously within defined authorization limits and is the first point of contact for thousands of daily interactions. Stakes are high: incorrect refunds are financial losses; missed escalations erode customer trust; over-escalation wastes human agent time.

## Architecture

**Components:**
- Claude-powered agent in a persistent conversation loop
- Four primary tools: `get_customer`, `lookup_order`, `process_refund`, `escalate_to_human`
- PreToolUse hook that intercepts `process_refund` calls before execution
- A structured `case-facts` block injected at the start of every system prompt
- Structured handoff payload generated when escalation is triggered

**Data Flows:**
1. Customer message arrives → agent reads `case-facts` block (customer tier, order history, prior contact reason)
2. Agent calls `lookup_order` to verify order state
3. Agent decides: resolve directly (refund under $500) or escalate
4. If refund: `process_refund` call is intercepted by PreToolUse hook → hook checks amount against $500 policy → approved or blocked
5. If escalation: agent calls `escalate_to_human` with a structured JSON payload summarizing the case

**Tools:**

| Tool | Purpose | Risk Level |
|---|---|---|
| `get_customer` | Read-only customer profile lookup | Low |
| `lookup_order` | Read-only order and shipment status | Low |
| `process_refund` | Writes to payment system | High — gated by hook |
| `escalate_to_human` | Triggers human queue | Medium |

## Domain Connections

| Domain | Key Concepts from This Scenario |
|---|---|
| D1 — Agent Architecture & Orchestration | Agentic loop design; acknowledge→resolve→escalate-on-reiteration pattern; when to stop and hand off |
| D2 — Tool Design & MCP Integration | Tool scoping (read vs write); PreToolUse hook as a policy enforcement layer; escalate as a tool vs a model decision |
| D4 — Prompt Engineering & Structured Output | Structured handoff payload; case-facts block formatting; prefill for consistent greeting format |
| D5 — Context Management & Reliability | Injecting case history without exceeding context; what goes in the system prompt vs injected per-turn |

## Key Design Decisions

**1. The $500 hook vs. prompt-only policy**
Putting the $500 refund limit in the system prompt relies on the model following instructions — that is probabilistic. A PreToolUse hook is deterministic: it fires before the tool executes, checks the amount field, and blocks the call if the threshold is exceeded. The exam tests whether you understand that hooks enforce policy, prompts request compliance.

**2. Escalate-on-reiteration pattern**
When a customer repeats the same complaint after the agent has already resolved it (or explained why it cannot be resolved), the correct signal is to escalate — not to re-resolve with the same answer. This pattern is baked into the system prompt: if `resolution_attempted == true` and the customer reiterates, trigger `escalate_to_human`. The exam tests distinguishing this from always-escalate or never-escalate strategies.

**3. Structured handoff payload**
When escalating, the agent must emit a JSON payload with fields like `customer_id`, `order_id`, `issue_summary`, `resolution_attempted`, and `sentiment`. This payload is tool input to `escalate_to_human`, not a freeform message. The exam tests knowing that structured output from an agent handoff prevents information loss and enables the receiving human agent to act immediately.

**4. case-facts block in the system prompt**
Customer context (tier, order count, prior contact reason) is injected as a structured `case-facts` block at the start of every system prompt, not rebuilt from conversation history. This keeps the agent grounded even if the conversation history is long or summarized. The exam tests understanding why this positioning matters (lost-in-the-middle risk for long histories).

**5. Tool count and reliability**
This agent uses exactly 4 tools. Adding more tools (e.g., `update_shipping_address`, `issue_store_credit`) increases the action space and the probability of incorrect tool selection. The exam tests the inverse relationship between tool count and reliability in single-agent systems.

## Typical Exam Question Patterns

**Pattern 1 — Hook vs. prompt enforcement:**
"A customer support agent has a policy not to process refunds over $500 without manager approval. Which implementation is most reliable?" — The correct answer is a PreToolUse hook that checks the refund amount before tool execution, not a system prompt instruction.

**Pattern 2 — Escalation trigger logic:**
"A customer has already received a refund, but continues to demand further compensation. What should the agent do?" — The correct answer is trigger `escalate_to_human` with the structured payload, using the escalate-on-reiteration pattern, not attempt another resolution.

**Pattern 3 — Handoff payload design:**
"When transferring a customer to a human agent, what should the structured payload include?" — The correct answer includes case facts, resolution history, and sentiment — not just the customer ID or a freeform summary.

## Common Mistakes

- **Confusing prompt policy with hook enforcement.** Candidates often choose "add the $500 limit to the system prompt" because it sounds correct. The exam distinguishes probabilistic (model follows instructions) from deterministic (hook intercepts before execution).
- **Treating escalation as a failure.** Escalation is a designed outcome, not an error. The system should generate a high-quality handoff payload when escalating, not simply transfer the raw conversation.
- **Over-engineering the tool set.** Adding tools for every possible action (store credit, address update, partial refund) increases failure surface. The exam rewards minimum viable tool sets for defined use cases.
- **Ignoring the case-facts positioning.** Putting case context at the end of a long conversation history means the model may underweight it (lost-in-the-middle). The case-facts block belongs at the top of the system prompt.

## Cross-Reference

| Concept | Module | Lab |
|---|---|---|
| Agentic loop and stop conditions | D1 — Agent Architecture | Lab 1 |
| PreToolUse hooks and policy enforcement | D2 — Tool Design & MCP | Lab 1 |
| Structured output and handoff payloads | D4 — Prompt Engineering | Lab 4 |
| Context injection and case-facts positioning | D5 — Context Management | — |
| Tool count and reliability tradeoff | D2 — Tool Design & MCP | — |
