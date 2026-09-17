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
5. **Phase 4 — Core Guide MVP hardening:** active. The 06:00 television-day foundation, television-day-aware runtime, D-2..D+7 day navigation/date context and the measured Totaal cold-switch performance hardening are merged, independently QA-reviewed where required and physically accepted on iPhone. PR #78 is the active Guide visual-convergence candidate; its Per-zender presentation is now implemented against the canonical production specification but remains pending exact-head CI and physical iPhone acceptance before any Independent QA or merge decision.

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
- vertical wall-clock schedule;
- horizontal adjacent-channel paging preserves time anchor where practical;
- persistent/browsable channel strip with direct selection;
- shared date context plus `Primetime` and `Nu`;
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

## Active Phase 4 Guide visual-convergence candidate
PR #78 remains the active visual-convergence branch. `docs/PER_ZENDER_VISUAL_CONVERGENCE.md` from canonical main is now the literal production implementation contract for Per zender; runtime screenshots and older PR descriptions are not authority where they conflict with that specification.

The active branch candidate includes:
- **Totaal:** shared Guide chrome, logo-first rail, restrained time axis/current-time badge and an open schedule body without permanent filled/rounded programme cards or in-cell current progress bars. Existing horizontal/vertical native scrolling, real-duration geometry, partial-left readability and PR #74 programme windowing remain intact.
- **Per zender:** exact production metrics are centralised in `features/guide/guideVisualMetrics.ts`; the channel strip is fixed at 72 pt with 48 × 48 items, 12-pt gaps, 40 × 32 logo/fallback content and 20-pt insets. The selected-channel heading, day selector, Primetime/Nu controls, 64-pt time gutter, programme X=100/right inset=24, 1.30 pt/min wall-clock scale, 20/32/56/92 density/current thresholds, single programme-end separator hierarchy and current-programme progress treatment follow the canonical production specification. Missing logos stay inside the same 48 × 48 geometry with `shortName ?? displayName`; no large text-tab fallback is used. Larger system text scales schedule geometry with `1.30 × max(1,fontScale)` and preserves uncapped substantive text. The Per-zender rest→condensed transition is scroll-coupled directly over 56 pt with max 12-pt upward translation, no spring and no direction-based hide/reveal; Reduce Motion switches discretely at 28 pt. The settled stack is channel strip + compact 52-pt context, with a minimum 88-pt wrapped context when date and utilities require two rows.
- **Nu & Straks:** shared time/reference model and chrome remain intact; channel content is denser and logo-first, the reference programme stays dominant, exactly three following programmes remain subordinate, and duplicate visible live-state copy is removed while accessibility still exposes current status.
- **Shared:** light/dark/system continue through the existing semantic theme tokens; no Söhne files, new dependencies, persistent cache, provider contract or native configuration were introduced. Programme Detail remains outside the redesign scope. Shared Totaal/Nu & Straks behavior is not deliberately changed by the Per-zender production correction.

The frozen adjacent-channel pager, direct strip selection, directional locking, viewed-time preservation, D-2..D+7 / 06:00 television-day model, Primetime/Nu semantics, provider contracts, Programme Detail round-trip and deferred `NowNextGuideView` boundary remain unchanged.

This is **implementation-candidate state only**. A green exact-head CI run is necessary but not sufficient. PR #78 must not merge and must not be sent to Independent QA before focused physical iPhone Per-zender acceptance against `docs/PER_ZENDER_VISUAL_CONVERGENCE.md`.

## Remaining Phase 4 responsibilities
- complete exact-head Fast CI and then focused physical iPhone Per-zender product/visual acceptance against the canonical production spec; only after explicit physical acceptance may exactly that head go to Independent QA;
- production-quality Programme Detail actions (`Herinner mij` + `Bewaar`) and contextual sticky bottom copies as a separate coherent increment;
- revisit any remaining Nu & Straks density/accessibility debt found by physical review without overlapping touch targets;
- decide local schedule persistence/cache only if measured MVP/offline requirements justify it;
- preserve schedule refresh/date/channel/time context and deterministic fixture fallback;
- physical Android interaction acceptance remains open until an Android device is available.

## Canonical visual handoff
`docs/VISUAL_BASELINE.md`, `design/current/` and the accepted Guide visual-convergence documentation are the source of truth for visual implementation. Current runtime appearance is not automatically the accepted visual target. Do not mix unapproved brand explorations into production implementation.

For Per zender, `docs/PER_ZENDER_VISUAL_CONVERGENCE.md` is the canonical production implementation specification. Values marked `IMPLEMENTATION CALIBRATION` are implementation constraints until physical evidence causes the specification itself to be revised; do not introduce local alternative magic numbers.

For Totaal, the accepted direction is an open, premium schedule rather than stacked programme cards: restrained surfaces/separators, logo-first channel rail, lighter time axis, compact current-time marker without a full-height red line, no in-cell current progress bar, and the shared selector integrated into the Guide hierarchy. Existing gestures, data semantics, programme geometry and Programme Detail context must remain intact.

## Android status
Physical Android interaction acceptance remains OPEN/DEFERRED because no Android device is available. CI proves Android JS/native export, clean prebuild and debug APK compilation when the native boundary is touched, not system Back, nested-gesture feel or device performance.

## Deferred / later gates
- true offline cold-start validation in a standalone/dev build rather than Expo Go;
- release-like performance outside Expo Go;
- production EPG/logo/artwork rights/SLA and D-2..D+7 horizon proof;
- pricing/trial/paywall and subscription implementation;
- production typography licensing;
- final Tonight composition;
- physical Android validation.

## EXACT NEXT STEP
**Run exact-head Fast CI for PR #78 and, once green, perform focused physical iPhone acceptance of Per zender against `docs/PER_ZENDER_VISUAL_CONVERGENCE.md`: rest-state 20/72/48/12 geometry, logo/fallback mass, 24/30 heading, compact day/Primetime/Nu, X=24/100 schedule columns, 1.30 pt/min density, current progress/detail thresholds, single-separator hierarchy, direct 56-pt collapse, 28-pt Reduce Motion behavior, light/dark/system, ~100/~110/~135% plus representative accessibility text, adjacent-channel swipe/direct selection, day/Primetime/Nu and Programme Detail round-trip. If any device finding appears, return to Development and repeat exact-head CI + physical review. Only after explicit physical acceptance may exactly that head go to Independent QA. Do not merge PR #78 before both gates are complete.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, this file, `docs/ENGINEERING_QUALITY_POLICY.md`, ADR 0007, ADR 0008 and the visual handoff documents before changing the repository. Phase 1A, Phase 1B, Phase 2 and Phase 3 are closed on iPhone. Phase 4 is active. PRs #62, #64 and #66 established the television-day/runtime/day-navigation foundation. Issues #67/#70/#73 and PRs #71/#74 closed the measured Totaal cold-switch performance problem on iPhone. Preserve the accepted performance architecture and frozen Guide mechanics. PR #78 is the active Guide visual-convergence candidate. Per zender must follow `docs/PER_ZENDER_VISUAL_CONVERGENCE.md` literally; its next external gate is focused physical iPhone acceptance on the exact CI-green implementation head. Independent QA comes only after that explicit device acceptance. Unapproved brand exploration remains outside production scope.
