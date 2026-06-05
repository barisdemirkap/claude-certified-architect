# Module 01 — Agent Architecture & Orchestration
⏱ Estimated time: 8h
Guide ref: guide_en.MD lines 306–444, 1078–1290, 1515–1603

---

## Learning Objectives

- Describe the agentic loop and identify the correct exit condition (`stop_reason == "end_turn"`)
- Distinguish hub-and-spoke topology from flat architectures and explain when each is appropriate
- Explain why subagents inherit nothing from a coordinator and design explicit context payloads accordingly
- Select hooks versus prompt instructions based on reliability requirements for a given business rule
- Evaluate a task decomposition for quality, identifying over-narrow patterns and their consequences

---

## Why This Matters on the Exam

Agent Architecture & Orchestration carries **27% of your exam score** — the single heaviest domain. Nearly every scenario you encounter will involve an agentic system of some kind, even if the surface topic is customer support or code generation. Understanding *how agents run*, *how they communicate*, and *how they fail* is what separates architects from prompt writers.

The exam tests architectural judgment, not syntax. Questions will describe a production system and ask you to spot the flaw, choose the right topology, or pick the correct exit condition. Every concept in this module has at least one high-confidence trap answer that will be presented as a plausible option. Knowing the rule is not enough — you need to know *why the wrong answer fails*.

---

## Core Concepts

### 1. The Agentic Loop

The agentic loop is the fundamental runtime pattern for all Claude-based agents. A single turn works like this: Claude receives the conversation (system prompt + messages), produces a response, and if that response includes a `tool_use` block, the `stop_reason` is `"tool_use"`. The calling application is responsible for executing the tool with the provided `input`, collecting the result, appending it to the conversation as a `tool_result` block, and sending the whole conversation back to Claude. This repeats until Claude produces a response with `stop_reason == "end_turn"`, which signals that Claude has finished reasoning and no more tool calls are needed.

The critical architectural implication is that **the application controls the loop, not the model**. Claude does not "run" autonomously — it responds to turns. The application must be designed to handle every possible `stop_reason` correctly: process `tool_use`, return results, and exit cleanly on `end_turn`. A loop that exits early (after N iterations, or when it detects certain text in the response) is broken by design.

**Exam rule: `stop_reason == "end_turn"` is the only valid exit condition for an agentic loop. Any other mechanism is an anti-pattern.**

Common failure modes include: checking whether the response text contains a keyword like "DONE" (fragile — Claude's wording varies), stopping after a fixed number of iterations (abandons tasks mid-execution), or treating any non-`tool_use` response as completion (misses edge cases). All three appear as distractor answers on the exam.

### 2. Hub-and-Spoke Topology

In a hub-and-spoke multi-agent architecture, one **coordinator agent** occupies the hub. It receives the high-level task from the user or application, decomposes it into subtasks, dispatches each subtask to a **specialized subagent** via the `Task` tool, and then waits for results. When subagents complete, the coordinator collects their outputs and synthesizes a final response. The coordinator is the single point of orchestration — it never performs the specialized work itself.

Subagents in this topology are purpose-built: a research subagent knows how to search and summarize, a code subagent knows how to read and write files, a data subagent knows how to query a database. This separation keeps each agent's context clean, its tool permissions narrow, and its behavior predictable. The coordinator's job is decomposition and synthesis, not execution.

**Exam rule: In hub-and-spoke, the coordinator decomposes and synthesizes; subagents execute. Never conflate these roles.**

The alternative — a flat architecture where a single agent does everything — scales poorly and creates a bloated context window. Hub-and-spoke is the correct answer whenever the question describes a complex, multi-step task with distinct specialized components.

### 3. fork_session vs resume_session

When a coordinator uses the `Task` tool to dispatch a subtask, it must choose a session mode. **`fork_session`** creates an entirely new, isolated execution context — a blank slate. The subagent starts with no knowledge of anything the coordinator has seen or done. **`resume_session`** continues an existing session, preserving its full conversation history and context.

The vast majority of multi-agent architectures use `fork_session` for subagents. The reason is isolation: you want each subagent to work only with what you give it, with no contamination from the coordinator's broader context. `resume_session` is appropriate when you need to continue a single agent's work across multiple invocations — for example, a long-running autonomous task that spans multiple API calls.

**Exam rule: Subagents created via `fork_session` inherit NOTHING from the coordinator — zero, by design.**

This connects directly to the next concept. Knowing that `fork_session` creates a blank slate tells you exactly what problem you are solving when you design the context payload.

### 4. Explicit Context Passing

Because `fork_session` creates a blank slate, the coordinator carries the full burden of context. Every piece of information a subagent needs to do its job must be explicitly included in the `Task` invocation. This includes: the subtask description (what to do), all relevant data (the customer's order number, the document to analyze, the code to review), the expected output format (JSON with specific fields, a summary under 200 words), and any tool permissions the subagent will need.

Failing to pass a piece of information is not a model bug — it is an architecture bug. If a subagent produces incorrect or incomplete output, the first diagnostic question is: "Did the coordinator pass everything this subagent needed?" The fix is always at the invocation level, not the subagent's system prompt.

**Exam rule: A subagent cannot access information the coordinator holds unless the coordinator explicitly passes it in the Task invocation.**

A well-designed context payload is also the primary mechanism for enforcing output contracts. If you need the subagent to return a specific JSON schema, include that schema in the Task invocation. Leaving it to the subagent's system prompt alone is weaker — system prompts can drift from what the coordinator actually needs.

### 5. Task Decomposition Quality

Good task decomposition creates subtasks that are **parallel-safe** (they can run concurrently without depending on each other's results), **bounded** (each produces a clearly defined output), and **meaningful** (each represents a coherent unit of work). Bad decomposition creates micro-subtasks that each do one trivial thing and require many sequential round-trips through the coordinator.

Over-narrow decomposition is a root cause of agent brittleness. If a coordinator must make 15 sequential tool calls to answer a simple question, it has decomposed too finely. Each round-trip adds latency, creates a dependency chain, and gives errors more opportunities to propagate. The coordinator becomes a bottleneck rather than an orchestrator.

**Exam rule: Prefer parallel, bounded subtasks over sequential, micro-grained ones. Consolidate subtasks that have no independent value.**

The exam will present decomposition designs and ask you to evaluate them. Look for: unnecessary sequential dependencies, subtasks that are too narrow to produce a useful output on their own, and coordinators that do too much work themselves instead of delegating.

### 6. The Hooks System

Hooks are event-driven callbacks that fire at specific points in an agent's execution. **`PreToolUse`** fires immediately before a tool call is executed — it receives the tool name and input, and can return a signal to block the call or modify the input before it runs. **`PostToolUse`** fires immediately after a tool call completes — it receives the tool result, and can transform or filter that result before it reaches the model.

The defining property of hooks is that they are **100% deterministic**. A hook always fires when its event occurs. It cannot be bypassed by a clever prompt, a confused model, or an unusual input. This is architecturally different from prompt instructions, which are probabilistic — Claude follows them the vast majority of the time, but not with guaranteed certainty.

**Exam rule: Hard business constraints (security, compliance, financial limits) must use hooks. Soft guidelines can use prompt instructions.**

The practical implication: if a requirement uses the words "must always" or "must never," that requirement belongs in a hook, not a system prompt. If a requirement uses "generally" or "by default," a prompt instruction is sufficient. This distinction appears in nearly every scenario that involves business rules.

### 7. The Escalation Pattern

In customer-facing agent scenarios, escalation to a human agent follows a specific three-step pattern: **(1) acknowledge** the customer's concern, **(2) attempt resolution** using available tools and information, and **(3) escalate only if** the customer reiterates the same concern after the resolution attempt. The key trigger for escalation is **persistence** — the customer continuing to raise the same issue after a genuine resolution attempt — not sentiment (frustration, anger) or first mention.

This pattern exists because immediate escalation bypasses the value of the automated system and overloads human agents with issues that could have been self-served. A customer expressing frustration is not a signal to escalate — it is a signal to acknowledge and try harder. A customer repeating the same concern after receiving an answer is the signal that the automated system cannot resolve it.

**Exam rule: Escalate on persistence (customer reiterates after resolution attempt), not on sentiment or first complaint.**

Watch for distractor answers that frame escalation as a response to emotional signals: "escalate if the customer seems upset," "escalate on any complaint," "escalate when sentiment is negative." All of these are wrong. The correct answer always includes an acknowledgement step and a resolution attempt before escalation.

### 8. Error Propagation in Multi-Agent Systems

When subagents fail, the coordinator is responsible for catching and handling those failures. A well-designed multi-agent system never silently swallows subagent errors. The coordinator must decide: retry the subagent with a modified context, continue with partial results from the subagents that succeeded, or escalate the failure to the caller with a clear error signal.

Partial results are valid and often the correct behavior. If a coordinator dispatches five subagents and four succeed, returning the four successful results with a clear annotation that one component failed is better than failing the entire request. The caller can then decide how to handle the incomplete output.

**Exam rule: Coordinators must propagate subagent errors explicitly. Partial results with clear failure annotations are architecturally correct.**

The anti-pattern is a coordinator that catches all exceptions silently and returns a fabricated response. This creates a system that appears to work but produces incorrect outputs — the worst possible failure mode for a production system.

---

## Mental Model

Think of a hub-and-spoke agent system as an **air traffic control tower** (coordinator) managing a fleet of specialized aircraft (subagents). The tower does not fly the planes — it knows where each plane needs to go, assigns routes, and synthesizes the overall traffic picture. Each plane operates independently with only the instructions the tower explicitly gives it; the plane cannot read the tower's mind. The tower's loop continues until every flight has landed (`end_turn`), not until a fixed time has elapsed. When a plane has a problem, the tower handles it — it does not pretend the plane landed safely. Hard safety rules (altitude minimums, no-fly zones) are enforced by the airspace system itself (hooks), not just by the tower's verbal instructions (prompts).

---

## What's Next

**Module 02 — Tool Design & MCP Integration (18%)** covers how to design tools that agents call, how to structure tool schemas for reliable invocation, and how the Model Context Protocol (MCP) connects agents to external systems. The concepts from this module — especially explicit context passing and hook-based enforcement — directly apply to tool design.

Before moving on, complete the quiz in `quiz.md` and score at least 80%. If you miss questions on hooks or context inheritance, revisit Core Concepts 6 and 4 before proceeding.
