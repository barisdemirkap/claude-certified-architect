# SPEC.md — LibraryLens MCP Server

## Architecture Overview

```
Claude (client)
     │
     │  MCP protocol (stdio or HTTP+SSE)
     ▼
LibraryLens MCP Server
     ├── Tools
     │     ├── search_catalog      (query + optional filters → result list)
     │     └── reserve_item        (item_id + patron_id + duration → confirmation)
     ├── Resources
     │     ├── catalog://items/available   (live availability list)
     │     └── catalog://items/{id}        (single item details)
     └── In-memory catalog store (mock database — no real DB required)
```

The MCP server is the only process. Claude connects to it via the stdio transport (or HTTP+SSE for M4). The catalog store is an in-memory object seeded at startup — persistence is out of scope.

---

## Milestone M1 — search_catalog Tool

### Requirements

1. Register a tool named `search_catalog` with the following input schema:

   ```json
   {
     "query": { "type": "string", "description": "Full-text search string" },
     "subject_filter": { "type": "string", "description": "Optional subject category (e.g. 'Computer Science')" },
     "max_results": { "type": "integer", "default": 10, "minimum": 1, "maximum": 50 }
   }
   ```

   Required fields: `query` only.

2. The tool searches the in-memory catalog by matching `query` against title and author fields (case-insensitive substring match is sufficient).

3. If `subject_filter` is provided, further filter results to items whose `subject` field matches.

4. **Critical behavior**: when the search matches zero items, return a valid successful response containing an empty list — do NOT set `isError: true`. An empty result set is a normal outcome, not a failure.

5. Each result item in the list must include: `item_id`, `title`, `author`, `subject`, `available` (boolean).

6. Seed the in-memory catalog with at least 8 items across at least 3 subject categories so search filtering can be tested.

---

## Milestone M2 — reserve_item Tool + Structured Errors

### Requirements

1. Register a tool named `reserve_item` with the following input schema:

   ```json
   {
     "item_id":       { "type": "string", "description": "Catalog item ID to reserve" },
     "patron_id":     { "type": "string", "description": "Library patron identifier" },
     "duration_days": { "type": "integer", "minimum": 1, "maximum": 30, "description": "Loan duration in days" }
   }
   ```

   All three fields are required.

2. On success, return a confirmation object:

   ```json
   {
     "reservation_id": "<uuid>",
     "item_id": "<string>",
     "patron_id": "<string>",
     "due_date": "<ISO-8601 date string>",
     "status": "confirmed"
   }
   ```

3. **Error: item not found** — when `item_id` does not exist in the catalog:

   ```json
   {
     "isError": true,
     "errorCategory": "NOT_FOUND",
     "isRetryable": false,
     "message": "Item '<item_id>' does not exist in the catalog."
   }
   ```

   `isRetryable` is `false` because retrying the same request will always fail — the item does not exist.

4. **Error: patron lacks privileges** — simulate by checking a hardcoded blocklist of patron IDs (e.g., `["SUSPENDED_001", "BLOCKED_002"]`); any patron on the list is denied:

   ```json
   {
     "isError": true,
     "errorCategory": "ACCESS_DENIED",
     "isRetryable": false,
     "message": "Patron '<patron_id>' does not have reservation privileges."
   }
   ```

   `isRetryable` is `false` because the denial is a policy decision, not a transient failure.

5. Check patron privileges before checking item availability so the error precedence is deterministic.

---

## Milestone M3 — Resources

### Requirements

1. Register a resource at URI `catalog://items/available`:
   - MIME type: `application/json`
   - Returns a JSON array of all catalog items where `available === true`
   - Each item must include: `item_id`, `title`, `author`, `subject`
   - This is a **read-only** operation — no side effects

2. Register a resource at URI `catalog://items/{id}` (parameterized):
   - MIME type: `application/json`
   - Returns full item detail for the given `id`, including `available` status and current reservation info if applicable
   - If `id` does not exist, return an MCP resource-not-found error (use the SDK's standard mechanism for resource errors, not the `isError` tool-error shape — resource errors are protocol-level, not business-logic errors)

3. Resources must never mutate state. `search_catalog` is a tool (not a resource) because filtering with side-effect potential belongs in tool space; the resources here are purely passive reads.

---

## Milestone M4 — RATE_LIMITED Error + .mcp.json Config

### Requirements

1. Add rate-limit simulation to `search_catalog`:
   - Maintain an in-memory request counter that resets every 60 seconds
   - If more than N requests (suggested: 5) arrive within the window, return:

   ```json
   {
     "isError": true,
     "errorCategory": "RATE_LIMITED",
     "isRetryable": true,
     "retryAfterSeconds": 30,
     "message": "Search rate limit exceeded. Please wait before retrying."
   }
   ```

   `isRetryable` is `true` because the failure is purely transient — the same request will succeed after the window resets.

2. Create `.mcp.json` in the project root (committed to version control):

   ```json
   {
     "mcpServers": {
       "librarylens": {
         "command": "node",
         "args": ["server/index.js"],
         "env": {
           "LIBRARYLENS_API_TOKEN": "${LIBRARYLENS_API_TOKEN}"
         }
       }
     }
   }
   ```

   - The actual token value must come from the environment at runtime — never hardcoded in `.mcp.json`
   - `${VARIABLE}` syntax signals that Claude Code should read the value from the shell environment
   - Add `.env` to `.gitignore`; document the required env var in README

3. The server must read `process.env.LIBRARYLENS_API_TOKEN` (or the Python equivalent) at startup and log a warning if it is missing, but continue to run (the token gates a future real API integration; for this lab it is read and discarded).

---

## Input/Output Contract

### search_catalog — success (with results)

```json
{
  "results": [
    {
      "item_id": "LIB-0042",
      "title": "Designing Data-Intensive Applications",
      "author": "Martin Kleppmann",
      "subject": "Computer Science",
      "available": true
    }
  ],
  "total": 1
}
```

### search_catalog — success (no results)

```json
{
  "results": [],
  "total": 0
}
```

Note: `isError` is absent (or `false`). This is a valid successful tool response.

### reserve_item — success

```json
{
  "reservation_id": "rsv-7f3a9b",
  "item_id": "LIB-0042",
  "patron_id": "PATRON-001",
  "due_date": "2026-07-05",
  "status": "confirmed"
}
```

### Error shape (all tool errors)

```json
{
  "isError": true,
  "errorCategory": "<NOT_FOUND | ACCESS_DENIED | RATE_LIMITED>",
  "isRetryable": <true | false>,
  "message": "<human-readable explanation>"
}
```

---

## Constraints (Out of Scope)

- No real database — in-memory store only
- No authentication middleware beyond reading the env-var token at startup
- No persistent reservations across server restarts
- No HTTP transport required (stdio is sufficient for M1–M3; M4 adds only the `.mcp.json` config, not a transport change)
- No pagination beyond `max_results` on `search_catalog`
- No concurrent-access handling (single-process, single-threaded model assumed)
