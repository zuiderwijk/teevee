# Teevee — Canonical Project State

Last updated: 2026-09-18.
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
- chronological fixed-row programme list: standard rows 52 pt and actual-current row 176 pt at base scale; programme duration never changes row height or Y position;
- selected rail logo is the sufficient visible channel identity in both expanded/rest and condensed states; no selected-channel text is rendered outside the persistent rail;
- horizontal adjacent-channel paging preserves the semantic viewed-time anchor where practical;
- persistent/browsable 48×48 channel strip with direct selection; rest rail 72 pt and settled condensed rail 60 pt;
- temporal context is always one 52-pt date + `Primetime` + `Nu` row: expanded gaps are **4 pt** strip→context and **24 pt** context→schedule, settled condensed gaps are 0/0; Per-zender date/Primetime/Nu are one line with `maximumFontSizeMultiplier = 1.20`, while programme content keeps substantive Dynamic Type;
- PR #81 fixed-native-viewport/collapse-isolation is frozen: full visual contraction 140 pt, native collapse distance 56 pt and visual compensation 84 pt; no per-frame normal-flow mutation above the active vertical schedule ScrollView;
- canonical local channel-logo registry is wired for NPO 1/2/3, RTL 4/5 and SBS6, with identical text fallback geometry for channels without a local asset;
- once canonical broadcaster identity is established, non-current day loading/unavailability preserves that channel catalogue and never transiently replaces it with the generic deterministic fixture; the generic catalogue remains valid only in true fixture mode;
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
- **PR #81** — Per-zender fixed-row convergence and scroll-jank hardening. Merged after physical iPhone validation and independent QA. Established 52-pt standard rows, 176-pt current row, semantic anchor preservation, stable canonical channel identity and the fixed-native-viewport/collapse-isolation architecture.
- **PR #86** — accepted Per-zender compact temporal-context refinement. Merged documentation/design baseline: no selected-channel text outside the rail; fixed 52-pt temporal context; one-line 1.20-capped date/Primetime/Nu; 72→60 rail; 140/56/84 contraction architecture endpoints. Its initial expanded spacing calibration was later superseded by PR #89.
- **PR #89** — owner-approved final Per-zender expanded spacing after physical iPhone calibration: **4 pt rail→context / 52 pt context / 24 pt context→schedule**, condensed 0/52/0. The 28-pt expanded gap sum and frozen 140/56/84 collapse geometry remain unchanged.
- **PR #88** — Per-zender runtime convergence to the accepted compact temporal context plus iOS safe-area and selected-channel schedule-height/trailing-whitespace fixes. Final exact implementation head `0f3ccb3f00fecc3229f32dae9521d1bb6254f830` passed physical iPhone validation and Independent QA. Merge commit `6521da61159583d39dc55fe1e1cccabf5176251a`; post-merge CI #596 completed successfully.

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
- provenance-checked dark-background variants for RTL 4, RTL 5 and SBS6 remain required before those marks can pass final dark-mode visual acceptance; do not recolour or fabricate them;
- pricing/trial/paywall and subscription implementation;
- production typography licensing;
- final Tonight composition;
- physical Android validation.

## EXACT NEXT STEP
**Implement the owner-approved Programme Detail production specification in `docs/PROGRAMME_DETAIL_VISUAL_CONVERGENCE.md` as one separate HIGH-risk Phase 4 increment. `Herinner mij` fires 5 minutes before programme start; configurable lead time remains out of Phase 4 scope. Preserve the mounted-Guide/modal boundary, Guide round-trip context, accessibility, themes and all accepted Guide behaviour. Add deterministic coverage, exact-head CI, physical iPhone validation and Independent QA before Lead merge.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, this file, `docs/ENGINEERING_QUALITY_POLICY.md`, ADR 0007, ADR 0008 and the relevant accepted visual handoff before changing the repository. Phase 1A, Phase 1B, Phase 2 and Phase 3 are closed on iPhone. Phase 4 is active. Per-zender production convergence is merged and closed through PR #88/#89: preserve its 52/176 fixed rows, 4/52/24 expanded temporal composition, 0/52/0 condensed composition, semantic anchors, channel identity stability, safe-area handling, selected-channel schedule-height ownership, gestures, D-2..D+7 and the frozen PR #81 fixed-native-viewport/collapse-isolation architecture. The Programme Detail production handoff lives in `docs/PROGRAMME_DETAIL_VISUAL_CONVERGENCE.md`; it is owner-approved, including the fixed `Herinner mij` timing of 5 minutes before programme start. The next runtime increment is Programme Detail production convergence.