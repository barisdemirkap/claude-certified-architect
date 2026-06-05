# AI Tutor — Claude Code Configuration & Workflows *(Optional — requires Claude Code)*

> You can complete the entire course without Claude Code. This file is a bonus accelerator. The commands below work when you open this repo in Claude Code and have the study skills installed.

---

## Quick-Start Commands for This Module

### Generate a 5-question quiz on this module's topics

```
/quiz claude code config
```

This invokes the `/quiz` skill with "claude code config" as the topic argument. You will receive 5 exam-style multiple-choice questions focused on CLAUDE.md hierarchy, rules glob behavior, skill frontmatter, and CI flags. Answer each question before revealing the explanation.

### Deep-dive on the most-tested concept

```
/explain CLAUDE.md hierarchy
```

This invokes the `/explain` skill. Claude will deliver:
1. The one-sentence rule
2. The exam-relevant implication
3. A realistic scenario where the distinction matters
4. The anti-pattern to avoid

After the explanation, ask a follow-up: "Give me a quiz question on this."

### Practice with the full Code Gen scenario

```
/scenario 2
```

Scenario 2 (Code Gen with Claude Code) directly tests Domain 3 knowledge. You will be presented with a realistic production scenario involving CLAUDE.md configuration decisions and skill design. Work through the sub-questions as if you are in the exam.

### Practice with the CI/CD scenario

```
/scenario 5
```

Scenario 5 (Claude Code CI/CD) tests the `-p` flag, structured output flags, session isolation for review pipelines, and how CLAUDE.md provides testing context to CI-triggered Claude Code. This scenario is the primary vehicle for the CI/CD sub-domain.

### Full domain study session

Use the `study-domain` workflow to generate a complete study session for Domain 3:

```json
{"domain": 3}
```

Invoke the `study-domain` skill (or workflow) with these args. You will receive:
- A domain summary covering all six sub-domains (3.1–3.6)
- 10 practice questions calibrated to exam difficulty
- A flashcard set for rapid pre-exam review

---

## Suggested Study Sequence

1. Read `README.md` end-to-end (30 min)
2. Run `/quiz claude code config` — note which questions you miss (15 min)
3. For each missed question: run `/explain [the concept you missed]` (20 min)
4. Work through all exercises in `exercises.md` in writing before checking answers (45 min)
5. Run `/scenario 2` — full scenario practice (30 min)
6. Run `/scenario 5` — CI/CD specific (30 min)
7. Review `tricky-details.md` and `key-points.md` (15 min)
8. Take the `quiz.md` timed (target: under 12 minutes for 10 questions)
9. Run `study-domain` with `{"domain": 3}` for a final consolidation session (30 min)

---

## Concepts to Target If You Score Below 80%

| Weak area | Command |
|---|---|
| CLAUDE.md level selection | `/explain CLAUDE.md hierarchy` |
| Rules glob conditional loading | `/explain rules path glob` |
| Skill context:fork vs no fork | `/explain context fork` |
| Personal vs project skill precedence | `/explain skill precedence` |
| CI non-interactive flag | `/explain claude code CI flag` |
| Planning mode triggers | `/explain planning mode` |
