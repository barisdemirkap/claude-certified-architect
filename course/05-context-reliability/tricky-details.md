# Tricky Details — Context Management & Reliability
These small distinctions decide pass/fail.

---

### Summarization loses numbers and names — case-facts block must stay verbatim

**Trap:** Summarizing the entire conversation history when context gets long, including the customer's order number and account details.

**Reality:** Summarization reliably loses specific numbers, proper nouns, dates, and structured data. Critical per-case facts (customer name, account number, order ID, issue description) must live in a SEPARATE verbatim block that is explicitly excluded from every summarization pass.

**Tell:** "The agent forgot the customer's order number after a long conversation" — the case-facts were inside the summarized history. The correct fix is to extract them to a dedicated case-facts block, not to use a larger context window or a more careful summarization prompt.

---

### Reliable escalation triggers are structural — not sentiment-based

**Trap:** Designing an escalation rule such as "escalate if the customer seems frustrated" or "escalate if the model's confidence score is below 0.6."

**Reality:** Sentiment analysis and model self-confidence are probabilistic and have unpredictable failure modes. Reliable escalation triggers are deterministic structural conditions: the customer explicitly requests a human, the issue type matches a predefined escalation list, a refund amount exceeds a threshold, or the account is flagged as VIP in the CRM.

**Tell:** Any exam question asking you to "design a reliable escalation system" is looking for structural/rule-based triggers. Any answer option that includes sentiment output, confidence score, or classifier output as the decision criterion is wrong.

---

### Multiple matches — ask for identifier, never guess

**Trap:** "When two customers match the query, pick the more likely one based on context clues such as recent order history."

**Reality:** The correct behavior is to detect the ambiguity and ask the user to provide a unique identifier (account number, email address, employee ID). Guessing between ambiguous matches is always the wrong architecture — the harm of acting on the wrong record is almost always larger than the cost of one clarifying question.

**Tell:** "Two customers named John Smith — what should the system do?" The correct answer is always to ask for a disambiguating identifier. Any answer option that selects one record based on heuristics or recent activity is wrong.

---

### Conflicting sources — preserve both with attribution, never silently pick one

**Trap:** When two retrieved sources disagree, use the more authoritative or more recent source and discard the other.

**Reality:** The correct behavior is to preserve both values with full attribution: "Source A (URL, retrieval date) states X; Source B (URL, retrieval date) states Y." The downstream consumer — human or agent — decides which source to trust. Silently discarding a source is data loss and may produce a misleading output.

**Tell:** A multi-source research scenario where sources conflict — the correct output includes both attributed values. Any answer that says "use the most recent source" or "prefer the primary source" and implicitly discards the other is wrong.

---

### 97% aggregate accuracy can hide 40% per-category failure

**Trap:** "Production accuracy is 97% — the extraction pipeline is working well."

**Reality:** Aggregate accuracy masks per-category failure rates. If 90% of documents are invoices (100% accurate) and 10% are receipts (40% accurate), the aggregate is 96%, which appears excellent — but the receipt pipeline is failing catastrophically. Stratified accuracy by document type or category is required to detect this.

**Tell:** Any question asking how to "properly evaluate" or "fully validate" an extraction or classification pipeline — the correct answer requires stratified per-category accuracy, not aggregate-only measurement. An answer that relies solely on aggregate accuracy is insufficient.

---

### Stateless API — no session memory, all state is caller-managed

**Trap:** "The API stores conversation state between calls so the application does not have to resend the full history."

**Reality:** Every Claude API call is completely stateless. There is no session ID, no server-side conversation memory, and no persistent context between calls. The caller must manage all state and include the full conversation history in the messages array on every single call.

**Tell:** "Where does the API store conversation state between turns?" — it does not. The caller stores it. Any answer that refers to server-side memory, session IDs, or persistent context stored by the API is wrong.

---

### Instruction drift from accumulated assistant turns

**Trap:** "The model remembers the persona defined in the early system prompt, so drift won't happen."

**Reality:** The model does not "remember" — it pattern-matches against recent context. Accumulated assistant turns in a specific style gradually shift subsequent responses (instruction drift). The fix is to reinforce the persona in the system prompt on every call and use prefill to prevent unwanted opening patterns — not to rely on an early system prompt that becomes diluted by many subsequent turns.

**Tell:** "The agent's tone became progressively more casual over a 30-turn conversation despite the system prompt specifying a professional tone" — this is instruction drift. The fix is always in the system prompt reinforcement and prefill, not in reducing conversation history length.

---

### Lost-in-the-middle — placement, not length, is the design lever

**Trap:** "The model missed an important instruction that was in the middle of the context — I need to increase the context window."

**Reality:** A larger context window does not fix the lost-in-the-middle problem. The design lever is placement: move the critical instruction to the beginning of the system prompt or to the end of the user turn (immediately before the model responds). Content remains poorly attended regardless of whether the context window is 8K or 200K tokens if it is stranded in the middle.

**Tell:** "The model is ignoring a key constraint that is listed in the middle of the prompt" — the fix is repositioning the constraint to the start or end, not increasing the context window or repeating the constraint multiple times throughout the prompt.
