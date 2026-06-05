<div align="center">

# Claude Certified Architect — Foundations

**Open-source curriculum · Deep understanding, not just memorization**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-barisdemirkap-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/barisdemirkap)
[![GitHub](https://img.shields.io/badge/GitHub-barisdemirkap-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/barisdemirkap)
[![License: CC BY 4.0](https://img.shields.io/badge/Content-CC_BY_4.0-lightgrey?style=for-the-badge)](LICENSE)
[![License: MIT](https://img.shields.io/badge/Code-MIT-green?style=for-the-badge)](LICENSE-CODE)

<br>

![Certification Banner](image.png)

</div>

---

## About This Project

This curriculum was built by **[Baris Demirkap](https://www.linkedin.com/in/barisdemirkap)** as a structured, open-source learning path for the Claude Certified Architect — Foundations exam. It turns the raw study guide into a modular course with dedicated lessons, hands-on labs across real project domains, and an AI-powered study system built on Claude Code.

Original study guide by [Paul Larionov](https://github.com/paullarionov) · Licensed [CC-BY-4.0](LICENSE)

---

## Exam Overview

> [!IMPORTANT]
> **Passing score: 720 / 1,000 · No guessing penalty — always answer every question · 4 of 8 scenarios chosen at random**

| Parameter | Value |
|---|---|
| Format | 4-choice MCQ |
| Score range | 100 – 1,000 |
| Passing threshold | **720** |
| Scenarios | 4 of 8 (random) — study all 8 |
| Duration | ~90 minutes |

**[→ Request exam access](https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request)** · **[→ Anthropic Academy](https://www.anthropic.com/learn)** · **[→ Partner Network](https://claude.com/partners)**

### Domain Weights

| Domain | Weight | Priority |
|---|---|---|
| 1 · Agent Architecture & Orchestration | **27%** | ★★★ Start here |
| 2 · Claude Code Config & Workflows | **20%** | ★★★ |
| 3 · Prompt Engineering & Structured Output | **20%** | ★★★ |
| 4 · Tool Design & MCP Integration | **18%** | ★★ |
| 5 · Context Management & Reliability | **15%** | ★★ |

---

## Time Commitment

| Path | Hours | Cadence |
|---|---|---|
| **Exam-prep** — modules + scenarios + assessments | **~35–45 h** | 3 weeks at 14 h/week |
| **Full mastery** — exam-prep + hands-on labs | **~70–85 h** | 6 weeks at 13 h/week |

---

## Quick Start

```
1. Fork this repo
2. Open PROGRESS.md — check items off as you go
3. Take the diagnostic → course/assessments/diagnostic.md
4. Follow the roadmap below (or ROADMAP.md for the full checklist)
5. Gate on each module quiz: score ≥80% before moving on
6. Final mock → course/assessments/final-mock-guide.md → sit or study more
```

> [!TIP]
> Read **`tricky-details.md`** in each module before its quiz. These files contain the pass/fail distinctions distilled from the 76-question practice test.

---

## Study Roadmap

<details>
<summary><strong>Phase 0 — Environment Setup · 1 h</strong></summary>

- Install Claude Code CLI and verify it runs in this directory
- Open `practical_test_en.html` in a browser — see the exam format before studying it
- Skim the Table of Contents of `guide_en.MD`
- Bookmark the free Anthropic Academy courses below

</details>

<details>
<summary><strong>Phase 1 — API Fundamentals & Tool Use · 4 h · Domains 3, 4</strong></summary>

**What to learn:**
- `stop_reason` values and the correct action for each (`end_turn` · `tool_use` · `max_tokens` · `stop_sequence`)
- Tool description as the **primary selection signal** — descriptions before schemas
- `tool_choice`: `"auto"` / `"any"` / forced `{"type":"tool","name":"X"}`
- JSON schema: `required` vs `nullable` · enum with `"other"` + detail field · syntax vs semantic errors

**Watch:** [Building with the Claude API](https://anthropic.skilljar.com/claude-with-the-anthropic-api)

**Read:** [Messages API](https://platform.claude.com/docs/en/api/messages) · [Tool Use](https://platform.claude.com/docs/en/build-with-claude/tool-use)

</details>

<details>
<summary><strong>Phase 2 — Agent Architecture · 4 h · Domain 1 — 27% of exam</strong></summary>

**What to learn:**
- Agentic loop: `stop_reason == "end_turn"` is the **only** valid exit — no text parsing, no `max_iterations`
- Hub-and-spoke topology: coordinator → subagents via Task tool
- Subagent context isolation: subagents inherit **nothing** — pass all context explicitly
- Hooks: `PreToolUse` (blocks before) vs `PostToolUse` (transforms after) — both **100% deterministic**
- Hooks vs prompt instructions: hooks always fire · prompts are ~90% reliable
- Escalation: acknowledge → resolve → escalate **only on reiteration**

**Watch:** [Introduction to Agent Skills](https://anthropic.skilljar.com/introduction-to-agent-skills)

**Read:** [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview) · [Hooks](https://platform.claude.com/docs/en/agent-sdk/hooks) · [Subagents](https://platform.claude.com/docs/en/agent-sdk/subagents)

</details>

<details>
<summary><strong>Phase 3 — MCP Integration · 2 h · Domain 4</strong></summary>

**What to learn:**
- MCP component types: **tools** (actions, side effects) · **resources** (read-only data) · **prompts** (templates)
- Config files: `.mcp.json` (project root, committed to VCS) vs `~/.claude.json` (personal, never committed)
- Secrets always in env vars — never hardcoded in config files
- Structured errors: `isError: true` + `errorCategory` + `isRetryable`
- Retryable: `RATE_LIMITED` · `INTERNAL_ERROR` — Not retryable: `NOT_FOUND` · `ACCESS_DENIED` · `INVALID_PARAMS`

**Watch:** [Intro to MCP](https://anthropic.skilljar.com/introduction-to-model-context-protocol) · [MCP Advanced](https://anthropic.skilljar.com/model-context-protocol-advanced-topics)

**Read:** [MCP Tools](https://modelcontextprotocol.io/docs/concepts/tools) · [MCP Resources](https://modelcontextprotocol.io/docs/concepts/resources)

</details>

<details>
<summary><strong>Phase 4 — Claude Code Configuration · 2 h · Domain 2</strong></summary>

**What to learn:**
- CLAUDE.md 3-level hierarchy: **user** (`~/.claude/`) · **project** (`.claude/`) · **directory** (any subtree)
- `.claude/rules/` with `paths:` glob frontmatter — loads **conditionally**, not always
- Skills: `context: fork` (isolated output) vs no fork (interactive) · `allowed-tools` · `argument-hint`
- `-p` / `--print` flag: the **only** correct non-interactive CI mode

**Watch:** [Claude Code in Action](https://anthropic.skilljar.com/claude-code-in-action)

**Read:** [Memory](https://code.claude.com/docs/en/memory) · [Skills](https://code.claude.com/docs/en/skills) · [Headless Mode](https://code.claude.com/docs/en/headless)

</details>

<details>
<summary><strong>Phase 5 — Prompt Engineering · 3 h · Domain 3</strong></summary>

**What to learn:**
- Few-shot examples: target **ambiguous** edge cases with rationale, not easy common cases
- Explicit criteria (`confidence ≥ 0.85 AND flag_count == 0`) vs vague ("be conservative")
- Validation-retry: return the invalid field + specific correction — but **retry fails when data is absent from source**
- Batch API: 50% cost · up to 24 h · no latency SLA · **no multi-turn tool calling** · `custom_id` for correlation

**Read:** [Message Batches](https://platform.claude.com/docs/en/build-with-claude/message-batches) · [Prompt Engineering](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)

</details>

<details>
<summary><strong>Phase 6 — Context Management & Reliability · 2 h · Domain 5</strong></summary>

**What to learn:**
- Lost-in-the-middle: critical info at **top** or **bottom** of context, never middle
- Case-facts block: customer name / order ID / issue description lives **outside** summarized history
- Reliable escalation triggers: structural rules only — **not** sentiment, not model self-confidence
- Provenance: claim + source URL + retrieval date + confidence — preserve **both** when sources conflict
- Aggregate accuracy can hide per-category failures — use **stratified sampling**

</details>

<details>
<summary><strong>Phase 7 — Scenario Practice · 4 h · All domains</strong></summary>

Work through all 8 exam scenarios. 4 appear randomly on the real exam — know all 8.

Run `/scenario [1-8]` for each. The 8 scenarios:
1. Customer Support Agent · 2. Code Generation with Claude Code · 3. Multi-Agent Research
4. Developer Productivity Tools · 5. Claude Code for CI/CD · 6. Structured Data Extraction
7. Conversational AI Architecture · 8. Agentic AI Tools

</details>

<details>
<summary><strong>Phase 8 — Tricky Details & Gap Closure · 2 h · All domains</strong></summary>

- Read every `tricky-details.md` across all 6 modules
- Run `/readiness` — fix anything below 🟡
- Spend remaining time on your weakest domain

</details>

<details>
<summary><strong>Phase 9 — Labs: Hands-On Build Track · 36 h (optional)</strong></summary>

Build all 6 labs for deep mastery. See the [Labs section](#hands-on-labs) below.

</details>

<details>
<summary><strong>Phase 10 — Exam Day</strong></summary>

- Night before: read all 5 `key-points.md` files
- Morning of: take `practical_test_en.html` under exam conditions (90 min, no notes)
- Use [Final Mock Guide](course/assessments/final-mock-guide.md) to decide: 🟢 sit / 🟡 review / 🔴 study more

</details>

> Full phase checklist with reading lists and success criteria: [`ROADMAP.md`](ROADMAP.md)

---

## Course Structure

Each of the 6 modules has the same 6 files:

| File | Purpose |
|---|---|
| `README.md` | The lesson — deep explanations, rules in bold |
| `key-points.md` | 8–12 decision rules in "If X → do Y, because Z" format |
| `tricky-details.md` | Pass/fail distinctions — **Trap → Reality → Tell** |
| `exercises.md` | Applied practice (fix-this-design, spot-the-anti-pattern) |
| `quiz.md` | 8–10 scenario MCQs · score ≥80% before moving on |
| `_ai-tutor.md` | Optional Claude Code commands for this module |

```
course/
  00-foundations/          Claude API, messages, stop_reason ············· 3 h
  01-agent-architecture/   Agentic loop, hooks, orchestration · 27% ····· 8 h
  02-tool-design-mcp/      Tool schemas, MCP server + resources · 18% ··· 5 h
  03-claude-code-config/   CLAUDE.md, rules, skills, CI · 20% ··········· 6 h
  04-prompt-engineering/   Few-shot, JSON schema, Batch API · 20% ······· 6 h
  05-context-reliability/  Context window, escalation, provenance · 15% · 5 h
  scenarios/               8 integrative case studies
  assessments/             Diagnostic + final mock guide
```

[→ Start with the course syllabus](course/README.md)

---

## Hands-On Labs

Six projects in different domains — so you generalize patterns, not memorize one example.

| Lab | Domain | Build | Exam Domains | Time |
|---|---|---|---|---|
| [Lab 1 — Support Agent](labs/lab-1-support-agent/) | E-commerce | Agent loop · `PreToolUse` hook · escalation | D1, D4, D5 | 6 h |
| [Lab 2 — MCP Server](labs/lab-2-mcp-server/) | Library catalog | MCP tools + resources + structured errors | D4 | 5 h |
| [Lab 3 — Team Config](labs/lab-3-claude-code-team/) | Web application | CLAUDE.md hierarchy · rules · skills | D2 | 4 h |
| [Lab 4 — Extraction Pipeline](labs/lab-4-extraction-pipeline/) | Finance / invoices | JSON schema · validation loop · Batch API | D3, D5 | 6 h |
| [Lab 5 — Multi-Agent Research](labs/lab-5-multi-agent-research/) | Market research | Coordinator + subagents + provenance | D1, D4, D5 | 7 h |
| [Capstone — CI/CD Review Bot](labs/capstone/) | Software delivery | `claude -p` · structured output · review | D1, D2, D3, D5 | 8 h |

[→ Lab index, prerequisites map, and difficulty order](labs/README.md)

---

## AI Study System

If you have [Claude Code](https://claude.ai/code) installed, use these commands directly in this project:

| Command | What it does |
|---|---|
| `/quiz [topic]` | 5 exam-style questions — scored with rationale |
| `/explain [concept]` | Rule → exam implication → scenario → anti-pattern |
| `/scenario [1-8]` | 6 questions on one exam scenario, fully scored |
| `/readiness` | 15-question cross-domain assessment → 🟢🟡🔴 per domain |
| `/fetch-doc [url]` | Fetches an official Anthropic doc → exam summary + 5 questions |

**Autonomous workflow:** `study-domain` with `{"domain": 1-5}` — reads the guide, generates 10 validated MCQs, builds 15 flashcards + a one-page cheat sheet. All automated.

> [!NOTE]
> Claude Code is optional. Everything in `course/` and `labs/` works as plain markdown on GitHub.

---

## Free Anthropic Courses

| Course | What it covers |
|---|---|
| [Building with the Claude API](https://anthropic.skilljar.com/claude-with-the-anthropic-api) | Tool use, streaming, SDKs, production patterns |
| [Introduction to Agent Skills](https://anthropic.skilljar.com/introduction-to-agent-skills) | Build, configure, and share Skills in Claude Code |
| [Claude Code in Action](https://anthropic.skilljar.com/claude-code-in-action) | Integrate Claude Code into your dev workflow |
| [Intro to Model Context Protocol](https://anthropic.skilljar.com/introduction-to-model-context-protocol) | Build MCP servers and clients in Python |
| [MCP: Advanced Topics](https://anthropic.skilljar.com/model-context-protocol-advanced-topics) | Sampling, notifications, production transports |
| [Claude 101](https://anthropic.skilljar.com/claude-101) | Core features and best practices |
| [AI Fluency: Framework & Foundations](https://anthropic.skilljar.com/ai-fluency-framework-foundations) | Foundational AI thinking |
| [Claude with Amazon Bedrock](https://anthropic.skilljar.com/claude-in-amazon-bedrock) | Full AWS accreditation course |
| [Claude with Google Vertex AI](https://anthropic.skilljar.com/claude-with-google-vertex) | Google Cloud setup to production |

---

## Certificate

<div align="center">

![Certificate Example](image-1.png)

</div>

---

## Reference Guides

Multi-language study guides and PDF versions in [`/pdf`](./pdf):

[English](./guide_en.MD) · [Spanish](./guide_es.md) · [Russian](./guide_ru.MD) · [Chinese](./guide_zh.md) · [Japanese](./guide_ja.md) · [Arabic](./guide_ar.MD) · [Korean](./guide_ko.md) · [Italian](./guide_it.md) · [Hebrew](./guide_he.md) · [Urdu](./guide_ur.md)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To add a translation, open an issue with the "Add Translation" template — PDF versions are generated automatically on PR merge.

---

## License

- **Educational content** (course/, scenarios, assessments, guide files): [CC-BY-4.0](LICENSE)
- **Code and tooling** (labs/, .claude/): [MIT](LICENSE-CODE)

---

<div align="center">

Built by [Baris Demirkap](https://www.linkedin.com/in/barisdemirkap) · Original guide by [Paul Larionov](https://github.com/paullarionov)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-barisdemirkap-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/barisdemirkap)
[![GitHub](https://img.shields.io/badge/GitHub-barisdemirkap-181717?style=flat-square&logo=github)](https://github.com/barisdemirkap)

</div>
