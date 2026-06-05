# AI Tutor — Context Management & Reliability *(Optional — requires Claude Code)*

> You can complete the entire course without Claude Code. This file is a bonus accelerator.

This file maps Module 05 concepts to Claude Code skills and slash commands. Use these to get interactive explanations, exam-style quizzes, and full scenario practice sessions from within your study environment.

---

## Quick Commands

### Quiz yourself on this module

```
/quiz context management
```

Generates 5 scenario-based MCQs on context management and reliability. Covers lost-in-the-middle, case-facts blocks, escalation triggers, provenance, and aggregate vs. stratified accuracy.

```
/quiz domain 5
```

Generates 5 questions weighted toward Domain 5 (Context Management & Reliability, 15% of exam weight). Use this after completing the module to benchmark readiness.

---

## Concept Deep Dives

Use `/explain` for any concept where you want the full treatment: one-sentence rule, exam implication, realistic scenario, and the anti-pattern to avoid.

```
/explain lost in the middle
```
Get the full explanation of why middle-context content receives less model attention, including the design rule (start/end positioning) and the anti-pattern (burying key instructions in the center of a long prompt).

```
/explain case-facts block
```
Deep dive into why summarization destroys structured data, what a case-facts block looks like in practice, and the exact summarization instruction to use.

```
/explain instruction drift
```
Explanation of how accumulated assistant turns shift model behavior, why the API's stateless design makes this happen, and how to fix it with system prompt reinforcement and prefill.

```
/explain provenance attribution
```
Full treatment of the requirements for trustworthy retrieval output: source URL, retrieval date, confidence level, and the rule for handling conflicting sources.

```
/explain stratified accuracy
```
Why aggregate accuracy is insufficient, how per-category stratification reveals hidden failure modes, and what a proper evaluation plan looks like.

```
/explain escalation triggers
```
The reliable vs. unreliable distinction, with examples of each type and the architectural principle (deterministic > probabilistic for safety-critical decisions).

---

## Scenario Practice

This module's concepts appear most heavily in these exam scenarios. Practice both before your exam date.

```
/scenario 1
```
**Customer Support Agent** — Exercises multi-turn context management, case-facts block design, escalation trigger reliability, and multi-entity ambiguity handling. Directly covers Concepts 2, 4, and 5 from this module.

```
/scenario 7
```
**Multi-Agent Research** — Exercises provenance and attribution, coverage annotations, conflicting source handling, and aggregate vs. stratified accuracy evaluation. Directly covers Concepts 6, 7, and 9 from this module.

---

## Study-Domain Workflow

To generate a full structured study session for Domain 5 — Context Management & Reliability — use the `study-domain` skill directly:

```
study-domain
```

When prompted for domain arguments, provide:

```json
{"domain": 5}
```

This generates:
- A domain summary with all 9 core concepts
- 10 practice questions calibrated to Domain 5
- A flashcard set for spaced-repetition review

---

## Suggested Study Sequence for This Module

1. Read `README.md` completely (45–60 min)
2. Run `/quiz context management` — identify gaps (10 min)
3. Use `/explain [concept]` for any question you missed (15 min per concept)
4. Work through all 7 exercises in `exercises.md` before checking answers (60–90 min)
5. Complete the 10-question `quiz.md` — score it honestly (20 min)
6. If score < 80%: run `study-domain` with `{"domain": 5}` for reinforcement
7. Run `/scenario 1` and `/scenario 7` for applied practice (30 min each)
8. Final review: read `key-points.md` and `tricky-details.md` aloud (15 min)

---

## Exam-Day Reminders (ask Claude Code to quiz you on these)

Ask Claude Code: "Quiz me on the 3 things that make an escalation trigger reliable."

Ask Claude Code: "What is the lost-in-the-middle effect and what are the two correct positions for critical information?"

Ask Claude Code: "Give me a scenario where aggregate accuracy is misleading and walk me through the correct evaluation approach."

Ask Claude Code: "What does the Claude API store between calls?" — the answer should be: nothing. The caller manages all state.
