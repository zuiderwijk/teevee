# Teevee Phased Build Specification

Status: phased baseline, amended 15 September 2026 with frozen television-day and Guide-horizon semantics. Implementation status remains governed by `docs/PROJECT_STATE.md`.

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
2. **Nu & Straks** — shared reference-time selector for the active day, live/browse states, `Nu` and `Primetime`, and reference programme plus three following programmes per channel.

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
- Guide consuming real data without provider-specific knowledge;
- durable data/query semantics that do not assume midnight is the Guide boundary or that the final product horizon is only today + tomorrow;
- ADR 0008 television-day/horizon semantics frozen before Phase 4 implementation.

Phase 3 does **not** need to implement the complete D-2..D+7 UX before its current physical real-data smoke closes. The existing two-day hosted/mobile slice is acceptable as validation evidence as long as the architecture remains compatible with the frozen final semantics.

The free provider is not declared production-safe by completing this phase.

## Phase 4 — Core Guide MVP
Deliver and harden the accepted Guide UX from `docs/UX.md` on production-quality schedule data:
- robust multi-day Totaal schedule;
- production-quality Per zender using the Phase 1B interaction baseline;
- production-quality Nu & Straks using the Phase 1B interaction baseline;
- implement ADR 0008 television-day grouping: **06:00 Europe/Amsterdam -> 06:00 next day**;
- guarantee Totaal and Per zender navigation across **D-2 through D+7** television days;
- allow evening browsing to continue through midnight without an explicit date switch;
- treat 00:00–05:59 as part of the preceding television day for Guide context;
- update the active television day at 06:00 without requiring a hard visual scroll break;
- make `Nu` restore the actual instant and correct television-day context from any historical/future day;
- define final compact date-navigation UX without ten permanent date buttons;
- channel selection and ordering;
- Programme Detail direct-open flow for historical/current/future broadcasts;
- `Herinner mij` + `Bewaar` primary actions and contextual sticky bottom copies after the canonical actions scroll away;
- offline/stale-cache handling across the required multi-day window;
- schedule refresh preserving date/channel/time context;
- production-level guide performance at the required horizon and realistic channel count;
- explicit 00:00, 05:59, 06:00 and Europe/Amsterdam 23/25-hour DST validation;
- light/dark/system and representative larger-text validation.

Phase 4 exit requires physical validation of the D-2..D+7 horizon and television-day rollover behaviour, not merely unit-test coverage.

Do not reintroduce card-heavy programme presentation, redundant metadata or low-value controls merely to fill visual space. The accepted design target is premium utility with restrained chrome.

## Phase 5 — Search and Discovery
**ACTIVE.** The Kijktip pre-Search vertical slice is closed. Phase 5 starts with **Phase 5A — Guide Search** using `docs/SEARCH_PRODUCT_DEFINITION.md` as canonical product authority.

Build sequence:
1. **DONE in PR #132** — Guide Search architecture boundary over the canonical hosted schedule store;
2. **DONE** — hosted Search migration + Edge Function deployed and live-verified; evidence: `docs/GUIDE_SEARCH_DEPLOYMENT_2026-09-23.md`;
3. **NEXT** — wire mobile Search UI/runtime for concrete programme broadcasts + channels against the frozen `GuideSearchApi` boundary;
4. focused physical iPhone validation and Independent QA;
5. only then evaluate the next Phase 5 slice.

Do not implement Search by eager D-2..D+7 mobile Guide prefetch or a title-only programme catalogue identity. Tonight remains deferred until its value and data requirements are clear; it may use more imagery than Guide but must not become an editorial/news dependency or infinite engagement feed.

## Phase 6 — Personal Features
Deliver saved programmes/favourites, reminders and refined channel preferences. Keep identity optional unless cross-device requirements justify an account decision.

## Phase 7 — Premium
Deliver App Store/Play subscription integration, preferred through RevenueCat; restore purchase; entitlement handling; paywall/trial based on a separately frozen commercial decision.

## Phase 8 — Production Data Decision
Validate and integrate the production EPG source, potentially Bindinc/TVgids data. Confirm schedule, metadata, logo and artwork rights. Maintain provider abstraction.

Production provider acceptance must additionally prove:
- reliable support for at least D-2 historical and D+7 future television-day coverage;
- freshness/correction behaviour that can keep that window continuously usable;
- explicit paid-app redistribution rights for the supplied schedule/metadata;
- separately understood rights for logos/artwork where used.

The preferred production target remains broader than the minimum product window (e.g. 14 days forward) when commercially and technically available.

## Phase 9 — Production Hardening
Performance profiling, accessibility audit, offline/failure scenarios, observability, privacy/security review, analytics validation, device matrix, notification reliability and store-policy checks.

## Phase 10 — Release
TestFlight and Google closed testing, store assets/metadata, subscription products, review submission, staged production rollout and post-release monitoring.

## Scope rule
A later-phase capability may be prototyped earlier only when it is required to validate an earlier architectural or interaction risk. Production hardening remains in its designated phase unless explicitly re-planned and approved.