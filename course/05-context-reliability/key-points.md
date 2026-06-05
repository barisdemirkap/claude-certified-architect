# Key Points — Context Management & Reliability
The most important parts. Review this file before the exam.

---

**If critical information must not be missed → place it at the START or END of context**, because the model's attention degrades for content in the middle of a long context window (lost-in-the-middle effect). The START and END positions have the highest retrieval accuracy.

**If conversation history is growing too long to fit in context → summarize old turns but keep a SEPARATE verbatim case-facts block**, because summarization reliably loses specific numbers, proper nouns, dates, and structured IDs. The case-facts block is never compressed; it holds customer name, account number, order ID, and any other per-case identifiers verbatim.

**If a tool returns a large payload (many fields, many rows) → trim it with a PostToolUse hook before it enters context**, because full payloads consume context budget and introduce irrelevant data that can confuse the model. Only the fields needed for the current task should reach the model.

**If you need a reliable escalation trigger → use a structural rule (explicit customer request, issue-type list, amount threshold, account flag)**, because sentiment analysis, confidence scores, and classifier outputs are probabilistic and have unpredictable failure modes. Probabilistic signals must not be the sole basis for safety-critical decisions.

**If a query matches multiple records (ambiguous entity) → ask for a unique identifier before taking any action**, because the cost of acting on the wrong record (updating the wrong customer, processing the wrong order) is almost always larger than the cost of one clarifying question. Never guess between ambiguous matches.

**If two retrieved sources conflict on a fact → preserve BOTH with full attribution (source URL, retrieval date)**, because silently selecting one source and discarding the other is information loss and produces a potentially misleading output. The downstream consumer must decide which source to trust.

**If a retrieval or research agent could not find or verify a claim → state this explicitly in the output**, because silence about what was not found implies completeness. Coverage annotations document the scope of the search and flag unverified claims.

**If aggregate accuracy on a production pipeline looks good (e.g., 97%) → also check stratified accuracy per category**, because aggregate metrics can mask catastrophic per-category failure rates. A 97% aggregate with 40% accuracy on a minority document type is a failing pipeline.

**If a conversation's tone drifts away from the intended persona after many turns → reinforce the persona in the system prompt and use prefill**, because the API is stateless — accumulated assistant turns can shift behavior (instruction drift), and the fix is in the system prompt, not in conversation history length.

**If the application needs to remember anything across API calls → the caller must manage and resend all state**, because the Claude API is stateless: no session ID, no server memory. Every call starts fresh and receives only what the caller provides in the messages array.

**If evaluating a classification or extraction pipeline → require per-category stratified accuracy before declaring it production-ready**, because aggregate accuracy is a necessary but not sufficient validation signal. Per-category breakdowns reveal hidden failure modes that aggregates suppress.

**If prefill is available → use it to lock in the opening of the model's response**, because prefill prevents repetitive greeting patterns and counters instruction drift by anchoring the response style before drift-inducing patterns can take effect.
