# Tricky Details — 04 — Prompt Engineering & Structured Output
These small distinctions decide pass/fail.

---

### Few-shot examples target ambiguous cases, not easy ones

**Trap:** Writing examples that demonstrate the most common, obvious cases — the cases where correct behavior is unambiguous.

**Reality:** Few-shot examples are most valuable on AMBIGUOUS edge cases where the model needs explicit guidance. The model already handles easy cases correctly from training. Adding examples for obvious cases wastes context tokens and can cause the model to fixate on example patterns rather than generalizing. Examples with rationale ("this is classified X because the amount exceeds the threshold AND the vendor is unregistered") consistently outperform examples without reasoning — the rationale teaches the rule, not just the label.

**Tell:** "Which set of few-shot examples will most improve accuracy?" — the correct answer targets edge cases and boundary conditions with rationale, not the common happy-path examples.

---

### "Be conservative" is not an explicit criterion

**Trap:** Writing "tell Claude to be conservative and use good judgment" as a reliability measure for sensitive decisions.

**Reality:** Vague qualitative instructions produce variable, non-reproducible behavior. Two identical inputs can yield different decisions because the instruction leaves room for interpretation. Explicit numeric thresholds and logical conditions — "approve if confidence_score >= 0.85 AND flag_count == 0" — produce consistent, auditable behavior. The more specific the threshold, the less interpretive space remains.

**Tell:** Two options presented: "tell Claude to be careful" vs "define specific numeric thresholds and conditions" — the specific thresholds answer is always correct on the exam.

---

### tool_use eliminates syntax errors, NOT semantic errors

**Trap:** "We force a tool call on a schema — our structured output problems are solved."

**Reality:** tool_use + schema eliminates SYNTAX errors: malformed JSON, wrong field types, missing required fields, extra keys, and markdown fences around JSON are all prevented. It does NOT prevent SEMANTIC errors: the model can return perfectly valid JSON where a string field contains a wrong value — the correct field type with incorrect content. For example, the `vendor_name` field is always a string, but sometimes the wrong vendor name.

**Tell:** "After implementing tool_use, the output format is always correct but certain field values are sometimes wrong." That's a semantic error. Schema + tool_use cannot fix it. The remaining errors need human review, confidence scoring, or downstream validation.

---

### Nullable fields prevent fabrication; required fields enable it

**Trap:** Making all JSON schema fields `required` to ensure complete, structured output.

**Reality:** A `required` field pressures the model to fill it — even when the source document does not contain the value. When the data is absent and the field is required, the path of least resistance for the model is fabrication: it invents a plausible value that passes schema validation but is factually wrong. Nullable fields (`"type": ["string", "null"]`) explicitly permit the model to return `null` for absent data, removing the pressure to fabricate.

**Tell:** "The pipeline keeps inventing vendor names for invoices that don't show one" — `vendor_name` should be `"type": ["string", "null"]`, not `required`. The fabrication is caused by schema pressure, not model hallucination in the general sense.

---

### Retry fails when data is absent from the source

**Trap:** Implementing unlimited or high-count retries whenever a structured output field is missing or invalid.

**Reality:** Validation-and-retry corrects errors where the model had the data available but extracted or formatted it incorrectly. When the data simply does not exist in the source document, retrying the same extraction will never succeed — the model is being asked to produce information that isn't there. The retry loop will either run to exhaustion or cycle indefinitely. A well-designed pipeline has two distinct code paths: retry for extraction errors with present data, and a null/not-found exit for genuinely absent data.

**Tell:** "The retry loop runs forever for a subset of invoices." Those invoices don't contain the field being extracted. The fix is a not-found exit path, not a higher retry count or a better correction instruction.

---

### Batch API: no multi-turn tool calling

**Trap:** Using the Batches API to run an agentic workflow that calls tools (search, database lookup) and uses those results to continue reasoning.

**Reality:** The Batches API processes each item as a SINGLE API call. There is no mechanism for the model to call a tool, receive a result, and continue the conversation within a batch item. Multi-turn tool loops are architecturally impossible in Batch. If your workflow requires any tool-call-and-continue loop, you must use the standard Messages API.

**Tell:** "Use the Batch API to run an agent that searches for information and then summarizes it" — impossible. Batch = one call per item, no loops. Any scenario describing a tool loop eliminates Batch as a valid answer.

---

### 24-hour processing time means Batch is never for user-facing requests

**Trap:** Using the Batches API for a pipeline that a user is waiting on, rationalizing that "most requests complete in minutes."

**Reality:** The Batches API has NO latency SLA. Processing can take up to 24 hours. "Usually faster" is not an architectural guarantee. Any request where a user is waiting for a response requires the standard Messages API, which has a synchronous response model. Batch is designed exclusively for background, overnight, non-interactive workloads.

**Tell:** "Which API should we use for processing 10,000 invoices overnight vs answering a customer's real-time question?" — Batch for the overnight job, Messages for the customer question. If a scenario mentions a user waiting, Batch is always wrong.

---

### Larger context window does not improve attention quality

**Trap:** "We have access to a 200K token context window, so we can put the entire document corpus in context and the model will find the relevant information."

**Reality:** The lost-in-the-middle effect means that model attention degrades for content positioned in the middle of a long context, regardless of how large the context window is. A larger window increases capacity — it does not increase attention quality or eliminate the positional attention bias. Critical information placed in the middle of a long context is less likely to be correctly referenced than information at the beginning or end.

**Tell:** "The model has access to all the documents but keeps missing information from the middle sections" — this is lost-in-the-middle, and the fix is chunking with targeted retrieval or repositioning critical content, not a larger context window.
