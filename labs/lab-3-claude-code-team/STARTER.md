# Lab 3 Starter Guide — Claude Code Team Configuration

## Environment & Dependencies

This lab requires no runtime dependencies. You are authoring configuration files that Claude Code reads.

**Tools you need:**
- A text editor (VS Code recommended)
- Claude Code installed: `npm install -g @anthropic-ai/claude-code`
- Git (to verify `.gitignore` patterns if testing locally)

**Relevant SDK/docs links:**
- Claude Code overview: https://docs.anthropic.com/en/docs/claude-code/overview
- CLAUDE.md reference: https://docs.anthropic.com/en/docs/claude-code/memory
- Rules files (paths glob): https://docs.anthropic.com/en/docs/claude-code/memory#rules-files
- Skills reference: https://docs.anthropic.com/en/docs/claude-code/skills
- MCP configuration: https://docs.anthropic.com/en/docs/claude-code/mcp

---

## Architecture Scaffold

Before writing any file, internalize this component map:

| Component | File | Load trigger |
|---|---|---|
| Project context | `.claude/CLAUDE.md` | Every session (always on) |
| API guardrails | `src/api/.claude/rules/api-rules.md` | Only when editing `src/api/**` |
| Payments guardrails | `src/payments/.claude/rules/payments-rules.md` | Only when editing `src/payments/**` |
| Review skill | `.claude/skills/review/SKILL.md` | User invokes `/review` |
| MCP manifest | `.mcp.json` | Session startup (tool registration) |

The key mental model: **context flows from broad to narrow**. The project CLAUDE.md is the widest ring; rules files are narrower rings triggered by file path; skills are on-demand; MCP tools are always available once registered.

---

## Key Documentation

Study these sections before writing each milestone:

**For M1 (CLAUDE.md):**
- Memory and CLAUDE.md docs — understand the "new teammate brief" pattern.
- Rule: Put in CLAUDE.md what every developer should know on day one, regardless of where they are working.

**For M2 (Rules files):**
- Rules files use YAML frontmatter with a `paths:` array of glob patterns.
- The `paths:` key uses the same glob syntax as `.gitignore` anchored to the repo root.
- A rules file without `paths:` frontmatter loads in every session (equivalent to a CLAUDE.md in that directory).
- Key distinction: a `rules/` file with `paths:` is **conditional**; a `CLAUDE.md` file in a subdirectory is **always loaded when you enter that directory's context**.

**For M3 (Skills):**
- `context: fork` creates an isolated execution — the skill output does not persist in the main conversation context.
- `allowed-tools` restricts what the skill can invoke — this is a safety and scoping mechanism.
- `argument-hint` is surfaced in the `/help` output; write it as a human-readable hint, not a type annotation.

**For M4 (.mcp.json):**
- `.mcp.json` is auto-discovered at the repo root.
- The `env` block injects environment variables into the MCP server process — the values are resolved from the host shell, not stored in the file.
- Use `"${VAR_NAME}"` syntax in the env block to reference host env vars. Never put real credentials in this file — it should be committed to version control.

---

## Approaching Milestone 1

**Concrete first steps:**

1. Create the directory: `mkdir -p .claude`
2. Open `.claude/CLAUDE.md` in your editor.
3. Start with the repo structure section — draw the directory tree and annotate each node.
4. Add the testing section next: what command runs all tests? What command runs a single layer?
5. Write the deployment section: CI → staging → prod, with exact commands.
6. Finish with the "extra care" areas — this is the most exam-relevant part. Be explicit about *why* these areas need care, not just *that* they do.

**The key quality test for M1:** Hand the CLAUDE.md to someone who has never seen the repo. Can they answer these questions without asking anyone?
- Where is the payments code?
- How do I run tests?
- What happens when I merge to `main`?
- Which two areas should I be most careful editing?

---

## Common Stumbling Blocks

**1. Forgetting the frontmatter separator.**
Rules files and skill files both use YAML frontmatter. The content must begin and end with `---` on its own line. Missing the closing `---` causes the entire file to be treated as frontmatter and the content is ignored.

```
---                     ← required
paths:
  - "src/api/**"
---                     ← also required
# API Rules
...content here...
```

**2. Anchoring paths globs incorrectly.**
`"src/api/**"` matches `src/api/routes/users.js`. But `"api/**"` does NOT match that same path because it is anchored to the repo root. Always write paths relative to the repo root, starting without a leading slash.

**3. Confusing `context:fork` with `context:background`.**
`fork` = isolated snapshot of current context, skill runs once and returns a report. `background` = persistent agent that can be checked in on. For a code review you want `fork` — you do not want the review session to pollute or extend the main conversation.

**4. Putting the actual credential in `.mcp.json`.**
The `env` block is for **references** to environment variables, not for values. Use `"${DB_CONNECTION_STRING}"` and ensure the real value is set in your shell or a `.env` file that is gitignored. Committing a live connection string is a security incident and an automatic exam-question wrong-answer for the credential-handling concept.
