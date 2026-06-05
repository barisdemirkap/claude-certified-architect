# STARTER — Lab 1: ShopFlow Customer Support Agent

## Environment & Dependencies

**Python (recommended):**
```bash
pip install anthropic
```
SDK: https://github.com/anthropics/anthropic-sdk-python
Requires Python 3.9+. Set `ANTHROPIC_API_KEY` in your environment.

**TypeScript alternative:**
```bash
npm install @anthropic-ai/sdk
```
SDK: https://github.com/anthropics/anthropic-sdk-typescript

Use `claude-3-5-sonnet-20241022` or `claude-3-5-haiku-20241022` for all API calls in this lab. Haiku is cheaper for iteration; swap to Sonnet for final testing.

---

## Architecture Scaffold

Build these components in order. Do not write full implementations yet — understand what each piece owns.

**1. Tool definitions** (`tools.py` / `tools.ts`)
- Four tool schema dicts/objects matching the Anthropic tools format
- Stub implementations returning fixture data
- Each stub should have at least two fixture cases (found / not found, success / error)

**2. PreToolUse hook** (`hooks.py` / `hooks.ts`)
- Single function: `pre_tool_use_hook(tool_name: str, tool_input: dict) -> dict | None`
- Returns `None` to allow the call, or a synthetic tool-result dict to block it
- Keep this function pure and stateless

**3. Tool dispatcher** (part of your main loop)
- Maps tool names to implementation functions
- Calls the hook first, returns the hook result if not None
- Wraps each tool call in a try/except to distinguish exception types

**4. Orchestrator / main loop** (`agent.py` / `agent.ts`)
- Builds the initial messages array
- Calls `messages.create()` in a loop
- Appends tool results and continues on `stop_reason == "tool_use"`
- Returns the final text content on `stop_reason == "end_turn"`

**5. Context manager** (`context.py` / `context.ts`)
- Tracks turn count
- Maintains the case-facts block separately
- Provides `trim_history(messages, case_facts)` for use at turn >10

**6. System prompt** (string constant or file)
- Persona, policy rules, escalation guidance
- Placeholder for case-facts injection

---

## Key Documentation

Read these before writing any code:

- **Tool use guide:** https://docs.anthropic.com/en/docs/tool-use
  - Pay attention to the `tool_use` and `tool_result` message formats — the structure is exact
- **Agentic loop patterns:** https://docs.anthropic.com/en/docs/agents-and-tools/agentic-loop
  - Focus on the `stop_reason` handling section — this is directly exam-tested
- **Context window management:** https://docs.anthropic.com/en/docs/context-windows
  - The summarization pattern for long conversations
- **Error handling:** https://docs.anthropic.com/en/docs/tool-use#handling-tool-use-and-tool-results
  - The `is_error` field on tool results — how Claude interprets it

---

## Approaching Milestone 1

Start here — everything else builds on getting the loop right.

**Step 1 — Write your tool schemas.** Before any API call, write the four JSON tool schemas. Verify them against the Anthropic tool-use format: each needs `name`, `description`, and `input_schema` with `type: "object"` and `properties`.

**Step 2 — Write stub implementations.** `get_customer("CUST-12345")` returns a hardcoded dict. `lookup_order("ORD-98765")` returns a hardcoded order. Make one fixture that returns `null` / `None` for an unknown ID.

**Step 3 — Write the loop skeleton.** The shape is:

```python
messages = [{"role": "user", "content": customer_message}]

while True:
    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        tools=TOOL_SCHEMAS,
        messages=messages
    )

    if response.stop_reason == "end_turn":
        # extract and return final text
        break

    if response.stop_reason == "tool_use":
        # process tool calls, append results
        # continue loop
        pass
```

Do not add hook logic or context trimming yet. Get a clean `end_turn` exit first.

**Step 4 — Verify tool result format.** After a tool call, your messages array must look like:

```python
# assistant turn with tool_use block
{"role": "assistant", "content": response.content}

# user turn with tool_result block
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": tool_use_block.id,    # must match exactly
      "content": json.dumps(result_dict)
    }
  ]
}
```

Getting the `tool_use_id` wrong is the most common first bug.

---

## Common Stumbling Blocks

**1. Exiting the loop on text output, not `stop_reason`**

Wrong: `if "I hope this helps" in response_text: break`
Right: `if response.stop_reason == "end_turn": break`

Claude can output text AND request tool calls in the same response in some configurations. The only reliable signal is `stop_reason`. Anything else will cause silent truncation.

**2. Confusing `null` return vs. exception in tool dispatch**

`lookup_order` returning `None` means "order not found" — a valid business state. An exception means the tool itself failed (network timeout, etc.). Handle them separately: `None` gets a "not found" message to Claude; an exception gets a retry or error escalation. If you catch both as `except Exception`, you will retry on order-not-found forever.

**3. Hook blocks must look like valid tool results**

Claude receives hook blocks as `tool_result` entries in the messages array. If you return a raw string instead of a properly formed tool-result dict (with `type: "tool_result"`, `tool_use_id`, and `content`), the API will reject the messages array with a validation error. The hook output must be indistinguishable in format from a real tool result.

**4. Escalating too eagerly or never escalating**

The escalation condition is: customer reiterates dissatisfaction AFTER the agent has made a resolution attempt. "I'm frustrated" on message 1 should NOT trigger escalation — the agent should acknowledge and try. Only after the agent has tried and the customer says "that still didn't help" or similar should `escalate_to_human` be called. Test both paths explicitly. The wrong pattern is checking for negative-sentiment keywords; the right pattern is tracking state: `resolution_attempted: bool`.
