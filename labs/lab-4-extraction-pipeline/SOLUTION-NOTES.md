# Lab 4 — Solution Notes

> Architecture discussion only — not a full implementation. No working code is provided here. Use this to evaluate your own design decisions after completing the milestones.

---

## Key Design Decisions

### 1. Nullable fields use `"type": ["string","null"]`

**Decision:** Represent absent optional fields as JSON null, enforced via the type array syntax.

**Rationale:** Without an explicit null type, the JSON Schema validator treats `null` as invalid and Claude may substitute a plausible-looking value to satisfy the schema. The `"type": ["string","null"]` form signals that null is a first-class valid return — Claude can and should return it when the data is not present on the document.

**The exam tradeoff:** `anyOf: [{type: "string"}, {type: "null"}]` is semantically equivalent but is more verbose and behaves identically in the Anthropic API. The exam expects the concise type-array form. More important: neither form eliminates fabrication unless you also reinforce the intent in the field `description`. A description that says "Return null if not visible on the document" dramatically reduces hallucinated values. The schema is a structural contract; the description is the behavioral instruction.

---

### 2. Enum fields always include "other" plus a companion detail field

**Decision:** Every enum includes `"other"` as a value, paired with a nullable string detail field that is required when the enum value is `"other"`.

**Rationale:** Closed enums that do not have an escape hatch force Claude to pick the nearest match even when none fits. A currency like `"CAD"` would be forced into `"USD"` or left blank. The `"other"` + `currency_other` pattern allows the model to signal "known unknown" — it knows the data is present but cannot categorize it. This is more reliable than an open string field because the enum still constrains the common case while allowing graceful degradation.

**The exam tradeoff:** You could use an open string for `currency` and validate with a regex, but then you lose the categorical signal. The enum + companion pattern is the recommended approach for any field with a known-but-incomplete value space.

---

### 3. tool_use eliminates syntax errors, not semantic errors

**Decision:** Force `tool_choice: {"type": "tool", "name": "extract_invoice"}` on every extraction call.

**Rationale:** When Claude uses a tool, its output is parsed JSON that matches the provided schema structure — you will never receive a response like "Here is the invoice data: vendor_name = Acme Corp, total = $1,250." Tool use enforces structural validity. It does not, however, prevent semantic errors: Claude can return `total_amount: 125.0` when the document clearly shows `$1,250.00`, or return `invoice_date: "03/15/2024"` when your schema description asked for ISO 8601. The Validator exists precisely to catch these semantic failures.

**The exam tradeoff:** This is a critical exam concept. Tool use is not a substitute for validation. It moves the error class from "malformed JSON" (format error) to "correctly structured but wrong content" (semantic error). Your retry loop targets semantic errors; tool_use handles format errors automatically.

---

### 4. Validation-retry with field-specific correction instructions

**Decision:** On validation failure, send a correction message that names the failing field, states the returned value, and states the required value or rule. Do not send a generic "please re-extract" message.

**Rationale:** A generic retry wastes a turn. Claude does not know which field failed or why. A specific correction instruction like "invoice_date must be ISO 8601 (YYYY-MM-DD). You returned '03/15/2024'. Return '2024-03-15'." is actionable in one turn. This is the same principle as targeted code review comments vs. "please fix the code."

**The exam tradeoff:** Specificity in correction instructions is the difference between a retry that converges and a retry that loops. Always include: the field name, the returned value, and the constraint that was violated.

---

### 5. Why retry fails when data is absent — and the "not found" exit path

**Decision:** After 2 failed retries on a nullable field, exit with `status: "not_extractable"` rather than retrying further.

**Rationale:** Retry assumes the model has seen the correct data but returned it in the wrong form. When the data is genuinely absent from the document (no invoice number exists), no number of retries will surface it — Claude will either keep returning null (correct) or eventually fabricate one (wrong). The retry loop must distinguish between:
- **Misread data**: present on the document, returned in wrong format → retry with correction
- **Absent data**: not on the document → exit with "not_extractable"

The decision point is your validator output. If the failure is a format error (`invoice_date` wrong format), retry. If the failure is a null on a required field after 2 attempts, escalate to re-scan because either the document is unreadable or the field genuinely does not exist.

**The exam tradeoff:** Unlimited retries are expensive and can cause rate-limit issues in batch contexts. Cap retries at 2. Design the exit path before you design the retry loop — it is easier to route correctly than to add an escape later.

---

### 6. Batch API: custom_id as the correlation key

**Decision:** Set `custom_id` to the invoice filename on every batch request. Use `custom_id` (not array index) when processing results.

**Rationale:** The Batch API does not guarantee result order. Results may arrive in any sequence, and some may be missing (errored or expired). Using array index to correlate input to output will silently produce wrong matches. The `custom_id` is explicitly designed for this use case — it survives reordering, partial failures, and result pagination.

**The exam tradeoff:** The Batch API offers ~50% cost savings and a 24-hour processing window. The tradeoffs: no multi-turn conversations (each request is a single self-contained call), no streaming, and no guaranteed completion time within the window. It is the right choice for overnight processing where latency is not a constraint.

---

### 7. Confidence routing: high/medium/low tiers

**Decision:** Route by confidence tier rather than by validation pass/fail alone.

**Rationale:** Validation tells you whether the extraction is structurally correct. Confidence tells you whether it is likely to be factually correct. A document that passes validation but has many null values (vendor_name present, all line items missing) is technically valid but almost certainly a poor extraction. Confidence scoring lets you route these borderline cases to human review rather than auto-approving them. The high/medium/low tiers map directly to business workflows: auto-approve, human review, re-scan.

**The exam tradeoff:** Confidence scoring is heuristic, not deterministic. Design the scoring function to be explainable — when a document goes to review, the reviewer should see a human-readable reason, not just a score.

---

### 8. Stratified accuracy: per document_type, not overall

**Decision:** Track and report precision/recall per `document_type` bucket, not just an overall accuracy number.

**Rationale:** Overall accuracy is a misleading metric when document types have different frequencies. If 90% of documents are invoices and 10% are credit memos, a model that correctly handles all invoices but fails on all credit memos will show 90% overall accuracy. The accounts payable team will believe the system is working, deploy it, and then discover that every credit memo has been misclassified. Stratified accuracy exposes per-type failure modes that aggregate metrics hide.

**The exam tradeoff:** More tracking overhead, but essential for any production extraction system with mixed document types. The rule is: always stratify metrics by the dimension that matters for correctness — here, `document_type`.

---

## What a Strong Solution Looks Like

- Schema is defined once in `schema.py` and imported everywhere — no copy-pasted dicts
- Validator returns structured error objects (field name + error code + message), not raw strings, so the retry prompt builder can format them correctly
- Retry loop is a pure function: `(document_text, previous_result, errors) -> new_result` — easy to test in isolation
- Batch runner separates submission (`submit_batch`) from collection (`poll_and_collect`) so you can submit overnight and collect in the morning without re-submitting
- Confidence scorer is calibrated against a small ground-truth set before being used in production routing
- `AccuracyTracker.summary()` prints a table, not a single number

---

## Common Mistakes and Fixes

**Mistake:** Returning `""` for missing fields and having the validator accept it.
**Fix:** Add an explicit check: `if isinstance(value, str) and value == "": errors.append(...)`. The schema allows null; empty string is not null.

**Mistake:** Sending only the correction instruction on retry, without the original document.
**Fix:** The retry message must contain the full document content again. Claude has no memory between turns in a stateless call — it cannot refer back to the document from the first turn.

**Mistake:** Retrying when `stop_reason == "max_tokens"`.
**Fix:** If the response was cut off by the token limit, the extraction is incomplete. Increasing `max_tokens` or chunking the document is the fix — not retrying with the same parameters.

**Mistake:** Treating batch results as ordered.
**Fix:** Build a lookup dict `{result.custom_id: result}` immediately after iteration. Never use positional indexing.

**Mistake:** Reporting 94% accuracy after batch run.
**Fix:** Break it down: `invoice: 97% | receipt: 91% | credit_memo: 62% | other: 40%`. The 94% overall is misleading; the 62% and 40% are the actionable numbers.

---

## Connection to Exam Concepts

| Concept | Where It Appears in This Lab |
|---|---|
| Structured output via tool_use | M1 — forced tool_choice |
| Nullable vs. required field design | M1 — schema design, null assertion tests |
| Validation-retry loop | M2 — correction instruction format, max retry cap |
| Explicit "not found" exit path | M2 — `not_extractable` and `rescan` statuses |
| Batch API mechanics | M3 — custom_id, poll/collect, partial failure handling |
| Confidence routing | M4 — three-tier dispatch |
| Stratified accuracy | M4 — per-document_type metrics vs. misleading overall |
| Semantic vs. syntax errors | Throughout — tool_use handles syntax; validator handles semantics |
