# Tricky Details — Agent Architecture & Orchestration
These small distinctions decide pass/fail.

---

### stop_reason "end_turn" is the ONLY valid loop exit condition

**Trap:** Checking if the response text contains "DONE" or "TASK_COMPLETE", or terminating the loop after a fixed number of iterations (e.g., "the loop exits after 5 tool calls").

**Reality:** `stop_reason == "end_turn"` is the single authoritative exit signal. The model sets this when it has finished reasoning and has no further tool calls to make. Text parsing is fragile — Claude's phrasing varies and can include words like "done" in intermediate reasoning. A hard iteration cap causes the agent to abandon in-progress tasks, which is a correctness failure, not a safety feature.

**Tell:** Any answer choice that exits the loop based on response text content or a maximum iteration count is wrong. Look for phrases like "the system stops when the response mentions 'completed'" or "exits after 5 iterations" — both disqualify the answer immediately.

---

### Subagents inherit NOTHING from the coordinator

**Trap:** Assuming a subagent knows something because the coordinator knows it. "The coordinator retrieved the customer's order ID, so the subagent can use it."

**Reality:** `fork_session` creates a completely blank context. The subagent has no access to the coordinator's conversation history, retrieved data, system prompt variables, or any other state. Zero. Every piece of information the subagent needs — the task description, all relevant data, the output format specification, the customer's order ID — must be present in the Task invocation itself.

**Tell:** "Why doesn't the subagent produce the correct output even though the coordinator has all the information?" → The coordinator failed to pass it. The fix is always at the Task invocation level. If an answer says "update the subagent's system prompt," that is wrong — the problem is missing context in the invocation, not a bad system prompt.

---

### Hooks are deterministic; prompt instructions are probabilistic

**Trap:** Writing a system prompt instruction to enforce a hard business constraint: "Never process refunds over $500 without manager approval." Believing this is reliable because Claude usually follows instructions.

**Reality:** Prompt instructions are followed ~90%+ of the time under normal conditions, but that "not always" matters enormously for compliance, financial limits, and security controls. A `PreToolUse` hook that checks the refund amount and blocks the tool call when it exceeds $500 fires on every invocation, without exception, regardless of how the conversation is framed.

**Tell:** Requirements containing "must always," "must never," "every time," or "without exception" map to hooks. Requirements containing "generally," "by default," "in most cases," or "as a guideline" can use prompt instructions. If the scenario involves a financial limit, a security boundary, or a compliance rule, the correct answer uses a hook.

---

### PreToolUse blocks outgoing calls; PostToolUse transforms results

**Trap:** Using `PostToolUse` to prevent a tool from running, or using `PreToolUse` to modify what the tool returns.

**Reality:** These hooks operate at different points in the lifecycle. `PreToolUse` fires before execution — it has access to the tool name and input, and can return a block signal to prevent the call entirely. `PostToolUse` fires after execution — the tool has already run, the action has already happened; all you can do now is modify what the model sees as the result.

**Tell:** "Block the database write if the record ID is in the forbidden list" → `PreToolUse`. "Strip internal metadata fields from the API response before the model sees it" → `PostToolUse`. "Prevent the refund tool from running if the amount exceeds the limit" → `PreToolUse` (you must prevent the action, not just hide the result). If an answer uses `PostToolUse` to "prevent" or "block," eliminate it.

---

### Escalation requires re-iteration, not first frustration

**Trap:** "If the customer expresses frustration, escalate to a human agent." Or: "Escalate on first complaint to ensure customer satisfaction."

**Reality:** The correct three-step pattern is: (1) acknowledge the concern, (2) attempt resolution with available tools and information, (3) escalate only if the customer reiterates the same concern after the resolution attempt. Escalating on frustration bypasses the value of the automated system entirely and overloads human agents. The trigger is not emotional signal — it is the customer's continued persistence on the same issue after a genuine resolution attempt.

**Tell:** Any answer that escalates based on emotional signals ("upset," "frustrated," "negative sentiment," "any complaint") is wrong. Any answer that escalates immediately without an acknowledgement and resolution attempt is wrong. Look for the word "reiterates" or "continues after" in correct answers — that is the signal.

---

### Over-narrow decomposition is a coordinator design failure

**Trap:** "Detailed decomposition improves agent reliability. Breaking the task into 20 fine-grained subtasks ensures each step is handled carefully."

**Reality:** Over-narrow decomposition is a root cause of agent brittleness. When subtasks are too fine-grained, they require many sequential round-trips, each of which adds latency and an opportunity for error. The coordinator becomes a bottleneck that spends most of its time coordinating tiny actions rather than orchestrating meaningful work. Good decomposition creates parallel-safe, bounded subtasks — each produces a complete, independently useful output.

**Tell:** "What is wrong with a coordinator that makes 15 sequential tool calls to retrieve and format a single report?" → over-narrow decomposition. The fix is to consolidate into fewer, larger subtasks that can produce meaningful output independently. An answer that adds more subtasks to "improve granularity" is wrong.

---

### Partial subagent results are valid — do not fail the whole request

**Trap:** "If any subagent fails, the coordinator must return an error and retry the entire operation."

**Reality:** In a hub-and-spoke system, partial results are architecturally valid and often the preferred behavior. If four of five subagents succeed, the coordinator should return the four successful results with a clear annotation that one component failed. The caller can then decide how to handle the incomplete output. Failing the entire request on a single subagent failure discards useful work and worsens latency.

**Tell:** Answers that require all-or-nothing success are suspect. Correct coordinator designs handle partial failure gracefully: collect successes, annotate failures, and return a useful partial result to the caller. Silent failure (pretending all subagents succeeded when some did not) is the actual anti-pattern to avoid.
