# AI Tutor — Agent Architecture & Orchestration *(Optional — requires Claude Code)*

> You can complete the entire course without Claude Code. This file is a bonus accelerator.

The study assistant in this project understands all Module 01 concepts. The commands below invoke specific workflows that connect directly to exam-relevant content from this module.

---

## Quiz Mode

Generate a fresh 5-question exam-style quiz on agent architecture topics:

```
/quiz agent architecture
```

Or target a specific concept:

```
/quiz agentic loop
/quiz hooks PreToolUse PostToolUse
/quiz task decomposition
/quiz escalation pattern
/quiz subagent context inheritance
```

Each quiz applies the Socratic method — it asks what you think before confirming. Aim for 100% before moving on.

---

## Deep Explanations

Get a structured explanation (one-sentence rule, exam implication, realistic scenario, anti-pattern) for any concept:

```
/explain agentic loop
/explain fork_session vs resume_session
/explain hub-and-spoke topology
/explain PreToolUse hook
/explain PostToolUse hook
/explain escalation pattern
/explain task decomposition quality
/explain error propagation multi-agent
```

The tutor will connect each explanation to the **Domain 1: Agent Architecture & Orchestration (27%)** weight and tell you exactly how it appears on the exam.

---

## Scenario Practice

Two of the eight exam scenarios are the most likely to test Domain 1 concepts heavily:

**Scenario 1 — Customer Support Agent**
Tests: escalation pattern, error propagation, agentic loop exit conditions

```
/scenario 1
```

**Scenario 3 — Multi-Agent Research**
Tests: hub-and-spoke topology, task decomposition, explicit context passing, fork_session

```
/scenario 3
```

Run each scenario in full exam simulation mode: read the scenario, choose your answers, then review.

---

## Domain Study Session

Run the full structured study session for Domain 1 (summary + 10 practice questions + flashcard set):

```
Use the study-domain workflow with args: {"domain": 1}
```

Or invoke it via the Skill tool in Claude Code:

```
/study-domain
```

When prompted, select domain 1 — Agent Architecture & Orchestration.

---

## Readiness Check

After completing all files in this module, assess your Domain 1 readiness:

```
/readiness
```

The tutor will quiz you across all five domains and give you a domain-by-domain score. You need to be strong in Domain 1 (27%) — weaknesses here cost the most points.

---

## Suggested Study Sequence with Claude Code

1. Read `README.md` — build the mental model
2. Run `/explain agentic loop` — confirm your understanding
3. Complete `exercises.md` — write answers before expanding
4. Run `/quiz agentic loop` and `/quiz hooks PreToolUse PostToolUse` — identify gaps
5. Complete `quiz.md` — score yourself
6. Review `key-points.md` and `tricky-details.md` — reinforce distinctions
7. Run `/scenario 1` and `/scenario 3` — apply under exam conditions
8. Run `/readiness` — confirm Domain 1 is solid before moving to Module 02

---

## Quick Reference — Domain 1 Concepts for Tutor Queries

| Concept | Tutor Query |
|---|---|
| Agentic loop exit condition | `/explain agentic loop` |
| Hub-and-spoke vs flat | `/explain hub-and-spoke topology` |
| fork_session vs resume_session | `/explain fork_session` |
| Explicit context passing | `/explain subagent context inheritance` |
| Task decomposition | `/explain task decomposition quality` |
| PreToolUse hook | `/explain PreToolUse hook` |
| PostToolUse hook | `/explain PostToolUse hook` |
| Escalation pattern | `/explain escalation pattern` |
| Error propagation | `/explain error propagation multi-agent` |
