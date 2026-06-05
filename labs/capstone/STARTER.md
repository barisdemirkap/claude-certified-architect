# Starter Guide: CI/CD Code Review Bot

## Environment & Dependencies

This lab is language-agnostic. Pick whatever scripting language your CI environment uses. Shown below for Python and shell, but Node.js or Go work equally well.

**Required:**

- Claude Code CLI installed and authenticated: https://docs.anthropic.com/en/docs/claude-code/getting-started
- `claude` binary on `PATH` (verify with `claude --version`)
- A VCS with API access (GitHub, GitLab, Bitbucket) for M4 routing
- `jq` (optional but helpful for shell-based JSON handling): https://jqlang.github.io/jq/

**Python dependencies (if using Python):**

```
jsonschema    # validate findings against schema before routing
subprocess    # spawn claude -p invocations
concurrent.futures  # parallel invocations in M2
hashlib       # sha256 fingerprints in M3
```

No Anthropic Python SDK is required — this lab drives Claude via the CLI, not the API.

**SDK links (for reference, not required):**

- Claude Code CLI docs: https://docs.anthropic.com/en/docs/claude-code/cli-reference
- `--output-format` and `--json-schema` flags: https://docs.anthropic.com/en/docs/claude-code/cli-reference#output-formats
- JSON schema spec (draft-07): https://json-schema.org/specification-links.html#draft-7

---

## Architecture Scaffold

Build these components in order; each milestone adds one layer.

```
capstone/
  review.schema.json          # finding schema (write this first, M1)
  reviewer.py (or .sh)        # main entry point
  components/
    extractor.py              # reads patch files, returns list of (path, diff)
    per_file_reviewer.py      # wraps single claude -p invocation
    aggregator.py             # merges arrays of findings
    deduplicator.py           # M3: fingerprint comparison
    coordinator.py            # M3/M4: cross-file coordinator pass
    router.py                 # M4: severity routing + VCS API calls
  state/
    previous_findings.json    # persisted across runs (starts empty)
  tests/
    sample_diffs/             # 3+ .patch files for testing M2
    test_dedup.py             # unit tests for M3 fingerprinting
    test_routing.py           # integration tests for M4 exit codes
```

You do not need to implement all components at once. M1 only needs `review.schema.json` + `per_file_reviewer.py`.

---

## Key Documentation

Read these before coding, not after hitting an error:

- **Non-interactive mode flag**: https://docs.anthropic.com/en/docs/claude-code/cli-reference#flags
  Confirms `--print` / `-p` is the correct flag for CI. There is no `--batch` flag.

- **Structured output**: https://docs.anthropic.com/en/docs/claude-code/cli-reference#output-formats
  Explains `--output-format json` and how `--json-schema` constrains the response shape.

- **Model behavior in non-interactive mode**: https://docs.anthropic.com/en/docs/claude-code/overview
  Covers what `claude -p` does and does not preserve between invocations (nothing — each is stateless).

- **JSON Schema primer**: https://json-schema.org/learn/getting-started-step-by-step
  Specifically the `"type": ["integer", "null"]` union syntax for nullable fields.

---

## Approaching Milestone 1

Work through these steps in order:

**Step 1 — Write `review.schema.json` first.**
Do not write the invocation script until the schema exists. The schema is the contract; everything else validates against it. Include all six fields with exact enum values. Make `line_number` a nullable integer union, not just `integer`.

**Step 2 — Test the claude -p invocation manually on the command line.**
```bash
claude -p "Review this diff for issues: $(cat sample.patch)" \
  --output-format json \
  --json-schema review.schema.json
```
Run this in your terminal before writing any code. Confirm the output is a JSON array. If it is not, debug the prompt or schema before proceeding.

**Step 3 — Wrap the invocation in a function that returns parsed JSON.**
Capture stdout with `subprocess.run(..., capture_output=True)`. Parse with `json.loads()`. Validate against the schema with `jsonschema.validate()`. Return the array or raise on failure.

**Step 4 — Handle the schema validation failure path.**
What happens when Claude returns valid JSON but it does not match the schema? Design this before you need it. Exit code 3 per the spec.

**Step 5 — Print findings in a readable table and verify with at least two different patch files.**
Only then move to M2.

---

## Common Stumbling Blocks

**1. Using the wrong flag for non-interactive mode.**
`claude --batch`, `CLAUDE_HEADLESS=1`, or `claude --no-interactive` are all wrong. The only correct flag is `claude -p` (or `claude --print`). The exam tests this explicitly. If your script hangs waiting for input, you used the wrong flag.

**2. Sharing a Claude session or context across files.**
Do not pass `--resume` or any session ID between per-file invocations. Each `claude -p` call must start fresh. If you see findings from file A appearing in file B's output, you have introduced shared state. The fix is to ensure each subprocess call is a completely independent command with no session flags.

**3. Treating `line_number` as always-present.**
Generated code, minified files, and some diff formats (notably `--no-context` diffs) do not have reliable line numbers. If your schema marks `line_number` as `integer` (not nullable), Claude may hallucinate a line number rather than emit `null`, or the schema will reject a valid `null`. Use `"type": ["integer", "null"]` in the schema.

**4. Deduplication fingerprint collision on similar-but-different findings.**
Using only `file_path + severity` as the fingerprint will suppress genuinely new findings in the same file at the same severity. Include `category` and a normalized form of `description` (lowercase, strip punctuation) in the hash. Overly broad fingerprints cause false suppressions; overly narrow fingerprints cause duplicate noise. Balance matters.
