# Exercises — Context Management & Reliability

Applied practice problems. Work through each before checking the answer.

---

## Exercise 1: Position the Context

You are building a customer support agent. The following items must all appear in a single prompt. Arrange them in the order that best counters the lost-in-the-middle effect, and explain your reasoning for each position.

Items to arrange:
- A: 8 retrieved knowledge-base articles (each ~500 tokens)
- B: Case-facts block (customer name, order ID, issue description)
- C: System persona and behavioral rules
- D: The customer's most recent message
- E: Summarized earlier conversation turns (last 10 turns compressed)

<details><summary>Answer</summary>

Optimal order (top to bottom):

1. **C — System persona and behavioral rules** — System prompt always comes first. The model must see the persona and constraints before any content. Placing it first gives it primacy-position advantage.

2. **B — Case-facts block** — Immediately after the system prompt. This is verbatim critical data (order ID, customer name, issue description) that must never be buried. Placing it at the top of the user-visible content keeps it in the high-attention start zone.

3. **E — Summarized earlier conversation turns** — Middle position is acceptable for compressed history because no specific number or name in this block is critical (those have been extracted to the case-facts block). The summary provides narrative context but is not individually load-bearing.

4. **A — Retrieved knowledge-base articles** — Also in the middle, but ordered so that the most relevant article appears first within the block (relevance-ranked retrieval). The middle position is the weakest attention zone, so the most important article must head the list.

5. **D — The customer's most recent message** — Immediately before the model's response turn. This is the most important positional slot after the system prompt: the model's response is generated immediately after reading this content, so it receives maximum recency-position attention.

Key principle: START gets the invariant rules and verbatim facts. END gets the immediate task stimulus. MIDDLE holds compressible or ranked content.

</details>

---

## Exercise 2: Classify the Escalation Triggers

A team proposes the following escalation rules for a customer support agent. Classify each as RELIABLE or UNRELIABLE and explain why.

1. Escalate if the customer's message contains the phrase "speak to a manager" or "talk to a human."
2. Escalate if the sentiment classifier returns a score above 0.8 on the "anger" dimension.
3. Escalate if the requested refund amount exceeds $500.
4. Escalate if the model's internal confidence score for its proposed resolution is below 0.65.
5. Escalate if the issue type is tagged as "fraud" or "legal" in the CRM ticket.
6. Escalate if the conversation has lasted more than 15 turns without resolution.
7. Escalate if the account has a VIP flag set in the CRM record.

<details><summary>Answer</summary>

1. **RELIABLE** — Explicit keyword match. Deterministic rule. The customer has directly expressed a preference; no probabilistic inference required.

2. **UNRELIABLE** — Sentiment classifier output is probabilistic. A score of 0.81 vs 0.79 is not meaningfully different, and the classifier can be wrong. Using this as a sole escalation trigger is an architectural anti-pattern.

3. **RELIABLE** — Threshold comparison on a numeric field. Completely deterministic. The amount either exceeds $500 or it does not.

4. **UNRELIABLE** — Model self-confidence scores are probabilistic outputs. The model can be confidently wrong and uncertain about correct answers. This score should inform logging, not control safety-critical routing.

5. **RELIABLE** — Issue type lookup against a predefined list. Deterministic. The CRM tag either matches the escalation list or it does not.

6. **BORDERLINE / UNRELIABLE** — Turn count is deterministic as a number, but using it as a proxy for "unresolved" is an unreliable inference. A 16-turn conversation is not inherently unresolved. This is a weak structural rule at best; it should be supplemented with an explicit resolution status field.

7. **RELIABLE** — Boolean flag lookup in a database record. Completely deterministic. The flag is either set or not.

Summary: Rules 1, 3, 5, and 7 are reliable (deterministic, structural). Rules 2 and 4 are unreliable (probabilistic model outputs). Rule 6 is weakly structural but relies on an implicit inference that should be made explicit.

</details>

---

## Exercise 3: Spot the Anti-Pattern in This Design

Read the following system design description and identify all context management anti-patterns present. For each anti-pattern, name the correct fix.

> "Our customer support agent handles long conversations by summarizing every 10 turns into a rolling summary. The summary includes all context from the conversation, including any order numbers or account details mentioned. Escalation is triggered whenever our sentiment model detects high frustration. When two customer records match the same name, we pick the one with the most recent interaction. After a successful resolution, the agent logs: 'Issue resolved successfully.' without recording which sources or policies it cited."

<details><summary>Answer</summary>

**Anti-pattern 1: Summarizing critical facts (order numbers, account details) into the rolling summary.**
Fix: Extract order numbers, account IDs, customer name, and issue description into a separate case-facts block before summarization begins. This block is never compressed.

**Anti-pattern 2: Sentiment model as the sole escalation trigger.**
Fix: Replace with structural escalation rules: explicit customer request for human, issue type matching an escalation list, refund amount threshold, or account flag. Sentiment output can be logged but must not solely control escalation.

**Anti-pattern 3: Guessing between ambiguous customer records ("pick the one with the most recent interaction").**
Fix: When multiple records match, halt the flow and ask the user for a unique identifier (account number, email address). Do not guess.

**Anti-pattern 4: Resolution log with no provenance ("Issue resolved successfully." with no sources cited).**
Fix: Log with full provenance: which knowledge-base articles were cited, which policies were applied, retrieval dates, and confidence level. Silence about the basis for a resolution is not an adequate audit trail.

</details>

---

## Exercise 4: Write a Coverage Annotation

A research agent has been asked to verify the following claim: "Model X achieved state-of-the-art performance on benchmark Y in Q3 2024."

The agent searched 4 sources:
- Source A: Confirms Model X achieved top-3 performance on benchmark Y as of August 2024, but does not claim it was state-of-the-art.
- Source B: States that Model Z held the top position on benchmark Y as of October 2024.
- Source C: Is a press release from Model X's vendor claiming state-of-the-art status, with no third-party verification.
- Source D: Is a benchmark leaderboard that does not include Model X at all.

Write the coverage annotation this agent should output.

<details><summary>Answer</summary>

A well-formed coverage annotation for this result:

---

**Claim:** Model X achieved state-of-the-art performance on benchmark Y in Q3 2024.

**Verdict:** Unverified — conflicting and insufficient evidence.

**Sources checked (4):**
- Source A (retrieved [date]): Confirms top-3 performance as of August 2024; does not claim state-of-the-art status. Partial support only.
- Source B (retrieved [date]): States Model Z held the top position on benchmark Y as of October 2024. Contradicts the claim for Q4 2024; does not directly address Q3.
- Source C (retrieved [date]): Vendor press release claims state-of-the-art status; no independent third-party verification found. Treat as promotional, not evidentiary.
- Source D (retrieved [date]): Benchmark leaderboard does not include Model X. Cannot confirm or deny the claim from this source.

**Coverage gaps:** No independent third-party benchmark audit found for Q3 2024 specifically. Leaderboard in Source D may be incomplete or from a different time window.

**Confidence:** Low. Available evidence does not support the state-of-the-art claim. Top-3 performance (Source A) is the strongest verified data point.

---

Key elements present: all 4 sources cited with retrieval dates, conflicting evidence preserved (not silently resolved), explicit statement of what could not be verified, explicit confidence level.

</details>

---

## Exercise 5: Fix This Evaluation Plan

A team is preparing to deploy an invoice processing pipeline. Their evaluation plan is:

> "We tested 5,000 invoices drawn randomly from our database. The pipeline achieved 96.2% field-extraction accuracy overall. We consider this sufficient for production deployment."

Identify what is missing and write an improved evaluation plan.

<details><summary>Answer</summary>

**Problems with the original plan:**

1. Aggregate accuracy (96.2%) hides per-category failure rates. The database likely contains multiple invoice subtypes (standard invoices, credit notes, pro-forma invoices, multi-currency invoices, invoices with handwritten annotations, etc.) with very different extraction difficulty. Aggregate accuracy can be 96.2% even if one category has 30% accuracy.

2. Random sampling may under-represent rare but important document types. If 97% of the database is standard invoices and 3% are multi-currency, a random sample of 5,000 gives only ~150 multi-currency examples — too few to measure accuracy reliably for that subtype.

3. No error analysis by field. A 3.8% error rate means different things depending on whether errors concentrate on critical fields (total amount, vendor name, invoice date) or non-critical ones (optional reference codes). Aggregate field accuracy obscures this.

**Improved evaluation plan:**

1. Stratify the 5,000-document sample by document type (standard, credit note, pro-forma, multi-currency, handwritten). Report accuracy separately for each stratum. Set a per-stratum minimum accuracy threshold (e.g., 95%) in addition to the aggregate threshold.

2. If any stratum has fewer than 200 examples in the random sample, supplement with targeted sampling to reach 200 for reliable accuracy estimation.

3. Report accuracy per critical field (total amount, vendor ID, invoice date, line items) separately from non-critical fields.

4. Define a deployment gate: the pipeline is production-ready only when ALL strata meet the accuracy threshold AND critical-field accuracy meets a higher threshold (e.g., 99% for total amount).

5. Set up ongoing stratified monitoring in production to detect accuracy degradation in specific categories before it affects enough volume to surface in aggregate metrics.

</details>

---

## Exercise 6: Design the Case-Facts Block

A multi-turn customer support agent handles insurance claims. A typical conversation includes: the customer's policy number, claim ID, date of loss, type of loss (fire, theft, water damage, etc.), claimed amount, adjuster's name, and any special flags (catastrophe zone, prior claim in last 12 months).

Design the case-facts block structure. Specify: what format it should use, where in the prompt it should appear, and what the summarization instruction should say about it.

<details><summary>Answer</summary>

**Case-facts block format (JSON in a labeled XML tag for unambiguous extraction):**

```xml
<case_facts>
{
  "policy_number": "POL-2024-887432",
  "claim_id": "CLM-20241103-0091",
  "date_of_loss": "2024-10-28",
  "loss_type": "water_damage",
  "claimed_amount_usd": 14750.00,
  "adjuster_name": "Maria Santos",
  "flags": {
    "catastrophe_zone": true,
    "prior_claim_12_months": false
  },
  "issue_description": "Customer reports roof leak causing damage to two bedrooms and contents. Contractor estimate attached."
}
</case_facts>
```

**Placement:** Immediately after the system prompt, before any conversation history or retrieved policy documents. This gives it primacy-position advantage and keeps it outside the summarizable conversation block.

**Summarization instruction (in system prompt):**

> "When summarizing earlier conversation turns, you MUST preserve the `<case_facts>` block verbatim and unchanged. Do not include case-facts content in your summary. Do not omit or paraphrase any field in the case-facts block. The summary should cover only the conversation narrative — what the customer said and what actions were taken — not the structured claim data."

**Why this works:** Structured fields (policy number, claim ID, amount, flags) are exactly the data that summarization destroys. By holding them in a verbatim XML block with an explicit instruction to skip this block during summarization, the agent retains access to precise identifiers throughout the conversation regardless of length.

</details>

---

## Exercise 7: Trace the Instruction Drift

The following is a condensed log of an agent conversation. The system prompt specified: "You are a terse, professional insurance claims assistant. Do not use casual language or greetings."

- Turn 1 (assistant): "I can help with your claim. Please provide your policy number." [compliant]
- Turn 5 (assistant): "Got it! Let me look that up for you." [starts to drift]
- Turn 12 (assistant): "Oh no, that sounds really frustrating — water damage is such a nightmare! Let's get this sorted out for you right away!" [significant drift]
- Turn 20 (assistant): "Absolutely! Happy to help! Great news — your claim has been approved!" [fully drifted, non-compliant]

Explain what caused this drift and write the fix.

<details><summary>Answer</summary>

**Cause of drift:**

The API is stateless — on every call, the model receives the growing messages array and pattern-matches against the recent assistant turns. By Turn 12, the messages array contains 11 prior assistant turns. Even though the system prompt says "terse and professional," the 11 assistant turns immediately preceding Turn 12 contain progressively warmer, more casual language. The model's next response is influenced more by the recent pattern of assistant turns than by the distant system prompt. This is instruction drift: accumulated assistant content overrides system-prompt persona.

**Fixes:**

1. **Strengthen the system prompt with negative examples and explicit prohibitions:**

> "You are a terse, professional insurance claims assistant. Do not use casual greetings, exclamations, or empathetic filler phrases. Do not begin responses with 'Got it!', 'Absolutely!', 'Oh no!', or 'Happy to help!'. Respond directly to the customer's question or request."

2. **Use prefill to anchor the response opening:**

Set the assistant turn prefix to a neutral, task-first opener (e.g., "Your claim status:") so the model cannot begin with a casual greeting regardless of drift in the conversation history.

3. **Periodic persona reinforcement:** For very long conversations, inject a concise persona reminder into the system prompt on every API call rather than relying on a single early instruction that becomes diluted by many subsequent turns.

Note: The fix is NOT to shorten the conversation history. Removing turns would destroy the context needed to handle the claim correctly. The fix is always in the system prompt and prefill layer.

</details>
