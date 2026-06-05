# Scenario 4: Developer Productivity Tools

## Overview

An internal platform team builds a suite of AI-powered developer tools using Claude: a documentation search assistant, a code review helper, a log analysis tool, and a dependency audit utility. Each tool is purpose-built for a specific task and runs with constrained permissions. The stakes are developer trust and security: a tool that modifies files when it should only read them, or fetches arbitrary URLs when it only needs to read local docs, creates both correctness and security problems.

## Architecture

**Components:**
- Four separate Claude-powered tools, each with a distinct tool set
- Documentation assistant: `load_document` only (no network access)
- Code review helper: `Read`, `Grep`, `Glob` (read-only file tools)
- Log analysis tool: `Bash` (restricted to read-only log directory) + `Grep`
- Dependency audit utility: `Bash` (restricted to `npm audit` / `pip audit` commands) + `Read`
- Each tool configured with only the tools it needs — no shared permissive tool set

**Least-Privilege Tool Assignment:**

| Tool | Allowed Tools | Explicitly Excluded |
|---|---|---|
| Docs assistant | `load_document` | `fetch_url`, `Write`, `Edit`, `Bash` |
| Code reviewer | `Read`, `Grep`, `Glob` | `Write`, `Edit`, `Bash`, `fetch_url` |
| Log analyzer | `Grep`, `Bash` (read-only path) | `Write`, `Edit`, `fetch_url` |
| Dependency auditor | `Read`, `Bash` (audit commands only) | `Write`, `Edit`, `fetch_url` |

**Data Flows:**
1. Developer invokes a specific tool with a task
2. Tool has access only to its assigned tool set
3. Claude selects from available tools to complete the task
4. If Claude attempts a tool not in the set, the framework rejects the call
5. Output is returned to the developer; no writes occur unless the tool explicitly allows them

## Domain Connections

| Domain | Key Concepts from This Scenario |
|---|---|
| D2 — Tool Design & MCP Integration | Built-in tool selection; least-privilege principle; `load_document` vs `fetch_url` distinction; tool count and reliability |
| D1 — Agent Architecture & Orchestration | Single-agent, single-turn tools vs. agentic loops; knowing when NOT to use an agentic loop |
| D3 — Claude Code Config & Workflows | How Claude Code's built-in tools map to this scenario's tool design patterns |
| D5 — Context Management & Reliability | How limiting tool sets improves output reliability and reduces hallucination surface |

## Key Design Decisions

**1. load_document vs. fetch_url**
The documentation assistant needs to retrieve internal docs stored as local files. The correct tool is `load_document`, not `fetch_url`. Using `fetch_url` would expose the tool to arbitrary network requests — a security risk and an unnecessary capability. The exam tests this distinction heavily: `load_document` is for local/managed content; `fetch_url` is for network retrieval. Giving a tool `fetch_url` when `load_document` suffices violates least privilege.

**2. Least-privilege tool selection**
Each tool receives the minimum set of capabilities required for its function. This is not just a security principle — it is a reliability principle. A model with fewer tools makes fewer incorrect tool selections. The exam tests the reasoning: fewer tools = smaller action space = higher probability of correct behavior.

**3. Read vs. Write access for code review**
The code review helper needs to read files, search content, and list files in directories. It does not need to write anything. Giving it `Write` or `Edit` access — even "just in case" — creates a risk that the model modifies files it should only be reading. The exam tests understanding that "just in case" permissions are a design error.

**4. Bash tool scoping**
When `Bash` is allowed, it should be scoped to specific commands or directories. The log analysis tool's Bash access is restricted to read-only operations on the log directory. The dependency auditor's Bash access is restricted to audit commands (`npm audit`, `pip audit`). Unrestricted Bash is equivalent to giving the model root access — the exam tests knowing this and applying appropriate restrictions.

**5. Tool count and reliability tradeoff**
A tool with 10 available tools has a much larger action space than one with 2. In a single-turn, focused task (e.g., "find all TODO comments in this codebase"), the code review helper with only `Read`, `Grep`, `Glob` will reliably select `Grep`. If it also had `Bash`, `fetch_url`, and `Write`, it might reach for a less appropriate option. The exam tests the inverse relationship between tool count and reliability.

## Typical Exam Question Patterns

**Pattern 1 — load_document vs. fetch_url:**
"A documentation assistant needs to retrieve content from a local knowledge base stored as markdown files on the server. Which tool should it be given?" — The correct answer is `load_document`, not `fetch_url`. `fetch_url` implies network access; `load_document` reads managed local content.

**Pattern 2 — Least privilege in tool assignment:**
"A code review assistant is being configured. A developer suggests adding `Write` access so Claude can auto-fix issues it finds. What is the primary argument against this?" — The correct answer is least privilege: the tool's purpose is review (read), not remediation (write). Adding write access expands the risk surface beyond what the task requires.

**Pattern 3 — Bash scoping:**
"A log analysis tool needs to run `grep` on log files. Should it be given unrestricted `Bash` access?" — The correct answer is no — Bash access should be scoped to read-only operations on the specific log directory, not granted without restriction.

## Common Mistakes

- **Defaulting to fetch_url for any retrieval task.** Candidates reach for `fetch_url` because it sounds like a general retrieval tool. The exam distinguishes local/managed retrieval (`load_document`) from network retrieval (`fetch_url`).
- **Adding tools "just in case."** Extra tools feel helpful during design but hurt reliability and expand the attack surface. The exam rewards minimum viable tool sets.
- **Treating Bash as equivalent to specific tools.** Bash is powerful and general. Specific tools like `Read`, `Grep`, and `Glob` are preferred over Bash for file operations because they are bounded and auditable.
- **Confusing single-turn tools with agents.** Not every Claude-powered feature needs an agentic loop. These four tools are designed as single-turn interactions. Adding an agentic loop would increase complexity without adding value.

## Cross-Reference

| Concept | Module | Lab |
|---|---|---|
| Built-in tool types and selection | D2 — Tool Design & MCP | Lab 2 |
| Least-privilege principle | D2 — Tool Design & MCP | — |
| Tool count and reliability | D2 — Tool Design & MCP | — |
| Single-turn vs. agentic patterns | D1 — Agent Architecture | Lab 1 |
| Bash scoping and permissions | D3 — Claude Code Config | — |
