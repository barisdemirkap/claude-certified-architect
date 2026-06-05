# Claude Certified Architect — Foundations: Study Roadmap

## Exam Quick Reference
| Parameter | Value |
|---|---|
| Format | Multiple choice, 1/4 |
| Score | 100–1000 scale, **passing = 720** |
| Guessing penalty | **None — always answer every question** |
| Scenarios | 4 randomly chosen from 8 |
| Duration | ~90 minutes (estimated) |

## Domain Weights (memorize these)
| # | Domain | Weight | Guide Chapters |
|---|---|---|---|
| 1 | Agent Architecture & Orchestration | **27%** | 3, 8, 9, 10 |
| 2 | Tool Design & MCP Integration | **18%** | 2, 4 |
| 3 | Claude Code Config & Workflows | **20%** | 5 |
| 4 | Prompt Engineering & Structured Output | **20%** | 6, 7 |
| 5 | Context Management & Reliability | **15%** | 11, 12, 13 |

## Claude Code Commands Available in This Project
| Command | Purpose |
|---|---|
| `/quiz [topic or domain]` | Interactive 5-question quiz session |
| `/explain [concept]` | Deep explanation with exam implications |
| `/scenario [1-8]` | Walk through an exam scenario with questions |
| `/readiness` | Assess readiness across all 5 domains |
| `/fetch-doc [url]` | Fetch an official doc, get exam-relevant summary + quiz |

## Workflow
```bash
# Run autonomous domain study session
# In Claude Code, use the Workflow tool with .claude/workflows/study-domain.js
# Pass args: { "domain": 1 }  (1-5)
```

---

## Phase 0: Environment Setup (Day 0 — 1 hour)

**Objective:** Get everything ready before actual studying.

### Tasks
- [ ] Ensure Claude Code CLI is installed and authenticated
- [ ] Open `practical_test_en.html` in a browser — see the exam format firsthand
- [ ] Read `README.md` to understand the repository
- [ ] Skim the Table of Contents of `guide_en.MD` (the chapter headings)
- [ ] Note which Anthropic Academy courses are free and bookmark them

### Setup Checks
- [ ] Can you run `claude -p "Hello"` in this directory?
- [ ] Does `/quiz Domain 1` work in Claude Code?

---

## Phase 1: API Fundamentals & Tool Use (Days 1–2 — 4 hours)

**Domains covered:** Domain 4 (Prompt Engineering), Domain 2 (Tool Design)

**Why start here:** Everything else (agents, MCP, skills) builds on the API. Tool use and JSON schema are in 4 of the 5 domains.

### Reading
- [ ] **Chapter 1** — Claude API: Fundamentals (`guide_en.MD` lines 116–195)
  - `stop_reason` values and what to do for each
  - System prompt behavior and scope
  - Context window risks (lost-in-middle, accumulation)
- [ ] **Chapter 2** — Tools and `tool_use` (`guide_en.MD` lines 197–304)
  - Tool description as the primary selection mechanism
  - `tool_choice`: auto / any / forced
  - JSON schema design rules (required vs optional, nullable, enums with "other")
  - Syntax errors vs semantic errors

### Video Courses (Anthropic Academy — Free)
- [ ] **Building with the Claude API** → https://anthropic.skilljar.com/claude-with-the-anthropic-api
  - Covers: function calling, tool use, streaming, SDKs, production patterns
  - Duration: ~2 hours

### Official Docs to Read
- [ ] Messages API: https://platform.claude.com/docs/en/api/messages
- [ ] Tool Use guide: https://platform.claude.com/docs/en/build-with-claude/tool-use

### Hands-on Tasks
- [ ] Write a JSON tool definition with a rich description (include: what it does, input formats, edge cases, when NOT to use it)
- [ ] Design a JSON schema with required fields, nullable fields, and enum with "other"
- [ ] Run `/quiz Chapter 1-2` to check understanding

### Success Criteria
- You can explain `stop_reason` values and the action for each without looking
- You can write a tool description that distinguishes it from a similar tool
- You know when to use `tool_choice: "any"` vs `"auto"` vs forced selection

---

## Phase 2: Agent SDK & Multi-agent Systems (Days 3–4 — 4 hours)

**Domain covered:** Domain 1 — **27% of exam (highest weight)**

**Why now:** This is the heaviest domain. Allocate full attention.

### Reading
- [ ] **Chapter 3** — Claude Agent SDK (`guide_en.MD` lines 306–444)
  - Agentic loop: `stop_reason == "end_turn"` is the ONLY reliable stop
  - Hub-and-spoke topology
  - Subagent context isolation (explicit context passing is mandatory)
  - Hooks: PreToolUse / PostToolUse — deterministic vs probabilistic
  - `Task` tool for spawning subagents
- [ ] **Chapter 8** — Task Decomposition (`guide_en.MD` lines 1078–1127)
  - Fixed pipelines vs dynamic adaptive decomposition
  - Multi-pass code review (per-file + integration pass)
- [ ] **Chapter 9** — Escalation & Human-in-the-Loop (`guide_en.MD` lines 1129–1228)
  - Escalation triggers (reliable vs unreliable)
  - Nuanced escalation pattern (acknowledge → resolve → escalate on reiteration)
  - Structured handoff protocol JSON schema
- [ ] **Chapter 10** — Error Handling in Multi-agent Systems (`guide_en.MD` lines 1230–1290)
  - Error categories: transient / validation / business / permission
  - Anti-patterns: generic status, silent suppression, abort on one failure
  - Structured error with `failureType`, `attemptedQuery`, `partialResults`, alternatives

### Video Courses (Anthropic Academy — Free)
- [ ] **Introduction to Agent Skills** → https://anthropic.skilljar.com/introduction-to-agent-skills
  - Covers: Build, configure, and share Skills in Claude Code
  - Duration: ~1 hour

### Official Docs to Read
- [ ] Agent SDK Overview: https://platform.claude.com/docs/en/agent-sdk/overview
- [ ] Agent SDK Hooks: https://platform.claude.com/docs/en/agent-sdk/hooks
- [ ] Agent SDK Subagents: https://platform.claude.com/docs/en/agent-sdk/subagents
- [ ] Agent SDK Sessions: https://platform.claude.com/docs/en/agent-sdk/sessions

### Anthropic Cookbook (Code Examples)
- [ ] Browse agent examples: https://github.com/anthropics/anthropic-cookbook

### Hands-on Tasks
- [ ] Implement a basic agent loop in Python/TypeScript that correctly handles `stop_reason`
- [ ] Build a 3-agent coordinator+subagent system with explicit context passing
- [ ] Write a `PostToolUse` hook that normalizes a date format
- [ ] Write a `PreToolUse` hook that blocks a financial operation above a threshold
- [ ] Run `/scenario 3` (Multi-Agent Research System) to practice

### Success Criteria
- You can write the agentic loop from memory (without `max_iterations` as stop condition)
- You understand why subagents need explicit context — and what happens if you skip it
- You can explain hooks vs prompts and when each is appropriate
- You can design a structured error response that enables intelligent coordinator recovery

---

## Phase 3: MCP Integration (Day 5 — 2 hours)

**Domain covered:** Domain 2 — **18% of exam**

### Reading
- [ ] **Chapter 4** — Model Context Protocol (`guide_en.MD` lines 446–545)
  - MCP tools vs resources vs prompts
  - `.mcp.json` (project, VCS) vs `~/.claude.json` (user, personal)
  - Environment variable substitution for secrets
  - `isError` flag and structured error responses
  - MCP resources as "content catalogs"

### Video Courses (Anthropic Academy — Free)
- [ ] **Intro to Model Context Protocol** → https://anthropic.skilljar.com/introduction-to-model-context-protocol
  - Covers: Build MCP servers and clients in Python from scratch
  - Duration: ~2 hours
- [ ] **MCP: Advanced Topics** → https://anthropic.skilljar.com/model-context-protocol-advanced-topics
  - Covers: Sampling, notifications, file system access, production transports
  - Duration: ~1.5 hours

### Official Docs to Read
- [ ] MCP Overview: https://modelcontextprotocol.io/
- [ ] MCP Tools: https://modelcontextprotocol.io/docs/concepts/tools
- [ ] MCP Resources: https://modelcontextprotocol.io/docs/concepts/resources
- [ ] MCP Servers: https://modelcontextprotocol.io/docs/concepts/servers

### Hands-on Tasks
- [ ] Create a `.mcp.json` for this project (use `${GITHUB_TOKEN}` substitution pattern)
- [ ] Write a tool description that clearly distinguishes `analyze_document` from `analyze_content`
- [ ] Design a structured MCP error response with `errorCategory`, `isRetryable`, `partialResults`
- [ ] Use `/fetch-doc https://modelcontextprotocol.io/docs/concepts/tools` to study and quiz

### Success Criteria
- You know the difference between project-level `.mcp.json` and user-level `~/.claude.json`
- You can distinguish transient / validation / business / permission errors and know which are retryable
- You know why a timeout and "0 results" are semantically different and require different responses

---

## Phase 4: Claude Code Configuration (Day 6 — 2 hours)

**Domain covered:** Domain 3 — **20% of exam**

### Reading
- [ ] **Chapter 5** — Claude Code (`guide_en.MD` lines 547–799)
  - CLAUDE.md hierarchy: user / project / directory
  - `@path` syntax for modular imports
  - `.claude/rules/` with YAML frontmatter and glob patterns
  - Skills: `context: fork`, `allowed-tools`, `argument-hint`
  - Planning mode vs direct execution (decision criteria)
  - `/compact` and `/memory` built-in commands
  - `-p` flag for CI/CD non-interactive mode
  - `fork_session` and `--resume`

### Video Courses (Anthropic Academy — Free)
- [ ] **Claude Code in Action** → https://anthropic.skilljar.com/claude-code-in-action
  - Covers: Integrate Claude Code into dev workflow
  - Duration: ~1.5 hours

### Official Docs to Read
- [ ] Claude Code Overview: https://code.claude.com/docs/en/overview
- [ ] CLAUDE.md and Memory: https://code.claude.com/docs/en/memory
- [ ] Skills (slash commands): https://code.claude.com/docs/en/skills
- [ ] Hooks: https://code.claude.com/docs/en/hooks
- [ ] Sub-agents: https://code.claude.com/docs/en/sub-agents
- [ ] MCP Integration: https://code.claude.com/docs/en/mcp
- [ ] GitHub Actions CI/CD: https://code.claude.com/docs/en/github-actions
- [ ] Headless mode: https://code.claude.com/docs/en/headless

### Hands-on Tasks
- [ ] This project's `.claude/CLAUDE.md` is already set up — read and understand it
- [ ] Create a `.claude/rules/test.md` with a `paths: ["**/*.test.*"]` frontmatter
- [ ] Create a skill with `context: fork` and `allowed-tools` restricted to read-only tools
- [ ] Run `claude -p "Summarize this file" < guide_en.MD` to test non-interactive mode
- [ ] Run `/scenario 2` (Code Generation with Claude Code)

### Key Exam Trap
- New team member doesn't get project instructions → they're in `~/.claude/CLAUDE.md` not `.claude/CLAUDE.md`
- Personal skills override project skills of the same name

### Success Criteria
- You can draw the 3-level CLAUDE.md hierarchy from memory
- You know when to use `.claude/rules/` with paths vs directory-level CLAUDE.md
- You can write a SKILL.md frontmatter with all 3 key parameters

---

## Phase 5: Prompt Engineering & Batch Processing (Day 7 — 2 hours)

**Domain covered:** Domain 4 — **20% of exam**

### Reading
- [ ] **Chapter 6** — Prompt Engineering (`guide_en.MD` lines 804–994)
  - Few-shot: 2-4 examples, targeted at ambiguous scenarios with rationale
  - Explicit criteria vs vague instructions
  - Prompt chaining (sequential) vs dynamic decomposition
  - "Interview" pattern
  - Validation + retry-with-feedback loop
  - Self-correction (calculate + state → detect conflict)
- [ ] **Chapter 7** — Message Batches API (`guide_en.MD` lines 1016–1073)
  - 50% savings, up to 24-hour window, no latency SLA
  - No multi-turn tool calling support
  - `custom_id` for correlation
  - When to use batch vs synchronous

### Official Docs to Read
- [ ] Prompt Engineering Guide: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- [ ] Extended Thinking: https://platform.claude.com/docs/en/build-with-claude/extended-thinking
- [ ] Message Batches: https://platform.claude.com/docs/en/build-with-claude/message-batches

### Hands-on Tasks
- [ ] Rewrite a vague instruction ("check comments for accuracy") as explicit criteria with examples
- [ ] Write 3 few-shot examples for ambiguous tool selection (customer support scenario)
- [ ] Design a validation + retry loop for a JSON extraction task
- [ ] Decide: which workflow goes to batch API? (pre-merge check vs overnight report)
- [ ] Run `/quiz Domain 4` to check understanding

### Batch API Decision Rule (commit this to memory)
- **Batch:** overnight reports, weekly audits, 10,000 document processing, anything async
- **Synchronous:** anything a developer is waiting for, pre-merge checks, interactive sessions
- **Batch is incompatible with iterative tool-calling** (the async model can't execute a tool mid-request)

### Success Criteria
- You can write a 3-example few-shot block for an ambiguous scenario
- You know the 4 Batch API constraints cold
- You can explain when retry-with-feedback helps and when it doesn't

---

## Phase 6: Context Management & Reliability (Day 8 — 2 hours)

**Domain covered:** Domain 5 — **15% of exam**

### Reading
- [ ] **Chapter 11** — Context Management (`guide_en.MD` lines 1292–1407)
  - Case facts block outside summarized history
  - `PostToolUse` hook for trimming tool results
  - Position-aware input (key findings at top, action items at bottom)
  - Scratchpad files for long investigations
  - Subagent delegation to protect main context
  - Structured state persistence for crash recovery
- [ ] **Chapter 12** — Preserving Provenance (`guide_en.MD` lines 1410–1474)
  - Attribution loss during summarization
  - Conflicting data: preserve both with attribution, let coordinator decide
  - Include dates for temporal interpretation
  - Render by content type (financial → table, news → prose)
- [ ] **Chapter 13** — Built-in Tools (`guide_en.MD` lines 1476–1510)
  - Grep (content search) vs Glob (file patterns) vs Read vs Write vs Edit vs Bash
  - Incremental investigation strategy
  - Fallback: Read + Write when Edit fails

### Hands-on Tasks
- [ ] Design a "case facts" block for a customer support scenario
- [ ] Write a structured error response for a subagent timeout
- [ ] Write a coverage annotation for a partial synthesis result
- [ ] Decide: when to use Grep vs Glob vs Read
- [ ] Run `/quiz Domain 5` to check understanding

### Success Criteria
- You know the lost-in-the-middle effect and can mitigate it in prompt design
- You can design provenance-preserving structured output for multi-source research
- You understand stratified sampling and why aggregate accuracy metrics can be misleading

---

## Phase 7: Domain Deep Dives with AI (Days 9–10 — 4 hours)

**Objective:** Fill gaps with AI-powered study sessions for each domain.

### Day 9: Domains 1 & 2 (heaviest — 45% combined)
- [ ] Run `/quiz Domain 1` — note any wrong answers, use `/explain [concept]` on gaps
- [ ] Run `/quiz Domain 2` — same process
- [ ] Run the study workflow: `args: { "domain": 1 }` then `args: { "domain": 2 }`
- [ ] Use `/fetch-doc https://platform.claude.com/docs/en/agent-sdk/hooks` for deeper hooks coverage
- [ ] Re-quiz any concepts you missed

### Day 10: Domains 3, 4 & 5
- [ ] Run `/quiz Domain 3` — CLAUDE.md hierarchy is a frequent trap
- [ ] Run `/quiz Domain 4` — batch API constraints come up often
- [ ] Run `/quiz Domain 5` — focus on provenance and escalation patterns
- [ ] Run study workflow for any domain with < 80% quiz score
- [ ] Use `/readiness` for an overall assessment

---

## Phase 8: Scenario Practice (Day 11 — 3 hours)

**Objective:** Practice all exam scenarios, especially the 4 highest-frequency ones.

### Scenario Practice (use `/scenario [N]`)
- [ ] **Scenario 1** — Customer Support Agent (Questions 46–60 in practice test)
  - Key: tool selection, hooks for enforcement, escalation triggers, case facts block
- [ ] **Scenario 2** — Code Generation with Claude Code (Questions 31–45)
  - Key: CLAUDE.md hierarchy, skills configuration, planning mode decisions
- [ ] **Scenario 3** — Multi-Agent Research System (Questions 1–15)
  - Key: coordinator/subagent, error propagation, provenance, coverage annotations
- [ ] **Scenario 5** — Claude Code for CI (Questions 16–30)
  - Key: `-p` flag, batch API incompatibility, independent review instance, few-shot

### Scenario 7 — Conversational AI Architecture Patterns (Questions 61–76)
- [ ] Run `/scenario 7`
  - Key: context window, instruction drift, ambiguity resolution, stateless API

---

## Phase 9: Full Practice Test (Days 12–13 — 6 hours)

**Objective:** Simulate exam conditions and identify final weak areas.

### Day 12: Questions 1–40
- [ ] Open `practical_test_en.html` in browser
- [ ] Complete Q1–40 without looking at the guide
- [ ] After each scenario block, review wrong answers
- [ ] Use `/explain [concept]` for any missed concept

### Day 13: Questions 41–76 + Domain Score
- [ ] Complete Q41–76
- [ ] Tally score by domain:
  - Domain 1 (Q related to agent loop, coordinator, hooks): ___/X
  - Domain 2 (Q related to tools, MCP): ___/X
  - Domain 3 (Q related to CLAUDE.md, skills, CI): ___/X
  - Domain 4 (Q related to few-shot, schema, batch): ___/X
  - Domain 5 (Q related to context, escalation, provenance): ___/X
- [ ] Run `/readiness` for final assessment
- [ ] Study any domain with < 75% score

---

## Phase 10: Exam Day Prep (Day 14 — 2 hours)

**Objective:** No new material — consolidate and build confidence.

### Morning Review (1 hour)
- [ ] Read the 15 key decision rules below
- [ ] Check the out-of-scope list (don't waste brain cycles on these)
- [ ] Run `/quiz [your weakest domain]` one final time

### 15 Key Decision Rules for the Exam

1. **Deterministic > probabilistic:** for business-critical rules → use hooks/code, not prompts
2. **Tool descriptions first:** wrong tool selection → always check descriptions before adding classifiers
3. **Explicit criteria > vague instructions:** "flag only when X contradicts Y" > "be conservative"
4. **Few-shot for consistency:** when instructions alone produce variable output → add examples
5. **`-p` flag for CI:** the only correct way to run Claude Code non-interactively
6. **Batch API = no latency SLA:** never for blocking workflows; 50% savings for async/overnight
7. **Batch API = no multi-turn tool calling:** incompatible with iterative tool workflows
8. **Subagent context isolation:** always pass full context explicitly; subagents inherit nothing
9. **`stop_reason == "end_turn"` only:** parsing text or iteration limits are anti-patterns
10. **Disable noisy categories first:** removes trust erosion immediately while improving prompts
11. **Independent review instance:** avoids confirmation bias from generation context
12. **Structured errors enable recovery:** generic errors prevent intelligent coordinator decisions
13. **`context: fork` in skills:** isolates verbose output from the main session context
14. **Project-level CLAUDE.md:** team instructions in `.claude/CLAUDE.md`, not `~/.claude/CLAUDE.md`
15. **Multi-pass > single-pass for large reviews:** prevents attention dilution across many files

### Out-of-Scope (do not study)
- Fine-tuning, model training, Constitutional AI, RLHF
- API authentication, billing, rate limiting, quotas
- Embedding models, vector database implementation
- Computer use, browser automation, Vision/image analysis
- Streaming API, server-sent events
- Cloud-provider configs (AWS, GCP, Azure)
- OAuth, API key rotation
- Token counting algorithms

---

## Resource Library

### Anthropic Academy (All Free)
| Course | URL | Domain |
|---|---|---|
| Claude 101 | https://anthropic.skilljar.com/claude-101 | Background |
| Building with the Claude API | https://anthropic.skilljar.com/claude-with-the-anthropic-api | D2, D4 |
| Introduction to Agent Skills | https://anthropic.skilljar.com/introduction-to-agent-skills | D1, D3 |
| Claude Code in Action | https://anthropic.skilljar.com/claude-code-in-action | D3 |
| Intro to Model Context Protocol | https://anthropic.skilljar.com/introduction-to-model-context-protocol | D2 |
| MCP: Advanced Topics | https://anthropic.skilljar.com/model-context-protocol-advanced-topics | D2 |
| AI Fluency: Framework & Foundations | https://anthropic.skilljar.com/ai-fluency-framework-foundations | Background |

### Official Documentation
| Resource | URL | Domain |
|---|---|---|
| Messages API | https://platform.claude.com/docs/en/api/messages | D4 |
| Tool Use | https://platform.claude.com/docs/en/build-with-claude/tool-use | D2, D4 |
| Message Batches | https://platform.claude.com/docs/en/build-with-claude/message-batches | D4 |
| Prompt Engineering | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview | D4 |
| Extended Thinking | https://platform.claude.com/docs/en/build-with-claude/extended-thinking | D4 |
| Agent SDK Overview | https://platform.claude.com/docs/en/agent-sdk/overview | D1 |
| Agent SDK Hooks | https://platform.claude.com/docs/en/agent-sdk/hooks | D1 |
| Agent SDK Subagents | https://platform.claude.com/docs/en/agent-sdk/subagents | D1 |
| Agent SDK Sessions | https://platform.claude.com/docs/en/agent-sdk/sessions | D1 |
| MCP Overview | https://modelcontextprotocol.io/ | D2 |
| MCP Tools | https://modelcontextprotocol.io/docs/concepts/tools | D2 |
| MCP Resources | https://modelcontextprotocol.io/docs/concepts/resources | D2 |
| MCP Servers | https://modelcontextprotocol.io/docs/concepts/servers | D2 |
| Claude Code Overview | https://code.claude.com/docs/en/overview | D3 |
| CLAUDE.md & Memory | https://code.claude.com/docs/en/memory | D3 |
| Skills (slash commands) | https://code.claude.com/docs/en/skills | D3 |
| Claude Code Hooks | https://code.claude.com/docs/en/hooks | D3 |
| Sub-agents | https://code.claude.com/docs/en/sub-agents | D1, D3 |
| MCP in Claude Code | https://code.claude.com/docs/en/mcp | D2, D3 |
| GitHub Actions CI/CD | https://code.claude.com/docs/en/github-actions | D3 |
| Headless mode | https://code.claude.com/docs/en/headless | D3 |

### Code Examples
| Resource | URL |
|---|---|
| Anthropic Cookbook | https://github.com/anthropics/anthropic-cookbook |
