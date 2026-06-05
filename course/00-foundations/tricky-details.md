# Tricky Details — Module 00: Foundations
These small distinctions decide pass/fail.

---

### stop_reason "end_turn" Is the Only Valid Completion Signal

**Trap:** Stopping an agentic loop after N iterations, or inspecting the response text for keywords like "DONE", "FINISHED", or "Task complete."

**Reality:** `stop_reason == "end_turn"` is the only correct signal that the model finished generating intentionally. `"max_tokens"` means the response was cut off at the token limit — the model did not decide to stop, the budget ran out mid-generation. Using a fixed iteration count as the primary exit condition means the loop can terminate on a truncated, incomplete response, silently producing wrong answers.

**Tell:** "The agent stops after 10 tool calls regardless of output" or "the loop exits when the response contains the word DONE" — both are wrong patterns. Correct answers always reference `stop_reason == "end_turn"` as the exit condition.

---

### Stateless API — No Session ID, No Server Memory

**Trap:** Assuming the API maintains a conversation session, or that a second call "knows" what was said in the first call without resending it.

**Reality:** Every API call is fully independent. There is no session ID, no server-side conversation handle, and no persistent memory on Anthropic's infrastructure between calls. If the application does not include the previous turns in the `messages` array of the next request, the model has no knowledge of them.

**Tell:** Any question phrasing that implies the API "knows" what happened in a prior call — for example, "since the API already has the context from the last call" — is always pointing to a wrong answer. Correct answers require explicit history management by the caller.

---

### System Prompt Is NOT a Message Role

**Trap:** Placing operator-level constraints (refund limits, persona instructions, safety rules) inside a `user` role message — perhaps to "make sure Claude always sees them" or because the code does not use the `system` parameter.

**Reality:** The system prompt is a separate top-level parameter (`system`), not a message in the `messages` array. It has no `role` of "system" — that role does not exist in the Claude API. Instructions placed in the `system` field carry operator-level authority and are harder for users to override. Instructions placed in a `user` message are part of the conversational dialogue and the model can engage with, question, or reinterpret them.

**Tell:** "Where should the rule that limits refunds to $50 be placed?" → the answer is always the system prompt (the `system` field), not a user message at the start of the conversation, and not a hardcoded string prepended to user input.

---

### Larger Context Window Does NOT Improve Attention Quality

**Trap:** "The agent loses track of important details in long conversations — switch to a model with a larger context window to fix it."

**Reality:** A larger context window gives more room before the budget is exhausted. It does not improve the quality of attention the model pays to tokens in the middle of a long context. The "lost-in-the-middle" effect is a fundamental characteristic of transformer attention, not a capacity problem. Moving to a model with a 200K-token window instead of a 100K-token window does not make the model pay more attention to turn 47 of 200 turns.

**Tell:** Any question asking how to improve accuracy for information placed deep in a long conversation → the answer involves restructuring content placement (move key facts to the beginning or end), not increasing the context window size or switching models.

---

### tool_result Blocks Must Be in a "user" Role Turn

**Trap:** Trying to inject a tool result as an `assistant` role message, or assuming the API has a dedicated `tool` role for the `messages` array.

**Reality:** After a model response with `stop_reason == "tool_use"`, the next request must include the tool result as a `user` role message containing a `tool_result` content block. This preserves the required `user`/`assistant` alternation. The API will reject requests where two `assistant` turns appear in a row or where tool results are injected as assistant messages.

**Tell:** Any scenario describing the application "sending back the tool output as an assistant message" → this is structurally invalid. The correct pattern always appends the tool result to the history wrapped in a `user` role block.

---

### Prompt Caching Applies to Stable Prefixes Only

**Trap:** Expecting prompt caching to cache the entire conversation history, including the dynamic parts that change on every request.

**Reality:** Prompt caching works on stable prefixes — the part of the request that does not change between calls. Typically this is the system prompt and static tool definitions. The dynamic conversation history (messages that grow on every turn) is not cacheable. The benefit is greatest in agentic loops where the same long system prompt is resent on every iteration.

**Tell:** A question about reducing cost for a long-running agent with a detailed system prompt → prompt caching on the system prompt prefix is the correct lever. Caching "the whole conversation" is not possible.
