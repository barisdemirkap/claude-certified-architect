# Scenario 5: Claude Code for CI/CD

## Overview

An engineering organization integrates Claude Code into its CI/CD pipeline to automate code review, security scanning, and release note generation at every pull request. Claude Code runs non-interactively as a pipeline step — it receives code diffs, produces structured output, and exits. No human is present during pipeline execution. The stakes are pipeline reliability (the step must complete deterministically) and output correctness (structured JSON must be parseable by downstream steps).

## Architecture

**Components:**
- CI runner (GitHub Actions, GitLab CI, etc.) that invokes Claude Code as a shell step
- `claude -p` flag (print mode) for non-interactive, single-turn execution
- `--output-format json` for machine-parseable output
- `--json-schema` to enforce a specific output schema
- One Claude Code instance per file reviewed (no shared context between files)
- Multi-pass review: first pass for correctness issues, second pass for style/security
- Deduplication step on recommit: when a PR is updated, existing comments are diffed against new output to avoid duplicate annotations

**Pipeline Step Example:**

```yaml
- name: Claude Code Review
  run: |
    claude -p "Review this diff for correctness issues. Output JSON only." \
      --output-format json \
      --json-schema ./schemas/review-output.json \
      < diff.patch
```

**Data Flows:**
1. PR is opened or updated → CI triggers
2. Diff is extracted per file
3. For each file: `claude -p` is invoked with the diff as stdin, schema as constraint
4. Claude Code produces JSON output: `{ file, issues: [{ line, severity, description }] }`
5. Output is validated against schema; invalid output fails the step
6. Downstream step reads JSON and posts inline PR comments
7. On recommit: new output is diffed against prior output; only new issues are posted

**Output Schema:**

```json
{
  "file": "string",
  "issues": [
    {
      "line": "integer",
      "severity": "error | warning | info",
      "description": "string",
      "suggestion": "string | null"
    }
  ]
}
```

## Domain Connections

| Domain | Key Concepts from This Scenario |
|---|---|
| D3 — Claude Code Config & Workflows | `-p` / `--print` flag as the correct non-interactive mode; `--output-format json`; `--json-schema`; headless execution |
| D4 — Prompt Engineering & Structured Output | JSON schema enforcement; multi-pass review prompting; structured output for downstream parsing |
| D1 — Agent Architecture & Orchestration | Independent instances per file (no shared state); when NOT to use a stateful agent loop |
| D5 — Context Management & Reliability | Deduplication on recommit; why shared context across files causes issues |

## Key Design Decisions

**1. -p / --print is the ONLY correct non-interactive flag**
When running Claude Code in a CI pipeline, the correct invocation flag is `-p` (also `--print`). This flag puts Claude Code into print mode: single-turn, non-interactive, exits after producing output. Other flags like `--interactive` or simply running `claude` without flags will wait for user input and hang the pipeline. The exam tests this as a fact: `-p` is the designated flag for headless/CI use. There is no other correct option.

**2. --output-format json with --json-schema**
Structured output is essential in CI. `--output-format json` tells Claude Code to produce JSON. `--json-schema ./path/to/schema.json` constrains the output to a specific schema. If the output does not conform, the step fails cleanly rather than producing unparseable text that silently corrupts the downstream step. The exam tests knowing both flags and their combined role.

**3. Independent instances per file**
Each file in a PR is reviewed by a separate, independent Claude Code invocation. There is no shared context between file reviews. This is intentional: shared context would cause the review of file B to be influenced by the issues found in file A (context bleed), increasing noise. Independence ensures each review is clean and reproducible. The exam tests why shared context is wrong here, not just that it is avoided.

**4. Multi-pass review**
A single-pass review asks Claude Code to identify all issue types at once. Multi-pass separates concerns: the first invocation reviews for correctness (logic errors, null dereferences), the second for security (injection risks, credential leaks), and optionally a third for style. Each pass uses a focused prompt and produces output in the same schema. The exam tests why multi-pass improves precision (focused attention per concern) over single-pass (competing concerns dilute attention).

**5. Deduplication on recommit**
When a developer pushes a new commit to an open PR, the pipeline reruns. Without deduplication, every existing issue would be re-posted as a new comment, flooding the PR. The deduplication step compares new output against prior output (keyed by file + line + description hash) and only posts issues that are new or changed. The exam tests understanding that deduplication is a downstream processing step, not a Claude Code feature.

## Typical Exam Question Patterns

**Pattern 1 — Correct non-interactive flag:**
"A CI pipeline step needs to invoke Claude Code, wait for it to produce output, and exit. Which flag must be used?" — The correct answer is `-p` (or `--print`). Running `claude` without `-p` will block waiting for interactive input.

**Pattern 2 — Structured output in CI:**
"A downstream pipeline step expects a JSON array of review issues from Claude Code. How should the invocation be configured?" — The correct answer uses both `--output-format json` and `--json-schema` pointing to the expected schema.

**Pattern 3 — Shared vs. independent context:**
"A CI review pipeline processes 12 files in a PR. Should a single Claude Code session be maintained across all 12 files?" — The correct answer is no — independent instances per file prevent context bleed and ensure reproducible, isolated reviews.

## Common Mistakes

- **Not using -p and expecting non-interactive behavior.** The most common mistake: running `claude` in a pipeline script without `-p` and wondering why it hangs. The exam makes this the distractor in the correct-flag question.
- **Skipping --json-schema.** Using `--output-format json` without a schema produces JSON that may have arbitrary structure. Downstream steps break. The schema is the contract between Claude Code and the rest of the pipeline.
- **Sharing context across files.** Candidates design a single Claude Code session that reviews all files sequentially, passing context forward. This causes context bleed and is slower (sequential) without benefit.
- **Not implementing deduplication.** Candidates design systems where the pipeline reruns and re-posts all issues on every commit. This is a product quality failure — developers stop trusting the annotations because they flood the PR.

## Cross-Reference

| Concept | Module | Lab |
|---|---|---|
| `-p` flag and headless execution | D3 — Claude Code Config | Capstone |
| `--output-format json` and `--json-schema` | D3 — Claude Code Config | Capstone |
| Structured output schema design | D4 — Prompt Engineering | Lab 4 |
| Independent agent instances | D1 — Agent Architecture | — |
| Multi-pass prompting | D4 — Prompt Engineering | — |
