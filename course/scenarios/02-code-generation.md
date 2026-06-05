# Scenario 2: Code Generation with Claude Code

## Overview

An engineering team uses Claude Code as an AI pair programmer across a large TypeScript monorepo. Claude Code assists with feature implementation, refactoring, test generation, and code review. The stakes include production correctness (bad code ships), developer trust (bad suggestions erode adoption), and codebase consistency (deviating from established patterns creates technical debt).

## Architecture

**Components:**
- Claude Code installed in the monorepo root and in individual package directories
- CLAUDE.md files at the repo root and in specific packages (hierarchy)
- `.claude/rules/` directory for language-specific conventions (TypeScript style, test patterns)
- Custom skills defined for recurring workflows (e.g., `/new-feature`, `/add-tests`)
- Planning mode enabled for high-risk operations (large refactors, schema migrations)
- `@path` imports used in CLAUDE.md to reference external files without inlining them
- `context:fork` in skill definitions to isolate each skill invocation

**Data Flows:**
1. Developer invokes Claude Code in a package directory
2. Claude Code reads CLAUDE.md files bottom-up: package-level → repo-level
3. Package-level CLAUDE.md overrides repo-level instructions where they conflict
4. For a `/refactor` skill, `context:fork` creates an isolated context so the skill does not inherit stale conversation state
5. For a risky refactor, planning mode is triggered: Claude Code outputs a plan first and waits for approval before executing
6. Code changes are made via Edit/Write tools; rules in `.claude/rules/` constrain style

**CLAUDE.md Hierarchy:**

```
/monorepo/
  CLAUDE.md              <- repo-wide conventions (TypeScript, testing, PR format)
  packages/
    auth/
      CLAUDE.md          <- auth-specific rules (never log PII, use internal crypto lib)
    payments/
      CLAUDE.md          <- payments-specific rules (PCI scope, no raw card data in logs)
```

## Domain Connections

| Domain | Key Concepts from This Scenario |
|---|---|
| D3 — Claude Code Config & Workflows | CLAUDE.md hierarchy; planning mode; skills with context:fork; @path imports; .claude/rules/ |
| D1 — Agent Architecture & Orchestration | When Claude Code acts as an agent (multi-step execution) vs. a single-turn assistant |
| D4 — Prompt Engineering & Structured Output | How CLAUDE.md instructions function as persistent prompt context; @path as lazy reference |
| D2 — Tool Design & MCP Integration | Built-in tool use (Read, Write, Edit, Bash, Grep) within Claude Code workflows |

## Key Design Decisions

**1. CLAUDE.md hierarchy and override precedence**
CLAUDE.md files are read from the invocation directory upward. A package-level CLAUDE.md can override repo-level instructions. This matters for security-sensitive packages: the `payments/CLAUDE.md` can say "never log card numbers" and that instruction takes precedence over any repo-level logging convention. The exam tests override direction (child overrides parent, not the other way) and what happens when there is no package-level file.

**2. Planning mode for risky refactors**
When a developer asks Claude Code to refactor a critical module, planning mode forces Claude Code to output a structured plan (list of files to change, rationale, risks) and pause for human approval before executing. This is the human-in-the-loop checkpoint for high-consequence actions. The exam tests when to enable planning mode (irreversible or large-scope changes) vs. when it adds unnecessary friction (small, safe edits).

**3. Skills with context:fork**
A skill like `/add-tests` should start fresh — it should not inherit context from a prior debugging session that might pollute its instructions or token budget. `context:fork` creates a new context branch for the skill invocation. The exam tests knowing that `context:fork` isolates skills, and that without it, skill behavior can be non-deterministic based on prior conversation state.

**4. @path imports in CLAUDE.md**
Instead of inlining a 200-line TypeScript style guide into CLAUDE.md, use `@path/to/style-guide.md`. This keeps CLAUDE.md readable, avoids token waste when the referenced content is not needed, and allows the style guide to be maintained independently. The exam tests knowing that @path is a lazy reference (loaded on demand) vs. inlined content (always in context).

**5. .claude/rules/ for language conventions**
Language-specific rules (e.g., "prefer `const` over `let`", "use `zod` for runtime validation") belong in `.claude/rules/` rather than in CLAUDE.md prose. This separates machine-actionable constraints from human-readable guidance. The exam may test the distinction, but the key point is that rules in this directory are enforced as constraints, not suggestions.

## Typical Exam Question Patterns

**Pattern 1 — CLAUDE.md override direction:**
"A monorepo has a root CLAUDE.md that allows console.log statements. The `auth` package has a CLAUDE.md that forbids logging PII. When Claude Code works in the `auth` package, which instruction takes precedence?" — The correct answer is the package-level (child) CLAUDE.md, which overrides the parent.

**Pattern 2 — When to use planning mode:**
"A developer asks Claude Code to rename a widely-used internal function across 47 files. What configuration should be in place to prevent unreviewed bulk changes?" — The correct answer is planning mode, which pauses execution after the plan is generated and requires explicit approval.

**Pattern 3 — context:fork purpose:**
"A skill that generates unit tests is producing tests that reference variables from a previous debugging conversation. What is the most likely cause?" — The correct answer is the skill was defined without `context:fork`, so it inherits the parent conversation context.

## Common Mistakes

- **Confusing override direction.** Candidates sometimes think the root CLAUDE.md takes precedence because it is "higher." The actual behavior is child overrides parent — the more specific context wins.
- **Using planning mode for every task.** Planning mode is for high-risk, irreversible, or large-scope actions. Using it for every edit adds friction without safety benefit and degrades the developer experience.
- **Treating @path as inline content.** @path is a lazy reference — the content is not automatically included in every context. Candidates sometimes expect @path content to always be present, but it is loaded when referenced.
- **Skipping context:fork for skills.** Without `context:fork`, a skill run after a long debugging session inherits that session's context. The skill may behave correctly in isolation but fail in practice due to context pollution.

## Cross-Reference

| Concept | Module | Lab |
|---|---|---|
| CLAUDE.md hierarchy and syntax | D3 — Claude Code Config | Lab 3 |
| Planning mode configuration | D3 — Claude Code Config | Lab 3 |
| Skills and context:fork | D3 — Claude Code Config | Lab 3 |
| @path imports | D3 — Claude Code Config | — |
| Human-in-the-loop checkpoints | D1 — Agent Architecture | — |
