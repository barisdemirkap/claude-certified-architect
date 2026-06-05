# Module 04 — Prompt Engineering & Structured Output
⏱ Estimated time: 6h
Guide ref: guide_en.MD lines 804–994, 1016–1073, 1764–1846

## Learning Objectives

- Design few-shot examples that target ambiguous edge cases rather than common ones
- Write explicit, measurable prompt criteria in place of vague behavioral instructions
- Architect prompt chains (sequential, dynamic decomposition, interview) for multi-step tasks
- Configure JSON schemas with correct required/nullable field semantics to prevent fabrication
- Identify when to use the Batch API versus the standard Messages API and what its hard constraints are

## Why This Matters on the Exam

Prompt Engineering & Structured Output carries **20% of the exam weight**, making it the second-highest domain alongside Claude Code Config. The exam tests this domain through production scenarios — structured data extraction pipelines, classification systems, and high-volume batch jobs — where the difference between a passing and failing answer comes down to precise knowledge of what tool_use actually fixes, what retry logic actually solves, and which field types prevent fabrication.

Many incorrect exam answers are defensible at a surface level: "use tool_use so the output is always correct" sounds reasonable. The exam rewards candidates who know the exact boundary — syntax errors, yes; semantic errors, no — and can apply that knowledge when a scenario adds a twist. Expect every concept in this module to appear with one or two plausible distractors built on partial truths.

## Core Concepts

### 1. Few-Shot Examples

Few-shot examples show the model how to handle cases it would otherwise interpret ambiguously. They are most valuable at the **edges** of a classification or extraction task — the boundary conditions where the model's prior training does not cleanly resolve the correct behavior.

Common, clear-cut cases do not benefit meaningfully from examples. The model already knows how to handle them. Adding examples for obvious cases wastes context tokens and can cause the model to fixate on the patterns in the examples rather than reasoning from first principles.

**Exam rule: Include rationale with your examples. An example with "this is classified X because Y" outperforms the same example without the explanation.** The rationale teaches the model the underlying rule, not just the label. Without rationale, the model must infer the rule from the examples alone — a less reliable process, especially on novel edge cases.

Too many examples can cause fixation: the model starts matching patterns from the examples rather than generalizing. Keep the example set focused and small. When designing a few-shot set, ask: "Would the model get this case right without the example?" If yes, cut it.

### 2. Explicit Criteria vs Vague Instructions

Vague instructions like "be conservative," "use good judgment," or "be careful about edge cases" are not reproducible. Two calls with identical inputs can produce different outputs because the instruction leaves significant interpretive space. In production systems — especially regulated ones — this is a reliability defect.

Explicit criteria eliminate interpretive space. "Approve if confidence_score >= 0.85 AND flag_count == 0" is measurable, testable, and auditable. A downstream engineer can verify that the model applied the rule correctly. A vague instruction cannot be verified.

**Exam rule: Replace any instruction that uses qualitative adjectives (conservative, careful, thorough) with a numeric threshold or a logical condition.** If you cannot express the criterion as a boolean expression over measurable values, it is still vague.

Explicit criteria also make errors actionable. When an extraction pipeline produces a wrong result, explicit criteria let you identify whether the model violated a specific rule — which is debuggable — versus whether it exercised poor "judgment" — which is not.

### 3. Prompt Chaining

Prompt chaining decomposes a complex task into a sequence of simpler, bounded prompts where each prompt's output feeds the next. It is the primary architectural pattern for tasks too complex for a single prompt.

**Sequential chaining** is the simplest form: extract raw data in step 1, normalize it in step 2, validate it in step 3. Each step has a clear objective and does not need to be aware of the full pipeline. This isolates failures — if step 2 fails, you know exactly where to look.

**Dynamic decomposition** shifts the planning responsibility to the model: Claude receives the input and decides how to break down the task before executing it. This is appropriate when the number and nature of subtasks varies by input. It trades predictability for flexibility.

**Interview pattern** is used when the input is ambiguous and the model needs clarification before acting. Claude asks targeted questions before producing output. This is appropriate for user-facing tasks where an incorrect assumption would produce a worthless or harmful result. It is not appropriate for batch pipelines where no human is available to answer.

**Exam rule: Each step in a prompt chain should have one clear, bounded objective. Combining multiple concerns in a single step reintroduces the complexity you were trying to decompose.**

### 4. Validation and Retry

When a structured output fails schema validation, the correct retry strategy is: return the invalid output to the model along with a specific correction instruction identifying the exact field that failed and the rule it violated. Generic "try again" instructions produce the same error.

**Exam rule: Specific correction instructions (field + rule violated) produce correct retries. Generic retry instructions do not.**

However, retry logic has a fundamental limitation: it can only extract data that is present in the source document. If a required field does not appear in the document being processed, no amount of retrying will produce a valid value. The retry loop will cycle indefinitely. A well-designed pipeline distinguishes between "the model made an extraction error" (retry) and "the data is absent" (return null or not-found). These require different code paths.

### 5. JSON Schema Design — Required vs Nullable

JSON schema field types have direct consequences for model behavior during extraction. A `required` field signals to the model that this field must be filled — which is correct when the data is always present in the source, but dangerous when it is sometimes absent.

When a field is `required` and the model cannot find the value in the source document, the path of least resistance is fabrication: the model invents a plausible value. This is a correctness defect that appears to be a formatting success.

A **nullable** field uses `"type": ["string", "null"]` and signals that the model may return `null` when the value is absent. This is the correct design for optional data. The model is not pressured to fabricate.

**Exam rule: Fields that are sometimes absent in the source data must be nullable, not required. Required fields should only be used for data that is structurally guaranteed to be present.**

Enum fields should include an "other" or "unclear" option alongside a companion free-text detail field. Without an escape hatch, the model is forced to pick the closest enum value even when none fit — a semantic error that looks like a valid output.

### 6. tool_use for Structured Output

Forcing a tool call on a schema — using `tool_use` to constrain the model's output format — eliminates **syntax errors**: the model cannot produce malformed JSON, use the wrong type for a field, or omit a required field without triggering a structured error.

This is a significant improvement over prompt-based JSON instructions, where the model might wrap output in markdown fences, use strings where numbers are expected, or add extra keys.

**Exam rule: tool_use eliminates SYNTAX errors. It does NOT eliminate SEMANTIC errors.** A semantically incorrect output is structurally valid JSON with wrong content — a correct vendor field type (`string`) filled with a wrong vendor name. The schema has no mechanism to detect this. Human review, confidence scores, or downstream validation are needed for semantic correctness.

The exam frequently presents scenarios where tool_use "seems to fix everything" and asks what category of error remains. The answer is always semantic errors.

### 7. Message Batches API

The Batches API processes large volumes of requests asynchronously at **50% cost savings** relative to the standard Messages API. It is designed for high-volume, latency-insensitive workloads: overnight invoice processing, batch classification, large-scale data extraction.

Key constraints that the exam tests directly:

- **Up to 24-hour processing time.** There is no latency SLA. Do not use Batch for anything a user is waiting for.
- **No multi-turn tool calling.** Each batch item is a single API call. The model cannot call a tool, receive a result, and continue — there is no mechanism for a tool loop within a batch item. Agentic workflows requiring tool calls are not compatible with Batch API.
- **Use custom_id to correlate results.** Batch results are not returned in submission order. The `custom_id` field you set at submission time is the only reliable way to match results to inputs.

**Exam rule: Batch API = high volume + latency-insensitive + single-turn. If the scenario involves a user waiting, tool loops, or multi-turn conversation, Batch is the wrong choice.**

### 8. Context Size vs Attention Quality

Increasing the context window size does not improve the model's attention to specific content within that context. The **lost-in-the-middle effect** describes the empirically observed degradation of model attention to content positioned in the middle of a long context, regardless of how large the window is.

**Exam rule: Placing the most critical information at the beginning or end of the context is more effective than relying on a larger context window to maintain attention.**

This has direct architectural implications: for long-document extraction, consider chunking and summarization rather than stuffing an entire document into context and hoping the model attends to the relevant section. A larger window is a capacity increase, not an attention quality increase.

## Mental Model

Prompt engineering at the architect level is about closing interpretive gaps. Every place where you write a qualitative word, the model fills in that gap with its own judgment — which varies. Every required field you write for optional data invites fabrication. Every generic retry instruction without a specific error explanation repeats the original mistake. Every few-shot example on an easy case wastes space that could train an edge case. And every tool_use schema closes the syntax gap but leaves the semantic gap open. The architect's job is to identify which gaps exist, which tools close which gaps, and which gaps require a different strategy altogether.

## What's Next

Module 05 — Context Management & Reliability covers how to manage long contexts without losing critical information, how to design reliable agents, and how to detect and recover from failures in multi-step pipelines. That module builds directly on the validation-and-retry and lost-in-the-middle concepts introduced here.
