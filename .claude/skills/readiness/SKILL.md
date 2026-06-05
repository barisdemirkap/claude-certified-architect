---
context: fork
---

Run a comprehensive exam readiness assessment for the Claude Certified Architect — Foundations certification.

Generate a 15-question diagnostic test — 3 questions per domain — covering all 5 domains proportionally to their exam weight.

**Domain allocation:**
- Domain 1 (Agent Architecture, 27%) — 4 questions
- Domain 2 (Tool Design & MCP, 18%) — 3 questions
- Domain 3 (Claude Code Config, 20%) — 3 questions
- Domain 4 (Prompt Engineering, 20%) — 3 questions
- Domain 5 (Context & Reliability, 15%) — 2 questions

For each domain, use one easy, one medium, one hard question. Hard questions involve subtle distinctions or realistic edge cases.

**Format:**

# Exam Readiness Assessment

*15 questions across all 5 domains. Answer all questions, then reply with:*
*`D1: A B C D | D2: A B C | D3: A B C | D4: A B C | D5: A B`*

---

## Domain 1: Agent Architecture & Orchestration (27%)

**Q1 [Easy]** ...
**Q2 [Medium]** ...
**Q3 [Medium]** ...
**Q4 [Hard]** ...

## Domain 2: Tool Design & MCP Integration (18%)
[3 questions]

## Domain 3: Claude Code Configuration (20%)
[3 questions]

## Domain 4: Prompt Engineering & Structured Output (20%)
[3 questions]

## Domain 5: Context Management & Reliability (15%)
[2 questions]

---

When the user submits answers, produce this readiness report:

# Readiness Report

## Overall Score: X/15 (X%) — [READY / BORDERLINE / NEEDS WORK]

| Domain | Score | % | Status | Weakest Concept |
|---|---|---|---|---|
| D1: Agent Architecture | X/4 | X% | 🟢/🟡/🔴 | [concept] |
| D2: Tool Design & MCP | X/3 | X% | 🟢/🟡/🔴 | [concept] |
| D3: Claude Code Config | X/3 | X% | 🟢/🟡/🔴 | [concept] |
| D4: Prompt Engineering | X/3 | X% | 🟢/🟡/🔴 | [concept] |
| D5: Context & Reliability | X/2 | X% | 🟢/🟡/🔴 | [concept] |

**Status key:** 🟢 Ready (≥75%) | 🟡 Borderline (50-74%) | 🔴 Needs Work (<50%)

## Answer Key & Explanations
[For each question: correct answer + 2-sentence explanation]

## Personalized Study Plan
Based on your results, prioritize in this order:
1. [weakest domain] — Run: `/quiz Domain X` and study-domain workflow with args domain:X
2. [second weakest] — Run: `/explain [specific weak concept]`
3. [concept gap] — Read: guide_en.MD Chapter Y

## Exam Readiness Prediction
[Given the 720/1000 passing threshold and your domain scores weighted by exam weight, estimate likelihood of passing and what to focus on in remaining study time]
