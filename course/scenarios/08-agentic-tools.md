# Scenario 8: Agentic AI Tools

## Overview

A software company builds a general-purpose agentic assistant that can execute multi-step tasks on behalf of users: research and summarize topics, write and run code, manage files, call external APIs, and produce reports. Unlike the single-turn tools in Scenario 4, this system operates in a full agentic loop — it reasons, acts, observes results, and continues until the task is complete or it determines it cannot proceed. Stakes include correctness (multi-step errors compound), safety (an agent that takes wrong actions in a loop can cause significant damage), and reliability (the loop must terminate cleanly).

## Architecture

**Components:**
- Claude API in a tool-use loop with `stop_reason` detection
- A diverse tool set: `web_search`, `run_code`, `read_file`, `write_file`, `call_api`
- Human-in-the-loop checkpoints at defined decision points (before destructive writes, before external API calls)
- Subagent delegation for parallelizable subtasks
- Error propagation contract: subagent errors are surfaced to the orchestrator, not silently swallowed
- Loop termination: `stop_reason == "end_turn"` signals task completion; `stop_reason == "tool_use"` signals another action is needed

**Agentic Loop:**

```
User task
    |
  [Reason]
    |
  stop_reason == "tool_use"?
   Yes → Execute tool → Observe result → [Reason again]
   No  → stop_reason == "end_turn" → Return result to user
                                       |
                              [human checkpoint if needed]
```

**Human-in-the-Loop Checkpoints:**

| Action Type | Checkpoint Required? |
|---|---|
| Read operations | No |
| Write to local files (new files) | Optional |
| Overwrite or delete files | Yes |
| External API calls with side effects | Yes |
| Code execution in production environment | Yes |
| Code execution in sandbox | No |

## Domain Connections

| Domain | Key Concepts from This Scenario |
|---|---|
| D1 — Agent Architecture & Orchestration | Agentic loop mechanics; stop_reason detection; human-in-the-loop checkpoints; subagent delegation; error propagation |
| D2 — Tool Design & MCP Integration | Tool orchestration for complex tasks; tool selection in a large action space; MCP for external tool access |
| D5 — Context Management & Reliability | Managing context across many loop iterations; subagent context isolation; graceful degradation on error |
| D4 — Prompt Engineering & Structured Output | System prompt design for agentic behavior; structuring task decomposition instructions |

## Key Design Decisions

**1. stop_reason as the loop control signal**
The agentic loop is driven by `stop_reason` in the API response. When `stop_reason == "tool_use"`, the model has requested a tool call and the loop should execute the tool and continue. When `stop_reason == "end_turn"`, the model has determined the task is complete and the loop should terminate. Any other `stop_reason` (e.g., `"max_tokens"`, `"stop_sequence"`) requires special handling — typically surfacing an error. The exam tests knowing these values and their loop implications.

**2. Human-in-the-loop checkpoints**
Not every action requires human approval — only irreversible or high-risk actions. The checkpoint policy is: destructive file operations (overwrite, delete) always require approval; external API calls with side effects (posting data, triggering workflows) always require approval; code execution in sandboxes does not. The checkpoint is implemented at the application layer — before executing the tool call, the system checks whether this action type requires approval, pauses, presents the proposed action to the user, and waits. The exam tests knowing which action types require checkpoints and that checkpoints are application-layer, not model-layer.

**3. Subagent error propagation**
When a subagent fails (tool error, context overflow, model error), the error must be explicitly propagated to the orchestrator — not silently swallowed. If an orchestrator receives no response from a subagent and proceeds as if the task succeeded, downstream steps may fail in unpredictable ways. The correct pattern: subagent returns a structured error response; orchestrator receives the error; orchestrator decides to retry, reassign, or surface the error to the user. The exam tests the contract: errors are data, not exceptions to be hidden.

**4. Tool orchestration for complex tasks**
The agent's tool set (`web_search`, `run_code`, `read_file`, `write_file`, `call_api`) covers diverse capabilities. For a complex task like "research market trends and produce a formatted report," the agent must:
1. Use `web_search` to gather sources
2. Use `run_code` to analyze data
3. Use `write_file` to save the report
The agent must reason about which tools to use in what order. The system prompt should describe the available tools and their appropriate use cases — not just their signatures. The exam tests that tool descriptions in the system prompt drive correct selection.

**5. Loop context growth and management**
Each iteration of the agentic loop adds tool results to the context. Over many iterations (e.g., a research task with 20 web searches), the context grows substantially. Strategies:
- Summarize tool results before adding to context (compress raw HTML into key findings)
- Use subagents for parallelizable subtasks (each subagent has its own context)
- Set a max-iteration limit and gracefully terminate with a partial result rather than running until context overflow
The exam tests knowing that unbounded loops without context management will eventually fail, and that the correct design includes explicit bounds.

## Typical Exam Question Patterns

**Pattern 1 — stop_reason loop control:**
"An agentic loop should continue executing tool calls and return the final answer to the user when the task is complete. Which stop_reason value signals that the model is requesting another tool call vs. signaling completion?" — The correct answer: `"tool_use"` = another tool call needed; `"end_turn"` = task complete.

**Pattern 2 — Human checkpoint placement:**
"An agent is about to call `write_file` with `overwrite=True` on a production configuration file. Should this action require a human checkpoint?" — The correct answer is yes — destructive, irreversible file operations require human approval before execution.

**Pattern 3 — Subagent error handling:**
"A research orchestrator spawns a subagent to fetch data from an external API. The API returns a 503 error. What should the subagent do?" — The correct answer is return a structured error response to the orchestrator; do not silently return empty results or continue as if the call succeeded.

## Common Mistakes

- **Not checking stop_reason.** Candidates design loops that always continue after a tool call, never checking for `"end_turn"`. The loop runs indefinitely or until a timeout, wasting tokens and potentially taking unintended actions.
- **Requiring human approval for every action.** Over-checkpointing defeats the purpose of an agentic system. Read operations, sandbox code execution, and non-destructive writes should not require approval. The exam tests calibration, not just the existence of checkpoints.
- **Silently swallowing subagent errors.** A subagent that fails quietly causes the orchestrator to proceed with incomplete information. Structured error propagation is mandatory.
- **Treating tool descriptions as optional.** In a large action space (5+ tools), the model's tool selection is heavily influenced by the descriptions in the system prompt. Vague or absent descriptions lead to incorrect tool choices. The exam rewards detailed, use-case-oriented tool descriptions.
- **Not bounding loop iterations.** A loop without a max-iteration guard will run until context overflow or API timeout. The correct design includes an explicit iteration limit with a graceful partial-result response.

## Cross-Reference

| Concept | Module | Lab |
|---|---|---|
| Agentic loop and stop_reason | D1 — Agent Architecture | Lab 1 |
| Human-in-the-loop checkpoints | D1 — Agent Architecture | Lab 5 |
| Subagent delegation and error propagation | D1 — Agent Architecture | Lab 5 |
| Tool orchestration and descriptions | D2 — Tool Design & MCP | Lab 2 |
| Context management across loop iterations | D5 — Context Management | — |
