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
5. **Phase 4 — Core Guide MVP hardening:** active. The 06:00 television-day foundation, television-day-aware runtime, D-2..D+7 day navigation/date context and the measured Totaal cold-switch performance hardening are merged, independently QA-reviewed where required and physically accepted on iPhone. PR #78 is the active complete Guide visual-convergence candidate; it is not yet physically accepted, independently QA-approved or merged.

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
PR #78 has been expanded from isolated chrome convergence to one complete physical-review candidate for all three Guide presentations. Canonical repository designs and visual manifests remain authoritative; earlier red-zone annotations are no longer the scope boundary.

The active branch candidate now includes:
- **Totaal:** shared Guide chrome, logo-first rail, restrained time axis/current-time badge and an open schedule body without permanent filled/rounded programme cards or in-cell current progress bars. Existing horizontal/vertical native scrolling, real-duration geometry, partial-left readability and PR #74 programme windowing remain intact.
- **Per zender:** shared/sticky Guide chrome, logo-first channel strip, date/Primetime/Nu context and an open programme-aligned time/title schedule. The schedule-wide current-time line and current filled/red-border stack are removed; one restrained row-local progress treatment remains for current programmes where real programme height permits it. Base schedule density is reduced toward the canonical reference while larger system text proportionally expands the minute scale rather than flattening wall-clock geometry.
- **Nu & Straks:** shared time/reference model and chrome remain intact; channel content is denser and logo-first, the reference programme stays dominant, exactly three following programmes remain subordinate, and duplicate visible live-state copy is removed while accessibility still exposes current status.
- **Shared:** light/dark/system continue through semantic theme tokens; no Söhne files, new dependencies, persistent cache, provider contract or native configuration were introduced; Programme Detail remains outside the redesign scope. Physical review identified that the sticky/condensed header transition was visually abrupt. The shared Guide chrome now keeps the accepted threshold/scroll mechanics but animates the 98pt brand + presentation chrome collapse/restore with a non-bouncing Reanimated spring across height, opacity and a small vertical offset. System Reduce Motion is respected, and hidden condensed controls are removed from interaction/accessibility while the transition runs.

This is **implementation-candidate state only**. PR #78 must not merge and must not be sent to Independent QA before physical iPhone product/visual acceptance. Exact-head CI evidence belongs in the PR handoff and must be green for the head used on-device.

## Remaining Phase 4 responsibilities
- complete physical iPhone product/visual acceptance of the full PR #78 Guide candidate, including the now-animated sticky/condensed transition, then run Independent QA on exactly the physically accepted head before any merge decision;
- production-quality Programme Detail actions (`Herinner mij` + `Bewaar`) and contextual sticky bottom copies as a separate coherent increment;
- revisit any remaining Nu & Straks density/accessibility debt found by physical review without overlapping touch targets;
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
- production EPG/logo/artwork rights/SLA and D-2..D+7 horizon proof;
- pricing/trial/paywall and subscription implementation;
- production typography licensing;
- final Tonight composition;
- physical Android validation.

## EXACT NEXT STEP
**Perform physical iPhone product/visual acceptance on the exact CI-green head of PR #78 as one complete three-presentation Guide review. Pay specific attention to the sticky/condensed transition: brand + presentation chrome should collapse and restore smoothly without a hard visual jump, while the existing scroll threshold, sticky functional context, native gesture feel and post-PR #74 performance remain unchanged. Continue the rest of the Totaal, Per zender and Nu & Straks light/dark/system, Dynamic Type, Programme Detail round-trip and blank-gap checks. If physical review finds anything, fix it in Development and repeat exact-head CI + physical review. Only after explicit physical acceptance may that exact head go to Independent QA. Do not merge PR #78 before both gates are complete.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, this file, `docs/ENGINEERING_QUALITY_POLICY.md`, ADR 0007, ADR 0008 and the visual handoff documents before changing the repository. Phase 1A, Phase 1B, Phase 2 and Phase 3 are closed on iPhone. Phase 4 is active. PRs #62, #64 and #66 established the television-day/runtime/day-navigation foundation. Issues #67/#70/#73 and PRs #71/#74 closed the measured Totaal cold-switch performance problem on iPhone. Preserve the accepted performance architecture and frozen Guide mechanics. PR #78 is the active complete Guide visual-convergence candidate across Totaal, Per zender and Nu & Straks. Its next gate is physical iPhone product/visual acceptance on an exact CI-green head, including the smooth sticky/condensed transition; only after explicit physical acceptance may that exact head go to Independent QA. Unapproved brand exploration remains outside production scope.
