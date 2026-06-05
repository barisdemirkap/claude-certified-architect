# AI Tutor — Tool Design & MCP Integration *(Optional — requires Claude Code)*

> You can complete the entire course without Claude Code. This file is a bonus accelerator.

---

## How to Use Claude Code for This Module

Claude Code is running in this project with a study coach configured in `.claude/CLAUDE.md`. The coach uses the Socratic method, connects every concept to an exam domain, and offers follow-up quiz questions after explanations.

Open a terminal in this project directory and run the commands below.

---

## Recommended Session Flow

### Step 1 — Warm up with a targeted quiz

```
/quiz MCP integration
```

This generates 5 exam-style questions on MCP configuration, error handling, and tool selection. Aim for 80% before proceeding. If you miss a question, use `/explain` on the concept you got wrong.

### Step 2 — Deep-dive on the hardest concept

The most commonly missed concept in this domain is `tool_choice`:

```
/explain tool_choice
```

The coach will give you the one-sentence rule, the exam-relevant implication, a realistic scenario, and the anti-pattern to avoid. After the explanation, ask: "Can you quiz me on tool_choice values?"

### Step 3 — Practice with full scenarios

This domain appears heavily in two exam scenarios. Run both:

```
/scenario 3
```
Multi-Agent Research scenario — tests tool allocation across agents, tool count, and MCP resource vs tool distinction.

```
/scenario 4
```
Developer Productivity scenario — tests MCP configuration file placement, Claude Code tool integration, and built-in vs MCP tool priority.

### Step 4 — Domain readiness check

```
/readiness
```

The coach will assess your readiness across all 5 domains. Pay attention to Domain 2 scores. If you score below 70% on Domain 2, return to the `tricky-details.md` file and re-read the entries on description-vs-schema and error retryability.

---

## study-domain Workflow

To run a full structured study session on this domain specifically, use the `study-domain` skill:

```
In Claude Code, run the study-domain skill with these args:
{ "domain": 2 }
```

This generates:
- A domain summary
- 10 practice questions scoped to Domain 2
- A flashcard set for key-point review

---

## Targeted `/explain` Commands for This Module

Use these for any concept you want to go deeper on:

```
/explain tool description vs input_schema
/explain MCP resources vs tools
/explain isRetryable error categories
/explain least privilege for tools
/explain tool_choice any vs auto
/explain .mcp.json vs ~/.claude.json
```

---

## Tips for This Domain

- After `/explain`, always ask the coach: "What is the anti-pattern here?" This is the most exam-relevant question for Tool Design topics.
- When the coach gives you a scenario, practice saying out loud which `tool_choice` value you would use before reading the answer.
- The tricky-details file has 5 traps that appear frequently. Read it once before each quiz session as a warm-up.
