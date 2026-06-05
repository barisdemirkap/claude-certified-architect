# SPEC — Lab 1: ShopFlow Customer Support Agent

## Architecture Overview

```
Customer Message
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  Orchestrator (your code)                            │
│  - Builds messages array                             │
│  - Manages the agentic loop                          │
│  - Fires hooks before/after tool calls               │
│  - Handles tool results and errors                   │
└──────────────────┬──────────────────────────────────┘
                   │  messages.create()
                   ▼
         ┌──────────────────┐
         │   Claude (API)   │
         │  stop_reason:    │
         │  "tool_use" /    │
         │  "end_turn"      │
         └──────┬───────────┘
                │ tool_use blocks
                ▼
┌───────────────────────────────────────────────────────┐
│  PreToolUse Hook (runs before EVERY tool call)        │
│  - If tool == process_refund AND amount > 200 → block │
│  - Returns structured block message to Claude         │
└──────────────────────┬────────────────────────────────┘
                       │ (if not blocked)
                       ▼
         ┌─────────────────────────┐
         │  Tool Execution Layer   │
         │  get_customer()         │
         │  lookup_order()         │
         │  process_refund()       │
         │  escalate_to_human()    │
         └────────────┬────────────┘
                      │ tool_result
                      ▼
              back to Orchestrator
              (loop continues until
               stop_reason == "end_turn")
```

**Components:**
- **Orchestrator** — your main loop; never exits until `stop_reason == "end_turn"`
- **System Prompt** — defines agent persona, policy rules, and case-facts structure
- **PreToolUse Hook** — stateless function called before every tool dispatch
- **Tool Implementations** — four functions with typed return values and distinct error surfaces
- **Context Manager** — trims summarized history at turn >10, always preserves case-facts block

---

## Milestone M1 — Grounded Lookup and Loop Termination

**Requirements:**

1. Accept a customer message with a `customer_id` and `order_id` embedded or provided as metadata.
2. On first turn, the agent MUST call `get_customer(customer_id)` and `lookup_order(order_id)` before formulating any response.
3. The orchestrator runs a `while True` loop that calls `messages.create()` and continues only if `stop_reason == "tool_use"`.
4. The loop exits ONLY when `stop_reason == "end_turn"`. No other exit condition is permitted — not iteration count, not detecting a final phrase in the text.
5. Tool results are appended to the messages array in the correct `tool_result` format before the next API call.
6. The agent's final text response must reference facts from the tool results (order status, customer name, etc.).

**Definition of done:** A test where the customer asks "What's the status of my return?" produces a response naming the actual order item and status from `lookup_order`, and the loop never exits early.

---

## Milestone M2 — PreToolUse Hook: Refund Guard

**Requirements:**

1. Implement a `pre_tool_use_hook(tool_name, tool_input)` function that runs before every tool call dispatch.
2. When `tool_name == "process_refund"` and `tool_input["amount"] > 200`, the hook MUST block the call.
3. On block, return a structured message to Claude in the tool_result position with `is_error: true` and a body like: `{"blocked": true, "reason": "Refund amount $X exceeds the $200 automated limit. You must escalate this to a human agent using escalate_to_human.", "action_required": "escalate"}`.
4. The hook must NOT modify the messages array or call the API — it only returns a synthetic tool result.
5. Claude must respond by calling `escalate_to_human` after receiving the block message — verify this in your test.
6. The hook fires for ALL tool calls (not just `process_refund`) — it's a no-op for the others unless you add future rules.

**Definition of done:** Sending "I want a refund for my $350 order" causes the hook to fire, Claude receives the block, and Claude's next action is `escalate_to_human`.

---

## Milestone M3 — Escalation Logic

**Requirements:**

1. The agent must NOT escalate on the first expression of frustration ("I'm really upset about this"). Acknowledge and attempt resolution first.
2. The agent MUST escalate if the customer expresses continued dissatisfaction AFTER a resolution has been attempted. The trigger is reiteration, not sentiment.
3. Escalation is performed by calling `escalate_to_human(customer_id, issue_summary, urgency, context_payload)` — not by outputting a phrase.
4. The urgency field must be determined by the agent based on context: `"high"` if the customer is clearly distressed or the order is time-sensitive, `"normal"` otherwise.
5. After escalation, the agent must confirm to the customer that a human will follow up and stop attempting to resolve the issue further.

**Test cases to verify:**
- Single message "I'm furious about my order" → agent acknowledges, attempts resolution → NO escalation yet
- Follow-up "That didn't help, I'm still not satisfied" → agent calls `escalate_to_human` → confirms handoff

---

## Milestone M4 — Full System: Structured Handoff, Error Handling, Context Trimming

**Requirements:**

**Structured handoff payload** (`context_payload` in `escalate_to_human`):
```json
{
  "customer_name": "string",
  "customer_id": "string",
  "order_id": "string",
  "order_summary": "string",
  "issue_description": "string",
  "resolution_attempts": ["array of what was tried"],
  "escalation_reason": "string",
  "conversation_turn_count": "integer",
  "refund_amount_if_applicable": "number | null"
}
```

**Tool error handling:**
- `lookup_order` returning `null` (order not found) → respond "I couldn't find that order ID — can you double-check it?" — do NOT retry
- `lookup_order` raising a timeout exception → retry once with the same arguments — if still failing, apologize and escalate
- `process_refund` returning an error object → parse the error code and respond accordingly — do NOT retry silently

**Context trimming (>10 turns):**
- Maintain a `case_facts` block at the top of the system prompt or as a pinned first user message
- After turn 10, replace the middle of the conversation history with a 3-5 sentence summary
- `case_facts` block is NEVER summarized — it must always be present verbatim
- Format: `[CASE FACTS]\nCustomer: {name}\nOrder ID: {order_id}\nIssue: {original_issue}\nResolution attempts: {list}\n[/CASE FACTS]`

---

## Input/Output Contract

**Agent input:**
```json
{
  "customer_id": "CUST-12345",
  "order_id": "ORD-98765",
  "message": "I want to return my jacket, it arrived damaged."
}
```

**Agent output (text response):** Plain prose, empathetic tone, factually grounded in tool results.

**Escalation output** (via tool call, not text):
```json
{
  "customer_id": "CUST-12345",
  "issue_summary": "Customer received damaged jacket (ORD-98765). Refund of $350 blocked by policy.",
  "urgency": "high",
  "context_payload": { ... }
}
```

---

## Constraints (Out of Scope)

- No actual database or HTTP backend — tool implementations may be stubs returning fixture data
- No streaming responses — use standard `messages.create()` (blocking)
- No multi-customer concurrency — single conversation thread only
- No authentication or session management
- No UI — CLI or simple script is sufficient
- No MCP server setup — tools are local function calls, not MCP-registered tools
