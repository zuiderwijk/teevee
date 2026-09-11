# ADR-001: React Native + Expo for the mobile application

Date: 2026-09-11
Status: Accepted for initial development

## Context
Teevee must ship on iOS and Android and is intended to be developed and maintained substantially by autonomous AI agents. Product behaviour should remain consistent across platforms while operational and code complexity stays low.

## Decision
Use React Native with Expo and strict TypeScript as the initial mobile stack. Use Expo Router for navigation and EAS for builds/distribution unless measured constraints require a change.

## Rationale
A single typed codebase reduces duplicated product logic and agent context, while Expo removes substantial native project/tooling overhead. The principal risk is Guide rendering performance, so Phase 1 explicitly validates that risk before this stack is considered irreversible.

## Consequences
Native Swift/Kotlin implementations are not created in parallel. Native modules may be introduced only for a demonstrated requirement. If Phase 1 proves that the required Guide experience cannot meet performance/interaction standards, this ADR must be revisited with measurements.
