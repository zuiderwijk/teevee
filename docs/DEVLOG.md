# Teevee Development Log

Purpose: a human-readable running log of what the autonomous development agent changed, why it changed, what was verified, and what comes next.

This file is intentionally written for product/engineering stakeholders, not only developers. It complements `docs/PROJECT_STATE.md`: PROJECT_STATE is the canonical current state; DEVLOG is the readable history.

## Logging rules
- Add one entry for every substantive development increment.
- Write newest entries at the top.
- Keep each entry concise and understandable.
- Explain impact in plain language before technical detail.
- Never claim a build, test or CI check passed unless it actually did.
- Link problems to the fix or current status.
- End each entry with the next intended increment.

---

## 2026-09-11 — First 2D Guide viewport implemented

### What changed
The app now has the first real version of the TV-guide surface instead of only a simple list. Programme blocks are laid out on a time axis, their width reflects programme duration, channel labels remain separate from the timeline, and vertical/horizontal scrolling are synchronised.

A current-time indicator and a `Nu` action have also been introduced so the user can return to the current point in the schedule.

### Why
The two-dimensional Guide is the defining interaction of Teevee and the largest technical/UX risk. We therefore validate this before adding broad product features.

### Technical notes
- Added pure time-to-pixel schedule geometry helpers.
- Added automated tests for Guide timeline geometry.
- Implemented a fixed channel column plus horizontally scrollable schedule timeline.
- Synchronised channel labels with the vertical Guide scroll.
- Continued using deterministic fixture data only.

### Verification
CI is still being stabilised. The first dependency issue has been fixed. A subsequent TypeScript 6 configuration failure was identified and fixed by removing deprecated `baseUrl` usage. The most recent CI run was still in progress when this entry was written.

### Next
Get CI fully green, then continue refining Guide interaction, programme selection and performance before moving to later product scope.

---

## 2026-09-11 — Expo/React Native foundation created

### What changed
Teevee now has an executable cross-platform app foundation for iOS and Android. The application opens directly into a minimal Guide screen and already supports semantic light/dark theming.

### Why
This establishes the smallest viable runtime foundation for Phase 1 while keeping the codebase simple enough for autonomous agents to maintain.

### Technical notes
- Expo / React Native / Expo Router bootstrap.
- Strict TypeScript configuration.
- Semantic light and dark theme tokens.
- System theme resolver.
- Minimal Guide route.
- Linting and GitHub Actions CI configuration.

### Verification
Initial CI runs exposed dependency-version conflicts between Expo-related packages. These were real configuration issues, not ignored warnings, and were corrected by aligning dependencies with the Expo SDK 57 stack.

### Next
Verify typecheck, lint and tests, then build the actual 2D Guide interaction.

---

## 2026-09-11 — Deterministic Guide data layer created

### What changed
A development-only TV schedule dataset now exists so the Guide can be built and tested without any external EPG provider.

### Why
Autonomous development must not stop when an external feed is unavailable or changes format. The fixture layer also makes automated tests repeatable.

### Technical notes
- Added Teevee-owned `Channel`, `Programme` and `GuideFixture` domain types.
- Added 16 synthetic channels.
- Added 49 hours of deterministic programme data.
- Included edge cases such as short/long programmes, long titles, missing metadata, live/repeat flags and a deliberate schedule gap.
- Added programme duration and progress helpers plus tests.

### Verification
Fixture/domain tests were added. Full CI verification was pending at the time of this increment.

### Next
Use the fixture layer to build schedule geometry and the first Guide viewport.

---

## 2026-09-11 — Project Foundation completed

### What changed
The project was converted from an idea/concept into an agent-operable product repository with a canonical product, UX, architecture, data and build baseline.

### Why
Every autonomous agent session needs the same source of truth. Without this, each new session could reinterpret the product and architecture.

### Technical/product notes
Created:
- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/UX.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/BUILD_SPEC.md`
- `docs/PROJECT_STATE.md`
- ADRs for guide-first positioning, Expo, provider-independent EPG and canonical project memory.

### Verification
Phase 0 was marked complete only after the canonical `PROJECT_STATE.md` and core ADRs existed.

### Next
Phase 1: build and validate the Guide interaction using deterministic fixture data.
