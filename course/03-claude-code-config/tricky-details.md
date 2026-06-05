# Tricky Details — Claude Code Configuration & Workflows
These small distinctions decide pass/fail.

---

### User-level vs project-level — the "new teammate" test

**Trap:** Putting repo testing conventions in `~/.claude/CLAUDE.md` so they apply globally.

**Reality:** User-level is for personal preferences (your style, your shortcuts). Project-level is for what every contributor needs to know about THIS project. Ask: "Would a new developer joining this team need to know this?" → yes: project-level (`.claude/CLAUDE.md`, committed to VCS). "Is this specific to my workflow?" → yes: user-level (`~/.claude/CLAUDE.md`, never committed).

**Tell:** "Where should the repo's test naming convention be documented?" → `.claude/CLAUDE.md` (project). "Where should I put my preference for short explanations?" → `~/.claude/CLAUDE.md` (user). Any question asking why a new contributor is not receiving project instructions → they were placed in user-level instead of project-level.

---

### `.claude/rules/` paths glob loads ONLY on matching files — not always

**Trap:** "I put my API rules in `.claude/rules/` so they always apply."

**Reality:** Rules files with `paths` frontmatter load CONDITIONALLY — only when Claude is working on a file matching the glob. They are NOT globally loaded. If Claude is editing a test file, an API rule with `paths: ["src/api/**"]` does NOT load. A rules file without any `paths` frontmatter does load globally, but the moment you add `paths`, loading becomes conditional.

**Tell:** "Why aren't my API security rules being enforced when Claude edits test files?" → the test files don't match the API glob pattern. Any scenario where a rule "sometimes applies" or "isn't loading" → check whether the current file matches the `paths` glob.

---

### Rules vs directory CLAUDE.md — different use cases

**Trap:** Using `.claude/rules/` for context that only applies to one directory, or using a directory CLAUDE.md when conventions span many directories.

**Reality:** Rules files (`paths` glob) = cross-cutting conventions applying to files by type across many directories (e.g., "all `.py` files follow this linting style," "all migration files follow this pattern"). Directory `CLAUDE.md` = localized context for one subtree ("this is the payments module; here is how it works"). Using rules for single-directory context adds unnecessary indirection. Using a directory CLAUDE.md for codebase-wide conventions requires duplicating it everywhere.

**Tell:** "Should apply to all TypeScript files regardless of location" → `.claude/rules/` with `**/*.ts` glob. "Should apply only within the `auth/` directory" → `auth/CLAUDE.md`. The phrase "regardless of location" strongly signals rules. The phrase "only within" strongly signals directory CLAUDE.md.

---

### Personal skill overrides project skill of the same name

**Trap:** "The project skill takes precedence because it was defined at the project level."

**Reality:** Personal skills (in `~/.claude/skills/`) override project skills with the same name. Personal preferences win over team defaults. This is intentional — developers can customize their own tooling without modifying the shared project configuration. The override is silent; no warning is shown.

**Tell:** "A developer installed their own `/deploy` skill but keeps getting the project's `/deploy` behavior" → they need to check that their personal skill file exists and has the correct name. Any question about precedence between personal and project skills → personal always wins.

---

### `context: fork` isolates output — incompatible with interactive conversation

**Trap:** Using `context: fork` for a quiz skill where the user needs to reply with answers.

**Reality:** `context: fork` runs in an isolated subagent session — clean contained output, but no back-and-forth is possible. The skill completes, returns a result to the main session, and the isolated session ends. The user cannot send a follow-up message inside the forked session. Use `fork` for self-contained reports (readiness assessment, code review, codebase analysis). Omit `context` for interactive skills (quiz, explain, iterative Q&A) where the conversation must continue after the skill runs.

**Tell:** "The quiz skill shows questions but can't receive the user's answers" → `context: fork` is wrong here; remove it. Any scenario describing a skill that produces output but cannot receive replies → `context: fork` is the culprit.

---

### `-p` / `--print` is the ONLY correct CI flag

**Trap:** Using `--batch`, `CLAUDE_HEADLESS=true`, or other creative flags for non-interactive CI runs.

**Reality:** `-p` (or `--print`) is the only documented, correct non-interactive mode flag. It causes Claude Code to process the prompt, write to stdout, and exit — no user input is expected. No environment variable, no `--batch` flag, no other option achieves this behavior correctly. Using the wrong approach causes the pipeline to hang waiting for input.

**Tell:** Any question listing options for "how to run Claude Code in a CI pipeline without it waiting for input" → only `-p` / `--print` is valid. Distractors often include plausible-sounding flags like `--headless`, `--non-interactive`, or `--batch`.
