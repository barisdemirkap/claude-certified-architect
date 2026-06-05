# Solution Notes: CI/CD Code Review Bot

> Architecture discussion only — not a full implementation.

---

## Key Design Decisions

### Decision 1: `claude -p` not `--batch`, not `CLAUDE_HEADLESS`

**Decision:** Every CI invocation uses `claude -p` (equivalently `claude --print`).

**Rationale:** `--print` is the only officially documented flag that puts Claude Code into non-interactive, single-pass mode suitable for automation. It causes Claude to read the prompt, produce one response, write it to stdout, and exit. Without it, the process waits for interactive input and the CI job hangs indefinitely.

**Why the alternatives fail:**
- `--batch` does not exist as a Claude Code flag. A script using it will receive a flag-not-recognized error.
- `CLAUDE_HEADLESS=1` is not a documented environment variable for this purpose. Environment variables may change across CLI versions; flag behavior is stable and versioned.
- Omitting any flag and piping stdin does not reliably trigger non-interactive mode in all shell environments.

**The exam tradeoff:** The exam tests whether you know the canonical CI invocation pattern. The distractor answers always include plausible-sounding but nonexistent flags. The rule is: if you cannot find the flag documented at the Claude Code CLI reference page, it does not exist.

---

### Decision 2: Independent instances per file, not a shared session

**Decision:** Each file's diff is reviewed by a completely separate `claude -p` subprocess. No session ID, no `--resume`, no shared temp directory between invocations.

**Rationale:** Shared context between file reviews causes two failure modes:

1. **Context bleed**: Claude accumulates observations from previous files. A variable naming pattern seen in `auth.py` may cause Claude to flag the same pattern as unusual in `payments.py` even though it is consistent across the codebase. The finding is an artifact of review order, not a real issue.

2. **Context window exhaustion**: A multi-file session accumulates the full diff of every previously reviewed file. On a large PR (50+ files), the context fills before all files are reviewed, and later files receive degraded or truncated analysis.

**The exam tradeoff:** Independent instances trade off efficiency (each invocation re-sends the system prompt and schema) against reliability (no cross-file interference). For CI, reliability is non-negotiable. The cost is extra tokens per invocation; the benefit is deterministic, order-independent results.

**How to verify independence in testing:** Swap the order in which patch files are fed to the parallel pool. The findings for any given file must be identical regardless of which other files were reviewed in the same run.

---

### Decision 3: Structured output via `--json-schema` matters for CI reliability

**Decision:** Use `--output-format json --json-schema review.schema.json` on every invocation, rather than parsing free-form text output.

**Rationale:** CI pipelines are deterministic systems. Every downstream component (deduplicator, router, VCS API caller) depends on the finding fields being present and typed correctly. Free-form text output creates three reliability problems:

1. **Non-deterministic shape**: Without a schema, Claude may sometimes return a `line` field, sometimes `line_number`, sometimes omit the field entirely. Parsing logic for this is brittle and fails silently in production.

2. **Implicit type coercion errors**: A router that reads `finding["severity"] == "critical"` will silently miss a finding where Claude returned `"Critical"` (capital C). Schema enforcement with an enum prevents this class of error at the source.

3. **Integration test coverage**: With a schema, you can write a contract test that validates every invocation output against the schema before any downstream code runs. Without a schema, you can only test what you thought to check for.

**The exam tradeoff:** Schema enforcement reduces Claude's expressive freedom (it cannot add extra fields or explanatory prose). The tradeoff is expressiveness vs machine-parseability. For automation, machine-parseability always wins. The schema is the API contract between the LLM layer and the deterministic pipeline layer.

---

### Decision 4: `line_number` is nullable

**Decision:** The schema declares `line_number` as `"type": ["integer", "null"]`.

**Rationale:** Line numbers are not reliably available for all inputs a CI reviewer will encounter:

1. **Generated code**: Auto-generated files (protobuf outputs, ORM migrations, GraphQL schema dumps) often appear in PRs but lack stable line semantics. A "line number" in a generated file is meaningless to a human reviewer.

2. **Minified or bundled assets**: JavaScript bundles, CSS minification outputs, and similar files have no meaningful line-level granularity.

3. **Context-free diffs**: Some diff generation tools (notably those using `--no-context` or `--unified=0`) produce diff blocks where the hunk header line numbers do not correspond to the file's final state. Claude cannot reliably reconstruct the line number.

4. **Model uncertainty**: Even with a valid unified diff, Claude may identify a pattern that spans multiple lines or is structural rather than localized. Forcing a single line number would hallucinate precision.

**If `line_number` is non-nullable in the schema:**
- Claude may fabricate a plausible line number rather than violate the schema, producing a finding that points at the wrong line.
- The schema validator will reject any output containing `null` for this field, causing a pipeline error code 3 for a structurally valid finding.

**The exam tradeoff:** Allowing null reduces the information density of each finding (no direct line link in the PR comment). The alternative — fabricated line numbers — is worse, because it actively misleads reviewers. Correct nullability is a reliability decision, not a convenience decision.

---

### Decision 5: Two-pass architecture (per-file + coordinator)

**Decision:** After per-file reviews aggregate, run a single coordinator `claude -p` pass over the combined findings.

**Rationale:** Per-file instances cannot see cross-file patterns by design. The coordinator pass exists specifically to identify concerns that require cross-file visibility: inconsistent error handling styles across modules, a function added in one file that is never called in any other file, or a security pattern applied in some files but missing in others.

**Scope limitation:** The coordinator receives the aggregated findings JSON and file paths, not the full diff content of every file. Sending all diffs would recreate the context-exhaustion problem that motivated independent per-file instances. The coordinator works from findings, not raw diffs.

---

## What a Strong Solution Looks Like

A strong M1-M4 implementation has these properties:

- The `review.schema.json` is written before any code and never modified mid-milestone to paper over failures.
- Schema validation runs before any routing logic; a schema failure exits with code 3 and does not reach the VCS API.
- The parallel invocation layer in M2 has a configurable concurrency limit (default 5) to avoid rate limiting.
- Deduplication fingerprints use normalized text (lowercase, stripped punctuation) so that minor rephrasing of the same finding across runs does not bypass deduplication.
- The coordinator prompt is distinct from the per-file prompt. Per-file prompt: "Review this diff for issues." Coordinator prompt: "Given these findings from a multi-file PR review, identify patterns or concerns that span multiple files that the per-file reviewers may have missed."
- Exit codes are the primary CI signal. PR comments are supplementary. A pipeline that only posts comments but always exits 0 provides no merge gate.

---

## Common Mistakes and Fixes

**Mistake: Validating schema with `"additionalProperties": false` too early.**
Claude sometimes adds an explanatory field (`"reasoning"` or `"context"`) when uncertain. With `additionalProperties: false`, valid findings are rejected. Fix: either allow additional properties during development, or add `"reasoning"` as an optional field to the schema explicitly.

**Mistake: Running the coordinator before deduplication.**
If the coordinator runs on deduplicated findings, it cannot see the full picture. If it runs before deduplication, it may surface a cross-file pattern that is itself a duplicate. The correct order is: aggregate → deduplicate → coordinator → route → store.

**Mistake: Treating the coordinator as a meta-reviewer that overrules per-file findings.**
The coordinator adds findings; it does not score or suppress per-file findings. Giving the coordinator authority to remove per-file findings creates an unpredictable system where the first pass's output is non-final. Keep the passes additive.

**Mistake: Writing the severity router to `if/elif` on strings without normalization.**
`"Critical"` != `"critical"`. Always `.lower()` (or equivalent) before comparing. Better: validate with the schema enum so the comparison is guaranteed case-consistent.

**Mistake: Using the same prompt for per-file and coordinator passes.**
The coordinator gets a different input shape (findings JSON, not raw diff) and has a different objective (cross-file patterns, not per-file issues). A prompt written for per-file review applied to the coordinator will produce redundant findings already covered by per-file passes.

---

## Connection to Exam Concepts

**D1 — Agent Architecture & Orchestration:**
This lab is a multi-agent pipeline. The per-file reviewers are parallel worker agents. The coordinator is an orchestrator that acts on aggregated worker output. The key exam concept: orchestrators should not share context with workers during worker execution; they collect worker output after the fact.

**D3 — Claude Code Config & Workflows:**
`claude -p` is the single most exam-tested Claude Code CLI behavior. The exam will present scenarios where an agent needs to run Claude non-interactively and ask which flag or configuration achieves this. The answer is always `-p` / `--print`. `--output-format json` combined with `--json-schema` is the standard pattern for machine-consumable Claude Code output.

**D4 — Prompt Engineering & Structured Output:**
JSON Schema enforcement via `--json-schema` is the Claude Code equivalent of constrained decoding. The exam distinguishes between asking Claude to "return JSON" in a prompt (unreliable) versus using `--json-schema` to enforce structure at the CLI level (reliable). The nullable `line_number` field tests knowledge of JSON Schema union types, which appear in real schemas whenever a field is conditionally absent.

**D5 — Context Management & Reliability:**
Deduplication across runs is cross-run context management without using Claude's context window. The exam tests whether you know the difference between in-context memory (prompt content in a single invocation), cross-invocation session memory (not used here), and external state (the `previous_findings.json` file). This lab uses external state deliberately to keep invocations stateless while preserving run-to-run continuity.
