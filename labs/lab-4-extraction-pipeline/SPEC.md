# Lab 4 — Specification

## Architecture Overview

```
PDF Invoices (batch or single)
        |
        v
  [Extractor]  ──── tool_use call ────>  Claude API
        |                                    |
        |         <── structured JSON ───────|
        v
  [Validator]  ──── field checks ────>  pass / fail + correction instruction
        |
     fail? ──> [Retry Loop] (max 2 retries, then "not found" exit)
        |
      pass
        |
        v
  [Confidence Router]
     high  ──> auto-approve queue
     medium ──> human review queue
     low   ──> re-scan request queue
        |
        v
  [Accuracy Tracker]  (per document_type, not global only)
```

**Component responsibilities:**

- **Extractor** — wraps the PDF content in a prompt, defines the extraction tool, calls `client.messages.create` with `tools` and `tool_choice: {type: "tool", name: "extract_invoice"}`.
- **Validator** — checks each required field is present and typed correctly, each nullable field is `null` or the correct type (never empty string `""`), enum fields are in the allowed set.
- **Retry Loop** — on validation failure, calls Claude again with the original document content plus a targeted correction message naming the failing field and the exact fix required. Exits after 2 retries or when data is confirmed absent from the source.
- **Confidence Router** — scores extraction confidence (see M4) and dispatches the record to one of three downstream queues.
- **Accuracy Tracker** — stores outcome per `document_type` bucket so precision can be measured independently for invoices, receipts, credit memos, and other.

---

## Milestone M1 — Schema Design & Null Verification

**Requirements:**

1. Define the extraction tool with the following JSON schema (use `"type": ["string","null"]` for nullable fields — do not use `anyOf` or `oneOf` for this exam):

```json
{
  "vendor_name":        { "type": "string",          "description": "..." },
  "invoice_number":     { "type": ["string","null"],  "description": "..." },
  "invoice_date":       { "type": "string",           "description": "ISO 8601 date, e.g. 2024-03-15" },
  "total_amount":       { "type": "number",           "description": "..." },
  "currency":           { "type": "string",           "enum": ["USD","EUR","GBP","other"] },
  "currency_other":     { "type": ["string","null"],  "description": "Required when currency is 'other', null otherwise" },
  "tax_amount":         { "type": ["number","null"],  "description": "..." },
  "line_items": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "description": { "type": "string" },
        "quantity":    { "type": ["number","null"] },
        "unit_price":  { "type": ["number","null"] },
        "total":       { "type": "number" }
      },
      "required": ["description","total"]
    }
  },
  "document_type":       { "type": "string", "enum": ["invoice","receipt","credit_memo","other"] },
  "document_type_detail":{ "type": ["string","null"], "description": "Required when document_type is 'other', null otherwise" }
}
```

2. Write a test suite with at least 4 synthetic documents:
   - Invoice with all fields present
   - Receipt with no invoice_number and no tax_amount
   - Document with an unknown currency
   - Ambiguous document that could be a credit memo

3. For each test, assert that absent fields are `null`, not `""`, `0`, `"N/A"`, or invented values.

4. Tool call must use `tool_choice: {"type": "tool", "name": "extract_invoice"}` to force structured output (not `auto`).

---

## Milestone M2 — Validation-Retry Loop

**Requirements:**

1. Implement a `validate(result)` function that checks:
   - All required fields are non-null and correctly typed
   - Nullable fields are `null` or the correct type (reject `""` as a failure)
   - `invoice_date` matches ISO 8601 (`YYYY-MM-DD` at minimum)
   - `currency` is in the enum; if `"other"`, `currency_other` must be non-null
   - `document_type` is in the enum; if `"other"`, `document_type_detail` must be non-null
   - `total_amount` is positive
   - Each `line_items[].total` is positive

2. On failure, construct a **correction instruction** that names the failing field and states the exact expectation:

   > "invoice_number must be a string or null. You returned an empty string. Return null if no invoice number is visible on the document."

3. Retry up to **2 times**, passing the original document content alongside the correction instruction.

4. Implement an explicit **"not found" exit path**: if validation still fails after 2 retries and the failure is on a field that may legitimately be absent (nullable fields), record the extraction as `status: "not_extractable"` and do not retry further. Only retry when the data might actually be present but was misread.

5. Do **not** retry when: the document type is confirmed absent from the image, or a required field (like `total_amount`) cannot be found after 2 attempts — escalate to re-scan.

---

## Milestone M3 — Batch Processing

**Requirements:**

1. Use the Anthropic Batch API (`client.beta.messages.batches`) to submit 50 invoices as a single batch job.

2. Set `custom_id` to the invoice filename (e.g., `"inv_2024_0042.pdf"`) so results can be correlated back to source files after the batch completes.

3. Poll the batch status until it reaches `ended` state; do not assume synchronous completion (target: overnight runs).

4. On completion, iterate results. Each result has a `custom_id` and a `result` object. Handle three result types:
   - `succeeded` — process normally through Validator
   - `errored` — log the error, mark the invoice as `status: "batch_error"`, do not re-raise
   - `expired` — log, mark as `status: "batch_expired"`, flag for resubmission

5. Produce a batch summary report: total submitted, succeeded, errored, expired, validation-passed, validation-failed.

6. Partial failure must not abort processing of the remaining results.

---

## Milestone M4 — Confidence Routing & Stratified Accuracy

**Requirements:**

1. Define a `confidence_score(result, raw_response)` function. Input signals to consider:
   - Stop reason (`tool_use` vs `max_tokens` vs `end_turn`)
   - Presence of `null` values in required-but-nullable fields (more nulls = lower confidence)
   - `line_items` array length vs. total_amount plausibility
   - Whether `document_type` is `"other"` (less certain)

2. Map scores to tiers:
   - `high` (≥ 0.8) — write directly to approved ledger
   - `medium` (0.5–0.79) — push to human review queue with the extracted JSON and a confidence explanation
   - `low` (< 0.5) — push to re-scan request queue with reason

3. Implement `AccuracyTracker`:
   - Tracks TP (true positive), FP, FN per `document_type` bucket
   - Computes precision and recall per bucket when ground truth is available
   - Exposes `summary()` that prints per-bucket and overall metrics

4. Write a test that shows why overall accuracy is misleading: a model that correctly handles all invoices (90% of volume) but fails on all credit memos will show high overall accuracy but 0% precision on credit memos.

---

## Input/Output Contract

**Input:** PDF binary or base64-encoded string, plus optional metadata `{filename, submitted_at, client_id}`.

**Output per document:**
```json
{
  "custom_id": "inv_2024_0042.pdf",
  "status": "approved | review | rescan | not_extractable | batch_error | batch_expired",
  "confidence_tier": "high | medium | low",
  "extraction": { ...invoice fields... },
  "validation_errors": [],
  "retry_count": 0
}
```

**Batch output:** JSON lines file where each line is one document output.

---

## Constraints (Out of Scope)

- OCR pre-processing — assume PDFs are already text-extractable or that vision input is sufficient
- Multi-page PDF splitting — treat each PDF as one document
- Database persistence — write to JSON files only
- Authentication, multi-tenancy, or user accounts
- Real vendor API integrations (GL posting, ERP sync)
- Cost tracking beyond the batch savings estimate
