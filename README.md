# Claude Certified Architect — Foundations

> Open-source curriculum for the **Claude Certified Architect — Foundations** certification.
> Deep understanding, not just memorization.

![Certification Banner](image.png)

---

## About This Project

This curriculum was built by **Baris Demirkap** as a structured, open-source learning path for the Claude Certified Architect exam. It turns the raw study guide into a guided course with modular lessons, hands-on labs across different project domains, and an AI-powered study system built on top of Claude Code.

**Connect:**
[![LinkedIn](https://img.shields.io/badge/LinkedIn-barisdemirkap-0077B5?logo=linkedin)](https://www.linkedin.com/in/barisdemirkap)
[![GitHub](https://img.shields.io/badge/GitHub-barisdemirkap-181717?logo=github)](https://github.com/barisdemirkap)

Original study guide by [Paul Larionov](https://github.com/paullarionov) · Curriculum and labs by Baris Demirkap

---

## Exam at a Glance

| Parameter | Value |
|---|---|
| Format | 4-choice MCQ, no guessing penalty |
| Passing score | **720 / 1,000** |
| Scenarios | 4 of 8 chosen at random — know all 8 |
| Duration | ~90 minutes |
| Access | [Partner network only →](https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request) |

**Domain weights — study in this order:**

| # | Domain | Weight |
|---|---|---|
| 1 | Agent Architecture & Orchestration | **27%** |
| 2 | Claude Code Config & Workflows | **20%** |
| 3 | Prompt Engineering & Structured Output | **20%** |
| 4 | Tool Design & MCP Integration | **18%** |
| 5 | Context Management & Reliability | **15%** |

---

## Time Commitment

| Path | Hours |
|---|---|
| **Exam-prep** — modules + scenarios + assessments | **~35–45 h** |
| **Full mastery** — exam-prep + hands-on labs | **~70–85 h** |

*Suggested cadences: exam-prep ~3 weeks at 14 h/week · full mastery ~6 weeks at 13 h/week*

---

## Study Roadmap

The roadmap has 10 phases. Follow them in order — each phase lists what to read, what to watch, and what to build.

> Full checklist version: [`ROADMAP.md`](ROADMAP.md)

### Phase 0 — Setup (1 h)
Install Claude Code, open the practice test, skim the repo structure.

### Phase 1 — API Fundamentals & Tool Use (4 h) · D4, D2
`stop_reason` values · tool descriptions as the primary selector · `tool_choice` · JSON schema (required vs nullable · enum with "other") · syntax vs semantic errors.
**Watch:** [Building with the Claude API](https://anthropic.skilljar.com/claude-with-the-anthropic-api)

### Phase 2 — Agent Architecture (4 h) · D1 — 27% of exam
Agentic loop · hub-and-spoke topology · subagent context isolation · PreToolUse / PostToolUse hooks · escalation pattern (acknowledge → resolve → escalate on reiteration only).
**Watch:** [Introduction to Agent Skills](https://anthropic.skilljar.com/introduction-to-agent-skills)

### Phase 3 — MCP Integration (2 h) · D2
MCP tools vs resources vs prompts · `.mcp.json` (project/VCS) vs `~/.claude.json` (personal) · `isError` structured errors · retryable vs non-retryable categories.
**Watch:** [Intro to MCP](https://anthropic.skilljar.com/introduction-to-model-context-protocol) · [MCP Advanced](https://anthropic.skilljar.com/model-context-protocol-advanced-topics)

### Phase 4 — Claude Code Configuration (2 h) · D3
CLAUDE.md 3-level hierarchy · `.claude/rules/` path-glob loading · Skills (`context: fork`, `allowed-tools`) · `-p` flag for CI/CD.
**Watch:** [Claude Code in Action](https://anthropic.skilljar.com/claude-code-in-action)

### Phase 5 — Prompt Engineering (3 h) · D4
Few-shot examples on ambiguous cases · explicit criteria vs vague instructions · prompt chaining · validation-retry loop · Batch API (50% savings · 24 h · no multi-turn tool calling · `custom_id`).

### Phase 6 — Context Management & Reliability (2 h) · D5
Lost-in-the-middle effect · case-facts block outside summarized history · reliable vs unreliable escalation triggers · provenance (claim + source + date + confidence) · stratified accuracy vs aggregate.

### Phase 7 — Scenario Practice (4 h) · All domains
Work through all 8 exam scenarios. Run `/scenario [1-8]` for each. Focus on the 4 you find weakest — those are your highest risk.

### Phase 8 — Tricky Details & Gap Closure (2 h) · All domains
Read every `tricky-details.md` file across all 6 modules. Take the `/readiness` assessment. Target anything below 🟢.

### Phase 9 — Labs (36 h, optional)
Build the 6 hands-on projects. Do this track for deep mastery, not just exam passing.

### Phase 10 — Exam Day
Read all `key-points.md` files the night before. Take the 76-question practice test under exam conditions. Use the [Final Mock Guide](course/assessments/final-mock-guide.md) to decide: sit or study more.

---

## Course Structure

```
course/
  00-foundations/          Claude API, messages, stop_reason (3 h)
  01-agent-architecture/   Agentic loop, hooks, orchestration — 27% of exam (8 h)
  02-tool-design-mcp/      Tool schemas, MCP server + resources — 18% (5 h)
  03-claude-code-config/   CLAUDE.md hierarchy, rules, skills, CI — 20% (6 h)
  04-prompt-engineering/   Few-shot, JSON schema, Batch API — 20% (6 h)
  05-context-reliability/  Context window, escalation, provenance — 15% (5 h)
  scenarios/               8 integrative case studies (4 appear randomly on exam)
  assessments/             Diagnostic + final mock guide
```

Each module has **6 files**: `README.md` (lesson) · `key-points.md` (pre-exam card) · `tricky-details.md` (pass/fail distinctions) · `exercises.md` (applied practice) · `quiz.md` (≥80% gate) · `_ai-tutor.md` (optional Claude Code commands).

[→ Start with the course syllabus](course/README.md)

---

## Hands-On Labs

Six projects across different domains so you generalize patterns, not memorize one example.

| Lab | Domain | Build | Exam Domains | Time |
|---|---|---|---|---|
| [Lab 1 — Support Agent](labs/lab-1-support-agent/) | E-commerce | Agent loop, PreToolUse hook, escalation | D1, D2, D5 | 6 h |
| [Lab 2 — MCP Server](labs/lab-2-mcp-server/) | Library catalog | MCP tools + resources + structured errors | D2 | 5 h |
| [Lab 3 — Team Config](labs/lab-3-claude-code-team/) | Web application | CLAUDE.md hierarchy, rules, skills | D3 | 4 h |
| [Lab 4 — Extraction Pipeline](labs/lab-4-extraction-pipeline/) | Finance / invoices | JSON schema, validation loop, Batch API | D4, D5 | 6 h |
| [Lab 5 — Multi-Agent Research](labs/lab-5-multi-agent-research/) | Market research | Coordinator + subagents + provenance | D1, D2, D5 | 7 h |
| [Capstone — CI/CD Review Bot](labs/capstone/) | Software delivery | `claude -p`, structured output, independent review | D1, D3, D4, D5 | 8 h |

[→ Lab index and prerequisites](labs/README.md)

---

## AI Study System (Claude Code)

Install Claude Code, then use these commands directly in this project:

| Command | What it does |
|---|---|
| `/quiz [topic]` | 5 exam-style questions, scored with rationale |
| `/explain [concept]` | Rule → exam implication → scenario → anti-pattern |
| `/scenario [1-8]` | 6 questions on one exam scenario, scored |
| `/readiness` | 15-question cross-domain assessment → 🟢🟡🔴 per domain |
| `/fetch-doc [url]` | Fetches an official Anthropic doc → exam summary + 5 questions |

**Autonomous workflow:** run `study-domain` with `{"domain": 1-5}` → reads the guide, generates 10 validated MCQs, builds 15 flashcards + a cheat sheet.

---

## Quick Start

```
1. Fork the repo
2. Open PROGRESS.md — check off items as you complete them
3. Take the diagnostic:  course/assessments/diagnostic.md
4. Follow the roadmap:   ROADMAP.md
5. Gate yourself on each module quiz (≥80% before moving on)
6. Final decision:       course/assessments/final-mock-guide.md
```

---

## Free Anthropic Courses

| Course | Topics | Link |
|---|---|---|
| Building with the Claude API | Tool use, streaming, SDKs, production | [→](https://anthropic.skilljar.com/claude-with-the-anthropic-api) |
| Introduction to Agent Skills | Skills in Claude Code | [→](https://anthropic.skilljar.com/introduction-to-agent-skills) |
| Claude Code in Action | Claude Code dev workflow | [→](https://anthropic.skilljar.com/claude-code-in-action) |
| Intro to Model Context Protocol | MCP servers + clients in Python | [→](https://anthropic.skilljar.com/introduction-to-model-context-protocol) |
| MCP: Advanced Topics | Sampling, notifications, production transports | [→](https://anthropic.skilljar.com/model-context-protocol-advanced-topics) |
| Claude 101 | Core features, best practices | [→](https://anthropic.skilljar.com/claude-101) |
| AI Fluency: Framework & Foundations | Foundational AI thinking | [→](https://anthropic.skilljar.com/ai-fluency-framework-foundations) |
| Claude with Amazon Bedrock | Full AWS accreditation | [→](https://anthropic.skilljar.com/claude-in-amazon-bedrock) |
| Claude with Google Vertex AI | Google Cloud setup to production | [→](https://anthropic.skilljar.com/claude-with-google-vertex) |

---

## Certificate

![Certificate Example](image-1.png)

---

## Reference Guides

Multi-language study guides (PDF versions in [`/pdf`](./pdf)):
[English](./guide_en.MD) · [Spanish](./guide_es.md) · [Russian](./guide_ru.MD) · [Chinese](./guide_zh.md) · [Japanese](./guide_ja.md) · [Arabic](./guide_ar.MD) · [Korean](./guide_ko.md) · [Italian](./guide_it.md) · [Hebrew](./guide_he.md) · [Urdu](./guide_ur.md)

---

## License

- **Educational content** (course/, scenarios, assessments, guide files): [CC-BY-4.0](LICENSE)
- **Code and tooling** (labs/, .claude/): [MIT](LICENSE-CODE)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To add a translation, open an issue using the "Add Translation" template — PDF versions are generated automatically on merge.
