# Capstone Checklist: CI/CD Code Review Bot

Use this checklist to track progress through each milestone. Check off items as you complete them.

---

## Milestone M1 — Single-File Review

- [ ] `review.schema.json` written with all six required fields
- [ ] `line_number` declared as `"type": ["integer","null"]` (nullable union, not plain integer)
- [ ] `severity` enum contains exactly: `info`, `warning`, `error`, `critical`
- [ ] `category` enum contains exactly: `security`, `performance`, `style`, `logic`, `other`
- [ ] `claude -p` invocation tested manually in terminal; output is valid JSON array
- [ ] Script wraps invocation and captures stdout via subprocess (not shell pipe)
- [ ] Output validated against schema using a JSON Schema library (not ad-hoc field checks)
- [ ] Human-readable finding table printed to stdout
- [ ] Script exits with code 0 on success, code 3 on parse/schema failure
- [ ] Tested with at least two different patch files producing different findings

---

## Milestone M2 — Multi-File Parallel Review

- [ ] Script accepts a directory of `*.patch` files (not hardcoded filenames)
- [ ] One independent `claude -p` subprocess spawned per patch file
- [ ] Invocations run concurrently (thread pool, async, or parallel shell jobs)
- [ ] No session ID, `--resume`, or shared environment variable passed between invocations
- [ ] Each finding in the merged array carries the correct `file_path` for its source file
- [ ] Merged findings written to `findings_current.json`
- [ ] Aggregate summary printed: count per severity level, count per category
- [ ] Tested with 3+ patch files simultaneously
- [ ] Verified that a finding in one file does not appear attributed to another file

---

## Milestone M3 — Deduplication

- [ ] `previous_findings.json` loaded at startup (empty array if file does not exist)
- [ ] Fingerprint computed as `sha256(file_path + category + normalize(description))`
- [ ] Net-new findings = current findings minus fingerprint-matched previous findings
- [ ] Count of suppressed findings logged to stdout
- [ ] Only net-new findings passed downstream to routing layer
- [ ] Full current findings (not just net-new) written to `previous_findings.json` after routing
- [ ] Unit tests: verify deduplication suppresses exact duplicates
- [ ] Unit tests: verify non-duplicate findings with similar descriptions are NOT suppressed
- [ ] Unit tests: verify empty `previous_findings.json` causes zero suppressions

---

## Milestone M4 — Severity Routing

- [ ] `info` findings posted as PR comment; no merge impact; exit code 0
- [ ] `warning` findings posted as PR comment; no merge impact; exit code 0
- [ ] `error` findings post PR comment AND set status check to `failure`; exit code 1
- [ ] `critical` findings post PR comment AND set status check to `failure` AND request human review; exit code 2
- [ ] Zero error/critical findings set status check to `success`; exit code 0
- [ ] Coordinator pass runs after per-file aggregation; uses its own `claude -p` invocation
- [ ] Coordinator findings routed through same severity router as per-file findings
- [ ] Human dismissal of a `critical` finding is recorded and will be deduplicated on next run
- [ ] Integration test: all-info input exits 0 and sets success status
- [ ] Integration test: one error finding exits 1 and sets failure status
- [ ] Integration test: one critical finding exits 2, sets failure, requests review

---

## Exam-Objective Coverage

| Objective | How this lab covers it |
|---|---|
| Identify correct non-interactive Claude Code flag | M1 forces use of `claude -p`; wrong flags cause the script to hang |
| Distinguish `--output-format json` from streaming modes | M1 schema validation breaks if wrong output format is used |
| Explain why independent instances prevent context bleed | M2 design requires separate subprocesses with no session sharing |
| Apply `--json-schema` to enforce structured output | M1-M4: schema is load-bearing; pipeline fails without it |
| Design stateless agent invocations | Every `claude -p` call carries full context in the prompt; no conversational state |
| Handle nullable schema fields correctly | `line_number` must be nullable or schema rejects real outputs |
| Implement multi-pass agent architecture | Coordinator pass is a second-pass agent over aggregated first-pass output |
| Manage context across runs (not across invocations) | M3 deduplication is cross-run context management without LLM memory |
| Route agent output to deterministic downstream actions | M4 severity routing maps structured output to VCS API calls |

---

## Common Pitfalls

- **Hanging pipeline**: you used a flag other than `-p` / `--print`. The process is waiting for interactive input.
- **Schema mismatch errors at runtime**: you added fields to the prompt that are not in the schema, or you omitted required fields from the schema. Keep schema and prompt in sync.
- **Cross-file contamination in M2**: findings from one file appear in another file's results. Root cause is almost always a shared session or shared temp file that Claude reads.
- **Deduplication too aggressive in M3**: you are fingerprinting only on `file_path + severity`, causing real new issues to be silently suppressed. Widen the fingerprint to include `category` and a normalized description fragment.
- **Coordinator pass receiving too much context**: if you pass full file contents (not just findings) to the coordinator, you may hit context limits. Pass the aggregated findings JSON plus file paths, not raw diffs.
- **Exit code off-by-one in M4**: pipelines treat any non-zero exit as failure. Make sure `error` and `critical` both produce non-zero exits, and that the exit code correctly distinguishes them (1 vs 2) if your CI system acts on the distinction.

---

## Stretch Goals

- Add a `--dry-run` flag that prints what routing actions would be taken without calling the VCS API.
- Implement a `confidence` field (0.0–1.0) in the schema; suppress findings below a configurable threshold.
- Add a coordinator prompt that compares findings across files and identifies the single highest-risk change in the PR.
- Store findings in a lightweight SQLite database instead of a flat JSON file, enabling richer historical queries (e.g., "show me all security findings that reappeared after being dismissed").
- Add a retry wrapper around each `claude -p` invocation with exponential backoff for rate-limit errors.
- Generate a Markdown PR comment that groups findings by category with emoji severity indicators.
