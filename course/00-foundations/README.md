# Module 00 — Foundations
⏱ Estimated time: 3h
Guide ref: guide_en.MD lines 1–196

## Learning Objectives

- Describe what the Messages API does and does not remember between calls
- Identify the four possible `stop_reason` values and the correct action for each
- Explain the difference between the system prompt and user messages, and when each is appropriate
- Calculate what competes for space in a context window and predict the effects of context pressure
- Apply token economics concepts to reduce cost on stable prompt prefixes

## Why This Matters on the Exam

Every exam domain — agent architecture, tool design, prompt engineering, context management — depends on a shared foundation: how the Claude API actually works. A question about an agentic loop gone wrong is really a question about `stop_reason`. A question about an instruction being ignored is really a question about where that instruction was placed. A question about a slow or expensive pipeline is really a question about token economics. If the foundation is shaky, the higher-level material will not stick.

The Foundations module is weighted as a prerequisite: it is not its own domain on the score sheet, but it underlies every correct answer in all five domains. Candidates who miss these basics tend to make confident, wrong choices on scenario questions — because the scenario looks unfamiliar but the underlying mechanic is always the same primitive.

## Core Concepts

### The Messages API — Stateless by Design

The Claude Messages API follows a request-response model with no server-side session memory. There is no concept of a session ID, a conversation handle, or a persistent connection that "remembers" earlier exchanges. Every HTTP request arrives at the API as if it were the very first one.

The practical implication is that the caller owns the state. If you want the model to know what was said two turns ago, you must include those turns in the `messages` array of the current request. The API will not infer, recall, or reconstruct anything that is not explicitly present in the payload it receives.

This design is intentional: statelessness makes the API horizontally scalable, debuggable (every request is self-contained), and auditable. The trade-off is that multi-turn conversations require the application layer to track and replay history.

**Exam rule: Any question implying the API "knows" what happened in a previous call requires explicit history management as the answer — there is no server-side memory.**

### Message Structure — Roles, Content Types, and Turn Alternation

The `messages` array is the conversation history. Each element has a `role` field (`user` or `assistant`) and a `content` field. Content can be plain text, structured blocks for tool invocations (`tool_use`), or tool result blocks (`tool_result`).

Turns must strictly alternate between `user` and `assistant`. If two user messages appear back-to-back without an intervening assistant turn, the API will reject the request. This rule matters when injecting tool results: a tool result must be wrapped in a `user` role block so that the alternation is maintained, even though the human did not author it.

The system prompt is a completely separate top-level field — it is not a message with role `system`. This distinction is important: instructions placed in the `system` field enjoy operator-level authority and cannot be argued away by later user messages. Instructions placed in a `user` role message are part of the conversation and the model can negotiate, question, or reinterpret them.

**Exam rule: System prompt goes in the `system` field, not in a message with role "system" or role "user". Operator constraints belong at the top level.**

### stop_reason — Four Values, One Safe Completion Signal

Every API response includes a `stop_reason` field explaining why the model stopped generating. There are exactly four values:

| Value | Meaning | Correct action |
|---|---|---|
| `"end_turn"` | Model finished naturally | Accept the response |
| `"max_tokens"` | Output was truncated at the limit | Response is incomplete — do not treat as done |
| `"stop_sequence"` | A configured stop string was matched | Handle per your application logic |
| `"tool_use"` | Model wants to call a tool | Execute the tool and return the result |

For agentic loops — systems where the model calls tools and receives results in a cycle — `"tool_use"` and `"end_turn"` are the two relevant values. The loop continues when `stop_reason == "tool_use"` and terminates when `stop_reason == "end_turn"`. Terminating on `"max_tokens"` means the response was cut off mid-generation; treating a truncated response as a completed answer is a reliability bug.

**Exam rule: `"end_turn"` is the only valid completion signal for an agentic loop. `"max_tokens"` means the response was cut off — never treat it as success.**

### Context Window — A Finite, Shared Resource

The context window is the total token budget available for a single API call. Everything the model can "see" in that call competes for this budget: the system prompt, the full conversation history, all tool definitions, and all tool results returned so far.

Context pressure accumulates. Early in a conversation the budget is plentiful; as tool calls add results and the history grows, the budget shrinks. When the conversation approaches the limit, older turns must be summarized or dropped — and summarization loses precision. Numeric values, percentages, and specific dates tend to become vague ("roughly", "around", "a few") after compression.

A related effect called "lost in the middle" means that information placed in the middle of a very long context receives less reliable attention than information at the beginning or end. This is not solved by using a model with a larger context window: a bigger window gives more room but does not improve the quality of attention to middle-of-context content.

**Exam rule: Larger context window does not fix lost-in-the-middle. The mitigation is content placement — put critical information at the start or end of the context.**

### System Prompt — Operator-Level Authority

The system prompt is passed in the `system` field, separate from the `messages` array. It establishes the model's persona, behavioral rules, constraints, and output format expectations. It is loaded once per request and applies to the entire interaction.

Because it sits at the operator level, the system prompt is harder for users to override than instructions placed in user messages. If a refund limit, a safety rule, or a persona constraint needs to hold throughout a conversation, it belongs in the system prompt — not in the first user turn.

A subtle exam trap: if the system prompt contains a phrase like "always verify the customer identity", the model may interpret this literally and invoke an identity-verification tool even in contexts where it is unnecessary. Precise, conditional language in the system prompt avoids over-triggering tool use.

**Exam rule: Operator constraints (limits, personas, safety rules) go in the system prompt. Instructions in user messages are part of the dialogue and can be argued against.**

### Token Economics — Counting What Actually Costs

Every token in an API request has a cost: input tokens (everything in the request payload) and output tokens (the model's generated response). Both consume the context window, and input tokens cost less than output tokens in most pricing tiers.

Prompt caching allows stable prefixes — typically the system prompt and fixed tool definitions — to be cached server-side. A cache hit reduces the effective input token cost dramatically for repeated calls that share a long common prefix. This is especially valuable in agentic systems where the same system prompt is sent on every loop iteration.

Practical implication: if a tool returns a 200-field JSON object but only 5 fields matter, the other 195 fields are wasted context budget on every subsequent turn. Designing tools to return minimal, relevant output is not just a performance optimization — it is a correctness strategy, because bloated tool results crowd out the conversation history.

**Exam rule: Minimize tool result payload size. Cached prefixes reduce cost. Input tokens are cheaper than output tokens, so verbose system prompts are less expensive than verbose model responses.**

## Mental Model

Think of the Messages API as a stateless function: `response = call(system, history, tools)`. You provide everything; it returns one response. The response tells you why it stopped (`stop_reason`), and your job is to decide what to do next — show the result, call a tool, or handle an error. Everything else in the course — agents, MCP, prompt engineering, context management — is about making this loop smarter, cheaper, and more reliable.

## What's Next

Module 01 covers Agent Architecture and Orchestration (27% of the exam) — the largest single domain. The primitives from this module (stop_reason, stateless history, context budget) appear directly in agent loop design, subagent delegation, and orchestration patterns.
