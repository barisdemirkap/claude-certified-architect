# Scenario 7: Conversational AI Architecture

## Overview

A healthcare company builds a patient-facing conversational assistant that handles appointment scheduling, symptom triage, medication reminders, and general health questions. Conversations span multiple turns over minutes or hours. The API is stateless — no session is maintained server-side — so the application must manage context explicitly. Stakes are high: context loss can cause the assistant to repeat questions the patient already answered; instruction drift can cause the assistant to adopt a tone or policy inconsistent with clinical guidelines; missed escalation signals (e.g., a patient expressing distress) can have serious consequences.

## Architecture

**Components:**
- Claude API (stateless — no session_id, no server-side memory)
- Application server that manages conversation history in a database
- Progressive summarization module that compresses old turns into a summary
- `case-facts` block injected at the start of every system prompt (patient tier, appointment history, active medications)
- Prefill used to set the greeting format for the first assistant turn
- System prompt with stable clinical instructions (tone, escalation policy, what NOT to say)
- Escalation logic: reliable (keyword/pattern-based) vs. unreliable (model-judgment-based) triggers

**Context Assembly Per Turn:**

```
[system prompt]
  - Clinical instructions (stable)
  - case-facts block (patient context)

[conversation history]
  - Summary of turns > N (progressive summarization)
  - Recent turns verbatim (last N turns)

[current user message]
```

**Data Flows:**
1. Patient sends a message
2. Application server retrieves conversation history from database
3. If history exceeds threshold: summarize oldest turns, keep recent verbatim
4. Assemble: system prompt (instructions + case-facts) + history + new message
5. Send to Claude API
6. Claude returns response
7. Application server appends new turn to database
8. If response triggers escalation keyword: route to clinical staff immediately

## Domain Connections

| Domain | Key Concepts from This Scenario |
|---|---|
| D5 — Context Management & Reliability | Stateless API; progressive summarization; case-facts positioning; lost-in-the-middle; instruction drift |
| D4 — Prompt Engineering & Structured Output | Prefill for greeting control; system prompt stability; instruction positioning |
| D1 — Agent Architecture & Orchestration | Stateless vs. stateful agent design; when escalation is a system pattern vs. a model decision |
| D2 — Tool Design & MCP Integration | Tool design for appointment booking; minimal tool set for safety-critical context |

## Key Design Decisions

**1. The API is stateless — the application owns context**
The Claude API does not maintain sessions. Every API call is independent. The application must send the full conversation history with every request. This is not a limitation to work around — it is the designed behavior. The exam tests this as a foundational fact: there is no `session_id` parameter; context persistence is entirely the application's responsibility.

**2. Progressive summarization**
As conversations grow, sending the full verbatim history eventually exceeds the context window or degrades quality (lost-in-the-middle). Progressive summarization compresses older turns: turns beyond a rolling window are summarized into a paragraph and stored as a summary block, while recent turns are kept verbatim. The summary is prepended to the recent history, not appended. The exam tests knowing that the summary goes before the recent turns, and that verbatim recent context is always preserved.

**3. case-facts block positioning**
The patient's stable context (name, age, active medications, appointment history) is injected as a structured `case-facts` block at the very top of the system prompt, before the clinical instructions. This ensures it is never lost due to the lost-in-the-middle effect and is always in the model's highest-attention zone. The exam tests positioning: system prompt top > end of history (risky in long conversations).

**4. Instruction drift**
Over a long multi-turn conversation, the model's behavior can drift from the system prompt instructions. A patient might say "be more casual with me" and the model might shift its tone — violating clinical guidelines. Instruction drift is prevented by: keeping clinical instructions in the system prompt (not the conversation history), periodically re-asserting key constraints in the system prompt, and monitoring for drift in evaluation. The exam tests recognizing instruction drift as a context management problem, not a prompting problem.

**5. Reliable vs. unreliable escalation**
Escalation (routing to clinical staff) is too important to depend on the model's judgment. Two escalation approaches:
- **Reliable (correct):** Pattern-based detection — if the assistant's output or the patient's message contains keywords like "chest pain", "can't breathe", "want to hurt myself", the application layer intercepts and routes to clinical staff, bypassing the model's decision.
- **Unreliable (risky):** Asking the model to "decide whether to escalate" — model may misjudge, miss signals, or be distracted by context.
The exam tests this distinction: safety-critical escalation must be deterministic (application layer), not probabilistic (model judgment).

**6. Prefill for greeting format**
The first assistant turn in a new conversation should follow a specific greeting format (e.g., "Hello, I'm your health assistant. How can I help you today?"). Using prefill — pre-seeding the assistant turn — ensures the greeting is exactly right without relying on the model to generate the correct phrasing. The exam tests prefill as a technique for controlling the start of the assistant's first response.

## Typical Exam Question Patterns

**Pattern 1 — Stateless API:**
"A developer adds a `session_id` parameter to their Claude API call, expecting the API to remember prior messages. What will happen?" — The correct answer is the API does not support session_id; the parameter will be ignored or cause an error; the application must send the full history each time.

**Pattern 2 — Progressive summarization:**
"A patient has been chatting for 45 minutes and the conversation history is approaching the context limit. What is the correct strategy?" — The correct answer is progressive summarization: compress older turns into a summary block, keep recent turns verbatim, prepend the summary to recent history.

**Pattern 3 — Escalation reliability:**
"The assistant is configured to call `escalate_to_clinician()` whenever it 'feels' the patient is in distress. Why is this design risky?" — The correct answer is that model judgment is probabilistic; safety-critical escalation must use deterministic pattern matching at the application layer, not model discretion.

## Common Mistakes

- **Assuming the API is stateful.** Candidates design systems where they send only the latest message and expect Claude to "remember" prior turns. The API has no memory — full history must be sent every time.
- **Appending the summary after recent turns.** Candidates put the summary at the end of the history (where it is recency-boosted but competes with the current message). The summary should precede recent turns.
- **Trusting the model for safety escalation.** In a healthcare context, asking the model to decide whether to escalate is a patient safety risk. Application-layer detection is mandatory.
- **Putting case-facts in the middle of the history.** Candidates inject case-facts as a "system message" mid-conversation rather than at the top of the system prompt. In a long conversation, mid-history content suffers from lost-in-the-middle.
- **Confusing instruction drift with hallucination.** Instruction drift is the model gradually deviating from system prompt guidelines due to conversational influence. It is a context management problem. Candidates often misdiagnose it as a prompting or model quality issue.

## Cross-Reference

| Concept | Module | Lab |
|---|---|---|
| Stateless API and context assembly | D5 — Context Management | — |
| Progressive summarization | D5 — Context Management | — |
| case-facts positioning | D5 — Context Management | Lab 1 |
| Instruction drift | D5 — Context Management | — |
| Prefill technique | D4 — Prompt Engineering | — |
| Reliable vs. unreliable escalation | D1 — Agent Architecture | — |
