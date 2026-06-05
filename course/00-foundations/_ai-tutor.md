# AI Tutor — Module 00: Foundations *(Optional — requires Claude Code)*

> You can complete the entire course without Claude Code. This file is a bonus accelerator.

---

## How to Use This File

Open this project in Claude Code and run the commands below from the terminal. The study coach (configured in `.claude/CLAUDE.md`) knows the exam domains, applies the Socratic method, and connects every explanation to an exam pattern. The commands below are the highest-value entry points for this specific module.

---

## Recommended Commands for Module 00

### Understand the two most exam-critical concepts

```
/explain stop_reason
```

This will walk you through all four `stop_reason` values, the correct action for each, why `"end_turn"` is the only valid agentic loop exit, and common trap answer patterns. Ask for a follow-up quiz question to test your retention.

```
/explain context window
```

This covers context budget composition (system prompt + history + tools + results), the lost-in-the-middle effect, progressive summarization trade-offs, and prompt caching. Connect this to token economics before moving on.

### Deeper concept explanations

```
/explain Messages API stateless
```

```
/explain system prompt vs user message
```

```
/explain prompt caching
```

```
/explain tool_result message structure
```

### Run a focused quiz on this module

```
/quiz stop_reason
```

```
/quiz context window
```

```
/quiz API fundamentals
```

Or run a full 5-question mixed quiz across all Foundations topics:

```
/quiz foundations
```

### Practice with a relevant scenario

The Foundations concepts appear most directly in these scenarios:

```
/scenario 7
```

Scenario 7 (Conversational AI Architecture Patterns) exercises context window management, instruction persistence across turns, and memory strategies — all built on Foundations primitives.

```
/scenario 1
```

Scenario 1 (Customer Support Agent) exercises system prompt placement, tool result handling, and agentic loop exit conditions in a realistic production context.

### Check your domain readiness

After completing the exercises and quiz in this module, run:

```
/readiness
```

The readiness assessment will flag weak spots across all 5 domains. Foundations material surfaces primarily under Domain 5 (Context Management and Reliability) and as prerequisite knowledge tested implicitly in Domains 1 and 4.

---

## study-domain Workflow

To generate a full study session (summary + 10 practice questions + flashcard set) tuned to the concepts most relevant to this module, use the `study-domain` workflow:

**For context management (Domain 5, which builds directly on Foundations):**

In Claude Code, trigger:

```
study-domain
```

When prompted for a domain, enter: `5` or `Context Management and Reliability`

This generates a 10-question set that will include stop_reason, context window budget, and stateless API questions in realistic scenario format.

---

## Fetch Official Documentation

To get an exam-oriented summary of the official API documentation plus an auto-generated quiz:

```
/fetch-doc https://platform.claude.com/docs/en/api/messages
```

```
/fetch-doc https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
```

---

## Suggested Study Sequence with Claude Code

1. Read `README.md` cold (no assistance)
2. Run `/explain stop_reason` — verify your understanding matches the explanation
3. Complete Exercise 2 (fix the agentic loop) without hints, then discuss your fix with Claude Code
4. Run `/quiz foundations` — aim for 80%+ before proceeding
5. If score is below 80%, run `/explain [the concept you missed]` for each wrong answer
6. Run `/readiness` to confirm Foundations is solid before starting Module 01
