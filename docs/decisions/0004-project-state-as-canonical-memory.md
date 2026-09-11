# ADR 0004 — PROJECT_STATE as canonical agent memory

Status: Accepted
Date: 2026-09-11

## Context
Teevee is intended to be developed across multiple autonomous-agent sessions. Chat context cannot be treated as durable project memory. Agents need a compact, current source of truth that prevents rediscovery and scope drift.

## Decision
`docs/PROJECT_STATE.md` is the mandatory starting point and highest-priority project-state document for every agent session. It records the current phase, frozen decisions, implementation reality, open gates, known issues and exactly one next step.

Longer-lived detail remains in dedicated product/UX/architecture/data/build documents and ADRs. `PROJECT_STATE.md` links to those documents rather than duplicating them unnecessarily.

## Consequences
- Every substantive milestone must update PROJECT_STATE.
- The exact next step must be singular and executable.
- A new agent should be able to resume work without prior chat history.
- Stale project state is treated as a development defect.
