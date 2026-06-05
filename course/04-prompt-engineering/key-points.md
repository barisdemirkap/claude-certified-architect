# Key Points — 04 — Prompt Engineering & Structured Output
The most important parts. Review this file before the exam.

---

**If the model handles easy cases correctly but fails on edge cases → add few-shot examples targeting ONLY the ambiguous edge cases**, because common cases don't need examples — the model's training already covers them, and adding obvious examples wastes context.

**If you write few-shot examples → include rationale ("this is X because Y") alongside each example**, because examples with explicit reasoning teach the model the underlying rule; examples without reasoning force the model to infer the rule, which is less reliable on novel inputs.

**If a prompt instruction uses qualitative language (conservative, careful, thorough) → replace it with a numeric threshold or a boolean condition**, because qualitative instructions leave interpretive space that produces variable, non-auditable behavior across identical inputs.

**If a task is too complex for a single prompt → use prompt chaining with one clear bounded objective per step**, because mixing multiple concerns in one step reintroduces the complexity you were trying to decompose and makes failures harder to isolate.

**If user input is ambiguous before acting on it → use the interview pattern (Claude asks clarifying questions first)**, because acting on ambiguous input produces results that may be entirely worthless or harmful, and a clarification loop costs far less than a wrong action.

**If structured output validation fails → retry with the invalid output + specific correction identifying the exact field and the rule it violated**, because generic "try again" instructions reproduce the original error; specificity about what failed and why is what produces a correct retry.

**If a retry loop runs indefinitely for certain inputs → add a null/not-found exit path**, because retry-and-correct can only extract data that exists in the source; when data is absent, retrying the same extraction will never succeed.

**If a JSON schema field represents data that is sometimes absent from the source → make it nullable (`"type": ["string", "null"]`) not required**, because required fields pressure the model to fill them even when the value isn't present, which causes fabrication.

**If you force a tool call on a schema → expect syntax errors to disappear but semantic errors to remain**, because tool_use enforces structural correctness (types, required fields, no markdown fences) but cannot verify that the values are correct, only that they are present and well-typed.

**If an enum field has a fixed set of options → add an "other"/"unclear" option plus a companion free-text detail field**, because without an escape hatch the model is forced to choose the closest enum value even when none fit, which is a semantic error disguised as valid output.

**If a workload is high-volume, latency-insensitive, and single-turn → use the Batches API for 50% cost savings**, because the standard Messages API charges full price and is not optimized for batch throughput.

**If a workflow requires tool calls and continued reasoning after tool results → do NOT use the Batches API**, because Batch API processes each item as a single API call with no mechanism for a tool loop; multi-turn tool calling is architecturally impossible in Batch.
