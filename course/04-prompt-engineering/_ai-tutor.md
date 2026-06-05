# AI Tutor — 04 — Prompt Engineering & Structured Output *(Optional — requires Claude Code)*

> You can complete the entire course without Claude Code. This file is a bonus accelerator.

Use the skills below from inside the `claude-certified-architect` project directory. Each command launches an interactive study session mapped to the concepts in this module.

---

## Quick Commands

### Generate a quiz on this module's topics

```
/quiz "prompt engineering"
```

Covers: few-shot example design, explicit criteria, JSON schema field types, tool_use limitations, retry logic, Batch API constraints, and lost-in-the-middle. Aim for >=80% before the exam.

```
/quiz "structured output"
```

Focuses on JSON schema design (required vs nullable, enum escape hatches), tool_use syntax vs semantic errors, and validation-and-retry patterns.

### Deep-dive explanations

```
/explain "JSON schema design"
```

Walks through required vs nullable, enum + detail field pattern, and how field types affect model behavior during extraction. Includes the exam rule and one anti-pattern.

```
/explain "few-shot examples"
```

Covers when to use examples, how to target edge cases, and why rationale outperforms bare examples. Includes the fixation anti-pattern.

```
/explain "Message Batches API"
```

Covers the 50% cost savings, 24-hour processing time constraint, the single-call-per-item limitation, and multi-turn tool calling incompatibility.

```
/explain "tool_use structured output"
```

Covers what tool_use actually fixes (syntax errors) and what it does not fix (semantic errors). Includes the exam trap and the realistic scenario.

```
/explain "prompt chaining"
```

Covers sequential, dynamic decomposition, and interview patterns with the exam-relevant criteria for choosing between them.

### Scenario practice

```
/scenario 6
```

Structured Data Extraction scenario — directly exercises JSON schema design, required vs nullable, tool_use, validation-and-retry, and Batch API decisions in a realistic production context.

```
/scenario 5
```

Developer Productivity scenario — exercises prompt chaining (sequential and dynamic decomposition) and explicit criteria design for automated code review pipelines.

---

## Structured Study Session

To run a full focused study session on Domain 4, use the `study-domain` workflow with these arguments:

```
study-domain {"domain": 4}
```

This generates:
- A domain summary covering all 8 core concepts
- 10 practice questions at exam difficulty
- A flashcard set for spaced repetition review

---

## Suggested Study Order

1. Read `README.md` end-to-end (45 min)
2. Review `key-points.md` — identify which rules feel uncertain (10 min)
3. Work through `exercises.md` — write your answer before revealing (60-90 min)
4. Run `/quiz "prompt engineering"` — note which questions you miss (15 min)
5. Run `/explain [concept]` for each missed question's concept (20-30 min)
6. Read `tricky-details.md` — map each trap to a quiz question you got wrong (15 min)
7. Run `/scenario 6` for a full production scenario session (30-45 min)
8. Retake the `quiz.md` questions cold — target >=80% (15 min)

Total: approximately 4-5 hours active study, within the 6-hour estimate.

---

## Flashcard Prompts for Self-Testing

Use these as verbal self-checks before moving to the next module:

- "What kind of cases do few-shot examples target?" → edge cases and ambiguous boundaries, with rationale
- "What does tool_use fix? What doesn't it fix?" → syntax errors yes; semantic errors no
- "What field type prevents fabrication for optional data?" → nullable: `"type": ["string", "null"]`
- "When does retry fail?" → when the data is absent from the source document
- "What are the three hard constraints of the Batches API?" → 24h processing, no latency SLA, no multi-turn tool calling
- "What is the lost-in-the-middle effect?" → degraded attention to content in the middle of long contexts, regardless of window size
- "What makes an explicit criterion explicit?" → a numeric threshold or boolean condition, not a qualitative adjective
