export const meta = {
  name: 'study-domain',
  description: 'Generate a complete study session for one exam domain: summary, 10 practice questions, and a flashcard set',
  phases: [
    { title: 'Load', detail: 'Extract domain content from the study guide' },
    { title: 'Questions', detail: 'Generate 10 exam-style practice questions with answers' },
    { title: 'Synthesize', detail: 'Build study summary and flashcard set' },
  ],
}

// Usage: pass args as { "domain": 1 }  (domain number 1-5)
// Example via Claude Code: run Workflow tool with args: { "domain": 2 }

const DOMAINS = [
  {
    num: 1,
    name: 'Agent Architecture and Orchestration',
    weight: '27%',
    guideLines: 'lines 306-444, 1078-1290, 1515-1603',
    keywords: ['agentic loop', 'stop_reason', 'end_turn', 'tool_use', 'hub-and-spoke', 'coordinator', 'subagent', 'Task tool', 'hooks', 'PreToolUse', 'PostToolUse', 'task decomposition', 'fork_session', 'resume session'],
    scenarios: ['Customer Support Agent', 'Multi-Agent Research System'],
  },
  {
    num: 2,
    name: 'Tool Design and MCP Integration',
    weight: '18%',
    guideLines: 'lines 197-304, 446-545, 1607-1675',
    keywords: ['tool description', 'tool_choice', 'auto', 'any', 'forced', 'MCP server', 'mcp.json', 'isError', 'errorCategory', 'isRetryable', 'MCP resources', 'least privilege', 'built-in tools'],
    scenarios: ['Multi-Agent Research System', 'Customer Support Agent'],
  },
  {
    num: 3,
    name: 'Claude Code Configuration and Workflows',
    weight: '20%',
    guideLines: 'lines 547-799, 1678-1761',
    keywords: ['CLAUDE.md', 'hierarchy', 'user-level', 'project-level', 'directory-level', '@path', 'claude/rules', 'glob patterns', 'paths frontmatter', 'SKILL.md', 'context fork', 'allowed-tools', 'argument-hint', 'planning mode', 'direct execution', 'Explore subagent', '/compact', 'fork_session', '-p flag', 'CI/CD'],
    scenarios: ['Code Generation with Claude Code', 'Claude Code for CI'],
  },
  {
    num: 4,
    name: 'Prompt Engineering and Structured Output',
    weight: '20%',
    guideLines: 'lines 804-994, 1016-1073, 1764-1846',
    keywords: ['few-shot', 'examples', 'explicit criteria', 'prompt chaining', 'dynamic decomposition', 'interview pattern', 'validation retry', 'self-correction', 'JSON schema', 'required optional nullable', 'enum other unclear', 'tool_use structured output', 'Message Batches API', '50% savings', '24 hours', 'custom_id', 'multi-turn tool calling'],
    scenarios: ['Structured Data Extraction', 'Claude Code for CI'],
  },
  {
    num: 5,
    name: 'Context Management and Reliability',
    weight: '15%',
    guideLines: 'lines 1129-1228, 1230-1290, 1292-1407, 1410-1474, 1849-1935',
    keywords: ['lost in the middle', 'case facts block', 'progressive summarization', 'tool result trimming', 'PostToolUse trim', 'position-aware input', 'scratchpad files', 'context delegation', 'state persistence', 'escalation triggers', 'structured handoff', 'confidence calibration', 'stratified sampling', 'provenance', 'attribution loss', 'conflicting data', 'coverage annotations'],
    scenarios: ['Customer Support Agent', 'Multi-Agent Research System', 'Conversational AI Architecture'],
  },
]

const domainNum = (args && args.domain) ? parseInt(args.domain) : 1
const domain = DOMAINS.find(d => d.num === domainNum) || DOMAINS[0]

log(`Starting study session for Domain ${domain.num}: ${domain.name} (${domain.weight} of exam)`)

// Phase 1: Load — extract domain content from the guide
phase('Load')

const contentSummary = await agent(
  `You are preparing study material for the Claude Certified Architect exam.

Read the file "guide_en.MD" using the Read tool. Focus on ${domain.guideLines}.

The topic is Domain ${domain.num}: ${domain.name} (${domain.weight} of the exam).

Key concepts to extract: ${domain.keywords.join(', ')}.

After reading the relevant sections, produce a structured content summary with these sections:

## Core Concepts (8-10 items)
[Each as: **[concept name]:** [1-2 sentence explanation with the exam-relevant rule]]

## Decision Rules (6-8 rules)
[Each as: **If [condition] → [action]** with one-line rationale]

## Anti-Patterns (4-6 items)
[Each as: **Never:** [wrong approach] | **Because:** [why it fails] | **Instead:** [correct approach]]

## Exam Traps (3-5 items)
[Subtle distinctions that trip up candidates — the things that look correct but aren't]

## Scenario Connections
[How this domain appears in these scenarios: ${domain.scenarios.join(', ')}]`,
  {
    label: `domain-${domainNum}-content`,
    phase: 'Load',
  }
)

// Phase 2: Questions — generate 10 practice questions
phase('Questions')

const questionsResult = await agent(
  `Generate 10 exam-style multiple-choice questions for Domain ${domain.num}: ${domain.name}.

Based on these domain concepts:
${contentSummary}

Requirements for each question:
- Scenario-based: describe a realistic production situation, not abstract theory
- Exactly 4 options labeled A/B/C/D, exactly 1 correct
- Difficulty mix: 2 easy (clear rule application), 5 medium (requires judgment), 3 hard (subtle distinctions)
- Cover different concepts — don't repeat the same concept twice
- Mirror the style of the Claude Certified Architect exam practice test

Return as a JSON object with this exact schema:
{
  "questions": [
    {
      "num": 1,
      "difficulty": "easy|medium|hard",
      "concept": "the specific concept being tested",
      "situation": "2-3 sentence realistic scenario",
      "question": "Which approach is most effective? (or similar)",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "A",
      "explanation": "3-4 sentences: why correct is right, why the best wrong option fails, the rule it demonstrates"
    }
  ]
}`,
  {
    label: `domain-${domainNum}-questions`,
    phase: 'Questions',
    schema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          minItems: 10,
          maxItems: 10,
          items: {
            type: 'object',
            properties: {
              num: { type: 'number' },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              concept: { type: 'string' },
              situation: { type: 'string' },
              question: { type: 'string' },
              options: {
                type: 'object',
                properties: {
                  A: { type: 'string' },
                  B: { type: 'string' },
                  C: { type: 'string' },
                  D: { type: 'string' },
                },
                required: ['A', 'B', 'C', 'D'],
              },
              correct: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
              explanation: { type: 'string' },
            },
            required: ['num', 'difficulty', 'concept', 'situation', 'question', 'options', 'correct', 'explanation'],
          },
        },
      },
      required: ['questions'],
    },
  }
)

// Phase 3: Synthesize — flashcards + study summary
phase('Synthesize')

const flashcards = await agent(
  `Create a flashcard set and one-page cheat sheet for Domain ${domain.num}: ${domain.name}.

Source material:
${contentSummary}

Part 1 — Flashcard Set (15 cards)
Format each as:
FRONT: [question or "what is X?" or "when should you use X?"]
BACK: [concise answer, max 2 sentences]

Include cards for: all core concepts, all decision rules, the top 3 anti-patterns, and the batch API constraints (if domain 4) or hook types (if domain 1) or CLAUDE.md hierarchy (if domain 3).

Part 2 — One-Page Cheat Sheet
A compact reference (could fit on one printed page) with:
- Domain weight and key facts
- Decision rules in IF/THEN format
- The 3 most important anti-patterns
- Quick-reference table for any comparison concepts (e.g., hooks vs prompts, batch vs sync)
- Memory aids (mnemonics, patterns)`,
  {
    label: `domain-${domainNum}-flashcards`,
    phase: 'Synthesize',
  }
)

return {
  domain: `Domain ${domain.num}: ${domain.name}`,
  weight: domain.weight,
  examScenarios: domain.scenarios,
  studySummary: contentSummary,
  practiceQuestions: questionsResult.questions,
  flashcardsAndCheatSheet: flashcards,
  nextSteps: [
    `Run /quiz Domain ${domain.num} for an interactive quiz`,
    `Run /scenario for: ${domain.scenarios[0]}`,
    domain.num < 5
      ? `Continue to Domain ${domain.num + 1} study session (args: { "domain": ${domain.num + 1} })`
      : 'All domains complete — run /readiness for final assessment',
  ],
}
