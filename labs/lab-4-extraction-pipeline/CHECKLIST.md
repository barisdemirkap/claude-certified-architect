# Lab 4 — Completion Checklist

## Milestone M1 — Schema Design & Null Verification

- [ ] `EXTRACT_INVOICE_TOOL` dict defined in `schema.py` with all fields from the spec
- [ ] All nullable fields use `"type": ["X","null"]` (not `anyOf`, not `oneOf`)
- [ ] All enum fields include `"other"` as a value
- [ ] Each `"other"` enum value has a companion nullable detail field (`currency_other`, `document_type_detail`)
- [ ] `tool_choice` is set to `{"type": "tool", "name": "extract_invoice"}` (not `"auto"`)
- [ ] Test: receipt with no invoice_number returns `null`, not `""` or `"N/A"`
- [ ] Test: invoice with no tax_amount returns `null`, not `0`
- [ ] Test: unknown currency returns `"other"` and `currency_other` is non-null
- [ ] Test: standard invoice returns all required fields correctly typed
- [ ] All 4 test assertions pass without manual post-processing of Claude's output

---

## Milestone M2 — Validation-Retry Loop

- [ ] `validate()` rejects `""` for any nullable field (not just missing keys)
- [ ] `validate()` rejects `invoice_date` strings that are not ISO 8601
- [ ] `validate()` rejects `total_amount <= 0`
- [ ] `validate()` enforces cross-field rules: `currency == "other"` requires `currency_other != null`
- [ ] Correction instruction names the specific failing field and states the exact expected value or format
- [ ] Retry passes original document content + correction instruction (not just the correction alone)
- [ ] Max retry count is enforced (no infinite loops)
- [ ] Explicit `"not_extractable"` exit for nullable fields that remain null after retries
- [ ] Explicit escalation to `"rescan"` for required fields that cannot be found after retries
- [ ] End-to-end test: a document with a deliberately wrong date format eventually passes after one retry

---

## Milestone M3 — Batch Processing

- [ ] Batch submitted using `client.beta.messages.batches.create`
- [ ] Each request in the batch has `custom_id` set to the invoice filename
- [ ] Polling loop checks `batch.processing_status` and waits for `"ended"`
- [ ] Results iterated via `client.beta.messages.batches.results(batch_id)`
- [ ] `succeeded` results are routed through the Validator
- [ ] `errored` results are logged and marked `status: "batch_error"` without re-raising
- [ ] `expired` results are logged and marked `status: "batch_expired"`
- [ ] Result lookup uses `custom_id`, not array index
- [ ] Partial failures do not abort processing of remaining results
- [ ] Batch summary report is printed: totals for submitted / succeeded / errored / expired / validation-passed / validation-failed

---

## Milestone M4 — Confidence Routing & Stratified Accuracy

- [ ] `confidence_score()` considers at least 2 input signals (stop_reason, null count, etc.)
- [ ] Three tiers defined: high (≥ 0.8), medium (0.5–0.79), low (< 0.5)
- [ ] High-confidence results written to approved output without human review
- [ ] Medium-confidence results pushed to review queue with extracted JSON + confidence explanation
- [ ] Low-confidence results pushed to re-scan queue with reason string
- [ ] `AccuracyTracker.record()` stores outcome per `document_type` bucket
- [ ] `AccuracyTracker.summary()` prints per-bucket precision/recall and overall metrics
- [ ] Test demonstrates that high overall accuracy can mask 0% precision on a minority document type

---

## Exam-Objective Coverage

| Objective | How This Lab Covers It |
|---|---|
| D4: Design JSON schemas for structured extraction | M1 — full schema with nullable, enum, companion fields |
| D4: Use tool_use to force structured output | M1 — `tool_choice` forced, not auto |
| D4: Write correction-instruction retry prompts | M2 — field-specific correction messages |
| D4: Distinguish syntax errors from semantic errors | M1/M2 — tool_use eliminates malformed JSON; validator catches semantic errors (wrong type, wrong value) |
| D5: Build explicit "not found" exit paths | M2 — `not_extractable` status, escalation to rescan |
| D5: Handle partial failures in batch jobs | M3 — errored/expired handling without aborting |
| D5: Implement confidence-based routing | M4 — three-tier routing |
| D5: Track stratified (not just overall) accuracy | M4 — per-document_type metrics |

---

## Common Pitfalls

- Using `tool_choice: "auto"` — Claude can skip the tool; always force it for extraction
- Treating `""` as a valid absent value — your validator must explicitly reject empty strings for nullable fields
- Retrying when data is absent — retry is for misread data, not missing data; build the exit path
- Using array index to correlate batch results — always use `custom_id`
- Reporting only overall accuracy — a model scoring 95% overall can have 0% on credit memos if they are rare

---

## Stretch Goals

- Add a `document_classifier` pre-pass that reads the first 200 words and predicts `document_type` before full extraction — use this to route to a more specific extraction prompt
- Implement cost estimation: calculate token usage per document, project monthly cost at current invoice volume
- Add a `line_items_reconciliation` check: sum all `line_items[].total` values and compare to `total_amount`; flag discrepancies > 1% as low confidence
- Build a ground-truth evaluation harness: given a folder of invoices with hand-labeled JSON, compute per-field accuracy (not just document-level pass/fail)
- Implement prompt caching on the system prompt and tool definition to reduce costs on large batches
