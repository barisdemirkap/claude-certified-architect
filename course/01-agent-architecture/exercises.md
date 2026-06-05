# Exercises — Agent Architecture & Orchestration

Applied practice. These are not multiple-choice — write out your answer before expanding.

---

## Exercise 1: Fix the Broken Loop

The following Python pseudocode implements an agentic loop. Identify every bug and rewrite the loop correctly.

```python
def run_agent(messages):
    for i in range(10):  # max 10 iterations
        response = client.messages.create(
            model="claude-opus-4-5",
            messages=messages
        )
        text = response.content[0].text
        if "TASK_COMPLETE" in text or "I'm done" in text:
            return text
        # execute tool if present
        if response.stop_reason == "tool_use":
            tool_result = execute_tool(response)
            messages.append(tool_result)
    return "Agent did not complete"  # fallback
```

List each bug, explain why it is wrong, and provide a corrected version.

<details><summary>Answer</summary>

**Bug 1: `for i in range(10)` as the primary loop control.**
A hard iteration cap is wrong. The loop must continue as long as the model produces `stop_reason == "tool_use"`. If a legitimate task requires 11 tool calls, this loop abandons it and returns a fallback. The cap can exist as a safety ceiling (to prevent infinite loops on bugs), but it must not be the normal exit path.

**Bug 2: Text-parsing exit condition (`"TASK_COMPLETE" in text`).**
Checking the response text for keywords is fragile. Claude's phrasing varies; it might say "I've completed the task" in one run and "Done" in another. The only authoritative completion signal is `stop_reason == "end_turn"`.

**Bug 3: The `messages.append(tool_result)` line does not append the assistant's response first.**
Before appending the tool result, the assistant's response (containing the `tool_use` block) must be added to the message list. Skipping this corrupts the conversation history.

**Bug 4: The fallback `return "Agent did not complete"` silently hides failures.**
If the loop exhausts iterations, the caller has no way to distinguish "the agent truly finished" from "the agent was cut off." The fallback should raise an exception or return a structured error.

**Corrected version:**

```python
MAX_ITERATIONS = 50  # safety ceiling only

def run_agent(messages):
    for _ in range(MAX_ITERATIONS):
        response = client.messages.create(
            model="claude-opus-4-5",
            messages=messages
        )
        if response.stop_reason == "end_turn":
            return response  # legitimate completion
        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            tool_result = execute_tool(response)
            messages.append({"role": "user", "content": tool_result})
        else:
            raise RuntimeError(f"Unexpected stop_reason: {response.stop_reason}")
    raise RuntimeError("Agent hit MAX_ITERATIONS safety ceiling — possible loop bug")
```

</details>

---

## Exercise 2: Design the Context Payload

A coordinator agent has retrieved the following information from its own tools:

- Customer name: "Maria Santos"
- Order ID: "ORD-78234"
- Order contents: 3x Widget Pro, 1x Widget Case
- Order status: "shipped — in transit"
- Customer's complaint: "I ordered 2 weeks ago and still haven't received anything"
- Expected delivery date from logistics API: 2026-06-08
- Customer's account tier: "Premium"
- Escalation policy: Premium customers get expedited resolution

You are dispatching a `resolve_complaint` subagent via the `Task` tool. Write the complete context payload you would pass in the Task invocation. Include: the task description, all data the subagent needs, the output format specification, and any constraints.

<details><summary>Answer</summary>

A well-formed Task invocation context payload for this scenario:

```
Task: Resolve a shipping delay complaint from a Premium customer.

## Customer Information
- Name: Maria Santos
- Account Tier: Premium (expedited resolution required)
- Complaint: "I ordered 2 weeks ago and still haven't received anything"

## Order Details
- Order ID: ORD-78234
- Contents: 3x Widget Pro, 1x Widget Case
- Current Status: Shipped — in transit
- Expected Delivery Date: 2026-06-08 (today is 2026-06-05, so delivery is 3 days away)

## Resolution Guidelines
- Acknowledge the delay concern empathetically
- Inform the customer of the current status and expected delivery date
- For Premium customers: offer a proactive gesture (e.g., expedited shipping credit on next order) if delivery is more than 5 days away — in this case it is 3 days away, so standard resolution applies
- Attempt full resolution; escalate ONLY if customer reiterates the same concern after receiving this information
- Do NOT promise a specific delivery time beyond what the logistics system states

## Required Output Format
Return a JSON object with the following fields:
{
  "customer_response": "<string — the message to send to the customer>",
  "resolution_status": "resolved" | "escalated" | "pending",
  "escalation_reason": "<string or null>",
  "actions_taken": ["<list of actions>"]
}
```

**Why each piece matters:**
- Customer tier is included because the subagent must apply the Premium escalation policy — it cannot look this up on its own.
- Today's date context is included so the subagent can calculate that delivery is 3 days away (the 5-day threshold for proactive gesture).
- Output format is specified explicitly so the coordinator can parse the response deterministically.
- The "do NOT promise" constraint is included because the subagent has no access to the coordinator's broader policy knowledge.

</details>

---

## Exercise 3: Hooks or Prompt? — Business Rules Triage

For each of the following business rules, decide whether to implement it as a hook (`PreToolUse`, `PostToolUse`) or as a prompt instruction. Justify each decision.

1. "The agent should generally prefer to use the internal knowledge base before searching the web."
2. "No refund may be processed for more than $1,000 without a manager approval token present in the request."
3. "When returning customer records, strip the `internal_credit_score` field before the model sees it."
4. "The agent should introduce itself as 'Aria' in the first message of every conversation."
5. "The `delete_account` tool must never be called for accounts created in the last 30 days."
6. "The agent should write responses in a friendly, conversational tone."
7. "Every call to the `send_email` tool must be logged to the audit table with a timestamp."

<details><summary>Answer</summary>

1. **Prompt instruction.** "Generally prefer" is a soft guideline — probabilistic behavior is acceptable. A hook would be over-engineering.

2. **`PreToolUse` hook.** "No refund may be" + a dollar limit = hard financial constraint. This must fire on every invocation. A prompt instruction that says "never process refunds over $1,000" is ~90% reliable — not acceptable for financial compliance. The hook checks the amount in the tool input before execution and blocks the call if it exceeds the limit without a valid approval token.

3. **`PostToolUse` hook.** The tool has already run and returned data. You cannot prevent the data from being retrieved (that is fine — the data is allowed). You want to transform the result before the model sees it. `PostToolUse` intercepts the result and deletes the `internal_credit_score` field.

4. **Prompt instruction.** Phrasing and introduction style are soft behavioral guidelines. Occasional variation is acceptable — it does not create a compliance or security risk.

5. **`PreToolUse` hook.** "Must never be called" + a condition = hard constraint. The hook checks the account creation date before allowing the `delete_account` tool to execute. If the account is less than 30 days old, the hook blocks the call. A prompt instruction is not sufficient for an irreversible destructive action.

6. **Prompt instruction.** Tone and style are soft guidelines — exactly what system prompts are designed for.

7. **`PostToolUse` hook.** This is an audit/compliance requirement that must fire on every email send. The hook fires after the tool executes and writes the log entry. Using `PostToolUse` (rather than `PreToolUse`) is correct here because you want to log the actual execution, not a blocked attempt. If you need to log both attempts and executions, use both hooks.

</details>

---

## Exercise 4: Spot the Decomposition Anti-Pattern

A team has built a coordinator agent that answers the question "What is the total revenue for Q1 broken down by product category?" using the following decomposition:

1. Subagent 1: Retrieve January sales records
2. Subagent 2: Retrieve February sales records
3. Subagent 3: Retrieve March sales records
4. Subagent 4: Filter January records to remove refunds
5. Subagent 5: Filter February records to remove refunds
6. Subagent 6: Filter March records to remove refunds
7. Subagent 7: Aggregate January net revenue by category
8. Subagent 8: Aggregate February net revenue by category
9. Subagent 9: Aggregate March net revenue by category
10. Subagent 10: Sum category totals across all three months
11. Subagent 11: Format the output as a table

Identify the problems with this decomposition and propose a better design.

<details><summary>Answer</summary>

**Problems:**

1. **Over-narrow decomposition.** Steps 1–3 retrieve data that steps 4–6 immediately filter. These could trivially be combined: retrieve and filter January in one step. Splitting them creates unnecessary round-trips.

2. **Artificial sequential dependencies.** Subagent 4 depends on Subagent 1, Subagent 7 depends on Subagent 4, etc. Many of these dependencies are architectural artifacts, not genuine data dependencies. January, February, and March can all be processed completely independently and in parallel.

3. **Trivial last steps.** Subagent 10 sums three numbers. Subagent 11 formats a table. These are operations that any agent can perform in a single response — dedicating a subagent to each is pure overhead.

4. **11 subagents for a 3-month aggregate query.** This is ~4x more coordination overhead than needed.

**Better design:**

- **3 parallel subagents** — one per month. Each retrieves its month's data, filters refunds, and aggregates revenue by category. All three run concurrently.
- **Coordinator** collects the three structured results (e.g., `{ "Electronics": 45000, "Accessories": 12000, ... }` from each month), sums the categories, and formats the final table itself. The coordinator's synthesis step is simple enough to handle directly.

This reduces 11 sequential-ish subagents to 3 genuinely parallel subagents plus coordinator synthesis. Latency drops by ~70%, and the dependency chain disappears entirely.

</details>

---

## Exercise 5: Escalation Flow Trace

A customer support agent receives the following conversation. For each agent response, mark it as CORRECT or WRONG based on the escalation pattern, and explain why.

**Customer message 1:** "I'm really frustrated — my delivery is late and no one is helping me!"

**Agent response A:** "I'm so sorry to hear you're frustrated. Let me look into your order status right now. [checks order] Your order shipped on June 2nd and is expected to arrive by June 8th — that's 3 days from now. Is there anything else I can help you with?"

**Customer message 2:** "June 8th?? That's still too long. I need this for an event tomorrow."

**Agent response B:** "I understand this is time-sensitive. Unfortunately, I cannot change the delivery date, but I can offer you a 15% discount on your next order as an apology for the inconvenience."

**Customer message 3:** "This is unacceptable. I want to speak to a manager."

**Agent response C:** "I completely understand. Let me connect you with a senior support specialist who can assist you further. [escalates]"

<details><summary>Answer</summary>

**Agent response A: CORRECT.**
The agent acknowledges the frustration and immediately attempts resolution by retrieving order status and providing concrete information (delivery date). This is the correct first step: acknowledge + attempt resolution. No escalation yet — the customer has not yet reiterated after a resolution attempt.

**Agent response B: CORRECT.**
The customer expressed that the resolution (delivery date) does not meet their need. The agent acknowledges the constraint and offers an alternative gesture (discount). This is a second resolution attempt. The agent is not yet escalating — the customer has raised a new concern (event deadline), and the agent is attempting to address it. This is correct behavior.

**Agent response C: CORRECT.**
The customer explicitly requested a manager after two resolution attempts (delivery info + discount offer). This is a clear re-iteration — the customer is persisting with an unresolved need after genuine attempts. Escalation at this point is correct.

**Overall assessment:** This flow follows the pattern perfectly. Acknowledge → Attempt 1 → Acknowledge new concern → Attempt 2 → Escalate on explicit persistence. Note that escalation was triggered by the customer's explicit request ("I want to speak to a manager"), which is the clearest possible persistence signal, not by frustration alone.

**What a wrong flow would look like:** An agent that escalated after Message 1 ("I'm really frustrated") — before any resolution attempt — would be incorrectly treating sentiment as the escalation trigger.

</details>

---

## Exercise 6: Error Propagation Design

A coordinator dispatches 4 subagents in parallel:
- Subagent A: Retrieves product inventory data — **succeeds**, returns structured JSON
- Subagent B: Retrieves pricing data — **fails** with a timeout error
- Subagent C: Retrieves competitor pricing — **succeeds**, returns structured JSON
- Subagent D: Generates a price recommendation — **fails** with "insufficient context" error

Design the coordinator's response strategy. What should the coordinator return to the caller? What information must be included?

<details><summary>Answer</summary>

**The coordinator should NOT fail the entire request.** Two of four subagents succeeded and returned useful data. Discarding that work would be a correctness failure.

**Correct strategy: partial result with explicit failure annotations.**

The coordinator should return a structured response that includes:

1. **Successful results** from Subagents A and C — inventory data and competitor pricing are available and should be included.

2. **Explicit failure annotations** for Subagents B and D:
   - Subagent B (pricing data): timed out — pricing data unavailable. Caller should decide whether to retry or proceed without current pricing.
   - Subagent D (price recommendation): failed due to insufficient context — this is likely because it depended on Subagent B's pricing data. With pricing data unavailable, a recommendation cannot be generated. This is a cascading failure the coordinator should detect and annotate.

3. **Actionability guidance** — the coordinator should indicate which partial data is still useful. Inventory + competitor pricing can support a manual pricing review even without the automated recommendation.

**Example structured response:**
```json
{
  "status": "partial",
  "results": {
    "inventory": { ... },  // from Subagent A
    "competitor_pricing": { ... }  // from Subagent C
  },
  "failures": {
    "pricing_data": {
      "error": "timeout",
      "impact": "automated price recommendation unavailable"
    },
    "price_recommendation": {
      "error": "dependency_failure",
      "dependency": "pricing_data",
      "impact": "cannot generate recommendation without pricing data"
    }
  },
  "usable_for": "manual pricing review using competitor data and inventory"
}
```

**What NOT to do:** Silently return only the successful results without indicating that pricing and recommendation data are missing. The caller has no way to know the response is incomplete, and may make decisions based on a false assumption of completeness.

</details>
