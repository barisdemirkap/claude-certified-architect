# Exercises — Claude Code Configuration & Workflows

Apply what you have learned. These are not multiple-choice questions — write out your reasoning, then check the answer.

---

## Exercise 1: Classify Each Config Item

A new project is being set up. Classify each of the following items into the correct CLAUDE.md level: **user-level** (`~/.claude/CLAUDE.md`), **project-level** (`.claude/CLAUDE.md`), or **directory-level** (`payments/CLAUDE.md`).

| # | Config item |
|---|---|
| A | "Always give me a one-paragraph summary before a detailed response." |
| B | "All tests must use `describe/it` blocks and data factories — no hardcoded fixtures." |
| C | "The `payments/` module calls the Stripe API. Never make live charges in tests." |
| D | "Branch naming convention: `feat/`, `fix/`, `chore/` prefixes required." |
| E | "My preferred editor is VS Code; open diff links there." |
| F | "This repo uses pnpm, not npm. Always run `pnpm install`, never `npm install`." |

<details><summary>Answer</summary>

**A → user-level** (`~/.claude/CLAUDE.md`). This is a personal output preference — how Claude should structure responses for you. It does not affect teammates.

**B → project-level** (`.claude/CLAUDE.md`). Testing conventions apply to every contributor. A new developer joining the team must know this. It should be committed to VCS.

**C → directory-level** (`payments/CLAUDE.md`). This is specialized knowledge about one subtree. It is relevant to the whole team, but only when working in `payments/`. Placing it at project-root level would add noise for developers not touching payments. Placing it in `payments/CLAUDE.md` means it loads only when needed.

**D → project-level** (`.claude/CLAUDE.md`). Branch naming is a team-wide convention every contributor must follow. It belongs in the committed project configuration.

**E → user-level** (`~/.claude/CLAUDE.md`). Tool preferences are personal. Your choice of editor does not affect how teammates work.

**F → project-level** (`.claude/CLAUDE.md`). Package manager choice is a codebase fact — a new developer who runs `npm install` instead of `pnpm install` will get a broken environment. This must be in committed project configuration.

</details>

---

## Exercise 2: Fix This Rules File That Is Not Loading

A developer created `.claude/rules/api-security.md` with the following content:

```yaml
---
paths: ["src/api/**/*"]
---

Never log request bodies containing `password`, `token`, or `secret`.
All API handlers must validate JWT before accessing the database.
```

A team member reports: "When I'm editing `src/api/auth/login.ts`, the security rules seem to be loading fine. But when I edit `src/__tests__/auth.test.ts`, the rules don't apply — I noticed Claude generated a test that logs the full request body."

Diagnose the problem and describe the fix.

<details><summary>Answer</summary>

**Diagnosis:** The rules file is working exactly as designed — and that is the problem. The `paths: ["src/api/**/*"]` frontmatter causes the rules file to load ONLY when Claude is editing a file that matches the glob `src/api/**/*`. The test file `src/__tests__/auth.test.ts` does not match this glob, so the security rules are not loaded when Claude works on it.

**Fix options (choose based on intent):**

1. **If the rules should apply everywhere (both API source and tests):** Remove the `paths` frontmatter entirely. A rules file without `paths` frontmatter loads globally for every session.

2. **If the rules should apply to both API source files AND test files:** Expand the glob to include test files:
   ```yaml
   ---
   paths: ["src/api/**/*", "src/__tests__/**/*"]
   ---
   ```

3. **If the no-logging rule is particularly critical and should always apply:** Move it to the project-level `.claude/CLAUDE.md` so it is always in context regardless of which file is being edited.

The key insight: `paths` glob in `.claude/rules/` is a filter, not a scope annotation. It determines when the file loads, not "who" the rule applies to.

</details>

---

## Exercise 3: Choose `context: fork` or No Fork

For each skill below, decide whether to use `context: fork` in the SKILL.md frontmatter. Justify your choice.

| # | Skill description |
|---|---|
| A | `/readiness` — Assesses exam readiness by reviewing all study notes and scoring each domain. Produces a single structured report. |
| B | `/quiz` — Asks the user 5 multiple-choice questions one at a time, waits for answers, then scores and explains each one. |
| C | `/analyze-deps` — Scans the codebase and produces a dependency graph report as a markdown file. No user interaction needed. |
| D | `/explain` — Explains a concept the user names, asks if they want a follow-up question, then adapts based on their reply. |
| E | `/security-scan` — Runs a read-only security audit of the `src/` directory, returns a JSON report listing potential issues. |

<details><summary>Answer</summary>

**A → use `context: fork`**. The readiness assessment is self-contained: scan inputs, produce a report, done. No user reply is expected. `context: fork` keeps the verbose scanning output out of the main session and returns a clean summary.

**B → do NOT use `context: fork`**. The quiz requires back-and-forth: Claude asks a question, the user answers, Claude responds. A forked session ends after producing its initial output and cannot receive the user's answers. Without `context: fork`, the skill runs in the main session and the conversation continues normally.

**C → use `context: fork`**. Producing a dependency graph is a self-contained analytical task. The intermediate file-reading output would be noisy in the main session. `context: fork` produces a clean final report.

**D → do NOT use `context: fork`**. The explain skill explicitly adapts based on user replies ("want a follow-up?"). This requires the conversation to remain open. Forking would end the session after the initial explanation, cutting off the follow-up loop.

**E → use `context: fork`**. A security scan is self-contained read-only analysis. The JSON report is a final deliverable. No user interaction is needed during the scan. `context: fork` is appropriate.

</details>

---

## Exercise 4: Write the CI Command

Your CI pipeline runs on GitHub Actions. For each requirement below, write the complete `claude` CLI command.

**Requirement A:** Run Claude Code with the prompt "Review this PR for security vulnerabilities" in non-interactive mode, printing results to stdout.

**Requirement B:** Same as A, but the output must be JSON conforming to this schema: `{"type":"object","properties":{"issues":{"type":"array","items":{"type":"string"}}}}`.

**Requirement C:** The pipeline should only report issues that were NOT present in the previous review. The previous review JSON is stored in `prior-review.json`.

<details><summary>Answer</summary>

**A:**
```bash
claude -p "Review this PR for security vulnerabilities"
```
The `-p` (or `--print`) flag is the only correct non-interactive mode flag. It processes the prompt and exits without waiting for input.

**B:**
```bash
claude -p "Review this PR for security vulnerabilities" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"issues":{"type":"array","items":{"type":"string"}}}}'
```
`--output-format json` produces machine-readable output. `--json-schema` validates the output against the provided schema.

**C:**
```bash
claude -p "Review this PR for security vulnerabilities. The prior review results are: $(cat prior-review.json). Report ONLY new or previously unresolved issues." \
  --output-format json \
  --json-schema '{"type":"object","properties":{"issues":{"type":"array","items":{"type":"string"}}}}'
```
The prior review context must be embedded in the prompt. Claude Code has no built-in deduplication — the instruction to "report only new issues" must be explicit. This also addresses the duplicate-comment problem: without this context, every pipeline run would re-report resolved issues.

</details>

---

## Exercise 5: Spot the Anti-Pattern

Read the scenario below and identify all configuration anti-patterns. For each one, name the problem and describe the correct fix.

---

**Scenario:** Amara is a senior developer at a startup. She has set up the following Claude Code configuration:

1. In `~/.claude/CLAUDE.md`, she wrote:
   > "All PRs must pass `pnpm test` before merging. Use conventional commits. Terraform files are in `infra/`. Never modify the database schema without a migration."

2. She created `.claude/rules/terraform.md`:
   ```yaml
   ---
   paths: ["infra/**/*"]
   ---
   Always run `terraform plan` before `terraform apply`.
   ```
   She tells the team: "These Terraform rules now apply globally so everyone follows them."

3. She created a personal skill at `~/.claude/skills/deploy/SKILL.md` with `context: fork` and named it the same as the project's `.claude/skills/deploy/SKILL.md`. She expects the project skill to be used in CI.

<details><summary>Answer</summary>

**Anti-pattern 1: Team conventions in user-level CLAUDE.md**

Amara put `pnpm test`, conventional commits, Terraform location, and migration rules in her personal `~/.claude/CLAUDE.md`. These are facts every contributor needs — they are project conventions, not personal preferences. No other developer will receive them. Fix: move all of these to `.claude/CLAUDE.md` at the project root and commit the file.

**Anti-pattern 2: Misunderstanding `.claude/rules/` `paths` as global**

The `paths: ["infra/**/*"]` frontmatter means the Terraform rules load ONLY when Claude is editing a file inside `infra/`. They do not apply globally. If Claude is working on a TypeScript file, these rules are invisible. If Amara wants the Terraform rules to appear whenever someone is in the `infra/` directory context, `.claude/rules/` with the correct glob is fine — but she must not describe it as "global." Fix: update the team's mental model. The rules load conditionally. If the rules must truly be global (e.g., "never run terraform apply directly"), put them in project-level CLAUDE.md.

**Anti-pattern 3: Personal skill shadowing project skill silently**

Amara's personal `~/.claude/skills/deploy/SKILL.md` silently overrides the project's deploy skill for her own sessions. This is a personal customization choice and may be intentional. However, the critical error is the statement about CI: CI pipelines run in a clean environment and load project-level configuration, NOT the developer's personal `~/.claude/` files. The CI pipeline will use the project skill. Fix: there is no CI problem here — but Amara should be aware that her local behavior differs from CI behavior. She should test the project skill in isolation to ensure CI behaves as expected.

</details>

---

## Exercise 6: Planning Mode vs Direct Execution

For each task below, decide whether to use **planning mode** or **direct execution**. Justify your answer.

| # | Task description |
|---|---|
| A | Fix a `TypeError: Cannot read property 'id' of undefined` on line 42 of `src/api/users.ts`. The stack trace is clear. |
| B | Migrate the entire frontend from React class components to hooks. Affects 47 files. |
| C | Add input validation to one form field in `components/LoginForm.tsx`. |
| D | Redesign the data-fetching layer — decide between React Query, SWR, and a custom hook solution. |
| E | Update a copyright year string in `src/constants.ts`. |
| F | Refactor the authentication flow to support OAuth in addition to password login. Multiple modules involved, security implications. |

<details><summary>Answer</summary>

**A → direct execution.** Single file, clear stack trace, unambiguous fix. Planning mode adds latency with no benefit.

**B → planning mode.** 47 files, one of the guide's explicit examples ("library migrations affecting 45+ files"). Claude should produce a migration plan — which components to convert first, how to handle stateful logic, how to test — before touching any files.

**C → direct execution.** Single component, single concern (input validation), well-understood change. No architecture decisions needed.

**D → planning mode.** Multiple plausible approaches (React Query vs SWR vs custom), architectural consequences, and the choice affects the entire data layer. Claude should surface trade-offs and produce a recommendation before any implementation begins.

**E → direct execution.** Trivial, single-file, unambiguous. A planning round-trip for a string update would be absurd.

**F → planning mode.** Multi-module refactor with security implications. Multiple viable approaches. Unfamiliar territory for most codebases (OAuth flows vary significantly). Planning mode lets Claude map the existing auth flow, identify all touchpoints, and propose a safe implementation sequence before any changes are made.

</details>
