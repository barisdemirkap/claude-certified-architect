# Module 05 — Context Management & Reliability
⏱ Estimated time: 5h
Guide ref: guide_en.MD lines 1129–1228, 1230–1290, 1292–1407, 1410–1474, 1849–1935

## Learning Objectives

- Identify optimal positions for critical information in long contexts to counter the lost-in-the-middle effect
- Design progressive summarization strategies that preserve verbatim critical facts in a separate case-facts block
- Classify escalation triggers as reliable (structural) or unreliable (probabilistic) and explain why each category behaves differently
- Apply provenance and coverage annotation standards when building retrieval and research agents
- Distinguish aggregate accuracy metrics from stratified per-category accuracy and explain why aggregate alone is insufficient for production validation

## Why This Matters on the Exam

Context Management & Reliability carries 15% of exam weight, and its questions tend to be the most "obvious-sounding but wrong" questions on the paper. The domain tests whether candidates understand that large language models do not process all positions in a prompt equally, that the API is stateless, and that probabilistic signals (sentiment, confidence scores) are unreliable foundations for safety-critical decisions. Candidates who rely on intuition rather than structural rules regularly fail these questions.

The scenarios most likely to surface this domain are Customer Support Agent, Multi-Agent Research, and Structured Data Extraction. In each scenario you will need to make design decisions about what stays in context, what gets summarized, what triggers escalation, and how conflicting evidence is handled. The correct answers consistently favor determinism, explicit attribution, and structural rules over probabilistic judgment calls.

## Core Concepts

### 1. Lost-in-the-Middle Effect

When a context window contains many tokens, the model devotes significantly less attention to content placed in the middle of that context. This is a documented empirical phenomenon sometimes called the "lost-in-the-middle" effect: retrieval accuracy and instruction-following degrade for content that is neither near the start of the prompt nor immediately before the model's response.

The practical consequence is that context assembly is a design decision, not a formatting choice. If you drop the ten most relevant retrieved documents into the middle of a 50 000-token context and surround them with system instructions above and conversation history below, the model will be less likely to correctly use the central documents.

**Exam rule: Place the highest-priority information at the START of the context (beginning of the system prompt or user turn) and required action instructions at the END (immediately before the model generates its response). Critical information must never be stranded in the middle.**

For retrieval-augmented pipelines, this means the retrieved passages most relevant to the current query should appear at the top of the retrieved block, not buried in the middle. For long conversation threads, it means periodically surfacing the original goal at the top of the context rather than assuming the model will recover it from an early turn.

### 2. Progressive Summarization and Case-Facts Blocks

As a conversation grows, older turns must eventually be compressed to prevent context overflow. Progressive summarization replaces older message pairs with a condensed summary. This is necessary and correct as a general strategy, but it introduces a specific and serious risk: summarization loses precision on structured data.

When a human summarizes "the customer mentioned their order number is ORD-29471 and the item was a blue 42L backpack," the result might be "customer has an order issue with a backpack." The order number — the field most needed to actually resolve the case — has been silently discarded.

The mitigation is a case-facts block: a clearly labeled, structured section of the prompt that holds verbatim critical facts (customer name, account number, order ID, issue description, relevant dates, stated preferences). This block is explicitly excluded from summarization. Every summarization pass must preserve this block unchanged. The case-facts block can be a JSON object, a YAML snippet, or a labeled section — the format is less important than the rule that it stays verbatim.

**Exam rule: Summarize conversation history, but keep a SEPARATE verbatim block for per-case critical facts. This block is never compressed. When a question describes an agent that "forgot" a number or name after many turns, the fix is a case-facts block, not a longer context window.**

A secondary benefit of the case-facts block is that it makes important facts position-stable. Since the block typically lives at the top of the prompt (after the system prompt), it benefits from the primacy advantage described in Concept 1.

### 3. Tool Result Trimming

In agentic pipelines, tool calls often return large payloads: a database query might return 200 rows, a web fetch might return the full HTML of a page, an API call might return a deeply nested JSON response. If the full payload enters context on every tool call, context fills rapidly and costs escalate.

PostToolUse hooks (or equivalent pre-processing logic) can intercept tool results before they enter the conversation context and trim them to only the fields relevant to the current task. For example, a customer lookup that returns a 40-field record can be trimmed to the 5 fields the current workflow actually needs. The remaining 35 fields never reach the model.

**Exam rule: Tool result trimming reduces context pressure without losing task-relevant data. It is a structural, deterministic operation applied before the model sees the result. It is not the same as asking the model to "ignore" fields — the model never sees the trimmed fields at all.**

Trimming also has a reliability benefit: a model that sees fewer irrelevant fields is less likely to hallucinate connections between those fields and the current task. Trimming is a form of prompt hygiene applied at the tool boundary.

### 4. Reliable vs. Unreliable Escalation Triggers

A customer support agent must decide when to hand off to a human agent. This decision has high stakes: wrong escalation wastes human agent time; missed escalation leaves a frustrated customer with an unresolved problem. The design choice of how to trigger escalation is therefore a reliability question, not just a UX question.

Reliable (structural) escalation triggers are deterministic conditions:
- The customer explicitly uses the words "speak to a human" or "talk to a person"
- The issue type (e.g., "legal complaint", "fraud report") appears on a predefined escalation list
- The refund amount requested exceeds a monetary threshold
- The account is flagged as VIP or SLA-protected in the CRM record

Unreliable (probabilistic) escalation triggers are outputs of probabilistic models:
- A sentiment classifier outputs "frustrated" or "angry"
- The agent's self-assessed confidence score falls below 0.7
- A toxicity detector triggers above a threshold
- The model "judges" that the customer seems upset

**Exam rule: Use structural, rule-based conditions for escalation decisions. Probabilistic signals (sentiment scores, confidence scores, classifier outputs) are valid inputs for logging and monitoring, but must not be the sole basis for a safety-critical decision like escalation. Deterministic > probabilistic for any decision with significant consequences.**

The reason is not that sentiment analysis is always wrong — it is that its error rate is high enough, and its failure modes unpredictable enough, that building a safety-critical decision on it is an architectural anti-pattern.

### 5. Multi-Entity Ambiguity

When a retrieval query matches multiple records (two customers named "John Smith," two orders with similar descriptions), the system faces an ambiguity it cannot resolve without additional information. The correct architecture is to detect the ambiguity and ask the user for a disambiguating identifier — not to pick the "most likely" match based on context clues.

The cost asymmetry matters: acting on the wrong record (updating the wrong customer, refunding the wrong order) causes concrete harm. Asking one clarifying question is a minor inconvenience. The harm of a wrong guess is almost always larger than the cost of asking.

**Exam rule: Multi-entity ambiguity must trigger a clarification request for a unique identifier (account number, email address, order ID). Guessing between ambiguous matches is always the wrong answer, regardless of how confident the guess seems.**

### 6. Provenance and Attribution

For agents that retrieve information from external sources (web search, document stores, knowledge bases), every claim must be accompanied by provenance metadata: the source URL or document ID, the retrieval date, and a confidence level or qualification. This is not optional documentation — it is a structural requirement for trustworthy retrieval output.

When two sources make conflicting claims about the same fact, the correct behavior is to preserve both claims with their respective attributions. The output should read: "Source A (URL, retrieved date) states X; Source B (URL, retrieved date) states Y." The downstream consumer — a human reviewer, another agent, or a final synthesis step — decides which source to trust based on this attributed output.

**Exam rule: When sources conflict, preserve BOTH values with full attribution. Never silently select one and discard the other. Discarding a source without documentation is information loss and can constitute a misleading output.**

### 7. Coverage Annotations

A research or retrieval agent that finds no contradicting evidence is not the same as an agent that checked no sources. Similarly, an agent that was unable to verify a claim is not the same as one that verified it. These distinctions must be made explicit in the output.

Coverage annotations are explicit statements of what was searched, what was found, and what remains unverified. Examples:
- "3 sources checked; 0 contradictions found."
- "Claim X could not be verified — no primary source located."
- "Search covered documents from 2020–2025; earlier documents not included in scope."

**Exam rule: Silence about what was NOT found is misleading. A trustworthy retrieval output explicitly documents the scope and limits of the search, including what it could not verify.**

Coverage annotations connect directly to the broader principle of calibrated uncertainty: outputs should convey not just what the agent found but how thoroughly it looked and what gaps remain.

### 8. Instruction Drift and Stateless API

The Claude API is stateless. There is no session identifier, no server-side memory, and no persistent context between calls. Every API call receives the full conversation history from the caller's message array. The model's apparent "memory" of earlier turns is simply the presence of those turns in the messages array.

This has two important implications. First, any state the application needs to preserve across turns — conversation history, case facts, persona instructions — must be managed by the caller and resent on every API call. Second, accumulated assistant turns in a specific style can gradually shift the model's subsequent behavior in a phenomenon called instruction drift: as assistant turns pile up, their cumulative stylistic pattern influences new responses, sometimes overriding the original system prompt persona.

**Exam rule: Instruction drift is fixed in the system prompt (by reinforcing the persona on every call) and with prefill (to prevent repetitive patterns like greeting the user on every turn). It is not fixed by shortening conversation history. The API is stateless — the caller owns all state.**

Prefill (the assistant turn prefix) is particularly useful for preventing repetitive openings. If the model consistently starts responses with "Of course! I'd be happy to help!" when the persona calls for terse, professional responses, setting a prefill that begins in-task prevents the drift pattern from taking hold.

### 9. Confidence Calibration and Stratified Accuracy

A pipeline that processes 10 000 documents and achieves 97% overall accuracy appears to be working well. But if that 97% is composed of 100% accuracy on the 9 000 invoice documents and 40% accuracy on the 1 000 receipt documents, the pipeline is catastrophically failing on receipts — and the aggregate metric completely hides this.

Stratified sampling — measuring accuracy separately for each document type, issue category, or customer segment — is the only way to detect per-category failures that aggregate metrics mask. For any production extraction or classification pipeline, the evaluation plan must include per-category breakdowns.

**Exam rule: Aggregate accuracy is a necessary but insufficient metric. Always require stratified accuracy by category before declaring a pipeline production-ready. A 97% aggregate with a 40% per-category failure rate is a failing pipeline.**

This principle extends beyond document extraction to any classification or prediction task: intent classification by intent type, entity extraction by entity type, sentiment analysis by domain. The category with the worst performance is the one most likely to cause real-world incidents.

## Mental Model

Context management is fundamentally about the gap between what information is available and what the model actually uses effectively. The lost-in-the-middle effect, instruction drift, and confidence masking all share the same root: the model's attention and reliability are not uniformly distributed across context, categories, or time. Good context architecture compensates for this non-uniformity by placing critical information at privileged positions, using structural rules (not probabilistic signals) for high-stakes decisions, preserving verbatim facts that summarization would destroy, and making the boundaries of knowledge explicit through provenance and coverage annotations.

## What's Next

Proceed to Module 06 — Exam Readiness & Scenario Practice, where you will complete full timed scenario simulations across all 5 domains and assess your readiness with the `/readiness` skill.
