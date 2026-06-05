# Scenario 6: Structured Data Extraction

## Overview

A financial services firm needs to extract structured data from thousands of unstructured documents: earnings call transcripts, SEC filings, analyst reports, and news articles. The system must produce machine-readable JSON from each document with high accuracy, handle missing or ambiguous fields gracefully, and process large volumes cost-efficiently. Stakes include downstream database integrity (bad extractions corrupt reports) and regulatory accuracy (financial figures must be correct and sourced).

## Architecture

**Components:**
- Extraction pipeline using the Claude API (not Claude Code)
- JSON schema with nullable fields for optional data points
- Enum fields with an `"other"` option for unknown category values
- `tool_use` block in the API request to enforce structured output (syntax mechanism only)
- Validation-retry loop: validate each extraction against schema; retry with correction prompt if invalid
- Batch API for high-volume, non-urgent extractions
- Stratified accuracy evaluation by document type (earnings vs. filings vs. news)

**Data Flow:**

```
Document corpus
      |
  [chunking if needed]
      |
  Claude API call with tool_use block (schema-enforced)
      |
  JSON output
      |
  [schema validation]
   /         \
valid       invalid
  |             |
store       retry with correction prompt (max 2 retries)
              |
           still invalid → human review queue
```

**Batch API Flow:**
1. Construct JSONL file: one line per document, each with `custom_id` and extraction prompt
2. Submit batch job via Batch API endpoint
3. Poll for completion (up to 24 hours)
4. Retrieve results JSONL; match results to inputs via `custom_id`
5. Separate valid extractions from failures; route failures to retry or human review

## Domain Connections

| Domain | Key Concepts from This Scenario |
|---|---|
| D4 — Prompt Engineering & Structured Output | JSON schema design; nullable fields; enum with "other"; tool_use for structured output; validation-retry loop |
| D5 — Context Management & Reliability | Retry logic; graceful degradation; human review queue; accuracy stratification |
| D1 — Agent Architecture & Orchestration | Batch processing as a non-agentic, high-volume pattern; when NOT to use an agent loop |
| D2 — Tool Design & MCP Integration | tool_use as a syntax mechanism (not a real tool call) in extraction context |

## Key Design Decisions

**1. JSON schema with nullable fields**
Not every document contains every data field. A field like `cfo_name` may not appear in a news article. The schema must define such fields as nullable: `"cfo_name": { "type": ["string", "null"] }`. If the schema marks the field as required and non-nullable, the model will hallucinate a value rather than return null. The exam tests knowing that nullable is the correct pattern for optional fields, not omitting the field from the schema.

**2. Enum with "other" option**
When extracting a category field (e.g., document type: `earnings | filing | analyst_report | news`), always include `"other"` as a valid enum value. Without it, the model must force-fit every document into one of the known categories, even if none fits. This produces incorrect classifications. With `"other"`, the model can signal uncertainty rather than hallucinate a category. The exam tests this as a reliability pattern.

**3. tool_use for structured output — syntax only**
Using a `tool_use` block in the API request to enforce structured output does not mean the model is calling a real tool. It is a syntactic trick: by defining the extraction schema as a "tool" with input parameters, the model's response will be formatted as a tool call, guaranteeing JSON structure. No tool is actually invoked; the response is parsed as the extraction output. The exam tests knowing that this is a syntax mechanism, not a real function call.

**4. Validation-retry loop**
The first extraction pass will sometimes produce JSON that fails schema validation (wrong type, missing required field, malformed string). A validation-retry loop: validate the output, and if invalid, construct a correction prompt ("Your previous response was missing the `revenue` field. Here is the document again. Please extract all fields.") and retry. Maximum 2 retries before routing to human review. The exam tests the structure of this loop and the max-retry-then-human-review pattern.

**5. Batch API characteristics**
The Batch API is designed for high-volume, non-time-sensitive extractions:
- **~50% cost discount** vs. real-time API calls
- **Up to 24-hour completion time** (not suitable for real-time workflows)
- **No multi-turn conversations** (each batch item is a single-turn request)
- **custom_id field** for matching results back to inputs (required for large batches)

The exam tests all four of these characteristics, especially the 24-hour limit (disqualifies real-time use cases) and the no-multi-turn constraint (disqualifies interactive or iterative workflows).

## Typical Exam Question Patterns

**Pattern 1 — Nullable vs. required fields:**
"An extraction schema for SEC filings includes a `subsidiary_name` field. Some filings do not mention subsidiaries. How should this field be defined?" — The correct answer is nullable: `"type": ["string", "null"]`. Not omitting it (which makes it absent from output), and not required (which causes hallucination).

**Pattern 2 — Batch API suitability:**
"A firm needs to extract data from 50,000 documents overnight and cost is a primary concern. They do not need results in real-time. Which API pattern is most appropriate?" — The correct answer is the Batch API: ~50% discount, 24-hour SLA, high throughput for non-urgent workloads.

**Pattern 3 — tool_use mechanism:**
"A developer uses a tool_use block in their API request to get structured JSON from Claude, but no actual tool is defined on the server side. What is happening?" — The correct answer is that tool_use is being used as a syntax mechanism to constrain output format, not as a real function call.

## Common Mistakes

- **Making optional fields required.** This is the leading cause of hallucination in extraction pipelines. If a field is required and the document does not contain the value, the model will invent one rather than return null.
- **Omitting "other" from enums.** Candidates define tight enums without an escape hatch. Documents that do not fit any category get mis-classified with high confidence.
- **Confusing tool_use with actual tool invocation.** In this context, tool_use is a formatting trick. No function runs. Candidates who think a tool is executing will design unnecessary server-side handlers.
- **Using Batch API for real-time workflows.** The 24-hour SLA makes Batch API inappropriate for any user-facing, time-sensitive extraction. Candidates who focus only on the cost benefit miss the latency constraint.
- **No retry loop or no human review queue.** Extraction pipelines without validation-retry produce silently invalid outputs that corrupt downstream databases. The human review queue for persistent failures is the safety valve.

## Cross-Reference

| Concept | Module | Lab |
|---|---|---|
| JSON schema design and nullable fields | D4 — Prompt Engineering | Lab 4 |
| tool_use for structured output | D4 — Prompt Engineering | Lab 4 |
| Batch API mechanics | D4 — Prompt Engineering | — |
| Validation-retry loop | D5 — Context Management | — |
| Graceful degradation and human fallback | D5 — Context Management | — |
