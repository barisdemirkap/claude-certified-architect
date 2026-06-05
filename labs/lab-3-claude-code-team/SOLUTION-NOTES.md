# Lab 3 Solution Notes — Claude Code Team Configuration

> Architecture discussion only — not a full implementation.

---

## Key Design Decisions

### Decision 1: Project CLAUDE.md vs Subdirectory CLAUDE.md for Area-Specific Context

**Decision:** Area-specific rules for `src/api/` and `src/payments/` go into rules files with `paths:` frontmatter, not into subdirectory CLAUDE.md files.

**Rationale:** A `CLAUDE.md` placed in `src/payments/` would load whenever Claude Code is operating anywhere within that directory, including read-only exploration. A rules file with `paths: ["src/payments/**"]` loads only when the files being actively edited match that glob. This is more precise: it fires on edit intent, not on navigation.

**The exam tradeoff:** If a rule is unconditional ("always tell Claude that Stripe SDK is available regardless of what it's editing"), use a subdirectory CLAUDE.md. If a rule is conditional ("only apply PCI caution when modifying payments code"), use a rules file with paths. The wrong choice inflates context on unrelated tasks and wastes context window.

---

### Decision 2: context:fork for the Review Skill

**Decision:** The `/review` skill uses `context: fork`, not `context: background` or no context qualifier.

**Rationale:** Fork creates an isolated snapshot of the current context, runs the skill to completion, and surfaces the output — without extending or polluting the main conversation. This matches the semantics of a code review: you want a self-contained report, not an ongoing dialogue that becomes part of the session state.

**The exam tradeoff:**

| context value | Use when |
|---|---|
| `fork` | One-shot task, output is a report or artifact, should not affect main session |
| `background` | Long-running task that runs alongside the main session, checked in on later |
| (omitted) | Skill runs inline in the main conversation, extending its context |

A review skill that inadvertently uses background would keep a "review agent" alive that the user cannot easily dismiss. A skill with no context qualifier would append all the review output into the main conversation, making it harder to continue working. Fork is the precise tool.

---

### Decision 3: allowed-tools Restriction on the Review Skill

**Decision:** Restrict the review skill to `[Read, Grep]` only.

**Rationale:** A code review skill that can write files or execute shell commands is a footgun. The restriction is a defense-in-depth measure: even if the skill prompt is manipulated or ambiguous, the toolset boundary prevents side effects. This aligns with the principle of least privilege at the tool level.

**The exam tradeoff:** Overly restrictive allowed-tools can make a skill useless — a deploy-check skill that cannot run `Bash` cannot execute `npm run lint`. Match the allowed-tools list to the minimum required to accomplish the skill's purpose, and no more.

---

### Decision 4: .mcp.json at the Repo Root with Env-Var Credential Pattern

**Decision:** `.mcp.json` is committed to version control; credentials appear only as `"${VAR_NAME}"` references in the `env` block.

**Rationale:** The manifest (server name, package, command structure) is team configuration and belongs in version control. The credential is a secret and belongs in the developer's local environment (shell profile, `.env` file that is gitignored, or a secrets manager). The `${VAR_NAME}` syntax in the env block is resolved at session startup from the host environment — the file itself never contains a live value.

**The exam tradeoff:** Some teams put `.mcp.json` in `.gitignore` because they are uncomfortable with any credential-adjacent file in version control. This trades security hygiene for team consistency — every developer must now manually configure the same servers. The better pattern is to commit the manifest, gitignore `.env`, and use env-var references. The file is safe to commit because it contains no secrets.

---

## What a Strong Solution Looks Like

**M1 — CLAUDE.md:**
A strong CLAUDE.md passes the "new hire on day one" test. It reads like a document written by an experienced team member for a peer, not like a config file. The payments and auth sections use explicit language ("this is PCI-scope code; every change requires a second human review") rather than vague language ("be careful with payments"). The env var section names the specific variables and says exactly where they come from.

**M2 — Rules files:**
A strong rules file has tight, actionable rules — not a philosophy. "Never use floating-point for monetary amounts; use integer cents" is actionable. "Be careful with money" is not. The payments rules file front-loads the most critical constraint (no secrets in code) and the PCI scope statement. Both files have syntactically valid frontmatter with the correct `paths:` glob.

**M3 — Review skill:**
A strong review skill prompt is specific about the output format. It names the sections, defines what "critical" vs "warning" vs "suggestion" means in context, and explicitly says "you cannot make changes — only report." The frontmatter is exact: `context: fork`, `allowed-tools: [Read, Grep]`, and `argument-hint` that tells users what to pass.

**M4 — .mcp.json:**
A strong .mcp.json is valid JSON with no trailing commas or comments. The env block references `DB_CONNECTION_STRING` by name; the value is `"${DB_CONNECTION_STRING}"`. The server name (`db-introspect`) is lowercase-hyphen, matching npm/CLI conventions. The `-y` flag in args prevents interactive prompts when npx downloads the package.

---

## Common Mistakes and Fixes

**Mistake: Writing `paths: "src/api/**"` (string) instead of `paths: ["src/api/**"]` (array)**
Fix: The `paths:` value must be a YAML sequence. Even a single glob must be in list form.

**Mistake: Putting the CLAUDE.md "extra care" sections as a one-liner**
Example of weak content: "Be careful with payments code."
Fix: "This directory is in PCI DSS scope. Any change to `src/payments/` requires a second human review before merge. Never compute, modify, or display payment amounts as floating-point values. Use integer cents throughout."

**Mistake: Using `context: background` on the review skill because "it needs time to run"**
Fix: Duration is not the distinction. Background is for persistent parallel agents. A review that takes 30 seconds is still a one-shot task — use fork.

**Mistake: Writing `"DB_CONNECTION_STRING": "postgres://user:pass@host/db"` in .mcp.json**
Fix: `"DB_CONNECTION_STRING": "${DB_CONNECTION_STRING}"`. The actual value lives in the developer's shell environment.

**Mistake: No `---` closing delimiter on frontmatter**
Fix: Both the opening and closing `---` are required. Without the closing delimiter, the parser treats all file content as frontmatter and loads no instructions.

---

## Connection to Exam Concepts

**The 3-level hierarchy on the exam:**
Questions will present a scenario and ask where a given instruction should live. Use this decision tree:
1. Does every developer on every task need this? → `.claude/CLAUDE.md`
2. Does this apply only when editing a specific subtree? → rules file with `paths:` frontmatter in that subtree
3. Is this something the user invokes on demand? → skill

**The paths glob question type:**
Expect a question that gives you a file path (`src/payments/webhooks.js`) and asks which rules files would be loaded. Trace each rules file's `paths:` glob against the given path. Only exact matches (with glob expansion) load.

**The context:fork question type:**
Expect a question describing a skill that "should produce a self-contained report without affecting the main session." The answer is `context: fork`. Distractors will include `background` (persistent agent) and the absence of a context key (inline, pollutes main context).

**The MCP credential pattern question type:**
Expect a question asking how to share an MCP server configuration with a team without exposing the database password. The answer is: commit `.mcp.json` with `"${ENV_VAR}"` syntax in the env block; each developer sets the real value locally. Distractors will include storing encrypted values in the file, using a separate `.env.mcp` file not mentioned in docs, or putting the server in `.gitignore`.
