# Teevee Phased Build Specification

Status: Phase 0 baseline.

## Build philosophy
Build risk-first, not screen-count-first. The Guide interaction is the defining product and largest technical/UX risk, so it is validated before broad feature development.

## Phase 0 — Project Foundation
Deliverables:
- product vision and MVP scope;
- UX/IA baseline;
- architecture baseline;
- programme-data strategy;
- design-system direction;
- agent operating model and Definition of Done;
- ADRs for major frozen decisions;
- canonical project state.

Exit criterion: an autonomous agent can start Phase 1 without rediscovering product intent or architecture.

## Phase 1 — Guide Interaction Prototype
Goal: prove the best possible mobile TV-guide interaction using deterministic realistic fixture data.

Build only what is needed to validate:
- React Native/Expo app bootstrap;
- light/dark semantic theme foundation;
- realistic channel/schedule fixtures;
- two-dimensional guide surface;
- sticky/anchored channel and time context;
- horizontal time navigation;
- vertical channel navigation;
- current-time marker;
- current-programme progress;
- Now action;
- day navigation sufficient for prototype testing;
- basic programme tap/detail sheet or screen;
- performance instrumentation where useful.

Acceptance gate:
- smooth interaction at realistic channel/programme volume;
- no major scroll synchronisation defects;
- Now/date behaviour is intuitive;
- information remains legible at practical density;
- light and dark both function;
- core interaction is demonstrably preferable to a conventional mobile guide.

Do not add Tonight, subscriptions or broad metadata before this gate passes.

## Phase 2 — App Shell
Goal: turn the prototype into a maintainable product shell.

Deliver:
- routing/navigation;
- semantic design tokens/components;
- settings foundation;
- local preference persistence;
- robust loading/error boundaries;
- test harness and CI quality gates;
- accessibility baseline.

## Phase 3 — Real Data Vertical Slice
Goal: external EPG -> normalisation -> Teevee API/storage -> mobile Guide.

Deliver:
- provider adapter;
- XMLTV/feed ingestion as appropriate;
- channel mapping;
- canonical programme storage;
- data-quality diagnostics;
- typed client API;
- cache/refresh strategy;
- Guide consuming real data without provider-specific knowledge.

The free provider is not declared production-safe by completing this phase.

## Phase 4 — Core Guide MVP
Deliver:
- robust multi-day schedule;
- channel selection and ordering;
- reliable Now behaviour;
- programme detail;
- offline/stale-cache handling;
- schedule refresh preserving context;
- production-level guide performance.

## Phase 5 — Search and Discovery
Deliver Search first. Add Tonight only after its value and data requirements are clear. Tonight must work without becoming an editorial/news dependency.

## Phase 6 — Personal Features
Deliver saved programmes/favourites, reminders and refined channel preferences. Keep identity optional unless cross-device requirements justify an account decision.

## Phase 7 — Premium
Deliver App Store/Play subscription integration, preferred through RevenueCat; restore purchase; entitlement handling; paywall/trial based on a separately frozen commercial decision.

## Phase 8 — Production Data Decision
Validate and integrate the production EPG source, potentially Bindinc/TVgids data. Confirm schedule, metadata, logo and artwork rights. Maintain provider abstraction.

## Phase 9 — Production Hardening
Performance profiling, accessibility audit, offline/failure scenarios, observability, privacy/security review, analytics validation, device matrix, notification reliability and store-policy checks.

## Phase 10 — Release
TestFlight and Google closed testing, store assets/metadata, subscription products, review submission, staged production rollout and post-release monitoring.

## Scope rule
A later-phase feature may be pulled forward only when it is required to validate an earlier-phase risk. Otherwise phases remain sequential.
