# Labs: Hands-On Build Track

Building the systems the exam tests is the fastest way to internalize the concepts. Each lab uses a different project domain — so you generalize patterns, not just memorize one example.

## Labs at a Glance

| Lab | Project Domain | What You'll Build | Exam Domains | Time | Prerequisites |
|---|---|---|---|---|---|
| [Lab 1 — E-Commerce Support Agent](lab-1-support-agent/) | E-commerce | Agentic loop with hooks and escalation | D1, D2, D5 | 6 h | M01, M02, M05 |
| [Lab 2 — MCP Server](lab-2-mcp-server/) | Library catalog | MCP server: tools + resources + error handling | D2 | 5 h | M02 |
| [Lab 3 — Claude Code Team Config](lab-3-claude-code-team/) | Web application | CLAUDE.md hierarchy, .claude/rules/, skills | D3 | 4 h | M03 |
| [Lab 4 — Invoice Extraction Pipeline](lab-4-extraction-pipeline/) | Finance / docs | JSON schema, validation loop, batch API | D4, D5 | 6 h | M04, M05 |
| [Lab 5 — Multi-Agent Research](lab-5-multi-agent-research/) | Market research | Coordinator + subagents + provenance | D1, D2, D5 | 7 h | M01, M02, M05 |
| [Capstone — CI/CD Review Bot](capstone/) | Software delivery | claude -p, structured output, independent review | D1, D3, D4, D5 | 8 h | All modules |

## Difficulty Order

Lab 2 → Lab 3 → Lab 1 → Lab 4 → Lab 5 → Capstone

*(Each lab builds on concepts from the previous — but they can be done independently after completing the prerequisite modules.)*

## How to Work Through a Lab

1. **Read `README.md`** — understand the project brief and exam domains exercised
2. **Read `SPEC.md`** — get full requirements and milestones M1–M4
3. **Read `STARTER.md`** — environment setup, architecture scaffold, key docs, first steps
4. **Build** — milestone by milestone. Get M1 working before touching M2.
5. **Self-grade** with `CHECKLIST.md` — verify each milestone's acceptance criteria
6. **Read `SOLUTION-NOTES.md`** — compare your architecture decisions with the discussion

## Language / Framework

Labs are **language-agnostic** in specification. You choose your language and SDK (Python, TypeScript, etc.). The exam never tests language-specific syntax.

## What's In Scope

Agentic loops, tool use, MCP servers, CLAUDE.md config, JSON schema design, batch API, prompt engineering. **Not in scope**: deployment, auth/billing, fine-tuning, vector databases, infra.
