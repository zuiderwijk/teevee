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
1. **Phase 1A — Totaal:** complete and physically accepted on iPhone.
2. **Phase 1B — Per zender / Nu & Straks:** complete and physically accepted on iPhone.
3. **Phase 2 — App Shell:** complete and physically accepted on iPhone.
4. **Phase 3 — Real Data Vertical Slice:** complete and physically accepted on iPhone. Real provider -> hosted ingest -> canonical persistence -> public typed read -> mobile canonical datasource is proven, including fixture-first startup, real-data transition, fallback and context retention.
5. **Phase 4 — Core Guide MVP hardening:** active. The 06:00 television-day foundation, television-day-aware runtime, D-2..D+7 day navigation/date context, measured Totaal cold-switch performance hardening, Per-zender production convergence and Programme Detail production convergence are merged. Nu & Straks production design is canonical through PR #93, refined by PR #97 and further owner-refined from physical iPhone evidence through PR #100. Open runtime PR #96 must now be reconciled to the PR #100 baseline before physical iPhone acceptance resumes. Physical Android interaction acceptance remains deferred until Android hardware is available.

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
- canonical production specification is `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`, established through PR #93, refined by PR #97 and physically recalibrated through owner-accepted PR #100;
- shared reference instant across channels; live mode uses the exact actual instant/minute and is never semantically rounded to a rail target;
- browse navigation settles in **15-minute** increments across the canonical 06:00–06:00 television day; whole/half hours show labels plus **1×10 pt** `railTick` marks, quarter hours use unlabeled **1×6 pt** `railTick` marks, and the **2×12 pt** `currentTime` marker remains strongest;
- semantic `railTick` is light **#80807A** / dark **#72726B**; whole/half opacity **1.00**, quarter opacity **0.78**;
- visible reference context has no `Referentietijd` caption: live shows `Nu · HH:MM`, browse shows the settled time;
- `Nu` active/current and return-to-live are materially distinct states; `Primetime` remains the 20:30 shortcut on the active television day;
- shared Guide tabs are **48 pt / one line through fontScale 1.35** and **64 pt / max two lines above 1.35**, retaining the 1.20 compact-label cap;
- Nu & Straks reference/utilities use the **52-pt horizontal** context through 1.35 and an **88-pt 40+48 two-lane** accessibility context above 1.35; the persistent functional stack is therefore **104 pt standard / 140 pt accessibility**;
- stable vertical channel context while reference time changes;
- reference programme + exactly three following programme slots; no visible reference-programme `tot HH:MM` metadata, while full times remain in accessibility/Programme Detail;
- default reference block is minimum 64 pt with 4 pt reference→following transition; following programme targets remain adjacent, non-overlapping minimum 44 pt iOS / 48 dp Android targets;
- perceived following density is decoupled from interaction geometry: #1 visible content bottom-biased 2 pt, #2 centred, #3 top-biased 2 pt;
- above fontScale 1.35, following content remains substantive/uncapped and uses the accepted inline time+title composition with maximum two visible lines; stacked time-above-title is only the extreme fallback when **fontScale >2.0 AND programme width <180 pt**;
- normal channel-row calibration remains 216 pt iOS / 228 dp Android;
- accepted native time-rail fling/settle and mixed-gesture behaviour remain frozen;
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
- **PR #97** — owner-approved Nu & Straks temporal/density refinement after physical iPhone review evidence. Exact design head `d0834ce2f25ec25c9e969354bc5241790960e10a`; merge commit `8b838fc71e2dd3aea601731defb11e9680a5d99b`; post-merge docs/design CI #677 completed successfully. It supersedes the earlier Nu & Straks production calibration only for the explicit 15-minute rail/tick, reference-copy, Nu-state and default-density metrics recorded in the canonical specification. Open runtime PR #96 must be reconciled before physical acceptance resumes.
- **PR #100** — owner-approved Nu & Straks physical accessibility refinement after rejection of PR #96 exact head `32db9459d265e8546c7137baf82e623f015ad652`. Exact design head `d2ece22771b35f369d40e58a51f8b85ffb461933`; merge commit `319e3caad758d0d7b511f2a01180ad91847a293f`; post-merge docs/design CI #695 completed successfully. It introduces dedicated `railTick` contrast, responsive shared Guide tabs/reference-context geometry, inline larger-text following composition and clustered visible following rhythm while preserving minimum touch targets and the frozen Nu & Straks interaction model. PR #96 requires another reconciliation before physical acceptance resumes.

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
- reconcile open runtime PR #96 to the owner-accepted PR #100 Nu & Straks physical-accessibility baseline now canonical on `main`;
- complete Nu & Straks runtime convergence with deterministic coverage, exact-head CI, renewed physical iPhone validation and Independent QA;
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
**Reconcile the existing runtime PR #96 against the owner-accepted PR #100 Nu & Straks physical-accessibility baseline now canonical on `main`. Preserve all already-accepted PR #96 architecture/behaviour that PR #100 did not supersede. Implement: dedicated `railTick` token (#80807A light / #72726B dark, major opacity 1.00, quarter 0.78, 1-pt widths unchanged); shared Guide tabs 48/one-line through fontScale 1.35 and 64/max-two-lines above; Nu & Straks context 52 horizontal through 1.35 and 88-pt 40+48 two-lane above, with 104/140 persistent functional stack and matching collapse compensation; larger-text following programmes as inline time+title max-two-lines above 1.35, with stacked fallback only when fontScale >2.0 AND programme width <180 pt; and visible following-content clustering #1 bottom / #2 centre / #3 top while retaining three adjacent, independent 44-pt iOS / 48-dp Android touch targets. Update shared Guide/Per-zender runtime geometry where the shared presentation-tab accessibility rule requires it. Require deterministic coverage, exact-head CI and Lead re-review. Physical iPhone acceptance remains PAUSED until the reconciled PR #96 head is approved for a new physical pass; Independent QA remains after physical PASS.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, this file, `docs/ENGINEERING_QUALITY_POLICY.md`, ADR 0007, ADR 0008 and the relevant accepted visual handoff before changing the repository. Phase 1A, Phase 1B, Phase 2 and Phase 3 are closed on iPhone. Phase 4 is active. Per-zender production convergence is merged and closed through PR #88/#89. Programme Detail production convergence is merged and closed through PR #92. Nu & Straks production design is canonical through PR #93, PR #97 and owner-accepted physical refinement PR #100. Runtime PR #96 still reflects the physically rejected pre-PR #100 calibration and must now be reconciled to current `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`. Do not resume physical acceptance, request Independent QA or merge PR #96 until the new runtime head passes exact-head CI and Lead re-review.