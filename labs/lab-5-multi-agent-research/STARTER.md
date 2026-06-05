# Lab 5 — Starter Guide: Insight Engine

## Environment & Dependencies

**Python 3.11+ recommended.**

```
anthropic>=0.25.0      # Claude API SDK
pydantic>=2.0          # Schema validation for ProvenanceClaim / ReportOutput
python-dotenv          # Load ANTHROPIC_API_KEY from .env
asyncio                # Built-in; used for parallel subagent dispatch
```

Install:
```
pip install anthropic pydantic python-dotenv
```

SDK reference: https://docs.anthropic.com/en/api/getting-started  
Python SDK: https://github.com/anthropic-ai/anthropic-sdk-python

Set your key:
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Architecture Scaffold

You will build these components in order. Resist the urge to wire them all together before each one works in isolation.

```
insight_engine/
  coordinator.py          # Main entry point. Decomposes topic, dispatches subagents, synthesizes.
  subagents/
    web_search.py         # Standalone function: receives subtask dict, returns ProvenanceClaim list
    doc_analysis.py       # Standalone function: receives subtask dict + docs, returns ProvenanceClaim list
    synthesis.py          # Standalone function: receives merged ProvenanceSet, returns ReportOutput
  schemas.py              # Pydantic models: ProvenanceClaim, ProvenanceSet, Finding, ReportOutput
  mock_tools.py           # Stub implementations of web search and document retrieval
  main.py                 # CLI entry point: parses args, calls coordinator, prints JSON
```

No shared global state between modules. Each subagent function must be callable in isolation with only its input dict.

---

## Key Documentation

Read these before writing any code:

- **Messages API** — https://docs.anthropic.com/en/api/messages  
  The `messages.create()` call is how you invoke both the coordinator and each subagent.

- **Tool use (function calling)** — https://docs.anthropic.com/en/docs/build-with-claude/tool-use  
  Used to enforce structured output from subagents (define a `return_provenance_set` tool and require the model to call it).

- **Multi-agent patterns** — https://docs.anthropic.com/en/docs/build-with-claude/agents  
  Covers orchestrator/subagent roles, when to use parallel vs serial, and the fork_session concept.

- **Context window and prompt caching** — https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching  
  Relevant when the document analysis subagent handles long documents.

---

## Approaching Milestone 1

**Step 1 — Define your Pydantic schema first.**  
Write `schemas.py` with `ProvenanceClaim` and `ProvenanceSet` before touching the Claude API. Validate a hardcoded dict against the schema to confirm it works. This gives you a known-good target shape.

**Step 2 — Build the Web Search Subagent in isolation.**  
Write a function `run_web_search_subagent(subtask: dict) -> list[ProvenanceClaim]`. Inside, call `client.messages.create()` with:
- A system prompt that explains the subagent's role and output format
- A user message that contains the full subtask dict as JSON

Force structured output by defining a tool called `submit_search_results` and setting `tool_choice={"type": "tool", "name": "submit_search_results"}`. Parse the tool call arguments as your `ProvenanceSet`.

Use mock tool responses for now — you are not integrating a real search API.

**Step 3 — Build the Coordinator wrapper.**  
Write a function `run_coordinator(research_topic, scope, max_sources)` that:
1. Constructs a subtask dict (hardcode one subtask for M1)
2. Calls `run_web_search_subagent(subtask)`
3. Prints the result as JSON

**Step 4 — Validate the self-contained context rule.**  
Copy the user message you sent to the subagent into a new blank Python script with no system prompt. Call the Claude API with only that message. The result should still be a valid `ProvenanceSet`. If it fails, you have not passed enough context — go back and enrich the user message.

---

## Common Stumbling Blocks

**1. Subagent inherits context from the coordinator — it doesn't.**  
The most common mistake in this lab is writing a subagent system prompt like "As described in the research topic above, search for..." There is no "above." Every subagent invocation is a fresh API call with its own context window. The coordinator's conversation history is not visible to the subagent. Put everything the subagent needs — topic, scope, output format, required fields — into the message you send it.

**2. Using a shared variable instead of passing context in the message.**  
It is tempting to define `CURRENT_TOPIC = "..."` as a module-level variable and have subagents read it. This works locally but breaks the model: the Claude instance running the subagent has no access to your Python process's memory. Design as if each subagent will run in a separate process on a separate machine.

**3. Merging conflicting claims instead of preserving both.**  
When web search says a company's revenue is $200M and a document says $180M, the wrong move is to average them or pick the more recent one. The synthesis subagent must emit both as separate `ProvenanceClaim` entries tagged with their origin. Conflicts are information, not errors.

**4. Treating a subagent timeout as a fatal error.**  
In M4 you will simulate a subagent failure. A common mistake is letting the exception bubble up through `asyncio.gather`. Use `return_exceptions=True` in `gather()`, then check each result: if it's an `Exception`, log it, add it to `subagent_failures`, and continue. Partial results with coverage notes are the correct output — not a stack trace.
