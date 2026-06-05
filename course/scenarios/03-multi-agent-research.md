# Scenario 3: Multi-Agent Research System

## Overview

A legal and financial research firm runs a multi-agent system that produces deep-research reports on companies and regulatory topics. A coordinator agent fans out parallel subagents to search the web, analyze documents, and synthesize findings. The stakes are high: incorrect citations can cause legal liability, conflicting claims need explicit resolution, and research coverage must be auditable.

## Architecture

**Components:**
- One coordinator (orchestrator) agent that receives the research query and manages the workflow
- Multiple parallel subagents: `web-search`, `doc-analysis`, `regulation-lookup`
- `fork_session` calls to spawn each subagent in an isolated context
- An MCP server exposing tools: `search_web`, `fetch_document`, `query_regulations_db`
- A provenance schema: every claim carries `{ claim, source_url, date, confidence }`
- Coverage annotations added by the coordinator before final synthesis
- A conflict resolution step when subagents return contradictory findings

**Data Flows:**
1. Coordinator receives research query
2. Coordinator spawns 3 parallel subagents via `fork_session` — each with an explicit context packet (query, scope, output format)
3. Each subagent uses its assigned MCP tools and returns a list of `{ claim, source_url, date, confidence }` objects
4. Coordinator collects all subagent outputs
5. Coordinator runs conflict resolution: if two subagents disagree on a claim, it flags the conflict and selects the higher-confidence source or notes the disagreement
6. Coverage annotations check that all required topics are covered
7. Final report is synthesized with inline citations

**Hub-and-Spoke Topology:**

```
                  Coordinator
                 /     |      \
        web-search  doc-analysis  regulation-lookup
             \         |         /
              \        |        /
           [claims with provenance]
                       |
              conflict resolution
                       |
               final report + citations
```

## Domain Connections

| Domain | Key Concepts from This Scenario |
|---|---|
| D1 — Agent Architecture & Orchestration | Hub-and-spoke topology; fork_session for subagent isolation; explicit context passing; parallel vs. sequential subagent execution |
| D2 — Tool Design & MCP Integration | MCP server design; tool scoping per subagent; which tools belong to which agent |
| D5 — Context Management & Reliability | Provenance schema; coverage annotations; conflict resolution; subagent context size limits |
| D4 — Prompt Engineering & Structured Output | Structured output format for subagent claims; coordinator synthesis prompt |

## Key Design Decisions

**1. fork_session for subagent isolation**
Each subagent is spawned with `fork_session`, which creates a fully isolated context. The web-search subagent cannot read the doc-analysis subagent's intermediate work, and neither can accidentally corrupt the coordinator's context. This isolation is essential for reliability: subagent failures are contained, and the coordinator receives clean, bounded outputs. The exam tests why isolation matters vs. a shared-context approach where subagents read each other's work.

**2. Explicit context passing**
The coordinator does not let subagents inherit a large, unstructured conversation history. Instead, it constructs an explicit context packet: the research query, the specific scope for that subagent, and the required output schema. This keeps subagent prompts small and deterministic. The exam tests the contrast: implicit inheritance (risky, unpredictable) vs. explicit passing (predictable, auditable).

**3. Provenance schema: claim + source + date + confidence**
Every claim a subagent returns must carry its source URL, the date of the source, and a confidence score (e.g., 0.0–1.0). This is not optional metadata — it is the primary mechanism for auditability and conflict resolution. The exam tests knowing the four fields of the provenance schema and why each is necessary (claim identifies the assertion; source enables verification; date enables recency checks; confidence enables conflict tiebreaking).

**4. Conflict resolution logic**
When two subagents return contradictory claims about the same entity, the coordinator must resolve the conflict explicitly — not silently pick one or average them. The resolution strategy: prefer the higher-confidence source; if confidence is equal, prefer the more recent date; if still tied, surface the conflict in the report with both sources. The exam tests that the coordinator has a defined resolution strategy and that conflicts are never silently discarded.

**5. Coverage annotations**
Before final synthesis, the coordinator checks that all required research topics (defined in the original query) have at least one claim with provenance. Missing coverage is flagged as a gap and surfaced in the report, not silently omitted. This prevents the system from producing confident-sounding reports that skip key topics because no source was found.

## Typical Exam Question Patterns

**Pattern 1 — fork_session purpose:**
"In a multi-agent research system, why should each subagent be spawned using fork_session rather than sharing the coordinator's context?" — The correct answer is isolation: subagent failures are contained, contexts stay small, and outputs are clean and bounded.

**Pattern 2 — Provenance fields:**
"A research subagent returns a claim about a company's revenue. What metadata must accompany the claim to support downstream conflict resolution?" — The correct answer is source URL, date, and confidence score (in addition to the claim itself).

**Pattern 3 — Conflict resolution:**
"Two subagents return contradictory figures for a company's market share. What should the coordinator do?" — The correct answer is apply the defined resolution strategy (higher confidence wins; if tied, more recent date; if still tied, surface the conflict) — not silently drop one or average the values.

## Common Mistakes

- **Thinking subagents should share context.** Candidates sometimes reason that subagents should be able to see each other's work to avoid duplication. In practice, shared context introduces race conditions, context bloat, and unpredictable behavior. Isolation is the correct pattern.
- **Omitting provenance.** Candidates design subagents that return plain text summaries. Without structured provenance, the coordinator cannot resolve conflicts or produce cited reports.
- **Confusing parallel and sequential execution.** The three subagents in this scenario run in parallel. Sequential execution (each waits for the prior to finish) is slower and is only correct when a downstream subagent needs the output of an upstream one.
- **Ignoring coverage gaps.** Candidates design systems that synthesize whatever the subagents return without checking whether required topics are covered. Coverage annotations are the mechanism to catch these gaps.

## Cross-Reference

| Concept | Module | Lab |
|---|---|---|
| Hub-and-spoke topology | D1 — Agent Architecture | Lab 5 |
| fork_session and isolation | D1 — Agent Architecture | Lab 5 |
| MCP server and tool design | D2 — Tool Design & MCP | Lab 2 |
| Provenance and structured output | D4 — Prompt Engineering | Lab 4 |
| Context size management in subagents | D5 — Context Management | — |
