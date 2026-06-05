# Final Mock Exam Guide

## How to Take the Practice Test

The 76-question practice test is in `practical_test_en.html`. Open it in a browser.

### Exam Conditions

Block 90 minutes — no notes, no guide open. Treat it like the real exam.

When uncertain: eliminate the clearly wrong options first, then pick the best remaining answer. No guessing penalty — always answer every question.

### Scoring

76 questions, approximately 13.2 points each, 1000 total. Passing: **720**.

| Raw score | Questions correct | Decision |
|---|---|---|
| 800–1000 | 61–76 | Sit the exam — you're well prepared |
| 720–799 | 55–60 | Sit the exam — at or above passing |
| 650–719 | 49–54 | 1-2 days targeted review, then re-test |
| 580–649 | 44–48 | Module review for weak domains, re-test |
| Below 580 | <44 | Full study mode — not ready yet |

### Per-Domain Breakdown

Estimate how many questions per domain you got wrong. The exam weights map approximately to:
- D1 (27%): ~20 questions
- D2 (18%): ~14 questions
- D3 (20%): ~15 questions
- D4 (20%): ~15 questions
- D5 (15%): ~12 questions

Calculate your per-domain accuracy. Any domain below 60% accuracy needs targeted review before sitting.

### Readiness Decision

**🟢 Sit the exam:** Overall ≥ 720 AND no domain below 60%.

**🟡 Targeted review:** Overall 650–719 OR one domain below 60%. Spend 4-6h reviewing that domain's tricky-details.md and quiz.md, then re-test.

**🔴 Keep studying:** Overall < 650 OR two or more domains below 60%. Return to the relevant modules.

## Exam Strategy

### Common Distractor Patterns

The exam regularly uses these misleading answer choices:
- Answers that are partially correct but fail on one key condition (e.g., "hooks are good for this" is correct, but "prompts can also work here" is the trap)
- Answers that solve the symptom but not the root cause
- Answers that confuse two similar-sounding concepts (fetch_url vs load_document, .mcp.json vs ~/.claude.json)

### "Most Effective" Framing

When the question asks for the "most effective" approach, look for the answer that addresses the root cause, not a workaround. The exam rewards architectural thinking.

### Time Management

76 questions in 90 minutes = ~1.2 minutes per question. Don't spend more than 2 minutes on any single question — mark it, move on, return.

### Scenario Questions

For each scenario question: (1) identify the domain, (2) identify the specific concept being tested, (3) apply the relevant decision rule from your tricky-details files. Most wrong answers are plausible but fail on one specific rule.

## After the Test

Review every wrong answer. For each one: identify the concept, look it up in the relevant module's tricky-details.md. If a concept surprised you, run `/explain [concept]` in Claude Code for a deeper explanation.
