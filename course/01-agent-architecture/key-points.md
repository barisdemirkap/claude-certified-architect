# Key Points — Agent Architecture & Orchestration
The most important parts. Review this file before the exam.

---

**If the agentic loop needs an exit condition → use `stop_reason == "end_turn"`**, because it is the only authoritative signal from the model that it has finished; text-parsing and iteration counts are both fragile anti-patterns that abandon tasks prematurely.

**If a requirement says "must always" or "must never" → implement it as a hook, not a prompt instruction**, because hooks are 100% deterministic and fire on every invocation regardless of model behavior, while prompt instructions are ~90% reliable at best.

**If you need to block a tool call before it runs → use `PreToolUse`, not `PostToolUse`**, because `PostToolUse` fires after the tool has already executed; at that point you can only transform the result, not prevent the action.

**If you need to filter or reformat a tool's output → use `PostToolUse`, not `PreToolUse`**, because `PreToolUse` has no access to the result; it only sees the tool name and input arguments.

**If a subagent needs a piece of information → pass it explicitly in the Task invocation**, because subagents created via `fork_session` inherit zero context from the coordinator; there is no implicit sharing.

**If a task has components that do not depend on each other → dispatch them in parallel**, because sequential subtasks multiply latency and make the coordinator a bottleneck; good decomposition maximizes concurrency.

**If a subtask is too narrow to produce a useful output on its own → merge it with adjacent subtasks**, because over-narrow decomposition creates excessive round-trips, brittle dependency chains, and coordinator overhead.

**If a customer expresses frustration → acknowledge and attempt resolution, not escalate**, because the correct escalation trigger is persistence (reiterating the same concern after a resolution attempt), not sentiment.

**If a subagent fails → catch the error at the coordinator and annotate it explicitly**, because silently swallowing errors produces systems that appear to work but return incorrect outputs; partial results with failure annotations are architecturally correct.

**If you are designing a multi-step complex task with specialized components → use hub-and-spoke topology**, because it keeps each agent's context clean, narrows tool permissions per role, and separates orchestration from execution.

**If a session must continue an existing agent's work across calls → use `resume_session`**, because `fork_session` creates a blank slate; `resume_session` preserves conversation history for continuity of a single agent's work.

**If the exam answer says "stop after N tool calls" → eliminate it immediately**, because there is no domain-valid reason to hard-cap tool iterations; the agent must run until `end_turn` unless an error occurs.
