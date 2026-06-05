# SOLUTION-NOTES.md — LibraryLens MCP Server

> Architecture discussion only — not a full implementation. Read this after attempting each milestone, not before.

---

## Key Design Decisions

### Decision 1: search_catalog is a tool, not a resource

**Decision:** `search_catalog` is registered as a tool even though it reads data.

**Rationale:** Tools accept arbitrary input parameters and can (in principle) have side effects. Resources are passively addressable by URI with no dynamic input beyond the URI itself. A search requires a `query` string and optional filters — that is dynamic parameterized input, which belongs in tool space. The MCP spec draws the line at "can you address it with a URI alone?" Resources: yes. Tools: no.

**The exam tradeoff:** The distractor answer will say "searches are read-only so they should be resources." That reasoning is partially correct (no side effects) but incomplete. The deciding factor is URI addressability, not side-effect presence. A resource that somehow accepted a query body would violate the resource model.

---

### Decision 2: Empty search result is a successful tool response

**Decision:** Zero search results return `{ "results": [], "total": 0 }` with no error fields.

**Rationale:** The tool executed correctly. It searched the catalog and found nothing. That is a valid, complete outcome. Setting `isError: true` would tell the orchestrator that the tool itself malfunctioned — triggering retries, escalations, or fallback behavior that is entirely unwarranted. The distinction matters most in agentic loops: an agent that mistakes "no results" for "tool broke" will retry the same search repeatedly instead of telling the user nothing was found.

**The exam tradeoff:** Empty array vs `isError: true` is the most commonly tested nuance in Tool Design. The rule is: `isError` signals tool malfunction, not business-logic outcomes. "No items found" is a business outcome.

---

### Decision 3: isRetryable reflects causal permanence, not HTTP convention

**Decision:** NOT_FOUND and ACCESS_DENIED → `isRetryable: false`. RATE_LIMITED → `isRetryable: true`.

**Rationale:** `isRetryable` answers: "will sending the same request again, after some delay, succeed?" For NOT_FOUND: the item either exists or it does not — time does not create it. For ACCESS_DENIED: a patron's suspension status does not resolve by itself between requests. For RATE_LIMITED: the rate window will reset, so the same request will eventually succeed. This is the sole variable that determines `isRetryable`.

**The exam tradeoff:** A common wrong answer sets `isRetryable: true` for ACCESS_DENIED on the grounds that "the patron's status might change." That is technically possible but it is not the right frame — `isRetryable` is about the current request, not speculative future state. Another wrong answer sets `isRetryable: false` for RATE_LIMITED because "the client should back off." Backing off and retrying are not mutually exclusive; the client should back off AND retry.

---

### Decision 4: .mcp.json in project root, not ~/.claude.json

**Decision:** Server config goes in `.mcp.json` committed to the repository.

**Rationale:** `.mcp.json` in the project root is project-scoped: it applies to all Claude Code sessions opened in that directory and is version-controlled alongside the code. `~/.claude.json` is user-scoped and global: it applies to every project for that user and is never committed. The right choice depends on whether the MCP server is project-specific (it is here) or a personal utility.

**The exam tradeoff:** The exam tests whether you know which file controls which scope. Project-specific servers belong in `.mcp.json`. Personal utilities (your own shell tools, custom formatters) belong in `~/.claude.json`. Putting a project server in `~/.claude.json` means it exists for that developer only — a new team member cloning the repo would not get it.

---

### Decision 5: Resource errors use protocol-level signaling, not the tool error shape

**Decision:** When `catalog://items/{id}` cannot find an item, it returns an MCP resource error through the SDK's resource-error channel, not `{ isError: true, errorCategory: "NOT_FOUND" }`.

**Rationale:** The `isError` + `errorCategory` + `isRetryable` shape is defined for tool call responses. Resource reads are a different protocol interaction — the SDK has its own mechanism for signaling that a resource URI could not be resolved. Mixing the two shapes would make the server's behavior harder to reason about and would not match what Claude Code expects from each component type.

**The exam tradeoff:** The temptation is to reuse the tool error shape everywhere for consistency. Resist it. The MCP spec distinguishes tool errors (business logic, returned in the tool result body) from resource errors (protocol level, returned as a resource access failure).

---

## What a Strong Solution Looks Like

- The catalog store module is completely separate from the MCP registration code. It can be tested independently with no MCP SDK involved.
- Error construction is centralized in one place (e.g., an `errors.js` module with factory functions). No inline `{ isError: true, errorCategory: ... }` literals scattered across handlers.
- The rate-limit counter is encapsulated — the `search_catalog` handler does not manage timing logic directly; it calls a rate limiter module and checks the result.
- `.mcp.json` uses `${LIBRARYLENS_API_TOKEN}` exactly, the server reads `process.env.LIBRARYLENS_API_TOKEN` at startup, and a `.env.example` file (with a fake placeholder) is committed alongside `.gitignore` so new contributors know what variable to set.
- The `isRetryable` field is present on all error responses, not only on RATE_LIMITED. Some implementations only add it to retryable errors; the orchestrator is better served by always having the field present (even when `false`) so it does not need to handle "field absent" as a case.

---

## Common Mistakes and Fixes

**Mistake:** Handler returns `{ isError: true }` when search yields 0 results.
**Fix:** Check whether the results array is empty after filtering. If it is, return `{ results: [], total: 0 }` and exit the handler normally. Reserve `isError` for cases where the tool itself cannot execute (rate limit exceeded, upstream down, etc.).

**Mistake:** `isRetryable: true` on ACCESS_DENIED because "privileges could be granted."
**Fix:** `isRetryable` answers whether the current request will succeed on a retry, not whether the world could theoretically change. It should be `false`.

**Mistake:** Registering `catalog://items/available` as a tool with no parameters.
**Fix:** A tool with no parameters that only reads data is almost certainly a resource. Register it using the SDK's resource registration API with the `catalog://` URI.

**Mistake:** `.mcp.json` contains the literal API token string.
**Fix:** Replace the literal value with `"${LIBRARYLENS_API_TOKEN}"`. Move the real value to `.env`. Add `.env` to `.gitignore`. The substitution happens at runtime, not at config parse time.

**Mistake:** Server crashes if `LIBRARYLENS_API_TOKEN` is not set.
**Fix:** Read the env var at startup, log a warning if missing (`console.warn` or Python `logging.warning`), and continue. The token is for a future real API integration; this lab does not make real API calls.

---

## Connection to Exam Concepts

This lab is a direct implementation exercise for Domain 2 (Tool Design & MCP Integration, 18%). Every milestone maps to a specific exam question pattern:

| Exam question pattern | Milestone that trains it |
|---|---|
| "Which component type should expose X?" (tool vs resource) | M1, M3 |
| "What is the correct response shape for 0 search results?" | M1 |
| "Which of these error categories has isRetryable: true?" | M2, M4 |
| "Where should a project-specific MCP server be configured?" | M4 |
| "What is wrong with storing the API token directly in .mcp.json?" | M4 |
| "What is the correct error shape for a missing item in a tool?" | M2 |
| "How do resource errors differ from tool errors?" | M3 |

The deeper principle running through all milestones: **MCP design is about making the orchestrator's job unambiguous.** Every field in every response — `isError`, `errorCategory`, `isRetryable` — exists so the agent loop can make a deterministic decision without reasoning about the raw content of an error message. When you design an MCP server, ask: "can the orchestrator act on this response mechanically, without understanding natural language?" If yes, the response shape is correct.
