# Key Points — Module 00: Foundations
The most important parts. Review this file before the exam.

---

**If the model needs to know what was said earlier in the conversation → resend the full message history in the `messages` array**, because the API is completely stateless — there is no server-side session or conversation memory of any kind.

**If `stop_reason == "end_turn"` → accept the response and exit the loop**, because this is the only signal that the model finished generating its response naturally and intentionally.

**If `stop_reason == "max_tokens"` → treat the response as incomplete and do not surface it as a final answer**, because the output was truncated mid-generation — the model did not decide to stop, the token limit forced a cut.

**If `stop_reason == "tool_use"` → execute the requested tool and return the result as a new user turn**, because the model has paused specifically to receive tool output before continuing its reasoning.

**If an operator constraint (refund limit, persona, safety rule) must hold throughout a conversation → place it in the `system` field**, because system prompt instructions operate at the operator level and are harder for users to override than instructions placed inside user messages.

**If a behavioral rule is placed in a user message role instead of the system prompt → expect reduced authority**, because user-role instructions are part of the dialogue and the model can negotiate, question, or reinterpret them.

**If critical information must be reliably attended to in a long context → place it at the beginning or end of the context**, because of the "lost-in-the-middle" effect — items in the middle of a large context receive less reliable attention regardless of model context window size.

**If accuracy degrades in a long conversation and you consider switching to a larger-context model → prefer restructuring content placement instead**, because a larger context window provides more room but does not improve attention quality for middle-of-context content.

**If a tool returns large amounts of data but only a few fields are needed → filter the result before returning it to the model**, because every token in a tool result consumes the shared context budget and crowds out conversation history on subsequent turns.

**If the same system prompt and tool definitions are sent on every loop iteration → enable prompt caching for the stable prefix**, because cached input tokens cost significantly less than uncached input tokens and the savings compound across many loop iterations.

**If you need to inject a tool result into the conversation → wrap it in a `user` role block**, because message turns must strictly alternate `user`/`assistant` and tool results are always the "user" side of that exchange — even though a human did not write them.

**If a question describes an agent that stops after N iterations regardless of output → identify this as an anti-pattern**, because the correct exit condition is `stop_reason == "end_turn"`, not a fixed iteration count.
