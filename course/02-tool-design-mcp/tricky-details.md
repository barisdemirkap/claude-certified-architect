# Tricky Details — Tool Design & MCP Integration

These small distinctions decide pass/fail.

---

### Tool description is the PRIMARY selector — fix overlapping descriptions, not the schema

**Trap:** When Claude picks the wrong tool, the first fix attempted is changing the input_schema — adding more specific parameter types, renaming fields, or tightening required fields.

**Reality:** Claude selects tools based on the description field, not the schema. The schema only validates the *structure* of the call after a tool has already been chosen. Overlapping descriptions create semantic ambiguity that no schema change can resolve. The fix is to rewrite descriptions to make each tool's purpose distinct, or rename tools so their names themselves signal different roles.

**Tell:** "Claude keeps calling `search_database` when it should call `search_catalog`" — the two descriptions are too similar. The correct answer will be: rewrite the descriptions (and possibly rename the tools) to eliminate overlap. Any answer option that involves schema changes is a distractor.

---

### timeout ≠ "0 results" — they require different handling

**Trap:** Treating a tool timeout (the server didn't respond) the same as a search that returned an empty result set.

**Reality:** A timeout is a system failure — the tool may not have executed at all; retrying is appropriate. A "0 results" response means the tool ran successfully and found nothing matching the query; retrying will produce the same empty result. These are different root causes and require different code paths: timeout → retry with backoff; empty result → return empty response immediately.

**Tell:** "How should the agent handle it when the search returns nothing?" — before answering, determine whether "nothing" means a timeout or a valid empty result. If the question conflates the two, look for the answer option that draws the distinction. An answer that retries on empty results is wrong; an answer that gives up on a timeout without retry is also wrong.

---

### `.mcp.json` (project/VCS) vs `~/.claude.json` (user/personal)

**Trap:** Putting a developer's personal API key as a literal string value in `.mcp.json` and committing it to the repository, on the grounds that the whole team needs the integration.

**Reality:** `.mcp.json` is the right file for team configuration and should be committed to VCS — but it must never contain literal credential values. Credentials belong in environment variables. The config file references them by name using `${GITHUB_TOKEN}` substitution syntax. `~/.claude.json` holds personal or experimental server configs and is never committed.

**Tell:** "Where should the shared MCP server config live for the whole team?" → `.mcp.json`. "Where should a developer's personal auth token go?" → environment variable, with the config referencing it by name. Any answer that puts a literal token value in a committed config file is wrong.

---

### Which error categories are retryable — and which are not

**Trap:** Writing agent logic that automatically retries on any `isError: true` response, or conversely, never retrying because "the tool failed."

**Reality:** Retryability is declared per-error by the tool itself via the `isRetryable` boolean. `RATE_LIMITED` → `isRetryable: true`, retry after delay. `INTERNAL_ERROR` → `isRetryable: true`, retry. `NOT_FOUND` → `isRetryable: false`, the item doesn't exist; retrying will return the same error. `ACCESS_DENIED` → `isRetryable: false`, fix permissions first. `INVALID_PARAMS` → `isRetryable: false`, the request is malformed; fix the input before retrying.

**Tell:** "Which of these error types should trigger automatic retry?" → the correct answer includes `RATE_LIMITED` and possibly `INTERNAL_ERROR`, but not `ACCESS_DENIED`, `NOT_FOUND`, or `INVALID_PARAMS`. Any answer option that retries all errors uniformly is wrong.

---

### 4–5 tools beats 18 tools for reliability

**Trap:** Assuming that giving an agent access to more tools makes it more capable and reliable — since it has more options available.

**Reality:** More tools per context means more candidates the model must discriminate between. Reliability consistently peaks at 4–5 well-defined, non-overlapping tools. Above ~8 tools, selection errors increase noticeably. When an agent with many tools keeps picking the wrong ones, the correct fix is tool consolidation — merging overlapping tools, removing irrelevant ones, or scoping each subagent's toolset to only what its role requires. Better prompting is not the fix for a tool proliferation problem.

**Tell:** "This agent has 18 tools and keeps picking wrong ones" — the distractor answers will suggest improving the system prompt or adding examples. The correct answer is tool consolidation. Any answer that adds more tools or improves prompting without reducing the tool count is wrong.

---

### MCP resources are read-only — they are not tools with a read action

**Trap:** Modeling all data access as tools — for example, creating a `read_schema` tool that executes a query to fetch the database schema when the agent needs it.

**Reality:** MCP has a distinct primitive for read-only data: resources. Resources are not callable like tools; they are data the agent can request as context. Exposing the database schema as a resource (not a tool) communicates clearly that no side effects are possible, and it allows the agent to load the schema as context before taking any actions. Using a tool for purely read-only data access is a design smell.

**Tell:** "The agent needs to understand the database schema before writing queries. How should this be exposed?" → as an MCP resource, not a tool. An answer that uses a `get_schema` tool is plausible but misses the distinction the exam is testing.
