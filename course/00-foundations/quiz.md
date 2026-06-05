# Quiz — Module 00: Foundations
Score >=80% (7 out of 8 correct, or 9 out of 10) before moving to the next module.

---

**Q1:** A production customer support agent completes 8 tool calls across multiple turns. On the ninth API response, `stop_reason` is `"max_tokens"` and the response text ends with "...and for these reasons, I recommend iss". The application code checks `stop_reason != "tool_use"` to decide the loop is done and presents this response to the user as the final answer. What is the problem?

A) The agent should have used a larger model with a longer context window  
B) The response was truncated mid-generation — presenting it as complete is a reliability bug  
C) The agent ran too many tool calls; it should have stopped after 5  
D) `"max_tokens"` is only returned for streaming requests, not standard requests  

<details><summary>Answer</summary>

**B** — `"max_tokens"` means the output hit the token limit and was cut off before the model finished. Presenting a truncated response as a final answer is a reliability bug. The correct action is to raise an error, increase `max_tokens`, or compress the context. | Distractor: A is wrong because switching models does not fix a truncated response — increasing `max_tokens` or compressing context is the correct lever.
</details>

---

**Q2:** An engineer builds a multi-turn chatbot. For the third user message, they send only `{"role": "user", "content": "What was my original question?"}` without including the earlier two turns. The model responds as if it is the beginning of the conversation. Why?

A) The model's cache expired after the second turn  
B) The API stores history on the server but only for 60 seconds  
C) The Messages API is stateless — the model can only see what is in the current request's `messages` array  
D) The model forgets context after more than 2 turns by design  

<details><summary>Answer</summary>

**C** — The Claude Messages API has no server-side session memory. Every request is independent. The caller must include the full conversation history in each request's `messages` array. | Distractor: B is wrong — there is no server-side session storage at any duration. The API is fully stateless.
</details>

---

**Q3:** A team is designing a billing assistant. The rule "never approve refunds exceeding $500 without manager approval" needs to be enforced throughout every conversation. A junior developer suggests adding this rule as the first message in the `messages` array with `role: "user"` so the model always sees it. What is wrong with this approach?

A) User messages are processed before the system prompt, so this creates a conflict  
B) Instructions in user messages carry conversational authority — users could argue against them in later turns  
C) The `messages` array only accepts `role: "assistant"` as the first entry  
D) User messages with instructions are automatically filtered by the safety layer  

<details><summary>Answer</summary>

**B** — The system prompt (the `system` field) is the correct place for operator-level constraints. Instructions in user messages are part of the dialogue and can be engaged with, negotiated, or reframed by subsequent user messages. The system prompt is harder for users to override. | Distractor: A is wrong — system prompt is not a message in the array at all, so there is no ordering conflict; it is a separate top-level field.
</details>

---

**Q4:** An agentic research pipeline produces inaccurate results for information mentioned in turns 15–25 of a 50-turn conversation. The architect proposes switching from a 100K-token context model to a 200K-token context model to solve this. Will this fix the problem?

A) Yes — the larger context window allows the model to attend to all turns equally  
B) Yes — the 200K model uses a different attention algorithm designed for long contexts  
C) No — a larger context window provides more room but does not improve attention quality for middle-of-context content  
D) No — the problem is caused by tool results consuming the context budget, not by attention quality  

<details><summary>Answer</summary>

**C** — The "lost-in-the-middle" effect means content in the middle of a long context receives less reliable attention regardless of the total window size. Switching to a larger model gives more capacity but does not fix the attention distribution problem. The correct mitigation is restructuring content placement — moving critical information to the beginning or end of the context. | Distractor: D is partially plausible but misidentifies the mechanism; the question specifies the problem is accuracy for specific turn ranges, pointing to attention distribution, not capacity exhaustion.
</details>

---

**Q5:** During an agent loop, the model response has `stop_reason == "tool_use"` and contains a `tool_use` block requesting `{"name": "search_database", "input": {"query": "Q4 revenue"}}`. The developer executes the tool and gets a result. In what format should they append this result to the `messages` array before the next API call?

A) A new message with `role: "assistant"` containing the tool output as a text block  
B) A new message with `role: "tool"` and the result in the `content` field  
C) A new message with `role: "user"` containing a `tool_result` content block referencing the original `tool_use` id  
D) No new message — the tool result is passed as a separate `tool_results` top-level field in the next request  

<details><summary>Answer</summary>

**C** — Tool results must be appended as a `user` role message containing a `tool_result` content block that references the `id` of the original `tool_use` block. This preserves the required `user`/`assistant` alternation in the messages array. | Distractor: B is wrong — there is no `role: "tool"` in the Claude Messages API; the roles are `user` and `assistant` only.
</details>

---

**Q6:** A developer wants to reduce API costs for an agent that processes 1,000 requests per day. Every request includes the same 5,000-token system prompt and 3,000-token tool definitions. Which optimization has the highest cost impact?

A) Reduce the system prompt from 5,000 to 4,000 tokens  
B) Enable prompt caching on the stable 8,000-token prefix  
C) Switch to a smaller model with a lower per-token price  
D) Reduce `max_tokens` from 4,096 to 2,048  

<details><summary>Answer</summary>

**B** — Prompt caching on the stable prefix (system prompt + tool definitions) turns 8,000 uncached input tokens per request into cached tokens at ~10% of the normal cost. Across 1,000 requests per day, this saves approximately 90% of the cost of those 8,000 tokens — the highest-leverage single change. | Distractor: A saves only 1,000 tokens per request and does not benefit from the compounding effect of caching; it is a smaller saving than enabling caching on the full stable prefix.
</details>

---

**Q7:** An agent is designed with the following exit logic: "Run the loop until `stop_reason == 'end_turn'`, OR until 30 iterations have elapsed, whichever comes first. If 30 iterations elapse, log a warning and return the last response." A quality engineer flags this design. What, if anything, is wrong?

A) Nothing — 30 iterations is a reasonable safety cap and returning the last response on timeout is correct  
B) Nothing — the loop correctly prioritizes `"end_turn"` and uses the iteration count only as a fallback  
C) The iteration cap is wrong — it should be based on elapsed time, not a count  
D) The iteration cap should raise an error, not silently return a potentially incomplete response  

<details><summary>Answer</summary>

**D** — Using an iteration cap as a safety fallback is correct design. However, silently returning the last response when the cap is hit hides the failure. If the loop ran 30 iterations without `"end_turn"`, the last response's `stop_reason` may be `"max_tokens"` (truncated) or `"tool_use"` (unfinished), neither of which is a valid final answer. The correct behavior is to raise an explicit error so the failure is visible and handled. | Distractor: A sounds reasonable but misses the critical point that the returned response may be truncated or unfinished — silent failure is the bug.
</details>

---

**Q8:** A system prompt for a research assistant contains the instruction: "Always verify the source before presenting any fact." The developer observes that the agent calls the `verify_source` tool even when the user asks a simple question like "What is 2 + 2?" What is the most likely cause?

A) The `verify_source` tool definition is too broad and matches arithmetic questions  
B) The system prompt instruction uses unconditional language ("always") that the model interprets literally  
C) The model defaults to calling all available tools on every turn  
D) The `tool_choice` parameter is set to `"required"` by mistake  

<details><summary>Answer</summary>

**B** — System prompt instructions with unconditional language like "always" cause the model to apply them in all contexts, including ones where the instruction is unnecessary. The fix is to use conditional language: "When presenting factual claims that could be externally verified, use the `verify_source` tool." This scopes the instruction appropriately. | Distractor: D is plausible but would cause all tools to be called, not just `verify_source`; the symptom described specifically implicates the system prompt wording.
</details>

---

**Q9:** An application builds a conversation history over 40 turns. The team notices that specific dollar amounts and dates from turns 10–20 are reported incorrectly in the final summary. They implemented progressive summarization: after every 10 turns, older turns are compressed into a 3-sentence summary. What is the most likely cause of the inaccuracy?

A) The model hallucinates numbers when the conversation exceeds 20 turns  
B) Progressive summarization of numeric values, dates, and percentages tends to produce vague approximations  
C) The turn-10 summarization removed the system prompt from context  
D) The 40-turn conversation exceeded the context window, causing earlier turns to be dropped entirely  

<details><summary>Answer</summary>

**B** — Progressive summarization is a valid context management technique, but it has a known failure mode: numeric values, specific dates, dollar amounts, and percentages tend to become vague after compression ("approximately", "around", "a few weeks later"). The mitigation is to use structured summaries that explicitly preserve key facts — amounts, dates, IDs — rather than free-text compression. | Distractor: D is wrong — if the context window were exceeded, the API would return a context length error, not produce inaccurate summaries; the symptom described is precision loss, not truncation.
</details>

---

**Q10:** A developer inspects an API request and finds the conversation history includes `{"role": "system", "content": "Be helpful."}` as the first entry in the `messages` array. What is the problem?

A) "Be helpful" is too vague to be a useful system prompt  
B) There is no `role: "system"` in the Claude Messages API — system instructions go in the top-level `system` field  
C) The system instruction must be the last message in the array, not the first  
D) System messages must use the `tool_result` content type instead of plain text  

<details><summary>Answer</summary>

**B** — The Claude Messages API does not have a `role: "system"`. The only roles in the `messages` array are `user` and `assistant`. System-level instructions must be placed in the separate top-level `system` parameter. A message with `role: "system"` will cause an API validation error. | Distractor: A is a plausible quality concern but is not the actual problem — the structural error (wrong role) is the primary issue regardless of the content.
</details>
