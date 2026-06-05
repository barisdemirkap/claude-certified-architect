# CHECKLIST — Lab 1: ShopFlow Customer Support Agent

## Milestone M1 — Grounded Lookup and Loop Termination

- [ ] Tool schemas for all four tools are written and match Anthropic's `tool_use` format exactly
- [ ] `get_customer` and `lookup_order` stubs return fixture data with at least two cases each
- [ ] Orchestrator calls `messages.create()` inside a `while True` loop
- [ ] Loop exit condition is `stop_reason == "end_turn"` — no other exit condition exists
- [ ] Loop continues when `stop_reason == "tool_use"` and processes all tool calls in the response
- [ ] Tool results are appended using the correct `tool_result` block format with matching `tool_use_id`
- [ ] Final agent response references actual data from tool results (customer name, order status, item)
- [ ] No hardcoded "max iterations" fallback or text-pattern exit

---

## Milestone M2 — PreToolUse Hook: Refund Guard

- [ ] `pre_tool_use_hook(tool_name, tool_input)` is implemented as a standalone function
- [ ] Hook is called before every tool dispatch (not just `process_refund`)
- [ ] When `tool_name == "process_refund"` and `amount > 200`, hook returns a synthetic block
- [ ] Block response is a valid `tool_result` dict with `is_error: true` and a structured explanation
- [ ] Block message tells Claude the exact reason and specifies `action_required: "escalate"`
- [ ] Hook returns `None` (allow) for all other calls or amounts within limit
- [ ] Test: $350 refund request → hook fires → Claude receives block → Claude calls `escalate_to_human`
- [ ] Test: $50 refund request → hook passes → `process_refund` executes normally

---

## Milestone M3 — Escalation Logic

- [ ] Agent acknowledges and attempts resolution on first customer frustration message
- [ ] `escalate_to_human` is NOT called after a single expression of dissatisfaction
- [ ] Agent tracks state: `resolution_attempted` is true after making a resolution offer
- [ ] Agent calls `escalate_to_human` when customer reiterates dissatisfaction after a resolution attempt
- [ ] Urgency field is set to `"high"` for distressed customers or time-sensitive orders, `"normal"` otherwise
- [ ] After escalation call, agent text confirms human follow-up and does not attempt further resolution
- [ ] Test: "I'm furious" (turn 1) → no escalation, resolution attempted
- [ ] Test: "That didn't help, still not satisfied" (after resolution) → `escalate_to_human` called

---

## Milestone M4 — Full System

- [ ] `escalate_to_human` context_payload contains all required fields: customer_name, customer_id, order_id, order_summary, issue_description, resolution_attempts, escalation_reason, conversation_turn_count, refund_amount_if_applicable
- [ ] `lookup_order` returning `None` → agent responds "couldn't find that order ID" — no retry
- [ ] `lookup_order` raising timeout exception → one retry, then apologize and escalate
- [ ] `process_refund` returning error object → parse error code, respond accordingly
- [ ] Turn count is tracked and context trimming is triggered at turn >10
- [ ] Case-facts block is preserved verbatim and never included in the summary
- [ ] Middle conversation turns are replaced with a 3-5 sentence summary after trimming
- [ ] Full end-to-end test: damaged-item return scenario, refund blocked, escalation with complete payload

---

## Exam-Objective Coverage

| Objective | How This Lab Covers It |
|---|---|
| Agentic loop: exit only on `stop_reason == "end_turn"` | M1 requires the loop condition to be exactly `stop_reason == "end_turn"`; wrong exit conditions cause M1 to fail |
| Hooks enforce hard business rules at infrastructure level | M2 is unsolvable by prompt alone — the hook must block at the dispatch layer |
| Tool schema design and error surfaces | M1-M2 require four correct tool schemas; M4 requires distinguishing null return from exception |
| Structured handoff with full context | M4 escalation payload must include all fields a human agent needs — no gaps |
| Escalation timing (acknowledge before escalating) | M3 test cases directly verify that premature escalation fails |
| Context management in long conversations | M4 context trimming requirement exercises the case-facts pinning pattern |
| Tool failure retry logic | M4 distinguishes timeout (retry once) from not-found (no retry) |

---

## Common Pitfalls

**Prompt-based refund enforcement** — If your M2 solution says "tell Claude in the system prompt not to process refunds over $200," this will not pass. The hook must exist as code. On the exam, this distinction is always framed as: hard compliance rules require hooks; soft preferences use prompts.

**Symmetrical error handling** — Treating `None` returns and exceptions the same way is incorrect and leads to infinite retry loops on order-not-found cases. Always branch on the error type.

**Incomplete escalation payload** — An escalation with missing `resolution_attempts` or no `escalation_reason` means the human agent has incomplete context. The exam tests whether you understand that escalation is a handoff, not just a flag.

**Premature escalation on sentiment** — Checking for words like "angry" or "frustrated" and immediately calling `escalate_to_human` fails the M3 test. The trigger is behavioral (reiteration after attempt), not lexical (negative words).

---

## Stretch Goals

- Add a `post_tool_use_hook` that logs every tool call with timestamp and result summary to a file
- Implement conversation replay: store the full messages array to JSON after each session, load it back for continuation
- Add a confidence field to the escalation payload (`"agent_confidence": 0.0-1.0`) where Claude estimates whether it could have resolved the issue
- Add a `get_policy(policy_name)` tool that retrieves ShopFlow's return policy text, and have the agent cite specific policy clauses in its responses
- Implement parallel tool calls for M1: call `get_customer` and `lookup_order` simultaneously in a single API turn rather than sequentially
