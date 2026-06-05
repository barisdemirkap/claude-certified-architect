# Quiz — Agent Architecture & Orchestration
Score ≥80% before moving to the next module.

8 questions. Each is a realistic production scenario. Expand the answer only after committing to your choice.

---

**Q1:** A team is building a research agent that browses the web, reads documents, and synthesizes a report. Their loop implementation checks whether the model's response text contains the phrase "Research complete" before exiting. In staging, the agent works correctly 95% of the time. In production after two weeks, they observe the agent occasionally stopping mid-research and occasionally running indefinitely. Which statement best explains both failure modes?

A) The agent's system prompt is too short, causing inconsistent behavior at scale.
B) The model sometimes phrases completion differently than "Research complete," and sometimes uses that phrase mid-reasoning — text-parsing is an unreliable exit condition in both directions.
C) The model's context window is being exceeded, causing unpredictable stop behavior.
D) The web browsing tool is returning inconsistent results, confusing the model about task completion.

<details><summary>Answer</summary>

**B** — Text-parsing the response for a completion keyword fails in both directions: the model may use different phrasing when genuinely done (causing early exit misses, leading to infinite loops if the loop keeps running looking for the phrase), and may use the phrase in intermediate reasoning steps (causing premature exits). The correct exit condition is `stop_reason == "end_turn"`, which is set by the model infrastructure, not by response content. | Distractor: C is plausible but explains only one failure mode (stopping mid-research), not both — and context overflow would manifest differently.

</details>

---

**Q2:** A hub-and-spoke coordinator agent manages a customer data platform. The coordinator retrieves a customer's profile (including their privacy consent flags) and then dispatches a `generate_personalized_report` subagent via `fork_session`. The subagent's system prompt says: "Generate a personalized report for the customer." In production, the subagent generates reports that ignore privacy consent restrictions because it uses all available data fields. What is the root cause?

A) The subagent's system prompt does not mention privacy consent, so it was not aware of the restriction.
B) The coordinator did not pass the customer's consent flags in the Task invocation; the subagent received no information about which data fields are permitted.
C) `fork_session` does not support privacy-scoped data access; `resume_session` should be used instead.
D) The subagent's model version does not have the same privacy training as the coordinator's model version.

<details><summary>Answer</summary>

**B** — Subagents created via `fork_session` inherit nothing from the coordinator. The coordinator retrieved the consent flags, but those flags exist only in the coordinator's context. Because they were not included in the Task invocation, the subagent has no knowledge of them and defaults to using all available data. The fix is to pass the consent flags explicitly in the Task invocation context. | Distractor: A is partially right (the system prompt doesn't mention it) but misidentifies the root cause — the system prompt is the wrong place to put customer-specific consent data anyway; it belongs in the invocation payload.

</details>

---

**Q3:** A financial services company is building a refund processing agent. Their compliance team requires that no refund exceeding $500 may be processed without a supervisor approval code. The development team implements this as a system prompt instruction: "Never process refunds over $500 without a valid supervisor approval code." During a compliance audit, the auditor asks what happens if the model ignores this instruction due to an unusual conversation flow. What is the correct architectural response?

A) The system prompt instruction is sufficient — Claude has strong instruction-following and will reliably comply.
B) Add the instruction to both the system prompt and the user turn to reinforce it.
C) The constraint must be enforced via a `PreToolUse` hook that inspects the refund amount and blocks the tool call if the amount exceeds $500 and no approval code is present — prompt instructions are probabilistic, not guaranteed.
D) Use output validation after the fact to detect and reverse unauthorized refunds before they settle.

<details><summary>Answer</summary>

**C** — Hard financial and compliance constraints must use hooks, not prompt instructions. A `PreToolUse` hook fires deterministically on every invocation of the refund tool, inspects the `amount` and `approval_code` fields, and blocks the call if the constraint is violated. Prompt instructions are ~90%+ reliable but not guaranteed — a "not always" is unacceptable in a financial compliance context. | Distractor: D (post-hoc validation) is a real pattern but is architecturally weaker — it allows the unauthorized refund to process and attempts recovery, rather than preventing the action. "PreToolUse" blocks the action; PostToolUse and output validation do not.

</details>

---

**Q4:** An agent system receives a tool result from a customer database query that includes sensitive internal fields: `account_risk_score`, `fraud_flag`, and `internal_notes`. These fields must never be visible to the model — they are for internal systems only. A developer proposes adding a `PreToolUse` hook that modifies the query to exclude those fields. A second developer proposes a `PostToolUse` hook that strips those fields from the result. Which approach is correct, and why?

A) `PreToolUse` is correct — modifying the query at the source is cleaner and more efficient.
B) `PostToolUse` is correct — the query runs normally and returns all fields, but the hook strips the sensitive fields from the result before the model sees them.
C) Both approaches are equally valid — choose based on whether the database query is modifiable.
D) Neither hook is appropriate — the model's system prompt should be instructed not to reference those fields.

<details><summary>Answer</summary>

**B** — `PostToolUse` is the correct hook for filtering results. The goal is to control what the model sees after the tool runs, which is exactly what `PostToolUse` does. The `PreToolUse` approach (modifying the query) is often not possible — the query may be parameterized, the database schema may not support field-level exclusion easily, or the tool may need all fields for other internal processing. `PostToolUse` is the canonical hook for result transformation and filtering. | Distractor: A is pragmatically attractive but architecturally misuses `PreToolUse` — that hook is for blocking or modifying calls before execution, not for controlling what data the tool is "allowed" to return. The right separation: PreToolUse controls whether the call runs; PostToolUse controls what the model sees.

</details>

---

**Q5:** A customer support agent receives this conversation sequence. Customer: "I've been waiting 3 weeks for my refund and this is completely unacceptable — I'm so angry." Agent: "I sincerely apologize for the delay. Let me look into your refund status immediately. [checks system] Your refund of $84.50 was processed on June 3rd and should appear in your account within 2-3 business days. I've also added a $10 credit to your account as an apology." Customer: "I still don't see it in my account and I need this money now." What should the agent do next?

A) Escalate immediately — the customer has expressed anger, which is the escalation signal.
B) Apologize again and repeat the same refund status information.
C) Attempt a second resolution: explain the processing timeline in more detail, verify the customer's payment method is correct, and offer to follow up via email when the refund posts.
D) Close the case — the refund has been confirmed as processed and the agent has fulfilled its responsibility.

<details><summary>Answer</summary>

**C** — The customer has reiterated a concern but the agent should make a second, more targeted resolution attempt before escalating. The customer's concern is now more specific ("I still don't see it") — this is new information. The correct next step is to address this specifically: verify the payment method, explain that 2-3 business days may not have elapsed yet, and offer a follow-up mechanism. Escalation comes only if the customer continues to persist after this attempt. | Distractor: A treats anger as the escalation trigger, which is the canonical wrong answer for escalation questions. Anger is acknowledged, not escalated. D is wrong because dismissing a customer who says they don't see the money — without further investigation — is not resolution.

</details>

---

**Q6:** A coordinator agent for a market analysis platform is designed to answer complex questions about industry trends. For the question "Compare the competitive landscape of cloud providers in APAC over the last 5 years," the coordinator creates the following subtasks: (1) Research AWS in APAC Q1 2021, (2) Research AWS in APAC Q2 2021, (3) Research AWS in APAC Q3 2021 ... continuing quarterly through Q4 2025, then (17) Research Azure in APAC Q1 2021 ... and so on for each provider. This creates 60 subtasks. What is wrong with this design?

A) The coordinator should not use subagents for research tasks — it should perform the research itself.
B) The decomposition is too granular — quarterly subagents for each provider create 60 round-trips where 3-5 parallel subagents (one per provider, covering the full period) would be more appropriate and produce equivalent quality.
C) The subtasks are not sequential enough — each quarter should depend on the previous quarter's data.
D) 60 subagents is within normal operating parameters for a hub-and-spoke architecture.

<details><summary>Answer</summary>

**B** — This is a textbook over-narrow decomposition. Quarterly granularity at the provider level creates 60 subtasks that are mostly interchangeable and produce no independently useful output (Q1 2021 AWS data alone is not useful — only the full 5-year trend is). Good decomposition would create 3-5 parallel subagents (one per cloud provider: AWS, Azure, GCP, Alibaba Cloud, others), each responsible for researching that provider's full 5-year APAC trajectory and producing a structured summary. The coordinator then synthesizes across providers. This is 3-5 parallel calls instead of 60 sequential-ish calls. | Distractor: D is tempting because 60 sounds like "enterprise scale," but the number is not the issue — the excessive granularity and lack of independent utility per subtask is.

</details>

---

**Q7:** A multi-agent pipeline processes job applications. The coordinator dispatches three subagents in parallel: SubA extracts structured data from the resume, SubB checks the applicant against a compliance database, and SubC scores the resume against the job requirements. SubB fails with an API timeout. SubA and SubC succeed. What should the coordinator return to the hiring system?

A) An error response — the pipeline cannot return partial results because the hiring decision requires all three components.
B) SubA and SubC's results, with a clear annotation that SubB's compliance check failed with a timeout, and an indication that the application cannot be advanced to the next stage until the compliance check completes.
C) Only SubA and SubC's results, silently omitting the compliance check — the hiring system can infer from the missing field that it did not run.
D) Retry SubB automatically three times before returning any response.

<details><summary>Answer</summary>

**B** — Partial results with explicit failure annotation is the correct pattern. The coordinator should not discard SubA and SubC's useful work. However, because compliance checks are typically gating requirements in hiring pipelines, the coordinator should explicitly flag that the compliance check is incomplete and note that advancement should be blocked until it completes. This gives the hiring system all available information and a clear action signal. The annotation must be explicit — the hiring system should not have to infer from a missing field. | Distractor: D (automatic retry) is a reasonable operational choice but is not what the question asks — the question asks what to return; and the answer is always a partial result with annotation, regardless of whether retries happen in the background.

</details>

---

**Q8:** A developer is building a coding assistant agent that uses `fork_session` to dispatch a `code_review` subagent. The coordinator has these variables in its context: the PR diff, the repository coding standards document, the author's name, the target branch, and a list of past review comments on this author's PRs. The subagent is given only the PR diff and the instruction "Review this PR." In production, reviews are generic and do not reflect the project's coding standards. What is the minimal fix?

A) Update the subagent's system prompt to include general code review best practices.
B) Switch from `fork_session` to `resume_session` so the subagent inherits the coordinator's context.
C) Pass the repository coding standards document in the Task invocation context alongside the PR diff.
D) Add a `PostToolUse` hook that appends the standards document to every subagent response.

<details><summary>Answer</summary>

**C** — The subagent is producing generic reviews because it has no access to the project's coding standards — they exist in the coordinator's context but were not passed in the Task invocation. The minimal fix is to include the standards document in the invocation. `fork_session` is correct for isolation; `resume_session` (B) would expose the coordinator's entire context, which is an over-broad fix with side effects. The author's past review comments and other data may also be worth passing, but the coding standards document is the specific gap causing the observed problem. | Distractor: B is tempting because it would "solve" the problem by exposing all context — but it also exposes data the subagent should not have, violates the isolation principle, and is architecturally incorrect. The right fix is always at the invocation payload level.

</details>
