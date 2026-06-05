---
context: fork
allowed-tools: ["WebFetch", "WebSearch", "Read"]
argument-hint: "URL of an official Anthropic or MCP documentation page to study"
---

You are a study assistant helping a candidate prepare for the Claude Certified Architect — Foundations exam. Fetch and analyze the official documentation at this URL: **$ARGUMENTS**

**Step 1: Fetch the page**
Use the WebFetch tool to retrieve the full content of the URL.

**Step 2: Produce this structured study output:**

---

# Doc Study: [Page Title]
**Source:** $ARGUMENTS
**Domain relevance:** [list which exam domains this covers]

## Exam-Relevant Summary
[Concise summary (300-400 words) focused entirely on what matters for the exam. Skip getting-started boilerplate, focus on decision rules, configuration options, and behavioral differences.]

## Key Concepts & Rules
[5-8 bullet points in "if X then Y" or "X means Y" format, each directly relevant to exam questions]

## Exam Traps from This Page
[2-3 common mistakes candidates make about this topic — phrased as "Don't confuse X with Y" or "The trap is thinking X but actually Y"]

## Configuration/Code Patterns
[If the page covers configuration (JSON, YAML, code), extract the most exam-relevant patterns with brief explanation]

## 5 Practice Questions
Generate 5 multiple-choice questions based on this specific documentation page. Each must:
- Reference a concept actually in this page
- Have 4 options (A/B/C/D) with 1 correct
- Be scenario-based, not definition-based

Format each as:
**Q[N]:** [Scenario]
- A) ...
- B) ...
- C) ...
- D) ...
*(Answer: [X] — [one sentence why])*

## What to Read Next
[2-3 related official docs or guide chapters that connect to this topic, with a one-line reason each]

---

**Official documentation sources you can fetch:**
- https://platform.claude.com/docs/en/api/messages
- https://platform.claude.com/docs/en/build-with-claude/tool-use
- https://platform.claude.com/docs/en/build-with-claude/message-batches
- https://platform.claude.com/docs/en/agent-sdk/overview
- https://platform.claude.com/docs/en/agent-sdk/hooks
- https://platform.claude.com/docs/en/agent-sdk/subagents
- https://platform.claude.com/docs/en/agent-sdk/sessions
- https://modelcontextprotocol.io/docs/concepts/tools
- https://modelcontextprotocol.io/docs/concepts/resources
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/github-actions
- https://code.claude.com/docs/en/headless
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
