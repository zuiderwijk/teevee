# ADR 0002 — React Native + Expo as mobile baseline

Status: Accepted
Date: 2026-09-11

## Context
Teevee needs iOS and Android clients while being developed primarily by autonomous AI agents. Maintaining two native implementations would increase duplicated logic, coordination cost and long-term maintenance surface. The main technical uncertainty is the performance of the two-dimensional Guide.

## Decision
Use React Native with Expo and strict TypeScript as the baseline mobile stack. Use Expo Router for navigation. Prefer shared cross-platform implementation and introduce native Swift/Kotlin code only when a measured requirement cannot be met adequately otherwise.

## Consequences
- One primary client codebase and domain model.
- Phase 1 must explicitly validate Guide performance rather than assume the stack is sufficient.
- Specialised React Native virtualisation/gesture primitives may be adopted based on measurement.
- A fundamental stack change requires evidence from the Guide prototype and a replacement ADR.
