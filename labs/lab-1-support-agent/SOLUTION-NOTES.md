# SOLUTION NOTES — Lab 1: ShopFlow Customer Support Agent

> Architecture discussion only — not a full implementation. These notes explain the design decisions and tradeoffs an exam-ready solution requires. Read after attempting each milestone, not before.

---

## Key Design Decisions

### 1. Loop termination: `stop_reason` as the only exit signal

**Decision:** The orchestrator exits the agentic loop only when `response.stop_reason == "end_turn"`. No other condition (iteration count, text pattern matching, timeout) is valid.

**Rationale:** Claude controls when it is done. The model may interleave multiple tool calls across multiple turns before producing a final response. If you add an iteration cap, you silently truncate multi-step reasoning. If you match text like "Is there anything else I can help you with?", you will false-positive on mid-conversation phrases.

**The exam tradeoff:** Iteration cap vs. `stop_reason` — the exam will present this as "which is the correct termination signal?" The answer is always `stop_reason == "end_turn"`. The cost of getting this wrong in production is invisible truncation: the agent looks like it responded, but it never completed its tool-call chain.

---

### 2. PreToolUse hook: infrastructure enforcement vs. prompt guidance

**Decision:** The $200 refund cap is enforced in a `pre_tool_use_hook` function that intercepts every tool dispatch before the function is called, regardless of what Claude outputs.

**Rationale:** A system prompt instruction ("do not process refunds over $200") is probabilistic — it relies on Claude interpreting and following the rule correctly every time. A PreToolUse hook is deterministic — it fires unconditionally at the infrastructure layer. For compliance-critical rules, the hook is not optional.

**The exam tradeoff:** "Should this rule be in the prompt or in a hook?" — The signal to use a hook is: (a) the rule involves a hard dollar/quantity limit, (b) the consequence of violation is a compliance failure (not just a bad user experience), or (c) the rule must hold regardless of jailbreak, prompt injection, or unusual user phrasing. Exam questions will often present both options and ask you to identify which is "most reliable" or "most appropriate for a production system."

**Hook return format matters:** The hook must return a synthetic `tool_result` entry in the messages array. It is not an exception — it is a normal message-array entry with `is_error: true`. This tells Claude what happened and lets it respond with a tool call to `escalate_to_human`. If you raise a Python exception instead, you bypass Claude's reasoning and produce a crash, not a handoff.

---

### 3. Escalation timing: reiteration, not sentiment

**Decision:** `escalate_to_human` is called when the customer reiterates dissatisfaction after the agent has attempted resolution — not on the first expression of frustration.

**Rationale:** Escalating on sentiment alone means any customer who says "I'm upset" gets handed to a human without the agent attempting to help. This defeats the purpose of the agent and increases human workload. The correct signal is state-based: `resolution_attempted == True AND customer_still_unsatisfied`.

**The exam tradeoff:** The exam tests whether you understand that "acknowledge before escalating" is a two-step process. The wrong design escalates to defend against unhappy users. The right design treats escalation as a last resort after genuine resolution attempts, with the customer explicitly indicating that the agent's attempt was insufficient.

**Implementation signal:** You need a state variable (`resolution_attempted: bool`) that is set to `True` after the agent makes an offer (refund, replacement, etc.). The next time the customer expresses dissatisfaction, check that variable. If it is `True`, call `escalate_to_human`. If it is `False`, attempt resolution first.

---

### 4. Structured handoff payload: escalation as a context transfer

**Decision:** The `context_payload` in `escalate_to_human` contains every field a human agent needs to continue the conversation without re-asking the customer for information already given.

**Rationale:** A human agent receiving an escalation with no context will ask the customer to repeat themselves. This is the primary failure mode of poorly designed escalation systems. The payload must be self-contained: who the customer is, what they ordered, what was tried, why it failed, and what the current state is.

**The exam tradeoff:** "What should the escalation payload contain?" — The principle is: the human agent should be able to read the payload and immediately act, without reviewing the conversation transcript. If a field is missing, that information must come from the customer. Fields like `resolution_attempts` and `escalation_reason` are non-negotiable. An escalation without `resolution_attempts` looks like the agent gave up immediately.

---

### 5. Error handling: null vs. exception as distinct failure modes

**Decision:** `lookup_order` returning `None` and `lookup_order` raising an exception are handled by different code paths.

**Rationale:** `None` is a domain response — it means the order ID does not exist in the system. Retrying a not-found order will always return `None`. An exception is a system failure — network timeout, service unavailable — which may resolve on retry. Treating them the same leads to either silent failure (catching exceptions and returning "not found") or infinite retry (retrying not-found orders).

**The exam tradeoff:** "What is the correct handling for a tool that returns an error?" — The exam distinguishes between "tool execution failed" (exception, may retry) and "tool returned a valid negative result" (null/error object, do not retry). The pattern is: exceptions warrant one retry; null/structured error objects warrant a domain response ("I couldn't find that order — can you check the ID?").

---

## What a Strong Solution Looks Like

A passing M4 solution has all of these properties:

- The loop never exits before `stop_reason == "end_turn"`, verified by a test with two sequential tool calls
- The hook is a separate function with a clear signature, not inline logic in the loop
- The hook output is a valid `tool_result` block — the messages array would pass API validation
- `resolution_attempted` is tracked as explicit state, not inferred from conversation text
- The escalation payload has all nine specified fields — the human agent has full context
- `None` from `lookup_order` produces a "not found" response; a timeout produces one retry then escalation
- At turn 11, the messages array has: system prompt, case-facts block, summary of turns 1-8, turns 9-10, current turn — not the full history

A weak solution typically passes M1-M2 and fails M3 because it escalates on sentiment, or fails M4 because the escalation payload is missing `resolution_attempts`.

---

## Common Mistakes and Fixes

**Mistake: Loop exits after 5 iterations "to prevent infinite loops"**
Fix: Remove the counter. The model's `stop_reason == "end_turn"` is the only exit. If you are worried about runaway loops, add a timeout on the wall clock (e.g., 60 seconds total), not an iteration count. A runaway loop is a model failure, not a normal loop continuation.

**Mistake: Hook raises an exception to block the call**
Fix: Return a synthetic `tool_result` dict instead. The exception exits your loop entirely. The synthetic result tells Claude what happened and lets it decide next steps — which is the behavior you want.

**Mistake: Escalation payload is built from memory (Claude's summary) not from tracked state**
Fix: Track `resolution_attempts` as a list in your orchestrator state. Append to it every time the agent makes an offer. Pass the list directly into the payload. Do not ask Claude to recall what it tried — it may hallucinate or omit.

**Mistake: Case-facts block is included in the summarized history**
Fix: Store case-facts separately, always insert them at the top of the context, and exclude them from the range of messages you summarize. The summary covers only the middle turns, never the case-facts block.

**Mistake: `process_refund` is retried after a structured error response**
Fix: Distinguish the error code. A structured error from `process_refund` (e.g., `{"error": "duplicate_refund"}`) is a business response — it means don't retry, handle it differently. Only exceptions (Python `Exception` subclasses) warrant retry logic.

---

## Connection to Exam Concepts

**D1 — Agent Architecture & Orchestration**
This lab is the agentic loop in its simplest complete form. The loop termination pattern (`stop_reason == "end_turn"`) is directly tested in Domain 1 questions. The escalation decision logic (state-based, not sentiment-based) is a recurring exam scenario across Customer Support Agent and Conversational AI Architecture Patterns scenarios.

**D2 — Tool Design & MCP Integration**
The four tool schemas test whether you can design clean input/output contracts. The error-surface distinction (null vs. exception) is a Domain 2 concept. The hook pattern — where infrastructure enforces rules rather than the model — is the central design tradeoff in D2.

**D5 — Context Management & Reliability**
The context trimming requirement (case-facts pinned, middle summarized) is the core D5 pattern. The retry logic (once on exception, never on null) maps to the reliability taxonomy in Domain 5. The hook itself is a reliability mechanism: it makes a critical business rule immune to model variability.

The rule that connects all three domains in this lab: **deterministic over probabilistic** — hooks over prompts, `stop_reason` over text parsing, state variables over sentiment inference.
