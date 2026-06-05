# Lab 5 — Specification: Insight Engine

## Architecture Overview

```
User / Caller
     |
     v
[Coordinator]
  - Receives: research_topic (string), scope (string), max_sources (int)
  - Decomposes topic into subtasks
  - Dispatches subagents (parallel where independent)
  - Synthesizes final report
     |
     +----------+-----------+
     |                      |
     v                      v
[Web Search Subagent]   [Document Analysis Subagent]
  - Assigned subtopic     - Assigned subtopic
  - Searches live web     - Analyzes provided document set
  - Returns ProvenanceSet - Returns ProvenanceSet
     |                      |
     +----------+-----------+
                |
                v
        [Synthesis Subagent]
          - Receives merged ProvenanceSet from both upstream subagents
          - Detects conflicts
          - Produces final ReportOutput with coverage annotations
```

**Key connectivity rules:**
- Web Search and Document Analysis subagents are independent — they may run in parallel.
- Synthesis subagent is serial — it cannot start until both upstream subagents have completed (or timed out).
- Each subagent receives a fully self-contained context payload; no shared memory or session state is inherited.

---

## Milestone M1 — Coordinator + Single Subagent

**Requirements:**

1. Implement the Coordinator as a Claude API call that accepts `research_topic`, `scope`, and `max_sources`.
2. Coordinator must decompose the topic into at least one subtask object (`subtask_id`, `description`, `required_provenance_fields`).
3. Coordinator invokes the Web Search Subagent via a Task invocation, passing the full subtask payload — including the output format schema — in the invocation message. The subagent's system prompt must not rely on any external state.
4. Web Search Subagent returns a `ProvenanceSet`: an array of `ProvenanceClaim` objects.
5. Coordinator prints the returned `ProvenanceSet` to stdout in JSON.

**Acceptance criteria:**
- Removing the coordinator's system prompt and running only the subagent invocation message still gives a correct result (self-contained context test).
- `ProvenanceClaim` objects contain at minimum: `claim`, `source_url`, `retrieval_date`, `confidence`.

---

## Milestone M2 — Parallel Subagent Dispatch

**Requirements:**

1. Add the Document Analysis Subagent. It accepts a list of document objects (`doc_id`, `text`, `metadata`) and a subtask description.
2. Coordinator dispatches Web Search and Document Analysis subagents concurrently (use `asyncio.gather` or equivalent).
3. Coordinator collects both result sets and merges them into a single `ProvenanceSet`, tagging each claim with `source_agent: "web_search" | "doc_analysis"`.
4. If one subagent returns an error or times out, the coordinator logs the failure and continues with the other subagent's results. It does NOT raise an exception to the caller.
5. Coordinator prints the merged `ProvenanceSet` to stdout.

**Acceptance criteria:**
- Wall-clock time for running both subagents is less than the sum of their individual runtimes (demonstrating true concurrency).
- The merged set correctly attributes each claim to its originating subagent.

---

## Milestone M3 — Full Provenance System + Synthesis Subagent

**Requirements:**

1. Enforce all four provenance fields on every `ProvenanceClaim`. Validation must reject claims missing any field before they enter the synthesis step.
2. Add the Synthesis Subagent. It receives the merged `ProvenanceSet` and a report format schema.
3. Synthesis Subagent produces a `ReportOutput`:
   - `executive_summary` (string)
   - `findings` (array of `Finding` objects: `topic`, `claims` (array of `ProvenanceClaim`), `confidence_range`)
   - `coverage_notes` (string — sources searched, gaps acknowledged)
4. Wire the full pipeline: Coordinator → [Web + Doc in parallel] → Synthesis → final `ReportOutput`.
5. The coordinator must pass the full merged `ProvenanceSet` to Synthesis in the Task invocation message, not via a shared variable or tool call.

**Acceptance criteria:**
- Any `ProvenanceClaim` missing `source_url`, `retrieval_date`, or `confidence` is rejected at validation with a descriptive error.
- `ReportOutput` is valid JSON matching the defined schema.

---

## Milestone M4 — Conflict Detection, Coverage Annotations, and Graceful Degradation

**Requirements:**

1. Implement conflict detection in the Synthesis Subagent: when two claims on the same topic contradict each other (e.g., different pricing figures), both claims must be preserved in `findings` with their respective `source_agent` tags. The subagent must NOT silently drop or overwrite either.
2. `coverage_notes` must include: number of sources searched, number of sources found relevant, and an explicit statement for any claim that could not be verified (e.g., paywalled, timed-out subagent).
3. Simulate a subagent failure: disable the Web Search Subagent and confirm the system produces a partial report annotated with "Web search unavailable — findings based on document analysis only."
4. Coordinator retry policy: if a subagent fails, do NOT retry automatically. Log the failure, proceed with available results, and pass a `subagent_failures` list to the Synthesis Subagent.
5. End-to-end test: run the full pipeline on the topic "Meridian Intelligence pricing strategy 2023-2025" and verify the output `ReportOutput` contains all required fields and at least one coverage note.

**Acceptance criteria:**
- Conflicting claims appear as separate entries in the same `Finding`, not merged.
- `coverage_notes` is never an empty string.
- A simulated single-subagent failure produces a valid `ReportOutput` (not an exception).

---

## Input/Output Contract

**Coordinator input:**
```json
{
  "research_topic": "string",
  "scope": "string",
  "max_sources": "integer (1-20)"
}
```

**ProvenanceClaim (all fields required):**
```json
{
  "claim": "string",
  "source_url": "string (valid URL)",
  "retrieval_date": "string (ISO 8601 date)",
  "confidence": "float (0.0 – 1.0)",
  "source_agent": "string ('web_search' | 'doc_analysis')"
}
```

**ReportOutput:**
```json
{
  "executive_summary": "string",
  "findings": [
    {
      "topic": "string",
      "claims": ["ProvenanceClaim"],
      "confidence_range": { "min": "float", "max": "float" }
    }
  ],
  "coverage_notes": "string",
  "subagent_failures": ["string"]
}
```

---

## Constraints

The following are explicitly out of scope for this lab:

- Real web search API integration (mock or stub the web search tool responses)
- Persistent storage or database backends
- Authentication or multi-user support
- Streaming responses from subagents
- Human-in-the-loop approval steps between milestones
- Retry loops or exponential backoff for failed subagents
