# CHECKLIST.md — LibraryLens MCP Server

Work through each milestone in order. Do not check a box until you have manually verified the behavior, not just written the code.

---

## Milestone M1 — search_catalog Tool

- [ ] MCP server starts without errors via stdio transport
- [ ] `search_catalog` tool is listed when Claude queries available tools
- [ ] Input schema marks only `query` as required; `subject_filter` and `max_results` are optional
- [ ] Search against a populated catalog returns a list with correct fields (`item_id`, `title`, `author`, `subject`, `available`)
- [ ] `subject_filter` correctly narrows results to matching subject category
- [ ] `max_results` is respected (result list never exceeds the requested count)
- [ ] **Zero-result search returns `{ "results": [], "total": 0 }` — no `isError` field present**
- [ ] Catalog seed data has at least 8 items across at least 3 subject categories

---

## Milestone M2 — reserve_item Tool + Structured Errors

- [ ] `reserve_item` tool is registered with all three required fields (`item_id`, `patron_id`, `duration_days`)
- [ ] Successful reservation returns `reservation_id`, `item_id`, `patron_id`, `due_date`, `status: "confirmed"`
- [ ] `due_date` is calculated correctly from today + `duration_days`
- [ ] Unknown `item_id` returns `{ isError: true, errorCategory: "NOT_FOUND", isRetryable: false }`
- [ ] Blocked patron returns `{ isError: true, errorCategory: "ACCESS_DENIED", isRetryable: false }`
- [ ] Patron privilege check runs before item-existence check (deterministic error precedence)
- [ ] Neither NOT_FOUND nor ACCESS_DENIED set `isRetryable: true`

---

## Milestone M3 — Resources

- [ ] Resource `catalog://items/available` is registered and accessible
- [ ] Available-items resource returns only items where `available === true`
- [ ] Resource `catalog://items/{id}` is registered with URI template
- [ ] By-ID resource returns full item detail including availability and any active reservation info
- [ ] By-ID resource for an unknown ID returns a protocol-level resource error (not the `isError` tool shape)
- [ ] Neither resource mutates catalog state when accessed
- [ ] Resources are distinguishable from tools in server registration (not registered as tools)

---

## Milestone M4 — RATE_LIMITED Error + .mcp.json Config

- [ ] In-memory request counter increments on each `search_catalog` call
- [ ] Counter resets after 60 seconds (or on server restart)
- [ ] Exceeding the rate limit returns `{ isError: true, errorCategory: "RATE_LIMITED", isRetryable: true, retryAfterSeconds: 30 }`
- [ ] RATE_LIMITED is the only error category in this lab with `isRetryable: true`
- [ ] `.mcp.json` exists in project root and is committed (not in `.gitignore`)
- [ ] `.mcp.json` references the API token as `"${LIBRARYLENS_API_TOKEN}"` — not the literal value
- [ ] A `.env` file (with the actual token) is listed in `.gitignore`
- [ ] Server reads `LIBRARYLENS_API_TOKEN` from environment at startup
- [ ] Server logs a warning (not a crash) if the token env var is missing

---

## Exam-Objective Coverage

| Objective | How This Lab Covers It |
|---|---|
| Distinguish tools from resources | M1/M3 require registering both types; resources are read-only, tools can mutate state |
| Design tool input schemas with required vs optional fields | M1 `search_catalog` schema; optional fields must not be marked required |
| Implement structured MCP error responses | M2 (NOT_FOUND, ACCESS_DENIED) and M4 (RATE_LIMITED) with exact field shapes |
| Know which errors are retryable | M2 sets `isRetryable: false` for permanent failures; M4 sets `isRetryable: true` for transient |
| Empty result vs error distinction | M1 zero-result search returns success shape, never an error |
| .mcp.json vs ~/.claude.json | M4 config in project root; scoped to project, not global |
| Credential handling with env vars | M4 `${ENV_VAR}` substitution in `.mcp.json`; token never hardcoded |
| Resource URI patterns | M3 `catalog://items/available` (static) and `catalog://items/{id}` (parameterized) |

---

## Common Pitfalls

- **Returning `isError: true` for an empty search.** The exam will have a distractor answer that treats zero results as a tool failure. It is not.
- **Setting `isRetryable: true` on NOT_FOUND or ACCESS_DENIED.** These are permanent business-logic failures. Retrying will not help.
- **Registering resources as tools.** Resources expose data passively; they have no input schema and no side effects. Using a tool for a read-only catalog listing is a design error.
- **Hardcoding the API token in `.mcp.json`.** Even a placeholder like `"token": "abc123"` is wrong. Use `"${VAR_NAME}"`.
- **Using the tool error shape (`isError: true`) for resource lookup failures.** Resource-not-found is a protocol error, returned through the SDK's resource-error channel, not through the tool response body.

---

## Stretch Goals

- Add an `update_availability` tool that marks an item as checked out when reserved, and verify the `catalog://items/available` resource reflects the change
- Implement a `cancel_reservation` tool with its own error cases (reservation not found, reservation already cancelled)
- Add input validation errors (e.g., `duration_days` out of range) and decide whether they should use a distinct `errorCategory` like `VALIDATION_ERROR`
- Wire up a real HTTP+SSE transport alongside stdio and confirm `.mcp.json` works with both
- Write a simple test harness that calls each tool/resource directly and asserts the response shape without needing Claude
