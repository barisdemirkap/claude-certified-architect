# Lab 5 — Completion Checklist: Insight Engine

## Milestone M1 — Coordinator + Single Subagent

- [ ] `schemas.py` defines `ProvenanceClaim` with all four fields: `claim`, `source_url`, `retrieval_date`, `confidence`
- [ ] `ProvenanceClaim` rejects construction when any required field is missing (Pydantic `ValidationError`)
- [ ] `web_search.py` is callable in isolation with only a `subtask` dict — no external state required
- [ ] Web Search Subagent uses tool_choice to enforce structured output (not free-text parsing)
- [ ] Coordinator constructs a subtask dict and passes it entirely in the subagent's user message
- [ ] Self-contained context test passes: subagent user message alone (no system prompt) returns a valid `ProvenanceSet`
- [ ] Coordinator prints `ProvenanceSet` as valid JSON to stdout

## Milestone M2 — Parallel Subagent Dispatch

- [ ] `doc_analysis.py` implemented; accepts subtask dict + document list; returns `list[ProvenanceClaim]`
- [ ] Coordinator dispatches both subagents using `asyncio.gather` (or equivalent concurrent pattern)
- [ ] Each claim in the merged set has a `source_agent` field set to `"web_search"` or `"doc_analysis"`
- [ ] If one subagent raises an exception, the other's results are not discarded
- [ ] Wall-clock timing confirms concurrent execution (both subagents do not run strictly serially)
- [ ] Merged `ProvenanceSet` printed to stdout as valid JSON

## Milestone M3 — Full Provenance + Synthesis Subagent

- [ ] Validation layer rejects any `ProvenanceClaim` missing `source_url`, `retrieval_date`, or `confidence` before synthesis
- [ ] `synthesis.py` implemented; accepts merged `ProvenanceSet`; returns `ReportOutput`
- [ ] Synthesis Subagent receives the full merged `ProvenanceSet` in its invocation message (not via a shared variable)
- [ ] `ReportOutput` contains: `executive_summary`, `findings`, `coverage_notes`, `subagent_failures`
- [ ] Each `Finding` contains: `topic`, `claims` (array), `confidence_range` (`min`/`max`)
- [ ] Full pipeline runs end-to-end: Coordinator → [Web + Doc parallel] → Synthesis → `ReportOutput` JSON

## Milestone M4 — Conflict Detection, Coverage Annotations, Graceful Degradation

- [ ] Conflicting claims on the same topic appear as separate entries in `findings`, not merged or averaged
- [ ] Each conflicting claim retains its `source_agent` tag so the reader knows which agent produced it
- [ ] `coverage_notes` states: number of sources searched, number found relevant, any unverifiable claims
- [ ] `coverage_notes` is never an empty string
- [ ] Simulated Web Search failure produces a valid `ReportOutput` (no unhandled exception)
- [ ] `ReportOutput.subagent_failures` lists the name of the failed subagent when failure occurs
- [ ] Failure annotation in `coverage_notes` reads similar to: "Web search unavailable — findings based on document analysis only"
- [ ] Coordinator does NOT retry failed subagents automatically
- [ ] End-to-end test on topic "Meridian Intelligence pricing strategy 2023-2025" passes all field validations

---

## Exam-Objective Coverage

| Objective | How this lab covers it |
|---|---|
| Orchestrator/subagent separation of concerns | Coordinator owns decomposition and synthesis; subagents own a single data-collection task each |
| Explicit context passing | Every subagent invocation is self-contained; tested explicitly in M1 self-contained context test |
| fork_session / fresh context per subagent | Each subagent is a separate `messages.create()` call with no shared history |
| Parallel execution when subagents are independent | Web Search and Doc Analysis dispatched concurrently in M2; Synthesis is correctly serial |
| Tool schema design for structured output | `submit_search_results` tool enforces `ProvenanceClaim` shape; tool_choice prevents free-text drift |
| Provenance record (all four fields) | Schema-enforced from M1; validation gate blocks synthesis if any field is missing |
| Conflict preservation | M4 requires both conflicting claims in output — not reconciled, not dropped |
| Coverage annotations | `coverage_notes` field required in every `ReportOutput`; must describe gaps explicitly |
| Graceful degradation | Single subagent failure yields partial report with annotations, not a crash |
| Error propagation strategy | Coordinator logs failure, passes `subagent_failures` list downstream, never retries silently |

---

## Common Pitfalls

- Putting context in the coordinator's system prompt and assuming subagents "see" it — they do not. Each `messages.create()` call is isolated.
- Using `asyncio.gather()` without `return_exceptions=True` — a single subagent exception will cancel the gather and discard the other result.
- Letting the synthesis subagent "resolve" conflicts by choosing the higher-confidence claim — this destroys provenance. Both claims must survive.
- Setting `confidence` as a string ("high") instead of a float — schema validation will catch this in development but only if Pydantic strict mode is on.
- Forgetting `retrieval_date` on mocked results — the field is required; omitting it from stubs means your validation is never tested.
- Writing `coverage_notes` as a static string like "sources searched" — it must reflect the actual run (counts, gaps, failures).

---

## Stretch Goals

- Add a third subagent: **Citation Verifier** — takes each `ProvenanceClaim`, attempts to re-fetch `source_url`, and updates `confidence` based on whether the source still exists and the claim text matches.
- Add a `confidence_threshold` parameter to the Coordinator: claims below the threshold are excluded from `findings` but listed in `coverage_notes` as "low-confidence signals."
- Implement prompt caching for the Document Analysis Subagent when processing long documents (set `cache_control` on the document block and measure token savings).
- Add a structured diff step: after M4, have the Synthesis Subagent output a `conflicts` array separate from `findings`, so the human analyst has a dedicated conflicts section.
- Write a test harness that injects known-conflicting mock data and asserts the output contains exactly two claims on the conflicted topic.
