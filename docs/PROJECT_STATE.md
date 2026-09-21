# Teevee — Canonical Project State

Last updated: 2026-09-21.
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
1. **Phase 1A — Totaal interaction/technical baseline:** complete and physically accepted on iPhone. The final Totaal production visual design and implementation-ready production specification are owner-approved and canonical; runtime production visual convergence remains the open Phase 4 work.
2. **Phase 1B — Per zender / Nu & Straks:** complete and physically accepted on iPhone.
3. **Phase 2 — App Shell:** complete and physically accepted on iPhone.
4. **Phase 3 — Real Data Vertical Slice:** complete and physically accepted on iPhone. Real provider -> hosted ingest -> canonical persistence -> public typed read -> mobile canonical datasource is proven, including fixture-first startup, real-data transition, fallback and context retention.
5. **Phase 4 — Core Guide MVP hardening:** **ACTIVE**. The 06:00 television-day foundation, television-day-aware runtime, D-2..D+7 navigation/date context, measured Totaal performance hardening, Per-zender production convergence, Programme Detail production convergence and Nu & Straks production convergence are merged and physically accepted on iPhone. **Totaal production visual design is owner-approved through PR #110 and its implementation-ready production visual-convergence specification is canonical through PR #112; runtime production visual convergence is the remaining Guide production-convergence work, so Phase 4 remains open.** The final Nu & Straks runtime head `f7e88a4a2cb3a212d59a4827e7f28c1e2e665975` passed exact-head CI, owner physical iPhone validation and Independent QA before merge through PR #96; exact-main CI #754 and the docs closeout exact-main CI #758 succeeded. The cache decision remains **no persistent mobile schedule cache now** absent new measured evidence; true no-network cold start and any persistence technology decision remain a release-like Phase 9 gate. Physical Android interaction acceptance remains deferred until Android hardware is available.
6. **Phase 5 — Search and Discovery:** planned, **not active yet**. Search remains the first intended Phase 5 slice after Totaal production design/convergence is completed; Tonight remains later and provisional.

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
- canonical production specification is `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`, established through PR #93, refined by PR #97 and PR #100, and finalized from physical iPhone evidence through owner-approved PR #102;
- shared reference instant across channels; live mode uses the exact actual instant/minute and is never semantically rounded to a rail target;
- browse navigation settles in **15-minute** increments across the canonical 06:00–06:00 television day; whole/half hours show labels plus **1×10 pt** `railTick` marks, quarter hours use unlabeled **1×6 pt** `railTick` marks, and the **2×12 pt** `currentTime` marker remains strongest;
- semantic `railTick` is light **#80807A** / dark **#72726B**; whole/half opacity **1.00**, quarter opacity **0.78**;
- the horizontal rail-bottom line is **1 pt `railTick` at opacity 0.78**, exactly matching the approved quarter-hour ticks; generic `border` is not used for that line;
- there is **no standalone visible reference-time copy** in live or browse mode and no empty lane reserved for it; the rail carries visible temporal orientation while the exact reference instant remains semantic state;
- `Nu` active/current and return-to-live are materially distinct states; `Primetime` remains the 20:30 shortcut on the active television day;
- shared Guide tabs remain **48 pt / one line through fontScale 1.35** and **64 pt / max two lines above 1.35**, retaining the 1.20 compact-label cap;
- Nu & Straks keeps one **52-pt utility-only Primetime/Nu context + 52-pt rail = 104-pt persistent functional stack at all font scales**; Larger Text does not reintroduce a reference-time lane;
- native collapse distance remains **56 pt**; responsive GuideChrome compensation remains **44 pt standard / 60 pt Larger Text** and stable visible channel/list anchors are preserved;
- while Nu & Straks remains live, crossing to a new nearest-quarter rail target recentres the rail exactly once while the semantic reference continues to follow the actual minute; entering native browse/drag relinquishes live recenter ownership synchronously so clock updates never fight drag or momentum;
- when an established channel catalogue is retained during temporary schedule unavailability, retained channel identities expose their full display names to VoiceOver/TalkBack because no programme actions carry that identity; normal schedule-present rows keep channel identity out of the accessibility focus order to avoid redundant stops;
- stable vertical channel context while reference time changes;
- reference programme + exactly three following programme slots; no visible reference-programme `tot HH:MM` metadata, while full times remain in accessibility/Programme Detail;
- default reference block remains minimum **64 pt**, but the title is bottom-aligned with **0 pt extra bottom inset**; dedicated reference→following gap is **0 pt**;
- channel bottom padding is **12 pt**, preserving normal channel-row totals of **216 pt iOS / 228 dp Android**;
- following programme targets remain directly adjacent, non-overlapping minimum **44 pt iOS / 48 dp Android**; at standard text, visible content uses proportional target-slack offsets **#1 = 2/3 / #2 = 1/3 / #3 = 0**, yielding ~16-pt iOS / ~18–19-dp Android visible gaps, while Larger Text remains vertically centred;
- above fontScale 1.35, following content remains substantive/uncapped and uses the physically accepted inline time+title composition with maximum two visible lines; stacked time-above-title is only the extreme fallback when **fontScale >2.0 AND programme width <180 pt**;
- dark mode, Larger Text composition, 15-minute rail/ticks, Nu/Primetime, vertical-position preservation and the accepted native rail fling/settle interaction are physically accepted and frozen;
- Nu & Straks uses the shared Guide shell;
- `NowNextGuideView` stays behind deferred `import()`; do not restore a static startup import without separate physical evidence.

## Programme Detail
- production convergence is merged and closed through PR #92;
- direct from all three Guide presentations; no intermediate preview sheet; the originating Guide remains mounted and round-trip context is preserved;
- action scope is `Herinner mij` + `Bewaar`; Share is not required;
- `Herinner mij` uses the canonical five-minute lead time, with immediate fallback inside the final five minutes and no reminder after programme start;
- local personal state is provider-independent; reminder scheduling/cancellation is isolated behind the notification boundary;
- Android 12+ exact-alarm scheduling uses `SCHEDULE_EXACT_ALARM`, verifies special-access capability before scheduling, fails closed when capability is unavailable/indeterminate, and preserves cleanup metadata when native cancellation cannot be confirmed;
- contextual sticky action copies, measured hysteresis, Dynamic-Type-safe action stacking, safe-area ownership and handle-zone swipe-to-dismiss are production behaviour.

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
- **PR #91** — owner-approved canonical Programme Detail production design specification. Merged before runtime implementation.
- **PR #92** — Programme Detail production convergence. Final exact implementation head `4a21b36c690aaa0df598dcc5ddf33ada1c790bcf` passed physical iPhone validation and Independent QA after reminder lifecycle/concurrency hardening. Merge commit `ba59ea72c41d0ee73c8fea30bb4de8b59454e00b`; post-merge CI #650 completed successfully, including the main/release full-ABI Android build. Physical Android exact-alarm special-access interaction remains deferred to Android hardware.
- **PR #93** — owner-approved Nu & Straks production design specification. Exact design head `18ee2b81357819b39ee35b9196d7f984ad59e9b7`; merge commit `21e1e61b950046fd0e77308be5a64d09721e6310`; post-merge docs/design CI #654 completed successfully. Runtime implementation remains a separate HIGH-risk increment.
- **PR #97** — owner-approved Nu & Straks temporal/density refinement after physical iPhone review evidence. Exact design head `d0834ce2f25ec25c9e969354bc5241790960e10a`; merge commit `8b838fc71e2dd3aea601731defb11e9680a5d99b`; post-merge docs/design CI #677 completed successfully. It supersedes the earlier Nu & Straks production calibration only for the explicit 15-minute rail/tick, reference-copy, Nu-state and default-density metrics recorded in the canonical specification. At that point, open runtime PR #96 still required reconciliation before physical acceptance could resume.
- **PR #100** — owner-approved Nu & Straks physical accessibility refinement after rejection of PR #96 exact head `32db9459d265e8546c7137baf82e623f015ad652`. Exact design head `d2ece22771b35f369d40e58a51f8b85ffb461933`; merge commit `319e3caad758d0d7b511f2a01180ad91847a293f`; post-merge docs/design CI #695 completed successfully. It introduces dedicated `railTick` contrast, responsive shared Guide tabs/reference-context geometry, inline larger-text following composition and clustered visible following rhythm while preserving minimum touch targets and the frozen Nu & Straks interaction model. At that point, PR #96 required another reconciliation before physical acceptance could resume.
- **PR #102** — owner-approved final Nu & Straks physical-composition refinement after partial physical acceptance of PR #96 exact head `224e7df1d47dbb5c42694cb36469de673496e7d5`. Exact design head `67a15db6e7f325247ca49bc95e34811449cd1729`; merge commit `778445acbf8f71b1383fdede4178f861e4074f62`; post-merge docs/design CI #725 completed successfully. It removes all standalone visible reference-time copy, fixes the rail-bottom line to 1-pt `railTick` @0.78, and tightens reference→following composition through bottom-aligned reference titles plus a 0-pt dedicated transition while preserving 216/228 row totals and independent 44/48 following targets.
- **Final standard-text density micro-refinement (owner physical evidence on PR #96 head `3cafcc6bee996eb1923549bb3b65fdabb6666262`)** — the remaining standard-text following-density issue was resolved with proportional target-slack offsets #1=2/3, #2=1/3, #3=0 while Larger Text remained frozen and centred. The resulting implementation was carried through the final PR #96 production convergence.
- **PR #96** — Nu & Straks production convergence. Final exact implementation head `f7e88a4a2cb3a212d59a4827e7f28c1e2e665975` passed exact-head CI #753 (64 test files / 448 tests), full owner physical iPhone acceptance and Independent QA after the two final correctness fixes: live nearest-quarter rail advancement without fighting native browse/momentum, and accessibility-preserving retained channel identities during schedule unavailability. Merge commit `b0df0cc08f565aa1a36edf794e60ced0f391f67c`; exact-main CI #754 completed successfully, including the main/release full-ABI Android build. Physical Android interaction remains deferred to Android hardware.
- **PR #110** — owner-approved Totaal production visual baseline. Canonical board: `/Teevee/Totaal production design - light dark expanded condensed.png` (Library file id `file_00000000aafc8230b3218e6577a1d912`). It freezes Totaal production composition/hierarchy while preserving the already proven interaction/data/performance architecture.
- **PR #112** — owner-approved Totaal implementation-ready production visual-convergence specification. Exact design/spec head `6c68202bce249c8eff2e198699e2a582bce55ede`; merge commit `4638f0574c60f3ad2f0d723c55a9291c9aff1e29`; post-merge docs/design CI #784 succeeded. It freezes the exact 84/76/3.00 schedule calibration, 52+44=96 persistent functional stack, 100/116 shared GuideChrome, 56 native collapse with 44/60 compensation, Dynamic Type formulas, Totaal channel/time-axis/current-marker/programme typography contracts, edge cases and physical acceptance criteria. PR #111 was an earlier superseded review proposal and was closed unmerged.

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

## Phase 4 closeout
- no persistent mobile schedule cache is selected for Phase 4; issue #67/#70/#73 evidence identified render/mount work rather than network/cache as the dominant cold Guide bottleneck, and the accepted bounded-rendering fixes resolved that path without cache/prefetch architecture;
- current graceful degradation remains deterministic fixture-first rendering plus preservation of usable in-memory runtime schedule state across failed refreshes;
- PRODUCT's MVP-level local caching/graceful-offline requirement remains a release requirement, but true no-network cold start and the concrete persistence technology decision are deferred to release-like Phase 9 evidence outside Expo Go;
- physical Android interaction acceptance remains open/deferred until an Android device is available and is not represented as passed.

## Canonical visual handoff
`docs/VISUAL_BASELINE.md`, `design/current/` and the accepted Guide visual-convergence documentation are the source of truth for visual implementation. Current runtime appearance is not automatically the accepted visual target. Do not mix unapproved brand explorations into production implementation.

For Totaal, the **production visual design and production specification are owner-approved and canonical**. Canonical composition is `/Teevee/Totaal production design - light dark expanded condensed.png` (`file_00000000aafc8230b3218e6577a1d912`); `design/current/guide/TOTAAL.md` is the accepted design manifest and `docs/TOTAAL_VISUAL_CONVERGENCE.md` is the exact implementation authority. Frozen interaction/data constraints remain intact: 2D time/channel navigation, real programme geometry, shared day selector + `Nu`, native inertia/bounce/directional lock, Programme Detail context, Instrument Sans and the proven performance/windowing architecture.

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
**Implement Totaal production visual convergence from the owner-approved canonical specification `docs/TOTAAL_VISUAL_CONVERGENCE.md` and accepted board `file_00000000aafc8230b3218e6577a1d912`. Inspect the existing Totaal/Guide implementation before editing and preserve all frozen interaction/data/performance mechanics: horizontal=time, vertical=channels, real-duration programme geometry, 120-pt viewed-time anchor, D-2..D+7/06:00 semantics, native inertia/bounce/directional lock, EdgeReadabilityOverlay, Programme Detail round-trip, viewport-bucket programme windowing with 1.5× overscan, fixture-first/hosted continuity and provider independence. Implement the canonical production calibration exactly: shared GuideChrome 100/116; Totaal day/Nu52 + axis44 = 96 persistent stack; native collapse56 with 44/60 visual compensation; rail84; base row76; 3.00 pt/min; open programme grid with no card fill/gap/progress/full-height now line; programme typography 15/19 + 13/18; owner-approved Dynamic Type formulas; logo-first 48×36 optical box; 15-minute axis/tick hierarchy; compact current-time marker; semantic light/dark/system states and accessibility contracts. This is HIGH-risk Guide work: require deterministic tests, strict TypeScript, lint, full tests, iOS/Android/web exports, classifier-selected native/config CI, exact-head Lead review, physical iPhone validation and Independent QA before merge. Do not combine with Search, Tonight, provider/cache work or unrelated refactors.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, this file, `docs/TOTAAL_VISUAL_CONVERGENCE.md`, `design/current/guide/TOTAAL.md`, `docs/VISUAL_BASELINE.md`, `docs/PRODUCT.md`, `docs/UX.md`, `docs/DESIGN_SYSTEM.md`, `docs/ARCHITECTURE.md`, `docs/DATA.md`, `docs/ENGINEERING_QUALITY_POLICY.md`, ADR 0007 and ADR 0008 before changing the repository. Phase 4 remains ACTIVE. Per-zender, Programme Detail and Nu & Straks production convergence are merged and accepted on iPhone. Totaal interaction/performance architecture is proven; its owner-approved visual baseline is canonical through PR #110 and its exact implementation-ready production specification through PR #112. The next step is runtime Totaal production visual convergence only. Do not reopen accepted visual metrics or frozen mechanics without concrete technical/accessibility evidence. Phase 5 Search remains planned but not active. Physical Android interaction validation remains deferred until Android hardware is available.