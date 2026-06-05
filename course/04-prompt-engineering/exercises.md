# Exercises — 04 — Prompt Engineering & Structured Output

Applied exercises to build hands-on intuition. These are not multiple-choice — write out your reasoning before revealing the answer.

---

## Exercise 1: Redesign a Vague Prompt

A financial services team has this instruction in their loan approval prompt:

> "Be careful with borderline applications. Use good judgment to avoid approving loans that might be risky, but don't be so conservative that you reject good customers."

Identify every vague element in this instruction and rewrite it using explicit, measurable criteria. You may invent reasonable thresholds.

<details><summary>Answer</summary>

**Vague elements:**
- "Be careful" — qualitative, no measurable definition
- "borderline applications" — undefined boundary
- "good judgment" — entirely subjective
- "might be risky" — no operationalized definition of risk
- "so conservative that you reject good customers" — undefined threshold in both directions

**Rewritten version:**

> Approve the application if ALL of the following are true:
> - credit_score >= 680
> - debt_to_income_ratio <= 0.43
> - employment_months >= 24
> - fraud_flag == false
> - requested_amount <= 3x monthly_income
>
> If any condition is false, classify as DECLINE with the specific failing condition in the reason field.
> If credit_score is between 650 and 679 and all other conditions pass, classify as MANUAL_REVIEW.

This version is reproducible, auditable, and testable. Every decision can be verified against the criteria.
</details>

---

## Exercise 2: Design a Few-Shot Example Set

You are building an invoice classification system. The model must classify each invoice as one of: `APPROVED`, `FLAGGED_AMOUNT`, `FLAGGED_VENDOR`, or `MANUAL_REVIEW`.

You have observed the following errors in production:
- The model approves invoices from vendors not on the approved list when the amount is small
- The model sends multi-line invoices from approved vendors to MANUAL_REVIEW unnecessarily
- The model correctly handles all single-line invoices from approved vendors

Design a few-shot example set. Specify: how many examples, which cases to target, and whether to include rationale. Explain what you would NOT include and why.

<details><summary>Answer</summary>

**Target examples (3 examples, all edge cases):**

**Example 1 — Small amount, unapproved vendor:**
Input: Amount $45, vendor "QuickPrint Co" (not on approved list)
Output: FLAGGED_VENDOR
Rationale: "Classified as FLAGGED_VENDOR because the vendor is not on the approved vendor list. Amount is not relevant when the vendor is unapproved."

**Example 2 — Multi-line invoice, approved vendor:**
Input: 5 line items, vendor "Acme Corp" (approved), total $1,200
Output: APPROVED
Rationale: "Classified as APPROVED because the vendor is on the approved list. Multiple line items do not trigger MANUAL_REVIEW — only vendor status and amount thresholds determine classification."

**Example 3 — Amount above threshold, approved vendor:**
Input: Amount $15,000, vendor "Acme Corp" (approved)
Output: FLAGGED_AMOUNT
Rationale: "Classified as FLAGGED_AMOUNT because the amount exceeds the $10,000 threshold, even though the vendor is approved. Both conditions must pass."

**What to NOT include:**
- Single-line invoices from approved vendors with normal amounts (the model already handles these correctly — adding an example here wastes context and adds nothing)
- An example for every possible vendor (overfitting; use the principle, not the enumeration)

**Rationale:** Each example targets a specific failure mode observed in production. Each includes the reasoning so the model learns the rule, not just the label.
</details>

---

## Exercise 3: Spot the Anti-Pattern — JSON Schema

Review this JSON schema for an invoice extraction pipeline:

```json
{
  "type": "object",
  "required": ["invoice_number", "vendor_name", "vendor_tax_id", "amount", "date", "line_items", "po_number"],
  "properties": {
    "invoice_number": { "type": "string" },
    "vendor_name": { "type": "string" },
    "vendor_tax_id": { "type": "string" },
    "amount": { "type": "number" },
    "date": { "type": "string" },
    "line_items": { "type": "array", "items": { "type": "string" } },
    "po_number": { "type": "string" }
  }
}
```

Identify at least 3 design problems. For each, explain the consequence and write the corrected schema fragment.

<details><summary>Answer</summary>

**Problem 1: `vendor_tax_id` is required but often absent**
Many invoices — especially small vendors or international ones — do not include a tax ID. Making it required pressures the model to fabricate a plausible tax ID number.

Fix:
```json
"vendor_tax_id": { "type": ["string", "null"] }
```
Remove from `required` array.

**Problem 2: `po_number` is required but invoices without PO exist**
Many invoice workflows (ad hoc purchases, subscription services) have no associated PO number. Same fabrication risk as tax_id.

Fix:
```json
"po_number": { "type": ["string", "null"] }
```
Remove from `required` array.

**Problem 3: `line_items` as array of strings is too unstructured**
Returning raw strings for line items makes downstream processing difficult and gives the model no guidance on what to include. Items may be inconsistently formatted.

Fix:
```json
"line_items": {
  "type": "array",
  "items": {
    "type": "object",
    "required": ["description", "quantity", "unit_price"],
    "properties": {
      "description": { "type": "string" },
      "quantity": { "type": ["number", "null"] },
      "unit_price": { "type": ["number", "null"] }
    }
  }
}
```

**Bonus — Problem 4: No enum escape hatch**
If you add a `category` field with an enum (e.g., `["office_supplies", "travel", "software"]`), you must add `"other"` as an option plus a `"category_detail"` string field, or the model will force-fit every invoice into an existing category.
</details>

---

## Exercise 4: Design a Retry Strategy

An extraction pipeline processes contracts to extract `effective_date`, `termination_date`, and `governing_law`. You run validation after each extraction. Describe the complete retry strategy, including:

1. What to send back to the model on a validation failure
2. How many retries to attempt
3. How to handle the case where a field is simply not in the contract
4. How to distinguish between cases 2 and 3

<details><summary>Answer</summary>

**1. What to send back on validation failure:**

Return the model's original output plus a specific correction instruction:

> "Your previous extraction returned an invalid value. The field `termination_date` has value `'ongoing'` but must be an ISO 8601 date string (YYYY-MM-DD) or null if no termination date is specified in the contract. Please re-read the contract and return a corrected extraction."

Key elements: original invalid output included, exact field named, exact rule violated, exact allowed format stated, instruction to re-read the source.

**2. How many retries:**
2-3 retries maximum. Beyond that, the failure is likely structural (data absent or model misunderstanding), and more retries won't converge.

**3. How to handle absent fields:**
The schema must mark `termination_date` and `governing_law` as nullable. If the model returns `null` after a retry, that is a valid outcome — not an error to retry. Exit the retry loop and accept the null.

**4. How to distinguish extraction error vs absent data:**

Two signals:
- **Schema level:** If the field is nullable and the model returns `null`, treat as "not found" — do not retry.
- **Content level:** If the model returns a malformed value (wrong type, invalid format), that is an extraction error — retry with specific correction.
- **After max retries:** If the model keeps returning wrong values, escalate to human review or flag as EXTRACTION_FAILED rather than retrying indefinitely.

Never retry a `null` result from a nullable field. That is the correct response to absent data.
</details>

---

## Exercise 5: Choose the Right API

For each scenario below, decide between the standard Messages API and the Batches API. Justify your choice with reference to at least one Batch API constraint.

1. Processing 50,000 customer support tickets overnight to extract product categories for analytics
2. Classifying a customer's real-time support message to route it to the right team (target: under 2 seconds)
3. Running a research agent that searches the web for each of 1,000 companies and writes a one-paragraph summary
4. Generating a monthly summary report for each of 200 enterprise accounts (run once per month, no user is waiting)
5. Answering a developer's question about an API error they just encountered

<details><summary>Answer</summary>

1. **Batches API** — high volume (50,000), latency-insensitive (overnight run), single-turn (extract category from ticket text, no tool loop). 50% cost savings applies directly.

2. **Messages API** — a user is waiting for real-time routing (under 2 seconds). Batch has no latency SLA and can take up to 24 hours. Batch is architecturally incompatible with any user-facing request.

3. **Messages API (or standard async orchestration, NOT Batch)** — the research agent calls a web search tool and uses the results to continue reasoning. This is a multi-turn tool loop. Batch API processes each item as a single API call with no mechanism for tool results to re-enter the conversation. Multi-turn tool calling is impossible in Batch.

4. **Batches API** — 200 items, run once a month, no user waiting, single-turn generation (summarize account data into a report). Classic Batch use case: scheduled, background, high-value-per-call but latency-insensitive.

5. **Messages API** — a developer is waiting for an immediate answer. Same reasoning as scenario 2: any user-facing, synchronous interaction requires Messages API.
</details>

---

## Exercise 6: Fix This Prompt Chain

A team has built a two-step prompt chain to process legal contracts:

**Step 1 prompt:**
> "Read this contract. Extract all parties, identify all key dates, summarize the obligations of each party, flag any unusual clauses, assess the risk level, and output a JSON object with all of this information."

**Step 2 prompt:**
> "Using the JSON from step 1, write a one-page executive summary."

Identify the structural problem with this chain and redesign it with the correct number of steps and bounded objectives for each.

<details><summary>Answer</summary>

**Problem:**
Step 1 has 5 distinct objectives crammed into a single prompt: extraction (parties, dates), summarization (obligations), analysis (unusual clauses), risk assessment, and JSON formatting. This is not prompt chaining — it is a single over-complex prompt wrapped in a chain structure. The "chain" provides no benefit because all the complexity is in one step. If step 1 fails or produces poor output, you cannot isolate which of the 5 tasks caused the failure.

**Redesigned chain (4 steps):**

**Step 1 — Extract structured data:**
> "Extract the following fields from this contract and return them as JSON: party_names (array), effective_date, termination_date, governing_law, and contract_type. Return null for any field not present."

Single objective: structured extraction. Bounded, testable, validates easily.

**Step 2 — Summarize obligations:**
> "Using the following contract text and the extracted parties [from step 1 output], write one paragraph per party describing their obligations under this agreement."

Single objective: narrative summarization of obligations. Uses step 1 output as context.

**Step 3 — Flag and assess risk:**
> "Review this contract for unusual clauses and assign a risk level of LOW, MEDIUM, or HIGH. List each unusual clause with a one-sentence explanation of why it is unusual. Then state the overall risk level with a one-sentence justification."

Single objective: risk analysis. Isolated from extraction and summarization.

**Step 4 — Executive summary:**
> "Using the extracted data [step 1], obligations summary [step 2], and risk assessment [step 3], write a one-page executive summary for a non-legal audience."

Single objective: synthesis and presentation. Has all necessary inputs.

Each step is now bounded, testable, and independently debuggable.
</details>
