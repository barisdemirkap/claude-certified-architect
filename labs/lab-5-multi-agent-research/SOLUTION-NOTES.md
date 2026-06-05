# Lab 5 — Solution Notes: Insight Engine

> Architecture discussion only — not a full implementation.

---

## Key Design Decisions

### Decision 1: Explicit Context Passing — the Central Pattern of This Lab

**Decision:** Every piece of information a subagent needs is included in the user message of its `messages.create()` call. Nothing is assumed. Nothing is inherited.

**Rationale:** This is the most commonly misunderstood concept in multi-agent systems, and it is a high-probability exam topic. Here is what trips people up:

When you write a coordinator, you have a system prompt and a conversation history. When you call a subagent, you start a brand-new API call. The subagent's context window contains only what you put in its `messages` array. The coordinator's system prompt? Gone. The coordinator's prior messages? Gone. Any variable you set in Python? The model has never seen it.

A correct subagent invocation looks like this in pseudocode:

```
subagent_message = {
    "role": "user",
    "content": f"""
You are a web search analyst. Your task is to find current information on the following subtopic
and return it as a structured provenance set.

SUBTOPIC: {subtask['description']}
SCOPE: {subtask['scope']}
REQUIRED OUTPUT FIELDS: claim, source_url (valid URL), retrieval_date (ISO 8601), confidence (0.0-1.0)

Call the submit_search_results tool with your findings.
    """
}
```

An incorrect invocation looks like this:

```
subagent_message = {
    "role": "user",
    "content": "Search for information on the assigned topic and return provenance records."
}
```

The second version depends on the subagent "knowing" the topic from somewhere. It doesn't. It will either hallucinate a topic or return a confused response.

**The exam tradeoff:** Explicit context passing makes each subagent invocation larger (more tokens) and costs slightly more per call. The alternative — trying to share state through a tool or a database — introduces coupling and failure modes. For exam purposes: always pass full context explicitly. The token cost is the accepted tradeoff for reliability and debuggability.

**The test to apply:** Can you take the exact user message you sent to the subagent, paste it into a fresh Claude session with no system prompt, and get a correct result? If yes, your context passing is correct.

---

### Decision 2: Parallel Dispatch for Independent Subagents; Serial for Dependent

**Decision:** Web Search and Document Analysis run concurrently. Synthesis runs only after both complete (or fail).

**Rationale:** Web Search and Document Analysis have no data dependency on each other — they operate on different input types (live web vs. provided documents) and produce the same output type (`ProvenanceClaim` list). Running them serially would waste time proportional to the slower subagent.

Synthesis cannot start until both upstream sets are available because its job is to compare and reconcile them. Synthesizing partial data produces a report with hidden gaps. The coordinator must `await` both before dispatching synthesis.

**The exam tradeoff:** Parallel dispatch requires `asyncio.gather` with `return_exceptions=True`. Without `return_exceptions=True`, a single subagent failure cancels the gather and discards the other result — the opposite of graceful degradation. The tradeoff is that error handling must be explicit in the gather result loop rather than via a try/except around a single await.

---

### Decision 3: Conflict Preservation, Not Conflict Resolution

**Decision:** When two subagents return contradictory claims on the same topic, both claims appear in the final report tagged with their source agent. The synthesis subagent does not pick one.

**Rationale:** Choosing between conflicting claims requires domain judgment that the system does not have. A web source saying revenue is $200M and an annual report saying $180M are both potentially correct (different fiscal years, different definitions of revenue). A human analyst needs to see both to make that call.

Silently dropping or averaging the lower-confidence claim destroys the provenance chain. The analyst can no longer audit the report back to its sources because one source has been erased.

**The exam tradeoff:** Conflict preservation produces a longer, potentially messier report. The alternative — picking one claim — produces a cleaner report that may be wrong. For reliability-focused architectures (which is what D5 tests), messiness with full provenance is always preferred over cleanliness with hidden assumptions.

---

### Decision 4: No Automatic Retry on Subagent Failure

**Decision:** If a subagent fails, the coordinator logs the failure, adds it to `subagent_failures`, and proceeds with available results. It does not retry.

**Rationale:** Automatic retry in a multi-agent pipeline introduces non-determinism and can cascade. If the web search subagent failed due to a transient API error, a retry might succeed — but it might also double the latency for the whole pipeline, and if it fails again, the coordinator is now stuck in a retry loop. For this lab (and for the exam pattern), the correct behavior is: detect failure, annotate the gap, proceed. The human reviewing the report sees the gap and can decide whether to re-run.

**The exam tradeoff:** No retry means a transient failure produces a partial report. The exam tests whether you understand that partial results with honest annotations are valid outputs — not failures. The anti-pattern is treating any subagent exception as a pipeline-stopping error.

---

### Decision 5: Tool-Enforced Structured Output from Subagents

**Decision:** Each subagent has a tool defined (`submit_search_results`, `submit_doc_findings`) with the `ProvenanceClaim` schema embedded. `tool_choice` forces the model to call the tool rather than returning free text.

**Rationale:** Free-text parsing of structured data from Claude is fragile. Even with a clear prompt, the model may occasionally wrap the JSON in markdown, add a preamble, or omit a field. Defining the output as a tool schema and requiring the model to call it means the response is always a JSON object matching the schema — parseable without regex or heuristics.

**The exam tradeoff:** Tool-enforced output costs an additional token overhead for the tool definition. It also means you must parse `response.content[0].input` (the tool call arguments) instead of `response.content[0].text`. This is a small complexity increase for a large reliability gain.

---

## What a Strong Solution Looks Like

A strong M4 solution has these properties:

1. **Schemas defined first, independently testable.** `ProvenanceClaim` can be instantiated and validated without calling the Claude API. The schema is the source of truth; the API calls are just producers of data that must satisfy it.

2. **Subagent functions are pure in spirit.** `run_web_search_subagent(subtask: dict) -> list[ProvenanceClaim]` takes a dict, returns a list. No side effects. No reading from global state. Testable with a mock API client.

3. **The coordinator is a thin orchestrator.** It does not do analysis. It decomposes, dispatches, and assembles. If the coordinator's logic is getting complex, you have probably put synthesis work in the wrong place.

4. **Coverage notes are dynamic.** They reference actual counts from the run: "Searched 7 sources via web search, found 4 relevant. Document analysis processed 2 documents, extracted 6 claims. Claim 'market share > 40%' could not be verified — primary source is paywalled."

5. **Conflicts are a first-class concept.** The `findings` array may contain a `Finding` with two claims that contradict each other. That is correct. The `coverage_notes` may call out: "Conflicting figures for annual revenue (see Finding: Revenue, sources: web_search, doc_analysis)."

---

## Common Mistakes and Fixes

**Mistake: Subagent system prompt references the research topic.**

```python
# Wrong
system = f"You are a web search agent. The research topic is: {topic}."
user = "Search for the most relevant information and return provenance records."
```

The system prompt is yours to set — the topic is there — but the exam pattern requires the user message to be self-contained. If the coordinator sends a task to a remote agent (different process, different machine), only the message travels.

Fix: Move all context into the user message. The system prompt should only describe the agent's role in the abstract.

---

**Mistake: `asyncio.gather` without `return_exceptions=True`.**

```python
# Wrong — one failure cancels the whole gather
results = await asyncio.gather(run_web_search(subtask), run_doc_analysis(subtask, docs))
```

```python
# Correct — failures are returned as Exception objects, not raised
results = await asyncio.gather(
    run_web_search(subtask),
    run_doc_analysis(subtask, docs),
    return_exceptions=True
)
web_result, doc_result = results
if isinstance(web_result, Exception):
    subagent_failures.append("web_search")
    web_claims = []
else:
    web_claims = web_result
```

---

**Mistake: Synthesis subagent resolves conflicts.**

```python
# Wrong — picks one claim when two conflict
if claim_a.confidence > claim_b.confidence:
    keep = claim_a
else:
    keep = claim_b
```

Fix: Both claims go into the `Finding`. The synthesis subagent's job is to identify and surface conflicts, not to resolve them.

---

**Mistake: `coverage_notes` is a static string.**

```python
# Wrong
coverage_notes = "Sources were searched and findings were compiled."
```

Fix: Build `coverage_notes` from runtime data — counts, failure list, unverifiable claims. It should be impossible to produce the same `coverage_notes` string from two different runs.

---

## Connection to Exam Concepts

**D1 — Agent Architecture:** This lab is the hub-and-spoke topology. Coordinator = hub. Subagents = spokes. The coordinator decides parallel vs serial. The exam will present scenarios where a student must identify whether subagents can run in parallel (look for data dependencies — if B needs A's output, it's serial; if not, it's parallel).

**D2 — Tool Design:** The provenance schema is a tool schema. The exam tests whether you know that tool schemas enforce output shape. Free-text prompting for structured output is the wrong answer on the exam.

**D5 — Context Management:** The explicit context passing pattern is the D5 anchor for multi-agent systems. The exam will present answer choices where one option passes full context and one assumes shared state. Full context is always correct. "Coverage annotations" are also a D5 concept — they are how a system communicates its own limitations to the human reviewer.

**The overarching exam rule for this lab:** In multi-agent systems, assume subagents are strangers. Pass everything they need. Expect them to fail. Preserve all evidence. Let humans resolve ambiguity.
