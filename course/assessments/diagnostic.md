# Diagnostic Assessment

> Take this BEFORE starting the course. It shows where to focus study time.

---

## Instructions

- Answer all 15 questions before checking the answer key.
- Do not reference notes — this is a cold baseline.
- Time yourself: aim to finish in under 20 minutes.
- Record which questions you got wrong and which domain they belong to.

---

## Questions

### D1 — Agent Architecture & Orchestration

---

**Question 1** (D1 — stop_reason)

You are reviewing an agentic loop that calls Claude with a tool list. After one API call, the response comes back with `stop_reason: "end_turn"` and no tool calls in the response. Your loop logic currently treats this as an error and retries the request. A senior architect reviews your code and flags it as a bug.

What is the correct interpretation of `stop_reason: "end_turn"` in a tool-enabled agentic loop?

A) The model hit its max_tokens limit and the response was cut off; retry with a higher limit.
B) The model chose not to use any tool and is returning a natural-language response; the loop should surface this to the caller and stop.
C) A network timeout occurred before the model finished; the loop should retry immediately.
D) The model is signaling that the current tool schema is invalid and no tool call is possible.

---

**Question 2** (D1 — subagent context passing)

A multi-agent system has an orchestrator that assigns research tasks to subagents. Each subagent receives only a task description string — no conversation history, no prior findings, and no system prompt context. Halfway through a run, a subagent produces a response that contradicts an established fact already confirmed by a previous subagent.

What is the most likely root cause of this contradiction?

A) The subagent's model version is different from the orchestrator's.
B) The subagent was not given sufficient context — key findings were not injected into its prompt.
C) The tool schema passed to the subagent was malformed, causing hallucination.
D) The orchestrator used `stop_reason: "tool_use"` incorrectly when dispatching the task.

---

**Question 3** (D1 — hooks vs prompts)

A team wants Claude to always confirm with the user before executing any bash command that contains the word `rm`. One developer suggests adding "always ask before running rm commands" to the CLAUDE.md system prompt. Another developer suggests implementing a `PreToolUse` hook that intercepts bash calls and checks the command string.

Which approach is more reliable for production use, and why?

A) The system prompt approach, because Claude's instruction-following is consistent and does not require extra infrastructure.
B) The hook approach, because hooks execute deterministically in the harness regardless of model behavior, while prompt instructions are probabilistic.
C) The system prompt approach, because hooks cannot inspect the content of tool call arguments.
D) Both are equivalent; the choice depends only on team preference.

---

**Question 4** (D1 — escalation pattern)

A customer support agent is handling a billing dispute. The agent has access to a `lookup_account` tool and a `apply_credit` tool. During the interaction, the customer claims the company made a fraudulent charge and threatens legal action. The agent's current logic routes all unresolved issues to a `create_ticket` tool.

Which escalation pattern is most appropriate here?

A) Invoke `apply_credit` immediately to de-escalate the situation without human review.
B) Continue attempting tool calls until the agent reaches max iterations, then surface the conversation.
C) Detect the legal-threat signal in the conversation and immediately hand off to a human agent, preserving full conversation context.
D) Ask the customer to call back during business hours and close the session.

---

### D2 — Tool Design & MCP Integration

---

**Question 5** (D2 — tool description vs schema)

You are designing a tool called `search_documents`. The JSON schema defines the parameter `query` as a `string` type. The tool description says "Searches internal documents." During testing, the model repeatedly passes overly broad queries and ignores the instruction to be specific.

What is the most effective fix?

A) Change the `query` parameter type from `string` to `array` so the model is forced to break it into terms.
B) Move the specificity instruction into the tool description field, since that is what the model reads to decide how to call the tool.
C) Add a `maxLength` constraint to the schema to prevent long queries.
D) Create a second tool called `search_documents_specific` and deprecate the original.

---

**Question 6** (D2 — .mcp.json vs ~/.claude.json)

A developer wants to add an MCP server that connects to the company's internal Jira instance. This server should only be available to engineers working in the `/projects/eng-tools` repository and should not appear in any other Claude Code session on the same machine.

Where should the MCP server be configured?

A) In `~/.claude.json` (user-level config) so it is always available.
B) In `/projects/eng-tools/.mcp.json` (project-level config) so it is scoped to that repository.
C) In the system-level Claude Code settings so it is available to all users on the machine.
D) In the CLAUDE.md file inside `/projects/eng-tools` as a JSON block.

---

**Question 7** (D2 — error categories)

A tool call to an external payment API fails. The API returns HTTP 503 (Service Unavailable). The agentic loop currently logs this as a permanent error and stops execution. A code reviewer flags this classification as wrong.

Which error category does HTTP 503 belong to, and what is the correct handling?

A) Permanent error — the tool schema was rejected by the API; update the schema and retry.
B) Transient error — the service is temporarily unavailable; retry with exponential backoff.
C) Authentication error — the API key has expired; prompt the user to re-authenticate.
D) Validation error — the request payload was malformed; fix the request and retry once.

---

### D3 — Claude Code Config & Workflows

---

**Question 8** (D3 — CLAUDE.md hierarchy)

A developer is writing a CLAUDE.md file for a monorepo. They want one rule to apply globally (across all subprojects), a second rule to apply only to the `frontend/` directory, and a third rule to apply only during CI runs. They are debating where to place each rule.

Which placement is correct for each scope?

A) Global: root `CLAUDE.md`; `frontend/` only: `frontend/CLAUDE.md`; CI only: a rule with a CI environment variable check in the root `CLAUDE.md`.
B) Global: `~/.claude/CLAUDE.md`; `frontend/` only: root `CLAUDE.md`; CI only: `frontend/CLAUDE.md`.
C) Global: `~/.claude/CLAUDE.md`; `frontend/` only: `frontend/CLAUDE.md`; CI only: a `--system-prompt` flag in the CI pipeline command.
D) All three should go in root `CLAUDE.md` separated by comments; CLAUDE.md does not support subdirectory scoping.

---

**Question 9** (D3 — rules/ glob behavior)

A Claude Code project has a `rules/` directory containing `python.md`, `typescript.md`, and `security.md`. The team assumes all three files are always loaded for every session. During a code review, an architect points out this assumption is incorrect.

What is the actual behavior of files in the `rules/` directory?

A) All files in `rules/` are concatenated and prepended to every system prompt automatically.
B) Files in `rules/` are loaded only when the user explicitly runs `/rules load`.
C) Files in `rules/` are available as selectable context; the model or user must reference them — they are not automatically injected into every session.
D) Only `rules/default.md` is loaded automatically; other files require explicit glob patterns.

---

**Question 10** (D3 — CI flag)

A team is running Claude Code in a CI pipeline to auto-fix linting errors. The pipeline occasionally hangs because Claude Code pauses and waits for user confirmation before applying changes. The team wants to eliminate all interactive prompts without modifying the project CLAUDE.md.

Which flag resolves this without side effects?

A) `--no-prompt` — disables all output from Claude Code.
B) `--yes` — auto-confirms all confirmation prompts, allowing the pipeline to run unattended.
C) `--silent` — suppresses interactive mode and runs Claude Code as a background daemon.
D) `--dangerously-skip-permissions` — bypasses all permission checks and is the standard way to run Claude Code in CI.

---

### D4 — Prompt Engineering & Structured Output

---

**Question 11** (D4 — nullable vs required schema)

You are building a structured extraction pipeline. The output schema has a field `resolved_date` representing when a ticket was closed. Some tickets are still open and have no resolved date. A junior engineer marks the field as `required: true` with type `string`. During testing, the model starts hallucinating dates for open tickets.

What is the correct schema fix?

A) Change the type to `integer` (Unix timestamp) so the model cannot fabricate a human-readable string.
B) Remove `resolved_date` from the schema entirely and handle it in post-processing.
C) Make `resolved_date` optional (remove from `required` array) and add `"type": ["string", "null"]` so the model can legitimately return null for open tickets.
D) Add an enum constraint listing all valid date formats to prevent hallucination.

---

**Question 12** (D4 — batch API constraint)

A data science team wants to use the Batch API to process 10,000 customer feedback records overnight. Their pipeline currently requires each record's output before processing the next record (the next record's prompt depends on the previous record's classification result).

Can the Batch API be used for this pipeline as-is?

A) Yes — the Batch API processes records in order and results are available sequentially as each completes.
B) No — the Batch API does not guarantee order, but results can be polled individually, so the dependency chain can still work.
C) No — the Batch API processes all requests independently with no guaranteed ordering or streaming; sequential dependencies require the synchronous API.
D) Yes — the Batch API supports a `depends_on` field that chains requests automatically.

---

**Question 13** (D4 — explicit criteria)

A content moderation system uses the prompt: "Classify this text as safe or unsafe." During evaluation, two human reviewers disagree on 30% of the borderline cases, and the model's outputs correlate with neither reviewer consistently. The lead engineer wants to improve consistency.

What is the single highest-leverage prompt change?

A) Switch from a two-class output to a five-class Likert scale to capture nuance.
B) Add a `temperature: 0` parameter to force deterministic outputs.
C) Add explicit criteria defining what constitutes "unsafe" with concrete examples, so the model and human reviewers share the same decision boundary.
D) Use chain-of-thought prompting and discard the reasoning, keeping only the final label.

---

### D5 — Context Management & Reliability

---

**Question 14** (D5 — case-facts block)

A legal research agent processes long case documents. The system prompt instructs the model to "remember the key facts as you go." During evaluation, the model frequently contradicts facts stated 80,000 tokens earlier in the conversation. A senior architect proposes replacing the instruction with a structured `<case-facts>` block that is updated and re-injected at each turn.

Why does the structured block outperform the instruction?

A) The structured block compresses the context window, allowing more tokens per request.
B) The instruction relies on the model's implicit memory across a long context, which degrades; the structured block makes key facts explicitly present in every prompt, independent of context length.
C) The `<case-facts>` XML tag triggers special retrieval behavior in Claude's architecture.
D) Re-injecting a block at each turn resets the model's attention and prevents position bias.

---

**Question 15** (D5 — aggregate vs stratified accuracy)

An automated code review agent reports 91% accuracy on a benchmark of 1,000 pull requests. The team ships it to production. Within a week, developers report that the agent misses almost every security vulnerability — it is accurate on style and logic issues but blind to security. The post-mortem reveals the benchmark had 950 style/logic PRs and only 50 security PRs.

What evaluation design flaw caused this, and what is the correct fix?

A) The benchmark was too small; increase to 10,000 PRs to reduce variance.
B) Aggregate accuracy masked per-category performance; the fix is to report stratified accuracy broken out by issue type (style, logic, security) so failures in rare-but-critical categories are visible.
C) The model was not fine-tuned on security data; the fix is domain-specific fine-tuning.
D) The team should have used the Batch API to process more PRs in parallel during evaluation.

---

## Answer Key

Q1:B Q2:B Q3:B Q4:C Q5:B Q6:B Q7:B Q8:C Q9:C Q10:B Q11:C Q12:C Q13:C Q14:B Q15:B

---

### Explanations

**Q1 (B):** `stop_reason: "end_turn"` means the model completed its response naturally and decided not to invoke a tool. This is valid — the model may have enough information to answer without a tool call. Treating it as an error and retrying will cause unnecessary API calls and may confuse the model with repeated identical prompts.

**Q2 (B):** Subagents in a multi-agent system are stateless unless context is explicitly injected. If the orchestrator does not pass prior findings into each subagent's prompt, each subagent starts from scratch and can contradict earlier results. Model version differences or tool schema issues are irrelevant to factual contradictions arising from missing context.

**Q3 (B):** Hooks run in the harness (the execution environment), not inside the model. A `PreToolUse` hook will intercept every bash call deterministically regardless of what the model decides. A system prompt instruction is probabilistic — the model might comply most of the time, but cannot be guaranteed to ask for confirmation 100% of the time in production.

**Q4 (C):** Legal threats require immediate human judgment — they carry liability risk that no automated tool can safely resolve. The correct pattern is to detect the escalation signal (legal language), stop autonomous tool use, and hand off to a human with full conversation context so the human can respond appropriately. Applying a credit autonomously or routing to a ticket is insufficient for a legal threat.

**Q5 (B):** The tool description is what the model reads to understand the tool's purpose and how to call it correctly. The JSON schema governs structure (types, required fields) but not behavioral guidance. Moving the specificity instruction into the description gives the model the behavioral context it needs at the point of decision.

**Q6 (B):** `.mcp.json` placed in a project directory is project-scoped — it only activates when Claude Code is run inside that directory. `~/.claude.json` is user-scoped and would make the Jira server available in every session, which violates the requirement for repository-specific availability.

**Q7 (B):** HTTP 503 (Service Unavailable) is a transient server-side error indicating the upstream service is temporarily overloaded or down. The correct handling is to retry with exponential backoff. Classifying it as permanent would abandon recoverable operations. It is not an authentication or schema error.

**Q8 (C):** `~/.claude/CLAUDE.md` is the user-level global config that applies to all projects. Subdirectory-specific rules go in a `CLAUDE.md` inside that subdirectory. CI-specific behavior is best controlled via pipeline flags (like `--system-prompt` or environment variables passed to the CLI), not inside a CLAUDE.md that would also affect local developer sessions.

**Q9 (C):** Files in the `rules/` directory are not auto-injected into every session. They function as a selectable library — the model can be directed to reference them, or users can pull them in explicitly. Assuming automatic injection leads to missing guardrails when the relevant rule file is never referenced during a session.

**Q10 (B):** The `--yes` flag (or `-y`) auto-confirms all interactive confirmation prompts in Claude Code, making it safe for unattended CI execution. `--dangerously-skip-permissions` bypasses security permission checks and is not a standard CI practice — it is a last resort for sandboxed environments where all risk is already managed externally.

**Q11 (C):** When a field is marked `required` and the model has no valid value, it will fabricate one to satisfy the schema. Marking `resolved_date` as optional and typing it as `["string", "null"]` gives the model a legitimate path to return `null` for open tickets, eliminating the hallucination incentive.

**Q12 (C):** The Batch API submits all requests simultaneously and returns results asynchronously with no guaranteed ordering or inter-request data flow. It cannot support sequential pipelines where each step depends on the previous step's output. Such pipelines must use the synchronous (non-batch) API to maintain the dependency chain.

**Q13 (C):** When human reviewers disagree, the decision boundary is ambiguous. Explicit criteria with examples anchor all reviewers (human and model) to the same definitions. Temperature 0 only removes sampling randomness but does not resolve ambiguous criteria. A five-class scale adds complexity without fixing the definitional problem.

**Q14 (B):** LLMs do not maintain an explicit memory of earlier context the way a database does — attention over very long contexts degrades in practice. Re-injecting a `<case-facts>` block at every turn ensures the critical facts are always within the model's effective attention window, regardless of how long the conversation has grown.

**Q15 (B):** Aggregate accuracy is misleading when category frequencies are highly imbalanced. A 91% aggregate rate on a 950/50 split can be achieved even if the model is 0% accurate on the rare category (security). Stratified reporting — accuracy per category — exposes performance gaps that aggregate metrics hide, which is essential when some categories carry disproportionate risk.

---

## Scoring Guide

| Score | Your path |
|---|---|
| 13–15 | Ready to take the final mock directly |
| 10–12 | Skim all modules, spend extra time on wrong-answer domains |
| 7–9 | Follow the full recommended learning path |
| 6 or below | Start with 00-Foundations, then follow the learning path |

---

## Using Your Results

- Wrong answers in D1 questions (Q1–Q4) → prioritize Module 01 (it is 27% of the exam)
- Wrong answers in D2 questions (Q5–Q7) → Module 02
- Wrong answers in D3 questions (Q8–Q10) → Module 03
- Wrong answers in D4 questions (Q11–Q13) → Module 04
- Wrong answers in D5 questions (Q14–Q15) → Module 05

Multiple wrong answers in one domain = start with that module regardless of recommended order.

---

## Next Step

[Return to learning path guidance](../README.md)
