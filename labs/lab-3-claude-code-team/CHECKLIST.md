# Lab 3 Checklist — Claude Code Team Configuration

## Milestone M1: Project-Level CLAUDE.md

- [ ] File exists at `.claude/CLAUDE.md`
- [ ] Repo structure section lists all top-level directories with purpose annotations
- [ ] Technology stack is stated (React, Node.js/Express, Stripe SDK, PostgreSQL)
- [ ] Testing conventions: `npm test` (all), `npm run test:api`, `npm run test:payments`, `npm run test:frontend`
- [ ] Deployment pipeline described: CI → staging (auto) → production (manual `npm run deploy:prod`)
- [ ] Payments module called out with reason (PCI scope, no hardcoded amounts, second review required)
- [ ] Auth middleware called out with reason (affects all authenticated routes)
- [ ] Environment variables listed (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `JWT_SECRET`) with explicit "never in code" rule
- [ ] Branch strategy documented (`feature/<ticket-id>-<slug>`, one approval required)
- [ ] The file reads as a genuine new-teammate brief, not a list of bullet points without context

---

## Milestone M2: Scoped Rules Files

### api-rules.md
- [ ] File exists at `src/api/.claude/rules/api-rules.md`
- [ ] YAML frontmatter is present and correctly delimited with `---`
- [ ] `paths:` key contains `["src/api/**"]` (or equivalent array form)
- [ ] Endpoint versioning rule stated (`/v1/...` prefix)
- [ ] Error response format specified (`{ "error": { "code": "...", "message": "..." } }`)
- [ ] Input validation rule: `zod`, before business logic, reject with HTTP 422
- [ ] HTTP status code table or list present
- [ ] Logging rule: use `src/api/lib/logger.js`, no `console.log`

### payments-rules.md
- [ ] File exists at `src/payments/.claude/rules/payments-rules.md`
- [ ] YAML frontmatter is present and correctly delimited with `---`
- [ ] `paths:` key contains `["src/payments/**"]`
- [ ] PCI DSS scope awareness stated explicitly
- [ ] Integer-cents rule stated (no floating-point for amounts)
- [ ] Stripe SDK requirement stated (no raw HTTP calls)
- [ ] Idempotency key requirement for charge/payment-intent calls
- [ ] Stripe error type handling described
- [ ] No-secrets-in-code rule is the most prominent rule (blocker language used)

### Path isolation verification
- [ ] You can articulate why editing `src/frontend/App.jsx` would NOT load either rules file
- [ ] You can articulate why editing `src/payments/stripe.js` would NOT load `api-rules.md`

---

## Milestone M3: Review Skill

- [ ] File exists at `.claude/skills/review/SKILL.md`
- [ ] YAML frontmatter correctly delimited
- [ ] `context: fork` present in frontmatter
- [ ] `allowed-tools: [Read, Grep]` present in frontmatter
- [ ] `argument-hint: "File or directory to review"` present in frontmatter
- [ ] Skill prompt instructs Claude to read the argument target
- [ ] Report structure defined: Summary, Issues Found (with severity labels), Positive Observations, Recommended Next Steps
- [ ] Prompt explicitly states the skill cannot make changes — report only
- [ ] You can explain why `context:fork` is the correct choice here vs `context:background`

---

## Milestone M4: MCP Server Manifest

- [ ] File exists at `.mcp.json` (repo root)
- [ ] Top-level key is `"mcpServers"`
- [ ] Server entry is named `"db-introspect"`
- [ ] `"command"` is `"npx"`
- [ ] `"args"` includes `"-y"` and `"@nexus/mcp-db-introspect"`
- [ ] `"env"` block is present with `"DB_CONNECTION_STRING": "${DB_CONNECTION_STRING}"`
- [ ] No actual credential value appears anywhere in the file
- [ ] File is valid JSON (no trailing commas, no comments)
- [ ] You can explain why `.mcp.json` belongs in version control even though credentials do not

---

## Exam-Objective Coverage

| Objective | How This Lab Covers It |
|---|---|
| 3-level CLAUDE.md hierarchy | M1 writes the project level; M2 writes subdirectory-scoped rules — understanding the difference between always-loaded and conditionally-loaded content |
| paths glob conditional loading | M2 frontmatter; verification step tests that frontend files do NOT trigger API or payments rules |
| Rules files vs directory CLAUDE.md | M2 uses the `rules/` pattern with frontmatter rather than a plain CLAUDE.md, enabling path-based filtering |
| context:fork for skills | M3 uses fork to produce an isolated report; lab requires explaining why fork vs background |
| .mcp.json structure | M4 writes the full manifest with command, args, and env block |
| Env-var credential pattern | M4 env block uses `${VAR}` reference syntax; no value stored in the committed file |
| allowed-tools scoping | M3 restricts the review skill to Read and Grep, preventing side effects |
| New-teammate brief pattern | M1 is evaluated on whether it passes the "hand to a new hire" test |

---

## Common Pitfalls

**Missing or malformed frontmatter delimiters** — Both `---` lines are required. A single `---` at the top only, or any whitespace before it, breaks parsing.

**Using a directory CLAUDE.md instead of a rules file** — A `CLAUDE.md` in `src/payments/` loads whenever you are anywhere in that directory. A rules file with `paths: ["src/payments/**"]` loads only when the files being edited match. The distinction is subtle but exam-tested.

**Putting `context: background` on the review skill** — Background context is for long-running persistent agents. A code review is a one-shot task; fork is correct. Background would keep the review conversation alive and mix it with the main session.

**Storing credentials in .mcp.json** — The `env` block holds variable names and reference syntax, not values. The file is committed; values are not.

**Paths glob anchoring** — `"api/**"` does not match `src/api/foo.js`. Always anchor from the repo root: `"src/api/**"`.

---

## Stretch Goals

- Add a `src/frontend/.claude/rules/frontend-rules.md` with React conventions (component naming, state management rules, accessibility requirements) scoped to `src/frontend/**`.
- Add a second MCP server entry to `.mcp.json` for a Stripe webhook signature validator tool, also using env vars.
- Write a `/deploy-check` skill with `context:fork` and `allowed-tools: [Bash]` that runs `npm run lint` and reports the result before a deploy.
- Write a `.claude/settings.json` that allows `npm test` and `npm run lint` but blocks any `rm` command.
- Extend the CLAUDE.md with an "AI Assistance Guidelines" section that tells Claude which operations always need human confirmation (production deploys, schema migrations, payments code changes).
