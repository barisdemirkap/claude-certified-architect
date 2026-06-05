# STARTER.md — LibraryLens MCP Server

## Environment & Dependencies

**Recommended: Node.js (TypeScript or plain JS)**

```
node >= 18
npm install @modelcontextprotocol/sdk
```

SDK: https://github.com/modelcontextprotocol/typescript-sdk

**Alternative: Python**

```
python >= 3.11
pip install mcp
```

SDK: https://github.com/modelcontextprotocol/python-sdk

You do not need a database, an external API, or Docker. The entire catalog lives in memory. Keep the dependency list minimal — one MCP SDK is all that is required to pass all milestones.

---

## Architecture Scaffold

Do not try to wire all components at once. Build in this order:

```
server/
  index.js          ← entry point; creates McpServer, registers components, starts transport
  catalog.js        ← in-memory catalog store + seed data (plain JS object/array)
  tools/
    search.js       ← search_catalog handler
    reserve.js      ← reserve_item handler
  resources/
    available.js    ← catalog://items/available handler
    byId.js         ← catalog://items/{id} handler
  errors.js         ← shared error shape builder
.mcp.json           ← MCP server config (added in M4)
.gitignore          ← must include .env
```

You are not required to use this exact layout, but separating the catalog store from the tool handlers makes it much easier to test each piece in isolation.

---

## Key Documentation

| What you need | Where to find it |
|---|---|
| MCP specification (tools vs resources) | https://modelcontextprotocol.io/docs/concepts/tools and /resources |
| TypeScript SDK server setup | https://github.com/modelcontextprotocol/typescript-sdk#server |
| Python SDK server setup | https://github.com/modelcontextprotocol/python-sdk#creating-a-server |
| `.mcp.json` reference | https://docs.anthropic.com/en/docs/claude-code/mcp |
| MCP error handling guidance | https://modelcontextprotocol.io/docs/concepts/tools#error-handling |
| MCP resource URI patterns | https://modelcontextprotocol.io/docs/concepts/resources |

---

## Approaching Milestone 1

1. **Start with the catalog store.** Write `catalog.js` first — an array of 8-10 hardcoded items with fields `item_id`, `title`, `author`, `subject`, `available`. Verify it loads correctly before touching the MCP SDK.

2. **Create the smallest possible MCP server.** Use the SDK's `McpServer` (TypeScript) or `Server` (Python) class. Register one tool with a trivial handler that returns a hardcoded string. Connect it to the stdio transport and confirm Claude Code can call it.

3. **Add the search logic.** Replace the trivial handler with real filtering. Test the zero-result case explicitly — call the tool with a query like `"xyzzy_no_match"` and confirm the response contains `"results": [], "total": 0` with no `isError` field.

4. **Validate your JSON schema.** Make `subject_filter` and `max_results` genuinely optional in the schema. The SDK enforces required/optional at call time; if you mark them required by mistake, Claude will always prompt for them.

5. **Do not move to M2 until M1 search returns correct shapes** for both the hit case and the zero-result case. The distinction between "empty list = success" and "empty list = error" is a core exam concept.

---

## Common Stumbling Blocks

**1. Treating 0-result search as an error**

This is the single most tested concept in this lab. An empty result set means the search succeeded and found nothing. The correct response is `{ "results": [], "total": 0 }` with no `isError` field. Setting `isError: true` on an empty search is wrong — it signals to the orchestrator that the tool itself failed, which would trigger a retry or escalation unnecessarily.

**2. Confusing isRetryable for NOT_FOUND vs RATE_LIMITED**

NOT_FOUND and ACCESS_DENIED are both `isRetryable: false` — no amount of waiting will make a missing item appear or change a patron's suspension status. RATE_LIMITED is `isRetryable: true` because the failure is time-based. Mixing these up is a common wrong-answer trap on the exam.

**3. Using the tool error shape for resource errors**

Resources that cannot find a requested item (e.g., `catalog://items/unknown-id`) should use the MCP SDK's resource-not-found mechanism, not the `{ isError: true, errorCategory: "NOT_FOUND" }` shape. That shape is for tool responses only. Resource errors are protocol-level.

**4. Hardcoding credentials in .mcp.json**

`.mcp.json` is committed to version control. Any secret placed directly in it will be visible to anyone with repo access. Always use the `"${ENV_VAR_NAME}"` substitution syntax for tokens. Store the actual value in a `.env` file that is listed in `.gitignore`. The exam tests this distinction explicitly.
