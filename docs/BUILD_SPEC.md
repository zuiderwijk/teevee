# Teevee Phased Build Specification

Status: phased baseline, amended 13 September 2026 to incorporate the accepted Guide/Programme Detail UX direction and the owner-approved Phase 1B Guide-presentation validation. Implementation status remains governed by `docs/PROJECT_STATE.md`.

## Build philosophy
Build risk-first, not screen-count-first. The Guide interaction is the defining product and largest technical/UX risk, so its distinct interaction models are validated before broad shell and production-data development.

Accepted visual/UX direction in `docs/UX.md` and `docs/DESIGN_SYSTEM.md` is the target for implementation; it must not be confused with already-shipped runtime behaviour.

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

## Phase 1A — Totaal Interaction Prototype
Goal: prove the hardest two-dimensional mobile TV-guide interaction using deterministic realistic fixture data.

Build only what is needed to validate:
- React Native/Expo app bootstrap;
- light/dark semantic theme foundation;
- realistic channel/schedule fixtures;
- Totaal two-dimensional guide surface;
- sticky/anchored channel and time context;
- horizontal time navigation;
- vertical channel navigation;
- current-time marker;
- current-programme progress where required by the prototype;
- Nu action;
- day navigation sufficient for prototype testing;
- direct programme tap/detail presentation;
- performance instrumentation where useful;
- larger-system-text validation for core Guide/detail behaviour.

Acceptance gate:
- smooth interaction at realistic channel/programme volume;
- no major scroll synchronisation defects;
- Nu/date behaviour is intuitive;
- information remains legible at practical density;
- light and dark both function;
- the core Totaal interaction is demonstrably preferable to a conventional mobile guide.

The accepted iPhone Totaal interaction baseline is technically frozen in `docs/PROJECT_STATE.md`; do not retune it without concrete regression evidence.

## Phase 1B — Guide Presentation Prototypes
Goal: prove the two Guide interaction models that were defined during Phase 1 before App Shell and real-data architecture are hardened around Totaal alone.

Build in this order on the same deterministic fixture domain and existing Programme Detail path:
1. **Per zender** — one channel's vertically time-based schedule, persistent/browsable horizontal channel strip, direct logo/channel selection, horizontal adjacent-channel paging that preserves the viewed time anchor, secondary day controls and Nu.
2. **Nu & Straks** — today-only shared reference-time selector, live/browse states, `Nu` and `Primetime`, and reference programme plus three following programmes per channel.

Acceptance gate:
- both presentations have interaction semantics that work on a physical available iPhone rather than only in tests;
- channel/time/reference context survives the expected navigation and Programme Detail round-trip;
- vertical/horizontal gesture arbitration is usable and does not create obvious accidental switching, jank, white screens or crashes;
- semantics remain based on the shared Teevee schedule domain rather than presentation-specific EPG models;
- light/dark and representative larger-text behaviour remain usable;
- Totaal's accepted implementation is not destabilised merely to share code prematurely.

Phase 1B is prototype scope. It deliberately does **not** pull production EPG integration, persistent channel management, offline production behaviour, accounts or subscriptions forward. Physical Android interaction validation remains required before release but may be deferred when no Android device is available; CI/native compilation is build evidence, not device acceptance.

Detailed Phase 1B gates live in `docs/PHASE_1B.md` and ADR 0005.

## Phase 2 — App Shell
Goal: turn the proven Guide interaction models into a maintainable product shell.

Deliver:
- routing/navigation;
- semantic design tokens/components;
- canonical Guide shell/chrome shared by Totaal, Per zender and Nu & Straks;
- presentation-state contract and locally remembered Guide presentation preference;
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
Deliver and harden the accepted Guide UX from `docs/UX.md` on production-quality schedule data:
- robust multi-day Totaal schedule;
- production-quality Per zender using the Phase 1B interaction baseline;
- production-quality Nu & Straks using the Phase 1B interaction baseline;
- channel selection and ordering;
- reliable Nu behaviour;
- Programme Detail direct-open flow;
- `Herinner mij` + `Bewaar` primary actions and contextual sticky bottom copies after the canonical actions scroll away;
- offline/stale-cache handling;
- schedule refresh preserving context;
- production-level guide performance;
- light/dark/system and representative larger-text validation.

Do not reintroduce card-heavy programme presentation, redundant metadata or low-value controls merely to fill visual space. The accepted design target is premium utility with restrained chrome.

## Phase 5 — Search and Discovery
Deliver Search first. Add Tonight only after its value and data requirements are clear. Tonight may use more imagery than Guide but must not become an editorial/news dependency or infinite engagement feed.

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
A later-phase capability may be prototyped earlier only when it is required to validate an earlier architectural or interaction risk. Production hardening remains in its designated phase unless explicitly re-planned and approved.
