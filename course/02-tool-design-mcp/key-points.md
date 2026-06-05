# Key Points — Tool Design & MCP Integration

The most important parts. Review this file before the exam.

---

**If Claude keeps calling the wrong tool → rewrite the tool descriptions to eliminate semantic overlap**, because the description is the primary selection signal; the input_schema plays no role in which tool gets chosen.

**If you need Claude to always return structured output but don't care which tool it uses → set `tool_choice: "any"`**, because `any` forces a tool call without specifying which one, guaranteeing structured output regardless of which path the model takes.

**If you need a specific tool to run first (execution order matters) → use forced `tool_choice: {"type": "tool", "name": "X"}`**, because `auto` and `any` both give the model discretion over which tool to call.

**If a developer needs to share MCP server config with the whole team → put it in `.mcp.json` at the project root and commit it to VCS**, because `.mcp.json` is the project-scoped config designed for team sharing; `~/.claude.json` is personal and never committed.

**If credentials or API tokens must be included in MCP config → store them in environment variables and reference them as `${VAR_NAME}` in the config file**, because committing literal token values to `.mcp.json` exposes them to anyone who clones the repo.

**If a tool call returns `isRetryable: false` → do not retry automatically**, because fields like `NOT_FOUND`, `ACCESS_DENIED`, and `INVALID_PARAMS` have `isRetryable: false`; retrying cannot resolve the underlying problem.

**If a tool call returns `RATE_LIMITED` or `INTERNAL_ERROR` → retry after an appropriate delay**, because these are transient conditions where the same request may succeed on a subsequent attempt.

**If an agent with many tools frequently misroutes calls → consolidate tools down to 4–5 well-defined, non-overlapping tools**, because reliability peaks in the 4–5 range and degrades noticeably above ~8 tools per context.

**If the task requires read access to data without side effects → expose it as an MCP resource, not an MCP tool**, because resources are read-only by contract; tools imply the possibility of actions and side effects.

**If a tool times out → treat it as a transient system failure and consider retry**, because a timeout means the tool may not have executed at all — this is different from a valid empty result set, which should be returned immediately without retry.

**If a general-purpose tool (`fetch_url`) and a constrained alternative (`load_document`) both satisfy the task → use the constrained alternative**, because least privilege limits the model's access surface and reduces risk of unintended access.

**If an MCP tool fails with a generic "Operation failed" message → this is an anti-pattern**, because without `errorCategory` and `isRetryable`, the calling agent cannot determine whether to retry, fix the request, or escalate — structured error metadata is required.
