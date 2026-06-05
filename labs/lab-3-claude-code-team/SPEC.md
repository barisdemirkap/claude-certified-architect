# Lab 3 Specification — Claude Code Team Configuration

## Architecture Overview

The Nexus repository has the following shape:

```
nexus/
├── .claude/
│   ├── CLAUDE.md                    ← M1: project-level context (always loaded)
│   ├── skills/
│   │   └── review/
│   │       └── SKILL.md             ← M3: /review skill, context:fork
│   └── settings.json                (not authored in this lab)
├── .mcp.json                        ← M4: MCP server manifest
├── src/
│   ├── frontend/                    (React SPA — no rules file needed)
│   ├── api/
│   │   ├── .claude/
│   │   │   └── rules/
│   │   │       └── api-rules.md     ← M2: loads only for src/api/**
│   │   └── ...
│   └── payments/
│       ├── .claude/
│       │   └── rules/
│       │       └── payments-rules.md ← M2: loads only for src/payments/**
│       └── ...
└── package.json
```

**Loading model:**
- `.claude/CLAUDE.md` is loaded in every Claude Code session for this project.
- Rules files are loaded only when Claude is working on files that match the `paths:` glob in their frontmatter.
- `.mcp.json` at the repo root is discovered automatically by Claude Code and makes MCP tools available in every session.
- Skills are invoked explicitly by the user (`/review <target>`).

---

## Milestone M1 — Project-Level CLAUDE.md

File: `.claude/CLAUDE.md`

Requirements:
- [ ] Repo structure section: list each top-level directory with a one-line purpose.
- [ ] Technology stack: React (frontend), Node.js + Express (API), Stripe SDK (payments), PostgreSQL (database).
- [ ] Testing conventions: Jest for all layers; `npm test` runs the full suite; individual layers via `npm run test:api`, `npm run test:payments`, `npm run test:frontend`.
- [ ] Deployment pipeline: CI (GitHub Actions) → staging (auto-deploy on `main`) → production (manual promote via `npm run deploy:prod`).
- [ ] Areas requiring extra care — call out two explicitly:
  - **Payments module** (`src/payments/`): PCI-scope code; any change requires a second review; never hard-code amounts.
  - **Auth flows** (`src/api/middleware/auth/`): JWT verification and refresh logic; changes here affect all authenticated routes.
- [ ] Environment variables: list the critical ones (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `JWT_SECRET`) and state they must never appear in code or commits.
- [ ] Branch strategy: `main` is protected; feature branches named `feature/<ticket-id>-<slug>`; PRs require one approval.

---

## Milestone M2 — Scoped Rules Files

### File: `src/api/.claude/rules/api-rules.md`

Frontmatter format (YAML, fenced by `---`):

```yaml
---
paths:
  - "src/api/**"
---
```

Content requirements:
- [ ] API endpoint patterns: all endpoints must be versioned (`/v1/...`); use Express Router per resource.
- [ ] Error response format: every error must return `{ "error": { "code": "<SCREAMING_SNAKE>", "message": "<human string>" } }` — no raw stack traces in responses.
- [ ] Input validation: use `zod` for request body validation before any business logic runs; reject with HTTP 422 if schema fails.
- [ ] HTTP status codes: enumerate the project standard (200/201/400/401/403/422/500) and when to use each.
- [ ] Logging: use the project logger (`src/api/lib/logger.js`); never use `console.log` directly.

### File: `src/payments/.claude/rules/payments-rules.md`

Frontmatter format:

```yaml
---
paths:
  - "src/payments/**"
---
```

Content requirements:
- [ ] PCI scope awareness: this directory is in PCI DSS scope; any code here can affect audit status.
- [ ] Amount handling: **never** compute, modify, or store payment amounts as floating-point; use integer cents only and always validate against Stripe's returned amount before capturing.
- [ ] Stripe API calls: always use the SDK (`stripe` npm package) — no raw HTTP calls to api.stripe.com.
- [ ] Idempotency keys: every Stripe API call that creates a charge or payment intent must include an idempotency key.
- [ ] Error handling: catch Stripe errors by type (`StripeCardError`, `StripeInvalidRequestError`, etc.); never surface Stripe error codes directly to end users.
- [ ] No secrets in code: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` come only from `process.env`; any hardcoded value is an immediate blocker.

**Verification criteria for M2:**
When Claude is editing `src/frontend/App.jsx`, neither `api-rules.md` nor `payments-rules.md` should be loaded. The paths glob ensures this.

---

## Milestone M3 — Review Skill

File: `.claude/skills/review/SKILL.md`

Frontmatter format:

```yaml
---
context: fork
allowed-tools:
  - Read
  - Grep
argument-hint: "File or directory to review"
---
```

Content requirements:
- [ ] The skill prompt instructs Claude to read the target file(s) and produce a structured review report.
- [ ] The report must include sections: **Summary**, **Issues Found** (severity: critical / warning / suggestion), **Positive Observations**, **Recommended Next Steps**.
- [ ] `context:fork` means the skill runs in an isolated context — it does not continue the current conversation and does not modify files.
- [ ] `allowed-tools: [Read, Grep]` means the skill can inspect code but cannot write or execute anything.
- [ ] The prompt must remind Claude that it cannot make changes — only report.

---

## Milestone M4 — MCP Server Manifest

File: `.mcp.json`

Requirements:
- [ ] JSON object with a top-level `"mcpServers"` key.
- [ ] One server entry named `"db-introspect"`.
- [ ] Command: `npx` with `@nexus/mcp-db-introspect` package (fictional but realistic package name).
- [ ] Environment variable: pass `DB_CONNECTION_STRING` from the host environment using the `env` block — the actual value must NOT appear in the file.
- [ ] The server exposes a schema inspection tool (no implementation needed in this file — the manifest is sufficient).

Exact `.mcp.json` structure expected:

```json
{
  "mcpServers": {
    "db-introspect": {
      "command": "npx",
      "args": ["-y", "@nexus/mcp-db-introspect"],
      "env": {
        "DB_CONNECTION_STRING": "${DB_CONNECTION_STRING}"
      }
    }
  }
}
```

---

## Input/Output Contract

| Input | Output |
|---|---|
| Repo with the directory structure above | `.claude/CLAUDE.md` (project context) |
| Team conventions documented in this SPEC | `src/api/.claude/rules/api-rules.md` |
| PCI requirements documented in this SPEC | `src/payments/.claude/rules/payments-rules.md` |
| Review workflow requirement | `.claude/skills/review/SKILL.md` |
| DB introspection need + credential as env var | `.mcp.json` |

---

## Constraints

The following are explicitly **out of scope** for this lab:

- Writing any application code (routes, handlers, React components).
- Implementing the MCP server (`@nexus/mcp-db-introspect`) — only the manifest is required.
- Configuring `settings.json` (permissions, allowed commands).
- Writing GitHub Actions CI workflow files.
- Creating a `.env` file — credentials are always external to the repo.
