# Key Points — Claude Code Configuration & Workflows
The most important parts. Review this file before the exam.

---

**If a configuration item should apply to all contributors on the team → put it in `.claude/CLAUDE.md` (project-level) and commit it**, because user-level (`~/.claude/CLAUDE.md`) is never shared via VCS and new teammates will never see it.

**If a configuration item is a personal working preference → put it in `~/.claude/CLAUDE.md` (user-level)**, because project-level CLAUDE.md is for codebase facts, not individual workflow habits.

**If context should apply only within one subtree (e.g., the `payments/` module) → add a `CLAUDE.md` directly inside that directory**, because directory-level CLAUDE.md loads only when Claude is working in that subtree, keeping global context clean.

**If a convention applies to files scattered across many directories (e.g., all `*.test.ts` files) → use `.claude/rules/` with a `paths` glob**, because a directory-level CLAUDE.md would need to be duplicated everywhere, while a single glob rule covers the whole codebase from one place.

**If you expect a `.claude/rules/` file to apply globally → add it to CLAUDE.md instead**, because rules files with `paths` frontmatter load ONLY when the current file matches the glob — they are never globally loaded.

**If a skill produces verbose intermediate output that should not pollute the main session → set `context: fork` in SKILL.md frontmatter**, because `context: fork` isolates the skill in a subagent and returns only a final summary to the main conversation.

**If a skill requires back-and-forth with the user (quiz, iterative Q&A) → omit `context: fork`**, because a forked session ends after producing its output and cannot receive further user input.

**If a developer's personal skill has the same name as a project skill → the personal skill wins**, because `~/.claude/skills/` overrides `.claude/skills/` for that developer; intentional customization beats team defaults.

**If you need to run Claude Code in a CI/CD pipeline → use the `-p` or `--print` flag**, because this is the only documented non-interactive mode; without it Claude Code waits for user input and the pipeline hangs.

**If a CI pipeline needs machine-readable output → add `--output-format json` and `--json-schema`**, because these flags produce structured, schema-validated JSON that downstream pipeline steps can parse directly.

**If a task involves dozens of files, multiple viable approaches, or architectural decisions → use planning mode first**, because planning mode lets Claude explore and propose without making changes; the developer approves before any file is touched.

**If a task is a single-file fix with a clear stack trace → use direct execution**, because planning mode adds unnecessary round-trip latency when the correct action is already obvious.
