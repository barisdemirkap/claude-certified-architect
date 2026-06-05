# Quiz — 04 — Prompt Engineering & Structured Output
Score >=80% before moving to the next module.

---

**Q1:** A team is building an invoice classification system that routes invoices to APPROVED, FLAGGED, or MANUAL_REVIEW. In production, accuracy on common single-vendor, single-line-item invoices is 98%. Accuracy drops to 61% on split invoices (multiple vendors, partial payments). The team wants to add few-shot examples. Which approach is most effective?

A) Add 10 examples of single-vendor, single-line-item invoices to reinforce correct behavior
B) Add 3-5 examples targeting split invoice edge cases, each with a rationale explaining the classification rule
C) Add 20 diverse examples covering all invoice types proportionally to their frequency in production
D) Add examples without rationale to avoid biasing the model toward a specific explanation

<details><summary>Answer</summary>**B** — Few-shot examples are most valuable on ambiguous edge cases where the model currently fails. The model already handles common cases at 98% — adding examples there wastes context. Rationale ("this is MANUAL_REVIEW because the split payment crosses two fiscal periods") teaches the rule, not just the label, which improves generalization to novel edge cases. | Distractor: C sounds reasonable but adding proportional examples biases the example set toward easy cases that don't need help, and 20 examples risks causing fixation on example patterns.</details>

---

**Q2:** A lending platform uses this instruction in its loan approval prompt: "Approve loans for creditworthy applicants but be conservative with borderline cases." After deployment, two loans with identical applicant profiles receive different decisions in separate calls. What is the root cause and correct fix?

A) The model is non-deterministic; increase temperature to reduce variance
B) The instruction is too short; add more detail about what creditworthy means in general terms
C) "Conservative" and "creditworthy" are vague; replace them with explicit numeric thresholds and conditions
D) Add few-shot examples demonstrating borderline cases so the model learns the boundary

<details><summary>Answer</summary>**C** — Vague qualitative instructions leave interpretive space that produces variable behavior across identical inputs. The fix is explicit criteria: "approve if credit_score >= 680 AND debt_to_income_ratio <= 0.43 AND fraud_flag == false." This produces consistent, auditable decisions. | Distractor: D is tempting because few-shot examples can help with edge cases, but they don't solve the root problem — the instruction itself is vague, and examples without an explicit rule will also vary. The correct fix is explicit criteria first, examples second if needed.</details>

---

**Q3:** An engineering team implements tool_use with a strict JSON schema for their contract extraction pipeline. After deployment, they report: "The output is always valid JSON — no more format errors. But the extracted party names are sometimes wrong." Which statement best characterizes the situation?

A) The schema is not strict enough; add more required fields to force correct values
B) tool_use has eliminated syntax errors but semantic errors remain; schema validation cannot verify value correctness
C) The model needs more examples of correct party name extraction to fix the remaining errors
D) The retry logic is misconfigured; a correct retry implementation would also fix the value errors

<details><summary>Answer</summary>**B** — tool_use + schema eliminates syntax errors (malformed JSON, wrong types, missing required fields). It cannot verify that a string field contains the correct string value — that is a semantic error. Valid JSON with wrong party names passes schema validation. Fixing semantic errors requires different strategies: human review, confidence scoring, or cross-reference validation. | Distractor: A is wrong because adding more required fields addresses completeness (syntax-level), not correctness (semantic-level). The party_name field is already required and present — it's just wrong.</details>

---

**Q4:** A data extraction pipeline processes supplier invoices. The JSON schema marks `vendor_tax_id` as required with type string. In production, about 30% of invoices don't display a tax ID. The team notices that for those invoices, the model consistently returns plausible-looking but fabricated tax ID numbers. What is the cause and the correct schema fix?

A) The model needs better instructions to say "unknown" when data is missing; add a system prompt instruction
B) The required constraint pressures the model to fill the field even when data is absent; change vendor_tax_id to `"type": ["string", "null"]` and remove it from required
C) Add a few-shot example showing an invoice without a tax ID so the model learns to return empty string
D) Implement validation-and-retry to catch fabricated tax IDs before they reach production

<details><summary>Answer</summary>**B** — The required constraint creates pressure to fill every field, including when the data isn't in the source document. The path of least resistance is fabrication. Making the field nullable (`"type": ["string", "null"]`) and removing it from required explicitly signals that null is a valid, expected response for absent data — which removes the fabrication pressure. | Distractor: D (retry) cannot fix this because validation-and-retry can only work if you can detect a fabricated tax ID, which is structurally indistinguishable from a real one. The fix must be at the schema level.</details>

---

**Q5:** A contract analysis pipeline extracts `termination_date` from legal contracts. Validation requires this field to be a valid ISO 8601 date. For some contracts, the retry loop runs 10 times without converging on a valid date, and the pipeline hangs. What is the most likely root cause and the correct architectural fix?

A) The model needs a better correction instruction; provide more specific guidance about the ISO 8601 format
B) 10 retries is insufficient; increase the retry limit to 50 to give the model more chances to correct itself
C) Some contracts are evergreen (no termination date); the field should be nullable and the pipeline needs a not-found exit path
D) Switch to tool_use for structured output; this will force the model to produce a valid date

<details><summary>Answer</summary>**C** — Retry-and-correct can only extract data that exists in the source. Evergreen or indefinite-term contracts have no termination date. No number of retries will produce a valid date from a document that doesn't contain one. The correct fix is: mark `termination_date` as nullable, accept null as a valid response, and exit the retry loop when null is returned. | Distractor: D (tool_use) enforces type correctness but if the model returns null for a required field, tool_use will still reject it — and if the field is nullable, returning null is valid. tool_use doesn't solve the absent-data problem.</details>

---

**Q6:** A team wants to use the Batches API to power an agent that researches each of 500 companies. For each company, the agent searches the web, reads top results, and writes a one-paragraph summary. Which statement correctly identifies a constraint that makes this design unviable?

A) The Batches API supports a maximum of 100 requests per batch, not 500
B) The Batches API processes each item as a single API call; there is no mechanism for multi-turn tool calling within a batch item
C) The Batches API does not support system prompts, making agent instructions impossible
D) The 50% cost savings only applies to input tokens, not output tokens, reducing the economic benefit

<details><summary>Answer</summary>**B** — The Batches API processes each item as one API call with no mechanism for a tool result to re-enter the conversation. A web search agent requires: call search tool, receive results, continue reasoning, write summary — at minimum a two-turn interaction. This tool loop is architecturally impossible in Batch. Each item is one call; no loops. | Distractor: A is factually wrong (Batch supports up to 100,000 requests per batch). The correct constraint is the single-call-per-item limitation that blocks tool loops.</details>

---

**Q7:** A startup processes customer support tickets using Claude. They are considering switching to the Batches API to reduce costs. Which of the following workloads is NOT appropriate for the Batches API?

A) Nightly batch classification of 20,000 support tickets to tag product areas for analytics
B) Monthly generation of account summary reports for 500 enterprise customers
C) Real-time classification of incoming support tickets to route them to the correct team
D) Quarterly analysis of historical ticket data to identify recurring issue patterns

<details><summary>Answer</summary>**C** — Real-time routing requires a response while the user (or the ticketing system) is waiting. The Batches API has no latency SLA and can take up to 24 hours. Any user-facing, synchronous, or low-latency workload requires the standard Messages API. | Distractor: A and B are textbook Batch use cases — high volume, scheduled, no user waiting. D is also Batch-appropriate. Only C requires real-time response.</details>

---

**Q8:** An architect is designing a long-document analysis pipeline. Each document is 150,000 tokens. The team plans to place the analysis instructions at the beginning of the context, followed by the document, followed by specific questions at the end. They note that the model sometimes misses information from the middle sections of long documents. A team member suggests switching to a larger context window model to fix this. What is the correct assessment?

A) The larger context window will fix the issue because more tokens improve comprehension
B) A larger context window increases capacity but does not eliminate the lost-in-the-middle effect; the fix is chunking with targeted retrieval or repositioning critical content
C) The placement of instructions at the start and questions at the end is the anti-pattern; move everything to the middle
D) The issue is prompt length, not document length; shorten the analysis instructions

<details><summary>Answer</summary>**B** — The lost-in-the-middle effect describes degraded model attention to content in the middle of long contexts, and it persists regardless of context window size. A larger window is a capacity increase, not an attention quality improvement. The correct architectural response is chunking the document into smaller segments with targeted retrieval, or ensuring critical information appears at the beginning or end of context where attention is strongest. | Distractor: C is wrong — placing instructions at start and questions at end is correct practice (high-attention positions). The problem is the document's middle content, not the instruction placement.</details>

---

**Q9:** A pipeline uses dynamic decomposition: Claude receives a complex research request and decides how to break it into sub-tasks before executing them. When would the interview pattern be more appropriate than dynamic decomposition?

A) When the sub-tasks are predictable and can be defined in advance
B) When the input is ambiguous enough that acting on incorrect assumptions would produce worthless or harmful results, and a human is available to answer clarifying questions
C) When processing speed is critical and the decomposition overhead is unacceptable
D) When the pipeline is fully automated with no human in the loop

<details><summary>Answer</summary>**B** — The interview pattern is designed for cases where acting on ambiguous input before clarification would produce a wrong or harmful outcome, and a human is available to resolve the ambiguity. Dynamic decomposition is appropriate when the task structure can vary but the model can reason correctly about how to break it down from the input alone. If a human is not available (fully automated pipeline), the interview pattern is not viable. | Distractor: D describes exactly the situation where the interview pattern is NOT appropriate — no human available means the model must act on its best interpretation, making dynamic decomposition or sequential chaining the correct choice.</details>

---

**Q10:** A team designs a JSON schema for extracting invoice categories. The category field uses an enum: `["office_supplies", "travel", "software", "facilities"]`. In production, the model correctly categorizes 87% of invoices but forces unusual invoices (charitable donations, legal fees) into the closest-matching category. What schema change would best resolve this?

A) Add more enum values to cover every possible category the business might encounter
B) Remove the enum constraint and let the model return any string value for maximum flexibility
C) Add "other" as an enum value and add a companion string field `category_detail` for free-text explanation when "other" is selected
D) Use a required field with type string instead of an enum to allow free-form categorization

<details><summary>Answer</summary>**C** — Without an escape hatch, the model is forced to select the closest enum value even when none fit — a semantic error disguised as valid output. Adding "other" as an option plus a `category_detail` string field allows the model to correctly signal that a category is outside the defined set, while still providing useful information about what the category actually is. | Distractor: B (free-form string) trades structure for flexibility in a way that breaks downstream processing — if any string is valid, you cannot reliably filter or aggregate by category. The enum with an escape hatch preserves structure while allowing for genuine edge cases.</details>
