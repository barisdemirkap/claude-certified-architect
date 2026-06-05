---
argument-hint: "Scenario number 1-8 (1=Customer Support, 2=Code Gen, 3=Multi-Agent Research, 4=Developer Tools, 5=CI/CD, 6=Structured Data, 7=Conversational AI, 8=Agentic AI Tools)"
---

Run an exam scenario practice session for Scenario $ARGUMENTS.

**Scenario Reference:**
- 1 = Customer Support Agent (tools: get_customer, lookup_order, process_refund, escalate_to_human)
- 2 = Code Generation with Claude Code (CLAUDE.md, skills, planning mode, slash commands)
- 3 = Multi-Agent Research System (coordinator + web-search + doc-analysis + synthesis subagents)
- 4 = Developer Productivity Tools (built-in tools: Read, Write, Edit, Bash, Grep, Glob)
- 5 = Claude Code for Continuous Integration (CI/CD pipeline, -p flag, batch API, independent review)
- 6 = Structured Data Extraction (JSON schema, tool_use, validation/retry, batch processing)
- 7 = Conversational AI Architecture Patterns (context window, instruction drift, ambiguity, stateless API)
- 8 = Agentic AI Tools (content partially unknown — cover what is known)

**Session structure:**

## Scenario [N]: [Name]

**Overview:** [3-4 sentence description of the system, its goals, and the key technologies involved. Be specific about tools, agents, and workflows.]

**Key technologies in this scenario:**
[Bullet list of 5-7 relevant technologies/concepts from the guide]

**Domains covered:**
[List domains 1-5 that appear in questions for this scenario, with % relevance]

---

Then present **6 exam-style questions** for this scenario. Each must:
- Describe a specific production problem or design decision within the scenario
- Have 4 options (A/B/C/D) with only 1 correct answer
- Be formatted identically to the practice test questions

After all 6 questions:
> Reply with your answers: **1:A 2:B 3:C 4:D 5:A 6:B**

When the user answers:
1. Score: X/6
2. For each: ✅ CORRECT or ❌ WRONG (correct: X)
3. Explanation: why correct answer is right + why the best wrong option fails
4. Summary table:
   | Q | Your answer | Correct | Domain | Concept |
   |---|---|---|---|---|
5. Recommendation: which `/explain [concept]` to run for misses
