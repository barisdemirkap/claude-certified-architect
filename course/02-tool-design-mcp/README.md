# Module 02 — Tool Design & MCP Integration

⏱ Estimated time: 5h
Guide ref: guide_en.MD lines 197–304, 446–545, 1607–1675

---

## Learning Objectives

- Design tool schemas with descriptions that eliminate selection ambiguity
- Choose the correct `tool_choice` value (`auto`, `any`, forced) for a given scenario
- Distinguish MCP tools, resources, and prompts by their role and side-effect profile
- Place MCP configuration in the correct file (`.mcp.json` vs `~/.claude.json`) and handle secrets properly
- Implement structured MCP error responses that allow callers to make correct retry decisions

---

## Why This Matters on the Exam

Tool Design & MCP Integration carries 18% of the exam score. Questions in this domain test whether you can read a broken tool design and diagnose the correct fix — almost always a description problem, not a schema problem. The exam routinely presents scenarios where an agent calls the wrong tool, times out, or produces unreliable output, and asks what to change. Knowing that the description is the primary selection signal — not the parameter list — is the single most leveraged insight for this domain.

The MCP section tests configuration placement and error handling. Expect questions that present a scenario where a developer has committed a token to `.mcp.json`, or an agent retries on a `NOT_FOUND` error. The correct answer always follows two principles: secrets belong in environment variables, and retryability is a property that the tool declares, not the caller guesses.

---

## Core Concepts

### 1. Tool Schema Anatomy

A tool definition has three parts: `name`, `description`, and `input_schema`. The name is a short identifier. The input_schema enforces valid JSON structure. The description is the field Claude reads to decide *which* tool to call for a given task.

**Exam rule: The description is the primary selection signal. Overlapping descriptions cause wrong-tool selection. Fix the description — not the schema.**

A strong description answers four questions: what does this tool do, what does it return, when should I prefer it over similar tools, and what are the input constraints and formats? A weak description ("Gets customer info") leaves Claude to guess when multiple tools have overlapping purposes. If `search_database` and `search_catalog` have near-identical descriptions, Claude will misroute calls regardless of how precisely the schemas are written.

When built-in Claude Code tools (Read, Grep) and MCP tools serve similar purposes, Claude may prefer the built-in tools by default. To prevent this, strengthen the MCP tool description to highlight concrete advantages: unique data, system-specific context, or capabilities the built-in tools cannot provide.

### 2. The `tool_choice` Parameter

`tool_choice` controls how Claude interacts with the tools provided in a request. There are three distinct values with different guarantees.

`{"type": "auto"}` is the default. Claude decides whether to call a tool or respond in plain text. Use this when the model should exercise judgment — for example, answering simple questions from context without forcing a lookup.

`{"type": "any"}` forces Claude to call *some* tool, but lets it pick which one. **Exam rule: Use `any` when you need guaranteed structured output but are indifferent about which tool produces it.** This is the correct choice when you have multiple extraction tools and want to ensure a structured result regardless of which path the model takes.

`{"type": "tool", "name": "X"}` forces Claude to call a specific named tool. Use this when execution order matters — for example, requiring `validate_input` to run before any downstream enrichment step. Forced selection removes model discretion entirely for that turn.

### 3. MCP Architecture — Tools, Resources, and Prompts

MCP defines three primitive types. They differ fundamentally in whether they have side effects and how they deliver content to the agent.

**Tools** are callable functions that can take actions: create records, call APIs, write files, execute queries. They may have side effects. **Resources** are read-only data sources — content catalogs, database schemas, documentation indexes — that provide context without taking action. **Prompts** are reusable template definitions that structure how Claude approaches a recurring task type.

**Exam rule: Tools can have side effects; resources cannot. If the question asks about exposing data for the agent to read without acting, the answer is a resource, not a tool.**

Resources solve a practical problem: without them, an agent must make exploratory tool calls to discover what data exists before it can query that data. A resource that exposes a content catalog or schema gives the agent an immediate map, reducing round-trips and token cost.

When multiple MCP servers are connected, all of their tools are discovered automatically and are available simultaneously. This is precisely why description quality matters: the model must pick from a combined pool of tools across all servers.

### 4. MCP Configuration Files

Two configuration scopes exist. **`.mcp.json`** lives at the project root and is committed to version control. It configures servers that all team members share. **`~/.claude.json`** lives in the user's home directory and is never committed — it holds personal or experimental server configurations.

**Exam rule: Credentials and API tokens never appear as literal values in either config file. Secrets are stored in environment variables, and the config file references the variable name using `${VAR_NAME}` substitution.**

A `.mcp.json` that contains a literal `GITHUB_TOKEN: "ghp_abc123"` is an anti-pattern that exposes the credential to everyone who clones the repository. The correct pattern stores the token in the environment and references it as `"GITHUB_TOKEN": "${GITHUB_TOKEN}"`. The config file can be committed safely because it contains only the variable name.

For standard integrations (GitHub, Jira, Slack), prefer existing community MCP servers over building custom ones. Build custom servers only for workflows that are unique to your team and have no community equivalent.

### 5. MCP Structured Errors

When an MCP tool fails, it must return `isError: true` in the response. A generic error message ("Operation failed") is an anti-pattern because it gives the calling agent no information to make a recovery decision. A structured error provides three fields the caller needs: `errorCategory`, `isRetryable`, and a human-readable `message`.

**Exam rule: `isRetryable` is a boolean the tool declares. The caller should not guess retryability from the error message — it reads this field.**

Error categories and their retryability: `RATE_LIMITED` and `INTERNAL_ERROR` are retryable — pause and retry. `NOT_FOUND` is not retryable — the item does not exist, retrying will not help. `ACCESS_DENIED` is not retryable — fix permissions first. `INVALID_PARAMS` is not retryable — the request is malformed, fix the input.

Subagents should handle transient (retryable) failures locally. Only errors they cannot resolve should propagate to the orchestrator.

### 6. Least Privilege for Tools

Least privilege means giving the model access to only what the current task requires — not a superset "just in case." A general-purpose tool like `fetch_url` allows arbitrary URL access. A constrained alternative like `load_document` restricts access to known file paths.

**Exam rule: When a constrained tool exists that covers the task, prefer it over the general-purpose alternative.**

This matters because broad tool access increases the attack surface for prompt injection and accidental data exfiltration. If a customer-support agent only needs to look up order status, it should not also have write access to order records or access to internal admin endpoints.

### 7. Tool Count and Reliability

Reliability peaks when an agent has 4–5 well-defined, non-overlapping tools. Adding tools beyond this range increases selection ambiguity: with 18 tools in context, the model must discriminate among many candidates, and the probability of misrouting rises noticeably.

**Exam rule: When an agent with many tools picks the wrong tool repeatedly, the fix is tool consolidation — not better prompting.**

Consolidation strategies: merge tools that serve overlapping purposes into one tool with a parameter controlling the variant; split a large general tool into specialized tools with narrow, distinct descriptions; remove tools that are not relevant to the agent's current role. Scope each subagent's toolset to what its role actually requires.

### 8. Error Type Distinction — Timeout vs Empty Result

A tool timeout is a system failure: the server did not respond in time. The tool may not have executed at all. An empty result set is a successful execution that found nothing matching the query. These are different situations with different correct responses.

**Exam rule: Timeout → retry may help (system problem). "0 results" → retry will not help (nothing matched). Do not conflate them.**

In code, these require different branches: a timeout should increment a retry counter and potentially back off; an empty result should be returned as a valid (empty) response immediately. Treating an empty result as a transient failure and retrying wastes tokens and time.

---

## Mental Model

Think of tool design as air traffic control: the description is the radio frequency a plane listens on, and two planes on the same frequency create a collision. The `tool_choice` parameter is the tower's discretion dial — `auto` lets planes navigate freely, `any` guarantees a landing without specifying the runway, and forced selection assigns a specific runway. MCP configuration is about jurisdiction: `.mcp.json` is the shared team airspace (committed, public), while `~/.claude.json` is each controller's personal notepad (never shared). Secrets are kept in a separate secure vault and referenced by name, never written on the shared whiteboard.

---

## What's Next

Module 03 — Claude Code Config & Workflows (20% exam weight). That module covers `CLAUDE.md` configuration, Claude Code hooks, slash commands, and CI/CD integration — building directly on the tool and MCP concepts covered here.
