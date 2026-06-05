# Quiz — Claude Code Configuration & Workflows
Score ≥80% before moving to the next module.

---

**Q1:** A startup has three developers. The lead developer placed the repo's branch naming convention (`feat/`, `fix/`, `chore/` prefixes), testing framework requirements, and deployment checklist in her `~/.claude/CLAUDE.md`. Two weeks later, a new contractor joins and Claude Code gives him no guidance on any of these conventions. What is the root cause?

A) The contractor's Claude Code installation is missing a dependency
B) The `~/.claude/CLAUDE.md` file is user-level and not shared via VCS, so the contractor never received it
C) Branch naming conventions cannot be expressed in CLAUDE.md files
D) The contractor needs to run `/memory` to import the lead developer's settings

<details><summary>Answer</summary>

**B** — User-level CLAUDE.md (`~/.claude/CLAUDE.md`) is never committed to version control. It applies only to the developer who wrote it. Team conventions must go in project-level `.claude/CLAUDE.md` so they are distributed to every contributor via VCS. | Distractor: D is wrong because `/memory` opens a developer's own CLAUDE.md for editing — it does not import another user's settings.

</details>

---

**Q2:** A developer created `.claude/rules/api-security.md` with `paths: ["src/api/**/*"]` containing rules about JWT validation and request body logging. She reports that when Claude edits `src/__tests__/api.test.ts`, it generates test helpers that log full request bodies, violating the security rules. What is happening?

A) The `.claude/rules/` directory is not supported for security rules; use CLAUDE.md instead
B) The `paths` frontmatter causes the rules file to load only when editing files matching `src/api/**/*`, so test files are excluded
C) The glob pattern `src/api/**/*` is malformed and fails to match any files
D) Security rules in `.claude/rules/` require `allowed-tools: []` to be enforced

<details><summary>Answer</summary>

**B** — Rules files with `paths` frontmatter are conditional loaders. When Claude is editing `src/__tests__/api.test.ts`, that path does not match `src/api/**/*`, so the security rules file is silently skipped. To fix this, either expand the glob (e.g., add `"src/__tests__/**/*"`) or move the critical rules to project-level CLAUDE.md for universal loading. | Distractor: A is wrong — `.claude/rules/` is perfectly valid for security conventions; the problem is the glob scope, not the location.

</details>

---

**Q3:** An engineering team has coding standards that apply to all TypeScript files throughout the codebase — linting rules, import order conventions, and type annotation requirements. The files are spread across `src/`, `lib/`, `utils/`, and `__tests__/`. Which configuration approach is most appropriate?

A) Create a `CLAUDE.md` in each of the four directories with the same content
B) Add all TypeScript conventions to `~/.claude/CLAUDE.md` on each developer's machine
C) Create `.claude/rules/typescript.md` with `paths: ["**/*.ts", "**/*.tsx"]`
D) Add the conventions to the project-level `.claude/CLAUDE.md` with a note that they apply only to TypeScript files

<details><summary>Answer</summary>

**C** — When conventions apply to files spread across many directories by file type, `.claude/rules/` with a glob pattern is the correct tool. `**/*.ts` matches all TypeScript files regardless of their directory location. This loads the rules exactly when needed, saves context, and avoids duplicating content across four directory-level CLAUDE.md files. | Distractor: D would work functionally, but adds TypeScript rules to the global always-loaded context — including when Claude is editing JSON, Markdown, or Python files — wasting context window space.

</details>

---

**Q4:** A team built a `/code-review` skill using `context: fork`. The skill reads the changed files, produces a detailed review report, and posts it as output. Three months later, a developer asks to extend the skill so that after the report, the developer can ask follow-up questions about specific findings. A teammate says "just add a follow-up prompt to the SKILL.md." What is the actual problem with this plan?

A) Skills cannot produce structured output and also accept follow-up input
B) `context: fork` creates an isolated subagent that terminates after producing output, making follow-up conversation impossible within the same skill session
C) The `allowed-tools` field must be updated before follow-up prompts can be processed
D) Follow-up questions in skills require `argument-hint` to be configured with a multi-value format

<details><summary>Answer</summary>

**B** — `context: fork` runs the skill in an isolated subagent. Once the skill completes and returns its result to the main session, the forked session is gone. There is no channel for the developer to send follow-up messages to it. To support interactive follow-ups, `context: fork` must be removed so the skill runs in the main session, where the conversation continues normally after the skill's initial output. | Distractor: A is wrong — skills can produce structured output (via `--output-format json` or formatted markdown) and in a non-forked context can also accept replies.

</details>

---

**Q5:** A developer has a personal `/deploy` skill at `~/.claude/skills/deploy/SKILL.md` that targets a staging environment. The project also has `.claude/skills/deploy/SKILL.md` that targets production. When the developer types `/deploy`, which skill runs?

A) The project skill, because project-level configuration takes precedence over user-level
B) The personal skill, because personal skills override project skills of the same name
C) Both skills run in sequence — personal first, then project
D) Claude Code raises an error when two skills share the same name

<details><summary>Answer</summary>

**B** — Personal skills (`~/.claude/skills/`) override project skills of the same name. This is intentional: developers can customize their own tooling without modifying shared project configuration. The override is silent — no warning is shown. The developer should be aware that their local `/deploy` behavior differs from what CI (which uses the project skill) will do. | Distractor: A is wrong — the precedence order is inverted; personal always beats project for the same skill name.

</details>

---

**Q6:** A team is setting up a GitHub Actions workflow to run Claude Code security reviews on every pull request. The workflow runs the command `claude "Review this PR for security issues"` but the job never completes — it times out after 6 hours. What is the most likely cause and fix?

A) The GitHub Actions runner does not have internet access; fix by adding network permissions
B) The security review prompt is too long; shorten the prompt to under 500 characters
C) The command is missing the `-p` flag; without it, Claude Code waits for interactive user input and the job hangs
D) Claude Code does not support running in GitHub Actions; use the REST API instead

<details><summary>Answer</summary>

**C** — Without the `-p` (or `--print`) flag, Claude Code runs in interactive mode and waits for user input that never arrives in a CI environment, causing an indefinite hang. The correct command is `claude -p "Review this PR for security issues"`. The `-p` flag enables non-interactive mode: Claude processes the prompt, writes to stdout, and exits. | Distractor: D is wrong — Claude Code explicitly supports GitHub Actions and CI/CD pipelines via the `-p` flag.

</details>

---

**Q7:** A senior architect is planning a migration of the authentication system to support OAuth in addition to the existing password-based login. The change will touch the auth middleware, session management, user model, database schema (requiring a migration), and three API endpoints. Which approach should she use?

A) Direct execution — she knows the codebase well, so there is no need for a planning phase
B) Planning mode first to map all touchpoints and propose an implementation sequence, then direct execution after approval
C) Create a new branch and let Claude make all changes simultaneously using parallel tool calls
D) Split the work into 12 individual slash commands and invoke them one at a time

<details><summary>Answer</summary>

**B** — This task has multiple modules involved, security implications, and several plausible implementation sequences (schema first vs middleware first, how to handle session invalidation during migration). Planning mode lets Claude explore the codebase, surface all touchpoints, and propose a safe sequence — without making any changes. The architect can review and approve the plan, then Claude executes it. | Distractor: A is wrong — familiarity with the codebase is not the deciding factor; the task's scope (multi-module, security-sensitive, migration) is. Those properties warrant planning mode regardless of seniority.

</details>

---

**Q8:** A CI pipeline is working correctly with `claude -p "Review this PR"`. The team now wants the output as machine-readable JSON so they can automatically post inline PR comments. Which command achieves this?

A) `claude -p "Review this PR" --format json`
B) `claude -p "Review this PR" --output-format json --json-schema '{"type":"object","properties":{"comments":{"type":"array"}}}'`
C) `claude --batch "Review this PR" --output json`
D) `CLAUDE_OUTPUT=json claude -p "Review this PR"`

<details><summary>Answer</summary>

**B** — The correct flags are `--output-format json` (to produce JSON output) and `--json-schema` (to validate the output against a schema). Both are documented CI flags. Combined with `-p` for non-interactive mode, this produces structured, parseable output that a pipeline step can use to post inline comments. | Distractor: A uses `--format` which is not the correct flag name; C invents `--batch` and `--output` which do not exist; D uses an undocumented environment variable.

</details>

---

**Q9:** A team's project CLAUDE.md contains general guidelines. They want additional context loaded only when someone is working on files inside the `billing/` directory, which has unique domain knowledge (Stripe integration, compliance rules). Which configuration approach is correct?

A) Add billing-specific context to project-level CLAUDE.md with a comment noting it applies to billing only
B) Create `.claude/rules/billing.md` with `paths: ["billing/**/*"]`
C) Create `billing/CLAUDE.md` with the billing-specific context
D) Either B or C is correct; the choice depends on whether the billing context is needed elsewhere

<details><summary>Answer</summary>

**D** — Both B and C are valid, but for different situations. If the billing context applies ONLY within the `billing/` directory (directory-scoped), a `billing/CLAUDE.md` is cleaner and more semantically clear. If some of the billing rules might apply to billing-related files elsewhere (e.g., billing utilities in `src/utils/`, billing tests in `src/__tests__/`), then `.claude/rules/billing.md` with a broader glob is more appropriate. The question gives no signal about cross-directory spread, so both are defensible. | Distractor: A is wrong — adding conditional context to a globally-loaded CLAUDE.md loads it on every session, wasting context even when no billing work is happening.

</details>

---

**Q10:** A developer runs `claude --resume auth-investigation` to continue a debugging session from two days ago. The session resumes and Claude references a file content it read two days ago. But the file was refactored yesterday. Claude begins making changes based on stale tool results. What should the developer have done instead?

A) Used `claude -p` instead of `--resume` to avoid stale context
B) Run `/compact` before resuming to compress the old context
C) Started a new session with a brief summary of prior findings instead of resuming the old session
D) Added `--refresh-tools` flag to invalidate cached tool results

<details><summary>Answer</summary>

**C** — When files have changed since a prior session, resuming with `--resume` brings stale tool results back into context. The safer approach is to start a new session and provide a brief human-written summary of what was discovered — "Here is what we found: the auth bug originates in the token validation middleware." This gives Claude current context without stale file reads. The guide explicitly recommends this approach when time has passed or files have changed. | Distractor: A is wrong — `-p` is for non-interactive CI mode, not for managing session staleness. D is wrong — `--refresh-tools` is not a real flag.

</details>
