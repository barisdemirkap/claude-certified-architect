# Contributing to Claude Architect Course

This is an open-source curriculum for the Claude Certified Architect — Foundations certification. Contributions are welcome.

## Types of Contributions

### 1. Improve a Module
Each module has 6 files: README.md, key-points.md, tricky-details.md, exercises.md, quiz.md, _ai-tutor.md.
- Fix factual errors — with a source reference (usually guide_en.MD line number)
- Add exercises (short-answer, fix-this-design, spot-the-anti-pattern — NOT MCQ)
- Add quiz questions — must follow the scenario-MCQ format with <details> answer blocks including rationale
- Improve tricky-details entries — use the Trap/Reality/Tell format

### 2. Contribute a Lab
Labs follow a 5-file structure: README.md, SPEC.md, STARTER.md, CHECKLIST.md, SOLUTION-NOTES.md.
- Labs must be language-agnostic in specification
- SOLUTION-NOTES.md should discuss architecture decisions, not provide full code
- New labs must map to at least one exam domain and one real-world project domain
- Include a milestone structure (M1→M4) so learners get early wins

### 3. Report Exam Question Patterns
Use the "Report Exam Question Pattern" issue template.

**IMPORTANT: Do NOT reproduce verbatim exam questions or answer text. This violates the exam NDA and will be rejected.**

What you CAN report: the concept type tested, which domain, what made it tricky, which tricky-details.md entry would have helped. This keeps the curriculum relevant without violating exam integrity.

### 4. Add or Improve Translations
- Translations live as guide_XX.MD files (XX = language code)
- The PDF pipeline is in .github/workflows/markdown-to-pdf.yml
- English is the canonical source — translations track the English guide
- Use the "Add Translation" issue template before starting work to avoid duplicates

## Module File Templates

**Module file anatomy (6 files, must follow this structure):**

`README.md`: ⏱ time → Guide ref → ## Learning Objectives → ## Why This Matters → ## Core Concepts (H3 per concept) → ## Mental Model → ## What's Next

`key-points.md`: 8-12 bullets in "**If X → do Y**, because Z" format

`tricky-details.md`: Each entry: ### Title / **Trap:** / **Reality:** / **Tell:**

`exercises.md`: 5-8 applied exercises with `<details><summary>Answer</summary>` blocks

`quiz.md`: 8-10 scenario MCQs with `<details><summary>Answer</summary>` including rationale + why best-wrong-option fails

`_ai-tutor.md`: Claude Code skill + workflow mappings (optional accelerator)

**Lab file anatomy (5 files):**

`README.md`: What You'll Build → Real-World Scenario → Domains Exercised → Prerequisites → Milestones Overview

`SPEC.md`: Architecture → M1/M2/M3/M4 requirements → I/O Contract → Constraints

`STARTER.md`: Dependencies → Scaffold → Key Docs → First Steps → Pitfalls

`CHECKLIST.md`: Per-milestone checkboxes → Exam-Objective Coverage → Pitfalls → Stretch Goals

`SOLUTION-NOTES.md`: Design Decisions → Strong Solution Criteria → Common Mistakes → Exam Connections

## Pull Request Guidelines

- Reference which module or lab file(s) you changed
- For quiz additions: verify scenario-MCQ format + answer rationale is in `<details>` block
- For tricky-details additions: verify the entry maps to an actual exam question pattern (not a hypothetical)
- Run your markdown through a renderer to check table and details block formatting
- Include guide_en.MD line references for factual claims

## Attribution

This curriculum builds on the original study guide by Paul Larionov, licensed CC-BY-4.0. Attribution to the original author must be preserved in any derivative work. The course curriculum and labs are by Baris Demirkap, also CC-BY-4.0. Code and tooling (labs/, .claude/) are MIT licensed.

## Code of Conduct

Be constructive. No verbatim exam question reproduction. No personal attacks. Disagreements about pedagogical approach should be resolved with evidence (e.g., "this tricky-details entry is wrong because guide_en.MD line 452 says...").
