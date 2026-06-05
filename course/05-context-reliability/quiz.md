# Quiz — Context Management & Reliability
Score ≥80% before moving to the next module.

---

**Q1:** A customer support agent handles 40-turn conversations. The development team notices that by turn 30, the agent frequently forgets the customer's order ID even though it was mentioned in turn 3. The team considers two fixes: (A) increase the context window from 100K to 200K tokens, or (B) extract order IDs and account numbers into a separate verbatim block placed at the top of each prompt, excluded from summarization. Which fix addresses the root cause?

A) Option A, because a larger context window retains more earlier turns in full  
B) Option B, because summarization loses specific structured data that a verbatim block preserves  
C) Option A, because the 100K window is too small to hold 30 turns  
D) Option B, because placing content at the top reduces the number of tokens the model reads

<details><summary>Answer</summary>**B** — The root cause is that the rolling summarization is compressing the order ID out of the conversation history. A larger context window does not fix summarization loss — it only delays the need to summarize. A verbatim case-facts block excluded from summarization directly addresses the root cause. | Distractor: Option A is wrong because the problem is not context window size — a 200K window still needs summarization at scale, and the order ID would still be lost. The fix is structural separation, not size.</details>

---

**Q2:** An architect designs an escalation policy for a financial services chatbot. The policy states: "Escalate if the sentiment classifier outputs frustration ≥ 0.75 OR if the customer explicitly says 'I want to speak with a human' OR if the transaction amount exceeds $10,000." Which component of this policy is architecturally unreliable?

A) The explicit customer request trigger  
B) The transaction amount threshold trigger  
C) The sentiment classifier threshold trigger  
D) All three triggers are equally reliable

<details><summary>Answer</summary>**C** — Sentiment classifier output is a probabilistic signal with unpredictable failure modes. A score of 0.76 vs 0.74 is not meaningfully different, and the classifier can be systematically wrong for certain customer groups or phrasing styles. It must not be the sole basis for a safety-critical routing decision. | Distractor: D is wrong because A and B are deterministic structural conditions — the customer either said the explicit phrase or they did not; the amount either exceeds $10,000 or it does not. These are reliable triggers.</details>

---

**Q3:** A retrieval agent searches three sources to answer the question "What is the current API rate limit for tier-2 accounts?" Source A (official docs, retrieved today) says 500 requests/minute. Source B (community forum post, 8 months old) says 1,000 requests/minute. Source C (vendor blog, 3 months old) says 750 requests/minute. What should the agent output?

A) "The rate limit is 500 requests/minute." (citing Source A as the official source)  
B) "Source A (official docs, today) states 500 req/min; Source B (forum, 8 months ago) states 1,000 req/min; Source C (vendor blog, 3 months ago) states 750 req/min. Values conflict; recommend verifying against current official documentation."  
C) "The rate limit is most likely 500 requests/minute, but this may be outdated."  
D) "Sources disagree; unable to provide an answer."

<details><summary>Answer</summary>**B** — All three values must be preserved with full attribution including source type and retrieval date. The downstream consumer needs this attribution to make an informed judgment. Even though Source A appears most authoritative, silently discarding B and C is information loss — the consumer may know something about the sources that changes the trust ordering. | Distractor: A is wrong because it silently discards conflicting evidence, which is information loss and potentially misleading if Source A is outdated. D is wrong because the agent can provide attributed values even when they conflict.</details>

---

**Q4:** A document extraction pipeline processes 20,000 forms per month and reports 98.1% overall field-extraction accuracy in its monthly metrics dashboard. A QA engineer notices that the pipeline handles three form types: Type 1 (standard, 85% of volume), Type 2 (multi-page, 10% of volume), and Type 3 (handwritten fields, 5% of volume). The engineer suspects the aggregate metric is misleading. What is the correct next action?

A) Accept the 98.1% metric — it is above the 95% production threshold so the pipeline is validated  
B) Run stratified accuracy measurement separately for each form type to detect per-category failure rates  
C) Increase the test set size from 20,000 to 100,000 to get a more reliable aggregate estimate  
D) Focus QA effort on Type 1 since it represents 85% of volume

<details><summary>Answer</summary>**B** — Aggregate accuracy can mask catastrophic per-category failure. If Type 3 (handwritten) has 40% accuracy, this would still produce a high aggregate because it is only 5% of volume. Stratified accuracy by form type is required to validate the pipeline correctly. | Distractor: A is wrong because aggregate-only measurement is insufficient — a pipeline can "pass" aggregate thresholds while catastrophically failing on a minority category. C increases statistical precision on the aggregate, which does not solve the problem.</details>

---

**Q5:** A developer builds a multi-turn agent and notices that after about 20 turns, the agent's responses become progressively shorter and more terse despite the system prompt asking for detailed, step-by-step explanations. The developer asks: "Why is the system prompt no longer being followed?" What is the correct explanation?

A) The system prompt was evicted from context because the conversation exceeded the context window  
B) The API stores a compressed version of the system prompt after many turns to save tokens  
C) Accumulated assistant turns in a terse style are pattern-matching against the system prompt, causing instruction drift  
D) The model learned from the conversation and updated its behavior weights

<details><summary>Answer</summary>**C** — This is instruction drift: the model pattern-matches against recent context, and if recent assistant turns are terse, subsequent turns follow that pattern regardless of the distant system prompt. The fix is to reinforce the persona in the system prompt on every call and use prefill. | Distractor: A is wrong because the system prompt is always included in the messages array on each stateless API call — it does not get "evicted." D is wrong because the model's weights are fixed at inference time; it does not learn from conversation turns.</details>

---

**Q6:** A search agent is asked to find information about a policy change. After searching, it finds 2 sources that confirm the change and 0 sources that contradict it. It has only searched internal documentation and has not checked the external regulatory database. What is the correct output format?

A) "The policy change is confirmed. 2 sources agree, 0 contradictions found."  
B) "The policy change is confirmed based on internal documentation. 2 internal sources (cited below) confirm; 0 contradictions found in internal docs. External regulatory database was not searched — independent verification recommended."  
C) "Unable to confirm — insufficient sources found."  
D) "The policy change is likely confirmed, with moderate confidence."

<details><summary>Answer</summary>**B** — Coverage annotations must explicitly document the scope of the search and what was not checked. The fact that the external regulatory database was not searched is critical context — the downstream consumer may not know this limitation. Silence about the search gap is misleading. | Distractor: A is wrong because it implies completeness — "0 contradictions found" without noting the limited search scope implies the agent checked all relevant sources, which it did not. C is wrong because 2 confirming sources is meaningful information that should be reported.</details>

---

**Q7:** An agent context is assembled as follows (top to bottom): [System prompt] → [5,000 tokens of retrieved documents] → [3,000 tokens of conversation history] → [500-token case-facts block] → [Current user message]. A performance review shows the agent frequently ignores constraints in the system prompt. Which restructuring is most likely to improve compliance?

A) Move the system prompt to the end, immediately before the current user message  
B) Move the case-facts block to the beginning, immediately after the system prompt, and move the current user message to the very end  
C) Duplicate the key constraints from the system prompt at the end of the context, immediately before the user message  
D) Reduce the retrieved documents to 2,000 tokens to make the system prompt relatively more prominent

<details><summary>Answer</summary>**C** — The lost-in-the-middle effect means that constraints stated only in the system prompt (far from the model's response generation point) receive less attention than content near the end of the context. Duplicating key constraints immediately before the user message places them in the high-attention end position. | Distractor: A is architecturally wrong — the system prompt must precede user content per the API structure. D reduces context pressure but does not address the positional problem; the system prompt is still far from the generation point.</details>

---

**Q8:** A CRM lookup tool returns the following JSON for a customer search on "John Smith": two records — John Smith (account #A1042, last contact 3 days ago) and John Smith (account #A7891, last contact 11 months ago). The agent needs to process a refund for "John Smith." What is the correct agent behavior?

A) Process the refund for account #A1042 because the recent contact suggests this is the active customer  
B) Process the refund for account #A7891 because older accounts are more established  
C) Halt the workflow and ask the customer to provide their account number or email address to resolve the ambiguity  
D) Process refunds for both accounts and flag for human review

<details><summary>Answer</summary>**C** — Multi-entity ambiguity must trigger a clarification request for a unique identifier. The cost of processing a refund on the wrong account (financial harm, incorrect records) is far greater than the cost of asking one clarifying question. No heuristic (recency, account age) is a reliable substitute for a unique identifier. | Distractor: A is wrong because "recent contact" is a heuristic, not a unique identifier — both John Smiths may have had recent interactions. D is wrong because it doubles the potential harm and creates a manual correction burden.</details>

---

**Q9:** An architect is reviewing a proposed agent that monitors customer conversations and triggers an alert when "the model determines it cannot handle the request." What reliability problem does this design have, and what is the correct fix?

A) No problem — the model's self-assessment is a reliable signal for escalation  
B) The model's self-assessed inability is a probabilistic output and an unreliable escalation trigger; fix by defining specific structural conditions that constitute "cannot handle" (e.g., issue type not in supported list, required data not available)  
C) The problem is latency — self-assessment adds a round-trip; fix by using a faster classifier  
D) The model cannot make self-assessments; fix by adding a separate confidence-scoring model

<details><summary>Answer</summary>**B** — Model self-assessment is a probabilistic output. The model can be confidently wrong about its own capabilities, and this self-assessment varies unpredictably across phrasings and contexts. The fix is to replace it with structural conditions: if the issue type is not on the supported-types list, if required fields are missing, if the request involves a regulated action — these are deterministic rules, not probabilistic self-judgments. | Distractor: A is wrong because model self-confidence is explicitly unreliable for safety-critical routing decisions. D is wrong because a separate confidence-scoring model is still a probabilistic output — it does not fix the fundamental architectural problem.</details>

---

**Q10:** A developer asks: "Where does Claude store the conversation history between API calls so I don't have to resend it every time?" What is the correct answer?

A) Claude stores conversation history in a session object associated with the API key  
B) Claude stores conversation history for 24 hours; after that the caller must resend it  
C) Claude does not store conversation history between calls; the caller must include the full history in the messages array on every call  
D) Claude stores conversation history in the first call and returns a session_id the caller can reference in subsequent calls

<details><summary>Answer</summary>**C** — The Claude API is fully stateless. There is no session object, no session_id, no 24-hour cache, and no server-side conversation persistence of any kind. The caller is entirely responsible for managing conversation state and must include the complete messages array on every API call. | Distractor: A and D describe a session-based architecture that does not exist in the Claude API. B implies partial server-side persistence, which is also incorrect.</details>
