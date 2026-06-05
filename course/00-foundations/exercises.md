# Exercises — Module 00: Foundations
Applied practice — not multiple choice. Work through each before revealing the answer.

---

## Exercise 1: Identify the stop_reason

For each of the following situations, identify the correct `stop_reason` value and the correct action to take next.

**Situation A:** The model returns a response that ends with a well-formed paragraph summing up the answer. The `messages` array now has 6 entries.

**Situation B:** The model's response is 1,024 tokens — exactly equal to the `max_tokens` parameter that was set for this request. The response ends mid-sentence.

**Situation C:** The model's response includes a structured block requesting a call to the `get_customer` function with `{"customer_id": "C-4892"}` as arguments.

**Situation D:** The model response contains the text "---END---" and the request included `stop_sequences: ["---END---"]`.

<details><summary>Answer</summary>

**A:** `stop_reason == "end_turn"`. The model finished naturally. Accept the response and display it to the user. No further API call is needed.

**B:** `stop_reason == "max_tokens"`. The response was truncated — the model did not finish. The correct action is NOT to display the response as complete. You should either increase `max_tokens` and retry, or handle truncation explicitly (for example, by asking the model to continue). Never surface a `"max_tokens"` response as a complete answer.

**C:** `stop_reason == "tool_use"`. The model wants to call a tool. Execute `get_customer(customer_id="C-4892")`, capture the result, append it to the conversation history as a `user` role message with a `tool_result` content block, and make the next API call to continue the loop.

**D:** `stop_reason == "stop_sequence"`. The model output matched a configured stop string. What to do next depends entirely on your application logic — stop sequences are user-defined signals. In many patterns this indicates a structured output boundary or a deliberate completion marker. It does not automatically mean the response is complete in the same way `"end_turn"` does.
</details>

---

## Exercise 2: Fix This Agentic Loop

The following Python pseudocode has a bug that will cause unreliable behavior in production. Identify the bug and rewrite the loop condition correctly.

```python
def run_agent_loop(messages, system, tools):
    for iteration in range(10):  # max 10 iterations
        response = client.messages.create(
            model="claude-sonnet-4-6",
            system=system,
            messages=messages,
            tools=tools,
            max_tokens=4096
        )

        if "TASK_COMPLETE" in response.content[0].text:
            break

        if response.stop_reason == "tool_use":
            tool_result = execute_tool(response)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_result})
        else:
            break

    return response
```

<details><summary>Answer</summary>

There are two bugs, one critical and one minor.

**Bug 1 (critical): Checking response text for "TASK_COMPLETE"**
This is a text-parsing completion check. It will break if the model paraphrases, if the token limit truncates the word, or if the model legitimately uses that phrase in a different context. The correct completion signal is `stop_reason == "end_turn"`, not text content inspection.

**Bug 2 (critical): Using `range(10)` as the primary exit condition**
The loop can exit after 10 iterations even if `stop_reason` is `"max_tokens"` (truncated) or `"tool_use"` (unfinished). A fixed iteration count should be a safety fallback — never the primary exit condition.

**Corrected loop:**

```python
def run_agent_loop(messages, system, tools, max_iterations=20):
    for iteration in range(max_iterations):
        response = client.messages.create(
            model="claude-sonnet-4-6",
            system=system,
            messages=messages,
            tools=tools,
            max_tokens=4096
        )

        if response.stop_reason == "end_turn":
            return response  # natural completion — only valid exit

        if response.stop_reason == "max_tokens":
            raise RuntimeError("Response truncated — increase max_tokens or compress context")

        if response.stop_reason == "tool_use":
            tool_result = execute_tool(response)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_result})
            continue

    raise RuntimeError(f"Agent did not complete within {max_iterations} iterations")
```

Key changes: `"end_turn"` is the only normal exit; `"max_tokens"` raises an explicit error; the iteration limit is a hard safety cap that raises rather than silently returning a partial result.
</details>

---

## Exercise 3: Instruction Placement Decision

For each of the following instructions, decide whether it belongs in the **system prompt** or in a **user message**, and explain why.

1. "You are a helpful billing assistant for Acme Corp. You must never reveal internal pricing algorithms."
2. "For this specific request, please format your response as a numbered list."
3. "The maximum refund you are authorized to approve is $200."
4. "Can you summarize this document in bullet points?"
5. "You must always respond in formal English, even if the user writes in another language."

<details><summary>Answer</summary>

1. **System prompt.** This is the model's persona and a security constraint. It must hold for the entire conversation and cannot be allowed to drift. User messages cannot be trusted to maintain this.

2. **User message.** This is a per-request formatting instruction specific to one turn. It is not a standing rule — it applies only to this response. User messages are the correct place for conversational, per-turn instructions.

3. **System prompt.** This is an operator-level business rule. If placed in a user message, a sophisticated user could construct later messages that argue against or reframe the limit. The system prompt is harder to override and is the correct location for authorization constraints.

4. **User message.** This is the user's actual request — the question they are asking. It belongs in the conversation, not in standing instructions.

5. **System prompt.** This is a persistent behavioral constraint that must apply regardless of how the user communicates. It is not negotiable per-turn and must be enforced at the operator level.
</details>

---

## Exercise 4: Context Window Budget Audit

A developer builds an agent with the following components. The context window limit is 100,000 tokens. Estimate whether this design will hit context pressure problems in a typical 20-turn conversation, and identify which component to optimize first.

- System prompt: 3,000 tokens (detailed persona, rules, output format examples)
- Tool definitions: 8 tools × 500 tokens each = 4,000 tokens
- Each tool result: averages 2,000 tokens (full API response objects)
- Conversation history: each turn averages 400 tokens (user + assistant combined)
- 20-turn conversation: 20 × 400 = 8,000 tokens of conversation
- Typical number of tool calls per conversation: 15

Total estimate: 3,000 + 4,000 + (15 × 2,000) + 8,000 = **45,000 tokens**

<details><summary>Answer</summary>

**At 20 turns with 15 tool calls, the estimate is 45,000 tokens — well within the 100,000-token window.** This specific design does not immediately hit context pressure in a 20-turn conversation.

However, the risk is concentrated in **tool results**: 15 tool calls × 2,000 tokens each = 30,000 tokens — fully 67% of the total budget. This is the component to optimize first.

If tool call frequency increases to 40 calls (not unusual for complex research agents), tool results alone would be 80,000 tokens, leaving only 20,000 tokens for system prompt, tool definitions, and conversation history. That scenario would hit the limit.

**Recommended optimizations in priority order:**
1. Filter tool results before returning them to the model — if only 5 of 50 fields are needed, return only those 5. This is the highest-leverage change.
2. Enable prompt caching on the system prompt + tool definitions prefix (7,000 tokens) to reduce cost, though this does not affect the context budget.
3. Consider progressive summarization of older turns if conversations routinely exceed 30 turns, but be aware that summarization loses numeric precision.
</details>

---

## Exercise 5: Spot the Anti-Pattern

Read the following system design description. Identify every anti-pattern present and name the correct alternative for each.

> "Our customer support agent sends the customer's original complaint as the very first message in the `messages` array with role `user`. The operator rules (no refunds over $100, always escalate fraud cases) are appended to this first user message as a postscript. The agent loop runs for a fixed 5 iterations, and after each model response the code checks if the text contains the phrase 'Resolution complete' to decide whether to stop. We save money by not resending the conversation history — instead we summarize it in one sentence and send just that summary on each new call."

<details><summary>Answer</summary>

**Anti-pattern 1: Operator rules in a user message**
The rules "no refunds over $100" and "always escalate fraud cases" are operator-level constraints. Appending them to a user message gives them conversational authority, not operator authority — meaning a clever user could construct follow-up messages that argue against them. These rules must go in the `system` field (the system prompt).

**Anti-pattern 2: Fixed iteration count as the primary exit condition**
Running for exactly 5 iterations means the loop can terminate when `stop_reason` is `"max_tokens"` (truncated response) or `"tool_use"` (unfinished), silently producing wrong or incomplete answers. The correct primary exit condition is `stop_reason == "end_turn"`. A fixed iteration count should be a hard safety cap with an explicit error, not the normal exit path.

**Anti-pattern 3: Text parsing for "Resolution complete"**
Checking response text for a completion phrase is fragile. The model may paraphrase, the phrase may be truncated by `max_tokens`, or the phrase could appear in an unrelated context. The correct completion signal is `stop_reason == "end_turn"`.

**Anti-pattern 4: Replacing conversation history with a one-sentence summary**
This approach loses precision on every call. Numeric values, specific amounts, and exact commitments made in earlier turns become vague or disappear entirely after summarization. For a customer support agent where the exact refund amount and specific complaint details matter, this approach creates reliability failures. The full history should be retained until context pressure actually requires compression — and when compression is necessary, structured summaries with key facts explicitly preserved (amounts, dates, case IDs) are safer than a single vague sentence.
</details>

---

## Exercise 6: Prompt Caching Cost Analysis

An agentic pipeline sends 500 API calls per day. Each call includes:
- A system prompt of 4,000 tokens (same on every call)
- Tool definitions of 2,000 tokens (same on every call)
- A dynamic conversation history averaging 3,000 tokens (unique per call)

Without prompt caching, all 9,000 tokens are billed as uncached input on every call.
With prompt caching enabled on the stable prefix (6,000 tokens), only the 3,000 dynamic tokens are billed as uncached input per call.

If uncached input costs 1x and cached input costs 0.1x (a typical caching discount):

1. Calculate the daily uncached input cost in "token-cost units" without caching.
2. Calculate the daily input cost with caching.
3. What percentage of input cost is saved?

<details><summary>Answer</summary>

**Without caching:**
500 calls × 9,000 tokens × 1.0 cost-per-token = **4,500,000 token-cost units**

**With caching:**
- Uncached (dynamic history): 500 × 3,000 × 1.0 = 1,500,000 units
- Cached (stable prefix, cache hit): 500 × 6,000 × 0.1 = 300,000 units
- Total: **1,800,000 token-cost units**

**Savings:** (4,500,000 - 1,800,000) / 4,500,000 = **60% reduction in input token cost**

This illustrates why prompt caching is the first cost optimization to apply to any agentic system with a stable, long system prompt — it is a structural saving on every call with minimal implementation overhead.
</details>
