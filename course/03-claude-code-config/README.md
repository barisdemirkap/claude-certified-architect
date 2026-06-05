# Module 03 — Claude Code Configuration & Workflows
⏱ Estimated time: 6h
Guide ref: guide_en.MD lines 547–799, 1678–1761

## Learning Objectives

- Identify which CLAUDE.md level (user, project, directory) is correct for a given piece of configuration
- Explain when `.claude/rules/` files load versus when they are silently skipped
- Configure a Skill's frontmatter fields (`context`, `allowed-tools`, `argument-hint`) for a given use case
- Choose planning mode or direct execution based on task complexity and risk
- Write the correct CLI command to run Claude Code in a non-interactive CI/CD pipeline

## Why This Matters on the Exam

Domain 3 carries 20% of the exam weight, making it the joint-highest domain alongside Prompt Engineering. The exam tests configuration decisions through realistic scenario questions — a new team member not receiving project conventions, a rules file silently failing to load, a CI pipeline hanging because the wrong flag was used. These are not abstract knowledge questions; they require you to trace cause from symptom to root configuration error.

The scenarios most likely to surface Domain 3 content are Code Gen with Claude Code (scenario 2), Claude Code CI/CD (scenario 5), and Developer Productivity (scenario 4). In each of these, the examiner is checking whether you know the precise loading model: what loads always, what loads conditionally, and what loads only on demand. Getting this model wrong in a scenario question cascades into wrong answers on sub-questions.

## Core Concepts

### 1. CLAUDE.md Three-Level Hierarchy

Claude Code loads instructions from up to three distinct levels simultaneously. The user level (`~/.claude/CLAUDE.md`) applies globally to one developer and is never committed to version control. The project level (`.claude/CLAUDE.md`, or a `CLAUDE.md` at the repo root) is committed and applies to every contributor. The directory level (`CLAUDE.md` placed anywhere in the source tree) applies when Claude is working on files inside that subtree.

These three levels are additive, not exclusive. All three load at once during a session. When there is a conflict — the user level says one thing, the project level says another — the more specific (lower) level wins for that conflicting rule only. Nothing is silently dropped; the hierarchy is a layered composition, not a waterfall replacement.

**Exam rule: a configuration item belongs at the level whose audience it serves. Ask "who needs this?" — one developer (user), the whole team (project), one part of the codebase (directory).**

The most commonly tested mistake is placing team conventions at user level. A developer who puts repo testing conventions in `~/.claude/CLAUDE.md` keeps them private. No new contributor inherits them. The fix is always to move the item to `.claude/CLAUDE.md` and commit it.

### 2. The "New Teammate" Mental Model

The clearest heuristic for distinguishing user-level from project-level configuration is to imagine a new developer joining the team on their first day. What would you need to tell them about this codebase specifically? How to run tests, what the branch naming convention is, which directories are deprecated, which APIs require extra care — all of this is project-level. It answers questions about the codebase, not about your personal working style.

Contrast this with personal preferences: preferring concise explanations, always getting a summary before a detailed response, disabling certain tool confirmations. These belong at user level because they are about how you interact with Claude, not about the project.

**Exam rule: if a new developer joining the team would need to know it, put it in project-level CLAUDE.md. If it is specific to your personal workflow, put it in user-level CLAUDE.md.**

Directory-level CLAUDE.md fills a third niche: localized context for one part of the codebase. The `payments/` subdirectory might have its own `CLAUDE.md` explaining how the billing domain works, which external APIs it calls, and which compliance rules apply. This is project-relevant knowledge, but scoped narrowly so it does not pollute the global project context.

### 3. `.claude/rules/` — Conditional Loading by File Path

The `.claude/rules/` directory holds rule files that are organized by topic rather than by directory. Each file can include a YAML frontmatter block with a `paths` key listing glob patterns. When Claude is about to edit a file, it checks every rules file; a rules file with a matching `paths` glob loads into context. A rules file whose glob does not match the current file is silently skipped.

```yaml
---
paths: ["src/api/**/*"]
---

For API files, use async/await with explicit error handling.
Each endpoint must return a standard response wrapper.
```

This conditional loading is a context-efficiency feature. A large codebase might have dozens of convention files — linting rules, testing patterns, migration standards, API contracts. Loading all of them for every edit would waste context window space. The `paths` glob ensures only relevant conventions load.

**Exam rule: `.claude/rules/` files with `paths` frontmatter load ONLY when Claude is editing a file that matches the glob. They are not globally loaded. A rule file with `paths: ["src/api/**/*"]` is invisible when Claude is editing a test file.**

The choice between `.claude/rules/` and a directory-level `CLAUDE.md` depends on where the files you want to govern actually live. If the convention applies to files spread across many directories — all TypeScript files, all migration files, all test files — use `.claude/rules/` with a glob like `**/*.test.ts`. If the convention applies only to one subtree, use a directory-level `CLAUDE.md` inside that subtree. Do not use rules for single-directory context; the added indirection is unnecessary.

### 4. Skills — On-Demand Slash Commands

Skills are reusable prompt templates invoked via a slash command (e.g., `/review`, `/test-gen`). Project skills live in `.claude/skills/` (or `.claude/commands/`), are committed to VCS, and are available to the whole team. Personal skills live in `~/.claude/skills/` and apply only to that developer.

Each skill is defined by a `SKILL.md` file with a YAML frontmatter header and a prompt body:

```yaml
---
context: fork
allowed-tools: ["Read", "Grep", "Glob"]
argument-hint: "Path to the module to analyze"
---

Analyze the specified module and produce a dependency report.
```

The three frontmatter fields have distinct effects. `context: fork` runs the skill in an isolated subagent — the skill's verbose intermediate output does not appear in the main conversation, and only a final result is returned. `allowed-tools` restricts which Claude Code tools the skill may call; this is a security and scoping mechanism. `argument-hint` is a UI hint shown when a developer invokes the slash command without arguments, prompting them to supply required input.

**Exam rule: personal skills override project skills of the same name. A developer's `~/.claude/skills/deploy/SKILL.md` silently replaces the project's `.claude/skills/deploy/SKILL.md` for that developer.**

The loading model for skills is strictly on-demand. A skill's prompt is not injected into context at session start. It is loaded only when the developer types the slash command. This is the opposite of CLAUDE.md, which always loads at session start regardless of what task is being done.

### 5. `context: fork` — Isolation vs Interactivity

The `context: fork` frontmatter creates an isolated subagent session for the skill. The skill runs separately, produces its output, and returns a summary to the main session. This is ideal for self-contained read-only tasks: code review reports, readiness assessments, codebase analysis, documentation generation.

The critical constraint is that a forked skill cannot continue an interactive conversation. If a skill needs the developer to reply — answering quiz questions, providing clarifying input, iterating — `context: fork` breaks that flow. The isolated session ends after producing its output; there is no channel back for user input.

**Exam rule: use `context: fork` for self-contained output (reports, analysis, generation). Omit `context` for interactive skills (quiz, explain, iterative Q&A) where the conversation must continue after the skill runs.**

### 6. Planning Mode vs Direct Execution

Claude Code can approach a task in two ways. In planning mode, Claude reads, searches, and explores the codebase to produce a proposed plan — it does not make any file changes. The developer reviews and approves the plan, then Claude executes it. In direct execution mode, Claude acts immediately on the request.

Planning mode is the right choice when the task is large (dozens of files), when there are multiple plausible approaches and you need Claude to surface them, when architectural consequences are significant, or when you are unfamiliar with the codebase and need to understand before acting. A library migration touching 45+ files, a microservices boundary decision, and a framework refactor all benefit from planning mode.

Direct execution is the right choice when the task is small, unambiguous, and well-understood — a single-file bug fix with a clear stack trace, adding one input validation rule, updating a constant. There is no benefit to a planning round-trip when the action is obvious.

**Exam rule: use planning mode when the task has architectural consequences or multiple viable approaches. Use direct execution when the fix is clear, small, and contained.**

The combined approach handles complex multi-phase tasks: use planning mode (or an Explore subagent) for the discovery and design phase, get developer approval, then switch to direct execution for implementation. The Explore subagent is specifically designed to isolate verbose discovery output so it does not exhaust the main context window.

### 7. CI/CD Integration — The `-p` Flag

Running Claude Code in a non-interactive automated pipeline requires the `-p` (or `--print`) flag. This flag puts Claude Code into non-interactive mode: it processes the prompt, writes output to stdout, and exits. Without this flag, Claude Code waits for user input and the pipeline hangs indefinitely.

```bash
claude -p "Review this PR for security issues" --output-format json --json-schema '{"type":"object",...}'
```

The `--output-format json` flag produces machine-readable output. Combined with `--json-schema`, the output is validated against a schema, making it directly parseable by the pipeline to post inline comments or trigger downstream steps.

**Exam rule: `-p` (or `--print`) is the only documented correct flag for non-interactive CI/CD mode. No environment variable, no `--batch` flag, no other option achieves this correctly.**

An important session isolation principle applies to CI review pipelines: the same Claude session that generated code is less effective at reviewing it because it retains its own reasoning context and is unlikely to challenge its own decisions. Use an independent Claude instance for code review. When re-running after new commits, include the prior review results in context and instruct Claude to report only new or unresolved issues to avoid duplicate comments.

## Mental Model

Think of Claude Code's configuration as three concentric rings, each loaded at a different time. The outermost ring — CLAUDE.md at all three levels — loads always, at session start, before any work begins. The middle ring — `.claude/rules/` files — loads conditionally, file-by-file, matching glob patterns against whatever file Claude is currently editing. The innermost ring — Skills — loads on demand, only when a developer invokes a slash command. Understanding which ring a configuration item belongs to, and when that ring loads, resolves nearly every Domain 3 exam question.

## What's Next

Module 04 covers Prompt Engineering & Structured Output (20% weight). The skills built here — especially understanding how CLAUDE.md provides context to Claude — connect directly to how you write prompts that reliably produce structured results. The discipline of specifying scope and constraints in CLAUDE.md is the same discipline applied to prompt design.
