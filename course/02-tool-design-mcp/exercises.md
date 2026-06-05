# Exercises — Tool Design & MCP Integration

Applied practice. Work through each exercise before checking the answer.

---

## Exercise 1: Diagnose the Tool Selection Bug

An agent has access to two tools:

```json
{ "name": "search_products", "description": "Search for products." }
{ "name": "search_inventory", "description": "Search for inventory." }
```

In production, the agent frequently calls `search_inventory` when the user asks about product availability and vice versa. A developer proposes fixing this by making the `query` parameter in `search_inventory` require a minimum length of 5 characters.

**Question:** Will this fix the problem? If not, what is the correct fix and why?

<details><summary>Answer</summary>

No, changing the input_schema will not fix the problem. Claude selects tools based on their descriptions, not their parameter constraints. The schema validates structure *after* a tool has already been selected.

The root cause is that both descriptions ("Search for products" and "Search for inventory") are semantically overlapping — they both sound like "find something in the catalog." The model cannot reliably distinguish them.

The correct fix is to rewrite the descriptions to make each tool's distinct purpose explicit. For example:

- `search_products`: "Find products by name, category, or SKU. Returns product metadata including name, description, price, and category. Use this to answer questions about what products exist or their specifications."
- `search_inventory`: "Look up real-time stock levels and warehouse location for a known product SKU. Returns quantity on hand, reserved quantity, and warehouse bin. Requires a valid SKU — use search_products first if you only have a product name."

These descriptions are now non-overlapping and each tells the model exactly when to prefer it over the other.
</details>

---

## Exercise 2: Choose the Right `tool_choice` Value

For each scenario below, choose `auto`, `any`, or the forced form `{"type": "tool", "name": "X"}` and explain why.

**Scenario A:** You have a customer support agent. Most questions can be answered from context, but for billing questions, the agent should look up account data. You do not want to force a lookup for every message.

**Scenario B:** You are building a data extraction pipeline. Every document must produce a structured JSON record. You have three extraction tools for different document types; the model should pick the right one for each document.

**Scenario C:** Your orchestration workflow requires that `validate_permissions` runs at the start of every agent turn, before any other action.

<details><summary>Answer</summary>

**Scenario A: `auto`**
The agent should decide whether a tool call is needed. `auto` allows it to answer simple questions from context and only invoke tools when necessary. Forcing a tool call for every message would waste tokens and produce unnecessary lookups.

**Scenario B: `any`**
You need guaranteed structured output (a tool call must happen) but you are indifferent about which of the three extraction tools is used — the model should pick the best one for the document. `any` enforces that a tool is called without pinning a specific tool name.

**Scenario C: Forced `{"type": "tool", "name": "validate_permissions"}`**
Execution order is the requirement. `auto` might skip the validation if the model thinks it isn't needed. `any` might call a different tool first. Only the forced form guarantees that `validate_permissions` runs first, every time.
</details>

---

## Exercise 3: Spot the MCP Configuration Anti-Pattern

A team lead commits the following `.mcp.json` to the shared GitHub repository. Identify every problem and explain the correct version.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_T3amT0k3n9xAbCdEfGh"
      }
    },
    "internal-db": {
      "command": "node",
      "args": ["./mcp-db-server.js"],
      "env": {
        "DB_PASSWORD": "prod-password-2024!"
      }
    }
  }
}
```

<details><summary>Answer</summary>

Two problems:

1. `GITHUB_TOKEN` contains a literal token value (`"ghp_T3amT0k3n9xAbCdEfGh"`). Anyone who clones the repo or views the commit history has this token. It should be stored in each developer's environment and referenced as `"${GITHUB_TOKEN}"`.

2. `DB_PASSWORD` contains a literal production password. Same issue and same fix: store in the environment and reference as `"${DB_PASSWORD}"`.

The correct `.mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "internal-db": {
      "command": "node",
      "args": ["./mcp-db-server.js"],
      "env": {
        "DB_PASSWORD": "${DB_PASSWORD}"
      }
    }
  }
}
```

Each developer sets `GITHUB_TOKEN` and `DB_PASSWORD` in their local environment (e.g., `.env` file, shell profile, or secrets manager). The config file can now be committed safely.
</details>

---

## Exercise 4: Fix the Error Response

An MCP tool currently returns this when it cannot find a record:

```json
{
  "isError": true,
  "content": "Record not found"
}
```

And this when the upstream API is rate-limiting:

```json
{
  "isError": true,
  "content": "API limit reached"
}
```

**Question:** What is wrong with both responses? Rewrite them in the correct structured format.

<details><summary>Answer</summary>

Both responses are generic. The calling agent cannot determine:
- Whether the error is retryable
- What category of error occurred
- Any context that would help it recover

The agent receiving "Record not found" cannot know whether to retry or give up. The agent receiving "API limit reached" cannot know whether to retry after a delay or escalate.

Corrected responses:

```json
{
  "isError": true,
  "content": {
    "errorCategory": "NOT_FOUND",
    "isRetryable": false,
    "message": "No record found matching the provided ID. Verify the ID is correct before retrying.",
    "attempted_id": "ord_12345"
  }
}
```

```json
{
  "isError": true,
  "content": {
    "errorCategory": "RATE_LIMITED",
    "isRetryable": true,
    "message": "Upstream API rate limit exceeded. Retry after 60 seconds.",
    "retry_after_seconds": 60
  }
}
```

The `isRetryable` field tells the caller exactly what to do. `NOT_FOUND` → do not retry; `RATE_LIMITED` → retry after the delay.
</details>

---

## Exercise 5: Right-size an Agent's Toolset

A "research assistant" agent currently has access to all 18 of the following tools. It frequently misroutes calls. Propose a consolidation strategy.

Tools: `search_web`, `fetch_url`, `load_document`, `search_internal_wiki`, `search_confluence`, `search_notion`, `read_file`, `write_file`, `create_jira_ticket`, `update_jira_ticket`, `delete_jira_ticket`, `list_jira_projects`, `send_email`, `schedule_meeting`, `list_calendar_events`, `cancel_meeting`, `post_slack_message`, `list_slack_channels`

<details><summary>Answer</summary>

The research assistant only needs to *gather information* — it should not be creating tickets, sending emails, or managing calendars at all. Those tools are in the wrong agent's context.

Proposed consolidation to 4–5 tools:

1. **`search_web`** — external web search (keep as-is)
2. **`fetch_page`** — merge `fetch_url` and `load_document` into one tool with a source parameter; or keep `load_document` only (more constrained, least privilege) and remove `fetch_url`
3. **`search_knowledge_base`** — merge `search_internal_wiki`, `search_confluence`, and `search_notion` into one tool with a `source` enum parameter (wiki | confluence | notion). Three tools with near-identical descriptions are the classic overlap problem.
4. **`read_file`** — keep for local file access (keep; remove `write_file` — the research agent should not write)
5. (Optional) **`summarize_results`** — a synthesis tool if needed

Remove entirely from this agent: all Jira tools, `send_email`, all calendar/meeting tools, all Slack tools. Those belong in a separate action-execution agent that the orchestrator invokes after the research is complete.

Result: 4–5 tools with distinct, non-overlapping descriptions. Selection reliability will improve significantly.
</details>

---

## Exercise 6: MCP Primitive Classification

For each of the following, decide whether it should be implemented as an MCP **tool**, **resource**, or **prompt**.

A. A database schema definition showing all tables and their columns.
B. An action that creates a new support ticket in the helpdesk system.
C. A reusable template for summarizing customer support conversations.
D. The current list of open incidents from a monitoring system, refreshed every minute.
E. An action that queries a database and returns matching rows.

<details><summary>Answer</summary>

**A. Database schema → Resource**
The schema is read-only reference data. No side effects. The agent reads it to understand structure before acting. Classic resource use case.

**B. Create support ticket → Tool**
Creating a record is an action with side effects. Tools are for actions the agent can take.

**C. Conversation summary template → Prompt**
Reusable prompt templates are exactly what the MCP `prompts` primitive is designed for. This is not an action and not raw data — it is a structured template for approaching a recurring task.

**D. Open incidents list → Resource**
The list is read-only data the agent consumes for context. Even though it is dynamic (refreshed frequently), it has no side effects when read. Resource.

**E. Database query → Tool**
Executing a query is an action (even read-only queries consume resources, may have query cost, and "do something"). When the action takes inputs and produces results, use a tool. The distinction from D is that a query is parameterized and executed by the agent on demand.
</details>

---

## Exercise 7: Short Answer — Least Privilege

An agent is tasked with loading and summarizing customer support transcripts stored at known paths like `/data/transcripts/2024-01-15/case_12345.txt`. The team is debating between giving it a `fetch_url` tool (which can retrieve any URL or local path) vs a `load_transcript` tool (which only accepts paths matching `/data/transcripts/**/*.txt`).

Which should they use, and why? What does the wrong choice risk?

<details><summary>Answer</summary>

Use `load_transcript` (the constrained tool). This follows the principle of least privilege: give the agent access only to what the task requires.

The `fetch_url` tool's general URL access creates risks:
- A malicious instruction injected via a transcript could direct the agent to fetch an internal admin endpoint or external exfiltration URL
- If the agent is compromised, the blast radius includes any URL the server can reach, not just the transcript paths
- The tool description is broad, which may cause the model to use it in unintended contexts

`load_transcript` with a path pattern constraint limits access to exactly the files the agent legitimately needs. If the agent is instructed to fetch something outside `/data/transcripts/**/*.txt`, the tool rejects it. This is defense in depth for agentic systems.
</details>
