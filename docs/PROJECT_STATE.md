# Teevee — Canonical Project State

Last updated: 2026-09-17.
Status: ACTIVE — **Phase 4 Core Guide MVP hardening**.
Current phase: **Phase 4 — Core Guide MVP hardening**
Previous phase: **Phase 3 — Real Data Vertical Slice — CLOSED**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository. Historical implementation detail belongs in Git history, `DEVLOG.md`, accepted PRs/issues and timestamped evidence documents; this file stays focused on current canonical state and the single next step.

## Product and source-of-truth constraints
- Teevee is a premium, paid, ad-free TV-guide app for iOS and Android.
- Guide-first; no mandatory account for core Guide use.
- Expo SDK 57 / React Native 0.86 / React 19 / strict TypeScript.
- Light, dark and system appearance; accessibility and larger system text are product-quality requirements.
- Provider-independent Teevee EPG model; mobile never consumes/parses an external EPG provider directly.
- Deterministic fixtures remain mandatory after real data is introduced.
- Core Guide cannot depend on artwork/enrichment.
- `docs/VISUAL_BASELINE.md` plus `design/current/` select the accepted visual references. New visual exploration is not canonical until explicitly approved and merged.
- Relevant durable architecture contracts are ADR 0001 through ADR 0008.

## Phase status
1. **Phase 1A — Totaal:** complete and physically accepted on iPhone.
2. **Phase 1B — Per zender / Nu & Straks:** complete and physically accepted on iPhone.
3. **Phase 2 — App Shell:** complete and physically accepted on iPhone.
4. **Phase 3 — Real Data Vertical Slice:** complete and physically accepted on iPhone. Real provider -> hosted ingest -> canonical persistence -> public typed read -> mobile canonical datasource is proven, including fixture-first startup, real-data transition, fallback and context retention.
5. **Phase 4 — Core Guide MVP hardening:** active. The 06:00 television-day foundation, television-day-aware runtime, D-2..D+7 day navigation/date context and the measured Totaal cold-switch performance hardening are merged, independently QA-reviewed where required and physically accepted on iPhone.

## Frozen television-day and Guide-horizon semantics
ADR 0008 is canonical:
- television day = **06:00 Europe/Amsterdam -> 06:00 next local day**;
- midnight is not a Guide boundary;
- 00:00–05:59 belongs to the preceding television day;
- canonical programme timestamps remain UTC instants;
- Totaal and Per zender support **D-2 through D+7**: ten complete television days;
- `Nu` restores the actual instant and the television day containing it;
- Nu & Straks uses the current television day and has no independent date selector;
- hosted schedule reads remain independently bounded; do not replace them with an eager ten-day payload;
- Phase 8 production-provider selection must prove horizon, history/retention, freshness and redistribution rights.

## Frozen Guide interaction baseline
Do not retune accepted Guide mechanics without concrete regression evidence.

### Totaal
- two-dimensional horizontal-time / vertical-channel Guide;
- real schedule-duration geometry;
- compact shared D-2..D+7 day selector and separate `Nu` action;
- visible date context derives from the stable viewed-time/scroll anchor;
- native inertia, bounce and directional lock;
- accepted partial-left-title and time-axis readability behaviour;
- programme cells are horizontally windowed around the actual viewport with conservative overscan; programme-window ownership during animated scrolling follows the native viewport rather than jumping ahead of it.

### Per zender
- chronological fixed-row schedule: standard rows 52 pt and actual-current row 120 pt at base scale; programme duration never changes row height;
- horizontal adjacent-channel paging preserves the semantic viewed-time anchor where practical;
- persistent/browsable 48×48 channel strip with direct selection; rest rail 72 pt and settled condensed rail 60 pt;
- canonical local channel-logo registry is wired for NPO 1/2/3, RTL 4/5 and SBS6, with identical text fallback geometry for channels without a local asset;
- shared date context plus semantic `Primetime` and `Nu` controls; active/current state derives from the stable programme/timestamp anchor and Nu wins on overlap;
- `Primetime` = 20:30 on the selected television day;
- Programme Detail round-trip preserves relevant context.

### Nu & Straks
- shared reference instant across channels;
- live/browse modes, `Nu` and `Primetime`;
- stable vertical channel context while reference time changes;
- reference programme + three following programmes;
- accepted time-rail fling/settle and mixed-gesture behaviour;
- `NowNextGuideView` stays behind deferred `import()`; do not restore a static startup import without separate physical evidence.

## Programme Detail
- direct from all three Guide presentations; no intermediate preview sheet;
- accepted current action scope is `Herinner mij` + `Bewaar`; Share is not required;
- actions/sticky bottom copies remain future Phase 4 work;
- returning from detail preserves originating Guide context.

## Phase 4 accepted implementation ledger
- **PR #62** — television-day domain foundation. Merged and CI-proven.
- **PR #64** — mobile television-day runtime boundary. Merged, independently QA-reviewed, physically accepted on iPhone; post-merge CI green.
- **PR #66** — D-2..D+7 Guide day navigation. Merged, independently QA-reviewed, physically accepted on iPhone; post-merge CI green.
- **Issue #67** — cold Guide day-switch measurement. Completed. Measurement identified Totaal React/render + large-grid commit/mount work as the dominant bottleneck, not network, fixture alignment or the native selector modal.
- **PR #71 / issue #70** — removed repeated synchronous Totaal hot-path work by reusing the Amsterdam formatter and indexing programmes by channel. Merged; issue #70 completed.
- **PR #74 / issue #73** — bounded horizontal Totaal programme-cell windowing. Final exact production head `0a6e98661ec3ca0af9722ab2786146101779cca2` passed independent QA and focused physical iPhone acceptance. Merge commit on `main`: `e2efe46d140b4c56906ba75ef1c8d6d2f66c50b9`. Post-merge CI #420 completed successfully. Issue #73 completed.

## Phase 4 performance evidence
Original issue #67 physical baseline for cold Totaal day switches:
- median tap -> selection commit: ~1356 ms;
- median tap -> first-frame proxy: ~3683 ms.

After PR #71:
- median tap -> selection commit: ~1012 ms;
- median tap -> first-frame proxy: ~2332 ms.

Focused PR #74 physical proof before the final animated-`Nu` correction:
- median tap -> selection commit: **290.7 ms**;
- median selection commit -> first-frame proxy: **179.9 ms**;
- median tap -> first-frame proxy: **475.1 ms**;
- aggressive horizontal fling/bounce showed no blank programme-cell gaps.

Independent QA then found one blocking animated same-window `Nu` ownership case. Development corrected it so animated programmatic scrolling leaves programme-window ownership tied to actual native scroll offsets. QA re-reviewed the final exact head with the blocker closed. Final focused physical iPhone acceptance passed Totaal day-switch responsiveness, animated same-window `Nu` continuity, hard horizontal fling/bounce and normal Guide scrolling. No persistent cache, eager horizon prefetch, provider/data-contract change, new dependency or full FlatList/FlashList virtualization was introduced.

## Remaining Phase 4 responsibilities
- bring implemented Guide surfaces into the already accepted visual baseline without reopening frozen interaction mechanics;
- production-quality Programme Detail actions (`Herinner mij` + `Bewaar`) and contextual sticky bottom copies as a separate coherent increment;
- revisit known Nu & Straks density/accessibility debt without overlapping touch targets;
- decide local schedule persistence/cache only if measured MVP/offline requirements justify it;
- preserve schedule refresh/date/channel/time context and deterministic fixture fallback;
- physical Android interaction acceptance remains open until an Android device is available.

## Canonical visual handoff
`docs/VISUAL_BASELINE.md`, `design/current/` and the accepted Guide visual-convergence documentation are the source of truth for visual implementation. Current runtime appearance is not automatically the accepted visual target. Do not mix unapproved brand explorations into production implementation.

For Totaal, the accepted direction is an open, premium schedule rather than stacked programme cards: restrained surfaces/separators, logo-first channel rail, lighter time axis, compact current-time marker without a full-height red line, no in-cell current progress bar, and the shared selector integrated into the Guide hierarchy. Existing gestures, data semantics, programme geometry and Programme Detail context must remain intact.

## Android status
Physical Android interaction acceptance remains OPEN/DEFERRED because no Android device is available. CI proves Android JS/native export, clean prebuild and debug APK compilation, not system Back, nested-gesture feel or device performance.

## Deferred / later gates
- true offline cold-start validation in a standalone/dev build rather than Expo Go;
- release-like performance outside Expo Go;
- production EPG/artwork rights/SLA and D-2..D+7 horizon proof; channel-logo provenance is repository-managed in `docs/CHANNEL_LOGO_ASSETS.md`;
- pricing/trial/paywall and subscription implementation;
- production typography licensing;
- final Tonight composition;
- physical Android validation.

## EXACT NEXT STEP
**Finish PR #81 against canonical main `178d81ba444e1def67e5f123971bd241bbb30581`: require exact-head CI, then perform physical iPhone acceptance of the refined Per-zender screen with real local NPO/RTL/SBS6 logos. Validate expanded 72-pt and settled-condensed 60-pt rails, direct selection/adjacent swipe/recentring, semantic Nu/Primetime states, fixed 52/120 rows, current description/progress, row press feedback, dark mode and accepted bottom navigation. Do not request Independent QA until the owner has physically accepted the exact CI-green head; do not merge from Development.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, this file, `docs/ENGINEERING_QUALITY_POLICY.md`, ADR 0007, ADR 0008 and the visual handoff documents before changing the repository. Phase 1A, Phase 1B, Phase 2 and Phase 3 are closed on iPhone. Phase 4 is active. PRs #62, #64 and #66 established the television-day/runtime/day-navigation foundation. Issues #67/#70/#73 and PRs #71/#74 closed the measured Totaal cold-switch performance problem on iPhone. Preserve the accepted performance architecture and frozen Guide mechanics. PR #81 now contains the canonical Per-zender refinement from main plus the local representative channel-logo layer. The single next gate is exact-head CI followed by physical iPhone acceptance of that PR; do not request Independent QA and do not merge before the owner accepts the exact CI-green head.