# Claude Certified Architect — Foundations: Course Curriculum

> **Method:** Understand → Pin the trap → Build → Self-test. Repeat for each domain.

## How to Use This Course

Two independent learning paths:

- **Exam-prep path** (reading track): Complete modules 00–05, Scenarios, and Assessments. No labs needed. Budget ~35–45 hours.
- **Full mastery path** (build track): Add the /labs track. Budget ~70–85 hours.

All content is plain markdown — no tools required. Each module has an optional `_ai-tutor.md` that integrates with Claude Code skills.

## Time Commitment

| Section | Avg. hours |
|---|---|
| 00 — Foundations | 3 |
| 01 — Agent Architecture (27% of exam) | 8 |
| 02 — Tool Design & MCP (18%) | 5 |
| 03 — Claude Code Config (20%) | 6 |
| 04 — Prompt Engineering (20%) | 6 |
| 05 — Context & Reliability (15%) | 5 |
| Scenarios (integrative case studies) | 4 |
| Assessments (diagnostic + mock + review) | 5 |
| **Exam-prep path total** | **~42 h (range: 35–45 h)** |
| Lab 1 — E-Commerce Support Agent | 6 |
| Lab 2 — MCP Server | 5 |
| Lab 3 — Claude Code Team Config | 4 |
| Lab 4 — Invoice Extraction Pipeline | 6 |
| Lab 5 — Multi-Agent Research | 7 |
| Capstone — CI/CD Review Bot | 8 |
| **Labs subtotal** | **~36 h** |
| **Full mastery total** | **~78 h (range: 70–85 h)** |

*Suggested cadences: Exam-prep ~3 weeks at 14 h/week · Full mastery ~6 weeks at 13 h/week*

## Recommended Learning Path

1. **[Diagnostic Assessment](assessments/diagnostic.md)** — 15 questions → identifies weak areas → gives you a prioritized study order
2. **[00 — Foundations](00-foundations/)** — 3 h — Claude API mechanics, messages, stop_reason lifecycle
3. **[01 — Agent Architecture](01-agent-architecture/)** — 8 h — **highest exam weight (27%), do this before anything else**
4. **[02 — Tool Design & MCP](02-tool-design-mcp/)** — 5 h
5. **[03 — Claude Code Config](03-claude-code-config/)** — 6 h
6. **[04 — Prompt Engineering](04-prompt-engineering/)** — 6 h
7. **[05 — Context & Reliability](05-context-reliability/)** — 5 h
8. **[Scenarios](scenarios/)** — 4 h — 8 integrative case studies crossing all domains
9. **[Labs](../labs/)** — 36 h — optional build track
10. **[Final Mock Guide](assessments/final-mock-guide.md)** — use the 76-question practice test to decide: sit now or study more

## Module Overview

| Module | Domain | Exam Weight | Time |
|---|---|---|---|
| [00 — Foundations](00-foundations/) | Claude API & message lifecycle | — | 3 h |
| [01 — Agent Architecture](01-agent-architecture/) | Agentic loop, orchestration, hooks | **27%** | 8 h |
| [02 — Tool Design & MCP](02-tool-design-mcp/) | Tool schemas, MCP server/resources | 18% | 5 h |
| [03 — Claude Code Config](03-claude-code-config/) | CLAUDE.md hierarchy, rules, skills, CI | **20%** | 6 h |
| [04 — Prompt Engineering](04-prompt-engineering/) | Few-shot, JSON schema, batch API | **20%** | 6 h |
| [05 — Context & Reliability](05-context-reliability/) | Context window, escalation, attribution | 15% | 5 h |

## Readiness Gates

After each module's `quiz.md`, score **≥80%** before continuing.

After all modules: re-take the diagnostic and compare scores. Then take the 76-question practice test (`practical_test_en.html`) under exam conditions using the [Final Mock Guide](assessments/final-mock-guide.md).

## About the Exam

- **Format:** 4-choice MCQ, no guessing penalty — always answer every question
- **Passing score:** 720 / 1,000
- **Scenario coverage:** 4 of 8 scenarios appear at random — you must know all 8
- **Domain weights:** D1=27% · D2=18% · D3=20% · D4=20% · D5=15%
- **Not tested:** fine-tuning, deployment/infra, auth/billing, vector-DB internals, computer-use, vision

## Study Tips

- **Tricky-details first.** Read `tricky-details.md` before each quiz. These distinctions decide pass/fail.
- **Weight your time.** Domain 1 is 27% of the exam. If short on time, go deep on D1 then D3/D4.
- **Know all 8 scenarios.** 4 appear randomly — you cannot predict which 4.
- **No guessing penalty.** On uncertain questions: eliminate 2 options, pick the better remaining one.
