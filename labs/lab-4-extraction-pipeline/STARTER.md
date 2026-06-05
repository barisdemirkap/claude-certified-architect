# Lab 4 — Starter Guide

## Environment & Dependencies

**Python 3.11+** is recommended. You need one package:

```
pip install anthropic
```

The Anthropic Python SDK handles tool_use, the Batch API, and all retries for transient network errors.

- SDK reference: https://github.com/anthropic-ai/anthropic-sdk-python
- Batch API guide: https://docs.anthropic.com/en/docs/build-with-claude/message-batches
- Tool use guide: https://docs.anthropic.com/en/docs/build-with-claude/tool-use

Set your key:
```
export ANTHROPIC_API_KEY=sk-ant-...
```

No PDF parsing library is required for the lab — use synthetic text-based invoice strings as input to keep the focus on schema design and API usage. If you want to test real PDFs, `pypdf` or `pdfminer.six` can extract text before passing to Claude.

---

## Architecture Scaffold

Build these components in order (one file each is fine for the lab):

1. **`schema.py`** — defines the `EXTRACT_INVOICE_TOOL` dict (the tool spec with the full JSON schema). Nothing else. Import this everywhere.

2. **`extractor.py`** — `extract(document_text: str) -> dict` — calls `client.messages.create` with `tools=[EXTRACT_INVOICE_TOOL]` and `tool_choice={"type":"tool","name":"extract_invoice"}`. Returns the parsed `input` dict from the tool_use content block.

3. **`validator.py`** — `validate(result: dict) -> list[str]` — returns a list of human-readable error strings (empty list = valid). Each error string should be ready to paste directly into a correction prompt.

4. **`retry_loop.py`** — `extract_with_retry(document_text: str, max_retries=2) -> dict` — orchestrates extractor + validator + retry. Returns `{"status": ..., "extraction": ..., "retry_count": ..., "validation_errors": [...]}`.

5. **`batch_runner.py`** — `submit_batch(documents: list[dict]) -> str` — submits a Batch API job, returns the batch ID. `poll_and_collect(batch_id: str) -> list[dict]` — polls until `ended`, returns all results.

6. **`confidence.py`** — `score(result: dict, stop_reason: str) -> float` and `route(score: float) -> str`.

7. **`accuracy_tracker.py`** — `AccuracyTracker` class with `record(document_type, predicted, actual)` and `summary()`.

8. **`main.py`** — wires everything together for a single-document run and a batch run.

---

## Key Documentation

| Topic | Link |
|---|---|
| Tool use (structured output) | https://docs.anthropic.com/en/docs/build-with-claude/tool-use |
| Forcing a specific tool | https://docs.anthropic.com/en/docs/build-with-claude/tool-use#forcing-tool-use |
| JSON Schema types (nullable) | https://json-schema.org/understanding-json-schema/reference/type |
| Message Batches API | https://docs.anthropic.com/en/docs/build-with-claude/message-batches |
| Batch result types | https://docs.anthropic.com/en/docs/build-with-claude/message-batches#getting-batch-results |
| Models reference | https://docs.anthropic.com/en/docs/about-claude/models |

Use `claude-3-5-haiku-latest` for the extraction calls (fast, cheap, good at structured output). Use `claude-3-5-sonnet-latest` only if Haiku struggles on complex multi-line-item invoices.

---

## Approaching Milestone 1

**Step 1 — Write the schema dict first, before any API calls.**

Open `schema.py`. The tool dict structure is:
```python
EXTRACT_INVOICE_TOOL = {
    "name": "extract_invoice",
    "description": "Extract structured invoice data from the document text.",
    "input_schema": {
        "type": "object",
        "properties": { ... },
        "required": ["vendor_name", "invoice_date", "total_amount",
                     "currency", "line_items", "document_type"]
    }
}
```

Note: `invoice_number` is NOT in `required` — it is nullable. Nullable means `"type": ["string", "null"]` in the property definition. The field can still appear in `required` if you want Claude to always return the key (just with null value) — this is actually good practice because it makes validation easier. Whether to include nullable fields in `required` is a design choice; including them is recommended here.

**Step 2 — Write synthetic test documents as plain strings.**

Do not start with real PDFs. Write 4 Python strings that simulate invoice text. Example:
```
INVOICE
Vendor: Acme Corp
Date: 2024-03-15
Total: $1,250.00 USD
...
```

**Step 3 — Call the extractor and print the raw tool_use block.**

Before building validation, inspect what Claude actually returns. Look for the `content` list in the response. Find the block where `type == "tool_use"`. Its `input` field is your extracted dict.

**Step 4 — Assert nulls, not empty strings.**

Write a simple assert loop over your 4 test cases. The most common first failure: Claude returns `""` for a missing invoice number. Your schema needs to signal that `null` is the correct absent value — add it to the field description: "Return null if no invoice number is visible on the document."

---

## Common Stumbling Blocks

**1. `tool_choice: "auto"` lets Claude skip the tool.**
If you use `tool_choice={"type": "auto"}`, Claude may decide to answer in plain text instead. Always use `{"type": "tool", "name": "extract_invoice"}` for extraction. This is a forced call — Claude must return a tool_use block.

**2. Nullable fields and empty strings are not the same.**
JSON Schema `"type": ["string","null"]` tells Claude the value can be null. It does not automatically prevent Claude from returning `""`. You must reinforce this in the field description AND catch `""` in your validator as a failure that requires a correction instruction — not a silent pass.

**3. Retry is the wrong fix for absent data.**
If an invoice genuinely has no invoice number, retrying will not help — Claude will keep returning null (or keep hallucinating one). Retry is for *misread* data (wrong type, wrong format). Build the `"not_extractable"` exit path before you build the retry loop, so you have somewhere to route documents that legitimately cannot be extracted.

**4. Batch custom_id is your only correlation key.**
The Batch API does not preserve insertion order in results. When you iterate results, always look up the record by `result.custom_id`, not by position. Design your input as a dict keyed by filename from the start.
