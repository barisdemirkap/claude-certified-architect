# Capstone Specification: CI/CD Code Review Bot

## Architecture Overview

```
PR opened / updated
        |
        v
  [Diff Extractor]          -- fetches changed files + diffs from VCS
        |
        | list of (file_path, diff_patch) tuples
        v
  [Per-File Review Layer]   -- one claude -p invocation per file (parallel)
   claude -p  claude -p  claude -p ...
        |
        | raw JSON arrays (one per invocation)
        v
  [Aggregator]              -- merges all per-file finding arrays
        |
        | merged findings[]
        v
  [Deduplication Filter]    -- loads previous_findings.json, removes already-known issues
        |
        | net-new findings[]
        v
  [Coordinator Pass]        -- single claude -p run over aggregate for cross-file patterns
        |
        | cross-file findings[]
        v
  [Severity Router]
   INFO/WARNING --> PR comment
   ERROR        --> PR comment + block merge
   CRITICAL     --> PR comment + block merge + require human approval
        |
        v
  [Findings Store]          -- writes current run's findings to previous_findings.json
```

Components:
- **Diff Extractor**: shell/script layer; not Claude-aware.
- **Per-File Review Layer**: stateless; each invocation receives only that file's diff.
- **Aggregator**: pure data merge; no LLM call.
- **Deduplication Filter**: compares on `(file_path, category, description)` fingerprint.
- **Coordinator Pass**: receives the aggregated finding list and original diffs; prompts for cross-file concerns (e.g., inconsistent error handling across modules).
- **Severity Router**: reads `severity` field; drives VCS API calls.
- **Findings Store**: flat JSON file (`previous_findings.json`) committed to CI artifact storage or written to a PR-scoped cache.

---

## Milestone M1 — Single-File Review

**Requirements:**

1. Accept a single `diff.patch` file as input.
2. Invoke `claude -p` with `--output-format json` and `--json-schema review.schema.json`.
3. Capture stdout; parse as JSON array of findings.
4. Each finding must conform to the schema (see Input/Output Contract).
5. Print findings to stdout in a human-readable table.
6. Exit with code 0 on success, non-zero if the JSON fails to parse.

**Deliverables:** A script (any language) plus `review.schema.json`.

---

## Milestone M2 — Multi-File Parallel Review

**Requirements:**

1. Accept a directory of `*.patch` files (one per changed file).
2. Spawn one `claude -p` invocation per patch file; invocations run concurrently.
3. Each invocation is fully independent — no shared Claude session, no shared environment state between invocations.
4. Collect all JSON outputs; merge into a single findings array.
5. Preserve `file_path` provenance on every finding.
6. Write merged findings to `findings_current.json`.
7. Display aggregate summary: count by severity, count by category.

**Deliverables:** Updated script, demonstration with at least 3 patch files.

---

## Milestone M3 — Deduplication

**Requirements:**

1. Load `previous_findings.json` if it exists (from a prior run on the same PR).
2. Compute a fingerprint for each finding: `sha256(file_path + category + description)`.
3. Remove any finding whose fingerprint matches a previous finding.
4. Surface only net-new findings downstream.
5. Log how many findings were suppressed as "already acknowledged."
6. After routing (M4), write the full current findings (not just net-new) to `previous_findings.json` to become the baseline for the next run.

**Deliverables:** Deduplication logic with unit tests for the fingerprint comparison.

---

## Milestone M4 — Severity Routing

**Requirements:**

1. Route findings by severity:
   - `info` — post as a PR comment (informational, no merge impact).
   - `warning` — post as a PR comment (informational, no merge impact).
   - `error` — post as a PR comment AND set merge-blocking status check to `failure`.
   - `critical` — post as a PR comment AND set merge-blocking status check to `failure` AND request human review via VCS review-request API.
2. If zero `error` or `critical` findings exist, set status check to `success`.
3. A human reviewer may dismiss a `critical` finding; the dismissal must be recorded so deduplication suppresses it on the next run.
4. The coordinator pass (cross-file) findings follow the same routing rules.

**Deliverables:** Routing logic, integration test simulating each severity level.

---

## Input/Output Contract

### Per-File Invocation Input

```
Prompt (stdin or inline): "Review this diff for issues:\n<diff content>"
Flags: --output-format json --json-schema review.schema.json
```

### Finding Schema (`review.schema.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ReviewFinding",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["file_path","severity","category","description","suggestion","line_number"],
    "properties": {
      "file_path":    { "type": "string" },
      "severity":     { "type": "string", "enum": ["info","warning","error","critical"] },
      "category":     { "type": "string", "enum": ["security","performance","style","logic","other"] },
      "description":  { "type": "string" },
      "suggestion":   { "type": "string" },
      "line_number":  { "type": ["integer","null"] }
    }
  }
}
```

### Pipeline Exit Codes

| Code | Meaning |
|---|---|
| 0 | No error or critical findings |
| 1 | One or more error findings (merge blocked) |
| 2 | One or more critical findings (human approval required) |
| 3 | Internal pipeline failure (JSON parse error, schema violation) |

---

## Constraints (Out of Scope)

- No IDE plugin or editor integration.
- No real-time streaming output (`--output-format stream-json` is not used here).
- No multi-turn conversation with Claude; every invocation is stateless.
- No auto-fix / auto-commit of suggested changes.
- Language-specific static analysis tools (ESLint, Bandit, etc.) are not integrated — Claude is the sole reviewer.
- The solution does not need to handle binary file diffs.
