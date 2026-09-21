# Teevee Development Logboek

Doel: chronologisch, begrijpelijk overzicht van substantiële milestones, verificatie en blokkades. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand. Granulaire CI/device-details blijven terugvindbaar in GitHub PR/commit-history en timestamped evidence-docs.

## Logboekregels
- Datum/tijd in Europe/Amsterdam waar praktisch.
- Eerst product-/gebruikerseffect, daarna techniek/verificatie.
- Claim alleen checks die aantoonbaar geslaagd zijn.
- Benoem regressies/gates expliciet.
- Iedere substantieve entry eindigt met de volgende stap.

---

## 21 september 2026 — Totaal physical refinement: ultra-micro density, vertical endpoint overscroll and current-time label

Owner physical iPhone validation of reconciled PR #114 head `36e1e3c27f475a5188bbc2950eb887f362344834` left three focused presentation defects while the broader Totaal convergence remained accepted: repeated very short broadcasts could create a barcode-like boundary/ellipsis pattern, top vertical rubber-banding moved only the schedule/channel canvas beneath the fixed functional stack, and the compact current-time marker could truncate a midnight label to `00:…`.

The microcell refinement keeps the existing full-frame micro classification (`frameWidth < 48 × S`) and every programme's real geometry, boundary, Pressable, accessibility label and Programme Detail destination. A second **presentation-only** floor now determines whether an individual microcell has enough room for the ellipsis glyph. The floor is derived from existing typography/geometry rather than a standalone magic constant: one 15-pt programme-title em plus the existing 6-pt micro inset on each side, scaled by `S`, giving **27 × S pt**. Below `27 × S` the microcell is visually empty; at and above `27 × S` the existing centred `…` remains. Repeated-title membership/identity and the existing `48 × S` visible-run shared-title threshold remain unchanged. The bounded repeated-run overlay applies the same individual-glyph floor only when it falls back from a shared title, so long-run windowing/1.5× overscan remains intact.

For vertical Totaal scrolling, the native schedule ScrollView now disables endpoint overscroll rather than making fixed Guide chrome imitate bounce. On iOS this sets `bounces={false}` and `alwaysBounceVertical={false}`, so the vertical schedule no longer rubber-bands at either top or bottom endpoint; normal native scrolling, fling/deceleration and the existing 56-pt collapse path remain unchanged. On Android `overScrollMode="never"` removes the platform edge-overscroll effect. Horizontal schedule/time-axis bounce and ownership are untouched, and Per-zender/Nu & Straks are not changed.

The current-time marker root cause was the body sizing contract: the body was fixed to the **38-pt minimum width** while also carrying 5-pt horizontal padding on both sides, leaving too little effective label space for five-character `HH:MM` text around midnight. The marker now reserves the frozen 38-pt minimum as the readable label box and adds the existing 5+5 pt padding outside it, giving a 48-pt base body. The body scales only with the existing compact 1.20 text cap (56 pt at the cap). The text is explicitly non-shrinking/centred. Edge clamping receives the actual body width, while the pointer continues to use the exact unchanged minute-X independently, so left/right body clamping never moves the semantic pointer.

Deterministic coverage now proves the exact `27 × S` ultra-micro boundary, a visually empty current 5-minute programme with full `nu bezig` accessibility and separate action/boundary, normal 15-minute ellipsis presentation, repeated-run shared-title/bounded-window behaviour, quiet ultra-micro run fallback, all four representative current-time strings (`00:00`, `00:04`, `09:09`, `23:59`), left/right marker-body clamping, the unchanged worklet helper and the Totaal-only native vertical endpoint policy. Code head `df3f30ea101a72c1a79019132a56735375b2efbe` passed CI #853 / run `35663036477`: strict TypeScript, lint, **71 test files / 522 tests**, and iOS/Android/web Expo export; the classifier correctly skipped the native/config Android job.

No Guide day-selector wording, 06:00 Europe/Amsterdam semantics, D-2..D+7 product horizon, selected-day/two-day hosted contract, EPG/provider/backend code, 84/76/3.00 geometry, 120-pt anchor, 1.5× overscan, horizontal ownership, first-open positioning, Nu policy, normal programme typography, Dynamic Type formulas or other frozen Totaal product metric was changed.

**Remaining physical gate:** validate exact final head on iPhone for (1) dense ultra-short rows staying calm while each cell remains tappable, (2) natural vertical scrolling/collapse with no partial-guide top pull-down state, including top and bottom endpoints, and (3) full current-time `HH:MM` readability near midnight and both horizontal viewport edges with the pointer still exactly on the current minute. Lead exact-head review precedes that physical gate. Do not merge or request Independent QA yet.

---

## 21 september 2026 — PR #114 reconciled with canonical main after EPG horizon closeout

PR #114 Totaal production visual convergence was reconciled with canonical `main` `c990ee5dcf757c88d7721ccccc82e6585402d185` after PR #116, PR #117 and PR #118 closed the Guide EPG horizon incident. The reconciliation uses a true merge commit with the prior PR #114 head and current main as parents. Main-only EPG/data/runtime files are inherited byte-identically from canonical main; the only overlapping path since the common base was `docs/DEVLOG.md`, which was merged additively so both the canonical EPG incident history and the existing Totaal convergence history remain intact.

No Totaal runtime conflict required product or metric reinterpretation. All owner-approved/frozen Totaal work remains unchanged: 120-pt viewed-time anchor, 1.5× programme overscan, horizontal single-source gesture ownership, worklet-safe current-time marker, first-open positioning, distance-aware `Nu`, micro-programme `…` treatment, repeated-title run identity and bounded repeated-run presentation, exact programme duration geometry and the accepted production shell/collapse metrics.

The reconciled client still uses `useSelectedGuideDaySchedule` with selected television-day loading; Totaal requests the selected day plus following day only when that following day is selectable, and `loadTwoTelevisionDayGuideSchedule` retains the all-or-nothing contract by returning `null` when either independent hosted canonical television-day read is unavailable. `HostedGuideScheduleClient` remains the client data source; no XMLTV/provider fallback or client-side horizon workaround was introduced.

Canonical PR #116/#117/#118 EPG files, including the server-side `guide-horizon` refresh, hosted transport policy, XMLTV provider fix, deployed Edge Function source and television-day horizon migration, are inherited unchanged from main. The live-proven 06:00 Europe/Amsterdam television-day semantics and D-2..D+7 product horizon therefore remain canonical.

**Next step:** exact-head CI, then Lead exact-head review followed by renewed owner physical iPhone acceptance. Do not merge and do not request Independent QA before those gates pass.

---

## 21 september 2026 — Guide EPG horizon incident operationally closed

PR #117 merged as `c875922225e27c825fa9b0c6cbde2d08b8d22205`; exact-main CI #839 succeeded. `epg-refresh` was redeployed as live version 6 and protected refresh request 88 completed with HTTP 200 in `guide-horizon` mode. Canonical storage now materialises true 06:00 Europe/Amsterdam television-day windows. Complete D0..D+5 windows were stored for all 12 development channels, while incomplete historical/future windows were correctly skipped without destructive replacement.

Remote Supabase migration history was reconciled to the repository timestamps through `20260921213000_refresh_guide_television_day_horizon.sql`.

Physical iPhone smoke on PR #114 exact head `4c3a2d97c67814d71861298ef8a8d341ad1924c2` passed the original regression: horizontal Vandaag→Morgen browsing and explicit Morgen selection both showed guide data. The first unavailable selected day was 26 September. That is expected with the current Totaal all-or-nothing two-day continuity loader: D+5 itself is complete, but its required following D+6 development-provider window is partial, so the composed Totaal read is unavailable.

Durable evidence: `docs/PHYSICAL_EVIDENCE_2026-09-21_EPG_HORIZON.md`.

**Next step:** continue the broader physical acceptance of open Totaal production-convergence PR #114; do not reopen the EPG horizon correction unless new regression evidence appears.

---

## 21 september 2026 — PR #116 live rollout exposed epg-refresh BOOT_ERROR

After PR #116 merged and exact-main CI #837 passed, the updated `epg-refresh` Edge Function was deployed as live version 5 and the guide-horizon migration was applied. The first protected one-shot refresh through `teevee.enqueue_development_epg_refresh()` returned request id 87, but `net._http_response` recorded HTTP 503 with `BOOT_ERROR`: the function failed before request-handler logging or EPG ingestion began. No new 06:00 television-day coverage was written; the canonical store therefore still contained the previous calendar-midnight windows.

The hotfix branch `hotfix/epg-refresh-edge-boot` removes the new horizon module's dependence on runtime alias/sloppy-import resolution by using explicit relative `.ts` module specifiers. A dedicated regression test walks the deployed `epg-refresh` runtime import graph with the TypeScript AST and rejects runtime `@/` aliases, extensionless relative imports and unsupported bare imports. This targets the only new boot-time module-resolution dependency introduced by the horizon refresh while leaving horizon semantics, provider coverage classification, canonical replacement rules, auth, cron and client behaviour unchanged.

The migration-history timestamp mismatch created by the Management API deployment remains operational cleanup only; do not run a normal `db push` until remote history is reconciled with canonical repo migration `20260921213000_refresh_guide_television_day_horizon.sql`.

**Verification:** hotfix exact-head CI, Independent QA and live redeployment/retry are still required. **Next step:** finish the hotfix PR gates, redeploy `epg-refresh`, re-trigger the protected guide-horizon refresh, prove 06:00 canonical coverage, then reconcile migration history and perform the focused physical iPhone smoke.

---

## 21 september 2026 — Totaal repeated-run overlay bounded to canonical programme window

Lead review of the first owner-approved micro-programme implementation found one performance-architecture blocker: repeated-title run **identity and geometry** were correctly full-schedule and bucket-stable, but the overlay still rendered `run.programmes.map(...)`. A sufficiently long repeated-title run could therefore mount ellipsis presentation nodes far outside the frozen coarse programme render window and partially bypass the accepted 1.5× overscan architecture.

The correction keeps the two responsibilities separate. Canonical run derivation remains based on the complete chronological channel schedule before viewport windowing, so run ID, membership, start/end geometry, shared-title threshold and partial-left/right behaviour remain unchanged across bucket transitions. A new bounded presentation layer is then derived from the already-windowed programmes for the current coarse render window. `TotaalMicroProgrammeOverlay` receives the full run plus only the intersecting member subset and renders per-cell `…` nodes from that bounded subset. Shared-title geometry still uses the complete run start/end, so the title remains sticky/clipped against the true run bounds rather than the current bucket.

Deterministic coverage now proves that a long 24-member repeated run keeps the same full run ID/membership while two distant programme windows expose only their six intersecting overlay members. Component coverage additionally verifies that a 20-member run can render a four-member bounded subset while the overlay width/visible layout still follows the full run geometry. Existing 4×5-minute / 3×5-minute behaviour, per-programme Pressables, boundaries, accessibility/Programme Detail ownership and normal EdgeReadabilityOverlay semantics are unchanged.

Code head `53c2f5da50a24934b383abef94a33ae59b828062` passed CI #834 / run `35649144128`: npm ci, strict TypeScript, lint, **69 test files / 515 tests**, and iOS/Android/web Expo export. The runtime-ui classifier correctly skipped the native/config Android job. No visual metric, micro threshold, scroll ownership, programme-window size/overscan, Guide geometry, EPG/data contract, Per-zender or Nu & Straks behaviour changed.

Physical iPhone acceptance remains open because the repeated-title overlay is native-scroll-coupled presentation. The device gate should additionally hard-fling across bucket transitions and confirm no duplicate/flashing shared title while the bounded member subset swaps underneath the same canonical run identity.

**Next step:** Lead exact-head review of the final PR #114 head, then owner physical iPhone validation. Do not merge and do not request Independent QA yet.

---

## 21 september 2026 — Totaal micro-programme refinement reconciled and implemented

PR #114 was first reconciled with canonical `main` `a6d57197b78d62ea3757f4be170f0a1181f11413`, which contains the owner-approved micro-programme design/spec merge from PR #115. The existing Totaal production runtime, horizontal ownership fix, mount-time Reanimated worklet fix, first-open positioning refinement and distance-aware long-range `Nu` navigation were preserved unchanged.

The runtime now classifies a programme as a microcell from its **full real frame width** using the canonical strict `frameWidth < 48 × S` rule, with `S = max(1, effectiveFontScale)`. Individual microcells keep their exact programme action/frame/boundary but suppress title fragments and secondary time in favour of one centred semantic-primary `…`; current microcells use the existing Semibold title weight while non-current microcells use Medium. No minimum width, gap, fill, radius, shadow or duration retuning was introduced.

Repeated-title runs are derived once from the complete chronological programmes-per-channel before viewport windowing. Membership requires at least two adjacent microcells, exact temporal abutment and exact/case-sensitive title equality after trim plus whitespace collapse. Run IDs and membership therefore remain stable across programme-window buckets. The underlying programme cells continue to own every hit target, press state, accessibility label and Programme Detail destination.

A dedicated non-interactive presentation overlay renders repeated-title runs without creating a second accessibility tree or gesture surface. It uses the existing Reanimated `scrollX` shared value to compute the visible run intersection on the UI thread, so the shared title can re-anchor inside true run bounds during partial-left scrolling without React state updates per frame. At a visible intersection of at least `48 × S`, per-cell ellipses are suppressed and one Medium, one-line shared title is drawn with the frozen 6-pt inset. Below that threshold, the overlay returns to individually centred ellipses. The overlay is pointer-transparent/accessibility-hidden and has no background, so canonical underlying programme boundaries remain visible except where glyphs naturally cross them. Normal/non-micro partial-left readability continues through the existing `EdgeReadabilityOverlay`; microcells are explicitly excluded from that normal-title duplication path.

Deterministic coverage was added for strict threshold/equality behaviour, Dynamic Type scaling, full-frame classification, individual/current microcells, run formation and all break conditions, whitespace normalization/case sensitivity, bucket-independent membership, exact shared-title threshold, four×5-minute and three×5-minute examples, partial-left/right run geometry, fallback to ellipses, action/boundary ownership, pointer/accessibility transparency, Medium shared-current typography, centred micro affordance and semantic primary text usage across appearance tokens. Existing Guide/windowing/detail/accessibility tests remain green.

Implementation code head `2a8401efa90c87e7a0cbc9eb61bbe83e3aa26061` passed CI #829 / run `35645887273`: npm ci, strict TypeScript, lint, **69 test files / 513 tests**, and iOS/Android/web Expo export; the runtime-ui classifier correctly skipped the native/config Android job.

This implementation does not claim physical acceptance. The remaining gate is owner iPhone validation of individual microcells, repeated-title runs, per-programme tap ownership, partial-left/right transitions, Larger Text, light/dark, programme-window transitions and regression checks for first-open positioning plus short/long `Nu` navigation.

**Next step:** Lead exact-head review, then owner physical iPhone validation on the final PR #114 head. Do not merge and do not request Independent QA yet.

---

## 21 september 2026 — Totaal initial-positioning and long-distance Nu polish

Further physical iPhone validation of PR #114 confirmed that the mount-time crash was gone, then exposed two non-crashing presentation/runtime defects: Totaal could visibly paint around the television-day start before jumping to the intended viewed-time position, and a long animated `Nu` return could temporarily outrun the coarse programme window and expose an empty schedule while the channel rail remained visible.

Development kept the accepted 120-pt viewed-time anchor, native horizontal ownership state machine, 1.5-viewport programme overscan, visual metrics, collapse/Reduce Motion and Guide data contracts unchanged. The first Totaal render now derives its authoritative horizontal offset and programme bucket synchronously from the initial viewed time. The mount/day positioning path was moved from a one-frame-delayed `requestAnimationFrame` effect to pre-paint `useLayoutEffect`, so the schedule and time axis are positioned together against an already-correct render bucket rather than first presenting the 06:00-side window.

Programmatic navigation now derives its animation policy from the existing programme-window overscan rather than adding another arbitrary timing/distance constant. Requested native animation is retained while the full travel is at most **1.5 programme viewports**, which is exactly the distance already covered safely by the source bucket's frozen overscan. Longer travel is converted to a direct two-phase jump: the target programme bucket commits first, then a layout effect positions the authoritative `scrollX`, schedule and time axis together. This prevents a long `Nu` animation from crossing more buckets than React windowing can guarantee while preserving native animation for nearby jumps. Reduce Motion continues to request direct positioning as before.

Deterministic windowing coverage now verifies target-bucket ownership on the first visible viewport, the exact 1.5-viewport animated boundary, long-distance target prealignment/direct navigation, and explicitly non-animated positioning. The existing horizontal ownership regression suite remains unchanged. Runtime head `89ff4294324feefbe40ee4c123d4cd47a39f39ba` passed CI #817 / run `35642921488`: npm ci, strict TypeScript, lint, **67 test files / 491 tests**, and iOS/Android/web Expo export. The runtime-ui classifier correctly skipped the native/config Android job.

No micro-programme rendering was implemented here; that remains intentionally deferred until the separate owner-approved Design/UX refinement is canonical. No Per-zender or Nu & Straks contract changed.

**Next step:** focused physical iPhone revalidation of initial Totaal presentation and both short/long `Nu` navigation on the final exact PR head, then continue the broader Totaal acceptance flow. Do not merge or request Independent QA yet.

---

## 21 september 2026 — Totaal mount-time Reanimated worklet contract fix

Focused physical iPhone revalidation still failed on exact head `3a50e2a39fefce80e7981f853735c85174593aff`: switching from another Guide presentation to Totaal continued to terminate the app immediately. The previously added horizontal single-source ownership state machine remains technically valid and is intentionally unchanged, but device evidence showed that reciprocal scroll ownership was not the direct mount-time termination cause.

Lead then identified a concrete Reanimated UI-thread contract violation on the unconditional Totaal mount path. `GuideView` creates `currentMarkerBodyStyle` with `useAnimatedStyle`, which synchronously calls `totaalCurrentTimeMarkerBodyX()`. That pure helper lacked an explicit `'worklet';` directive even though it executes on the UI thread. Development added only that directive; marker geometry and return values are unchanged. The existing deterministic marker-geometry test now also guards that the helper remains explicitly workletized.

The complete Totaal UI-thread call-chain audit covered `useAnimatedStyle`, `useAnimatedReaction` and `useAnimatedScrollHandler` paths in `GuideView`, `EdgeReadabilityOverlay`, `TimeAxisLeftMask` and shared `GuideChrome`. All other synchronous helper chains were already worklet-safe: `totaalStableScrollVisuals` → `guideChromeExpandedHeight` → `guidePresentationNavigationMetrics` → `guideUsesAccessibilityChrome`; `totaalCollapseProgressForScrollOffset`; `totaalChromeCondensedForProgress`; every horizontal-ownership helper including their nested idle-owner calls; `clippedTimeAxisLabelWidth` → `centredTimeAxisLabelLeft`; and `edgeBoundaryBucket`. Reanimated `scrollTo` and `scheduleOnRN` remain the intended UI/native and UI→RN bridges. No second non-worklet synchronous helper call was found.

Runtime/test head `cea16ddc551a80d30aa4b63d51e15106d34c2726` passed CI #814: npm ci, strict TypeScript, lint, **67 test files / 487 tests**, and iOS/Android/web Expo export. The runtime-ui classifier correctly skipped the native/config Android job. No visual metric, current-marker geometry, horizontal ownership behaviour, collapse/Reduce Motion, programme-windowing parameter, ChannelIdentity, Per-zender/Nu & Straks contract or canonical design/spec changed.

Green CI does not prove this native worklet failure class. Physical iPhone acceptance therefore remains **FAILED/CLOSED** until Lead reviews the exact final PR head and switching to Totaal is revalidated on-device. If termination persists after this targeted fix, the next diagnostic step is native crash-log capture rather than another speculative runtime change.

**Next step:** Lead exact-head review followed by focused physical iPhone revalidation; do not merge and do not request Independent QA before physical PASS.

---

## 21 september 2026 — Totaal physical iPhone crash: horizontal ownership fix candidate

Physical iPhone validation of PR #114 exact head `397fc54e3695a45d72442c0b7c15c38b5e29a1b7` failed immediately when switching to Totaal: the app terminated before visual validation could begin. Lead traced the highest-confidence runtime cause to reciprocal native horizontal mirroring between the independently draggable programme schedule and sticky time axis: each surface treated every `onScroll`, including the peer's programmatic mirror event, as authoritative and immediately scrolled the other surface back.

Development replaced that reciprocal path with a small worklet-safe single-source ownership state machine while preserving both native draggable surfaces. A schedule drag owns authoritative `scrollX` and mirrors only to the passive axis; an axis drag does the inverse. Passive mirror events are ignored, ownership survives the initiating surface's native momentum and is released only after settle, and only an idle surface may become the next gesture owner. Animated Nu movement uses the schedule as the temporary native programmatic owner so programme-window buckets continue to follow real native viewport movement. Initial positioning, day selection and other non-animated programmatic jumps set the authoritative offset and both native peers directly while ownership is idle, so their resulting native events cannot mirror back.

Deterministic regression coverage now exercises schedule→axis/no-back-mirror, axis→schedule/no-back-mirror, momentum retention, post-settle ownership transfer, loop-free direct positioning, animated Nu ownership, day-selection/120-pt-anchor alignment, authoritative programme-window bucket changes and non-momentum release. No visual metric, Reduce Motion geometry, programme-window parameter, ChannelIdentity, Per-zender or Nu & Straks contract changed. Final crash-fix candidate `eb1aaa24de68f0e69d53761901ab6dde9a94af9c` passed exact-head CI #812 / run `35636872975` with strict TypeScript, lint, **67 test files / 487 tests**, and iOS/Android/web Expo export; the runtime-ui classifier correctly skipped the native/config Android job.

Physical acceptance remains explicitly **FAILED/CLOSED** until Lead reviews the final exact head and switching to Totaal is revalidated on physical iPhone.

**Next step:** exact-head Lead review, then repeat physical iPhone validation; do not merge and do not request Independent QA before physical PASS.

---

## 21 september 2026 — Totaal production visual convergence implemented in PR #114

Development converged Totaal to the owner-approved production visual specification without replacing the proven 2D Guide architecture. The runtime now uses the shared GuideChrome/tabs, the fixed native schedule viewport with 56-pt collapse isolation, a persistent 52-pt day/Nu context plus 44-pt time axis, the 84-pt base logo-first channel rail and deterministic Dynamic Type geometry. Programme cells keep exact start/duration geometry at 3.00 pt/min base scale with zero permanent gap, no card fill/radius/progress treatment, Instrument Sans title hierarchy, current `tot HH:MM` copy, restrained temporal boundaries and semantic pressed-only elevation.

The time axis now uses real 15-minute positions with labels at :00/:30, production railTick hierarchy, a compact exact-minute current-time marker and no full-height now line. Totaal has an explicit ChannelIdentity presentation so successful logos do not duplicate visible names while retained channels remain accessible when programme actions are absent. Partial-left readability, viewport-bucketed programme windowing with 1.5-viewport overscan, D-2..D+7/06:00 television-day semantics, wall-clock-preserving day changes, Nu, native inertia/bounce/directional lock, fixture-first→hosted continuity and Programme Detail round-trip remain on the existing architecture.

A small runtime support refactor isolates Totaal programme rendering into `TotaalProgrammeCell` and adds deterministic helpers for collapse geometry, vertical channel-context preservation, unavailable-state presentation, axis/marker calibration and width-aware content degradation. No new dependency, provider/cache/Search/Tonight scope or parallel Guide implementation was introduced.

Deterministic coverage was expanded for geometry, no-gap programme widths, 15-minute axis hierarchy, typography/current copy, width degradation, current marker, logo/accessibility behaviour, 100/116 shared chrome with 196/212→96 collapse endpoints, compact date wording, 120-pt viewed-time anchor, television-day/day-switch/Nu semantics, Dynamic Type formulas, partial-left readability, programme windowing, Detail/runtime continuity, themes and shared Guide tabs. Lead review of exact head `ef8adb72f213917bb404c9fde30ee1742824b61b` then identified four deterministic production-spec mismatches before the physical gate: Reduce Motion did not compose to the same settled endpoint at the 28-pt discrete switch, :00/:30 axis labels were not geometrically centred on their ticks, the Totaal no-logo fallback used full `displayName` instead of `shortName ?? displayName`, and the required 16-pt clearance after the final row was missing. Those four issues were corrected on the existing PR without retuning any accepted metric or shared Per-zender/Nu & Straks contract.

Final implementation head `6985ed57625a2a9ea2520fb03b470c929e058752` passed PR CI #809: npm ci, strict TypeScript, lint, **66 test files / 478 tests**, and iOS/Android/web Expo export. The runtime-ui classifier correctly skipped the native/config Android compile job because no native/config files changed. Added deterministic coverage verifies composed Reduce Motion geometry at 27.99/28 pt for standard and Larger Text, semantic channel-offset continuity across that switch, centred axis-label/mask geometry, shortName/displayName fallback semantics and exact 16-pt trailing schedule clearance.

Physical acceptance is intentionally not claimed here. The next gate is renewed Lead exact-head review, then physical iPhone validation of expanded/condensed composition, Reduce Motion, horizontal/vertical gesture ownership, current-time marker/time-axis alignment, logo rail/fallback, final-row clearance, Dynamic Type, light/dark appearance, day/Nu transitions and Programme Detail round-trip before Independent QA.

**Next step:** renewed Lead exact-head review of PR #114; do not merge before the prescribed physical iPhone and Independent QA gates pass.

---

## 21 september 2026 — Totaal production visual specification canonical via PR #112

The owner-approved Totaal visual baseline from PR #110 is now converted into an implementation-ready production specification. PR #112 exact design/spec head `6c68202bce249c8eff2e198699e2a582bce55ede` passed docs-only CI #783 and merged as `4638f0574c60f3ad2f0d723c55a9291c9aff1e29`; post-merge CI #784 succeeded. The earlier one-file PR #111 review proposal was superseded and closed unmerged.

The canonical specification is now `docs/TOTAAL_VISUAL_CONVERGENCE.md`. It freezes the remaining production calibration without reopening the proven Guide architecture: 84-pt base channel rail, 76-pt base row, 3.00 pt/min horizontal scale, 52-pt day/Nu + 44-pt axis = 96-pt persistent functional stack, shared GuideChrome 100/116, native collapse56 with 44/60 compensation, deterministic Dynamic Type formulas, Instrument Sans programme hierarchy, logo-first rail, open no-card schedule treatment, 15-minute time axis, compact current-time marker, accessibility semantics, DST/loading/partial-left/short-programme edge cases and physical-device acceptance criteria.

No runtime code changed in PR #112. The owner-approved design/spec is now frozen Development authority; physical iPhone evidence remains required on the eventual implementation head.

**Next step:** Development performs Totaal production visual convergence on the existing proven Totaal architecture, followed by exact-head Lead review, physical iPhone validation and Independent QA. Phase 5 Search remains paused until this work closes.

---

## 21 september 2026 — Owner correction: Totaal production visual design is still open

The owner corrected an over-broad project closeout: Totaal has a proven and physically accepted **interaction/technical baseline** plus accepted shared day-navigation and typography contracts, but its **final production visual design has not yet been completed or owner-approved**.

This supersedes the Phase 4/Phase 5 status wording introduced by the earlier closeout. Per-zender, Programme Detail and Nu & Straks production convergence remain closed and accepted; Totaal performance/windowing, television-day semantics, gestures and Programme Detail context also remain frozen. What is reopened is specifically the **Totaal production visual design and subsequent visual convergence**.

The existing Totaal light/dark assets, `design/current/guide/TOTAAL.md` and `docs/TOTAAL_VISUAL_CONVERGENCE.md` are therefore demoted from an accepted production target to **provisional design direction / inactive candidate handoff**. They may inform exploration but must not trigger Development until the owner explicitly accepts the final Totaal design and the canonical spec is updated.

Phase 4 remains ACTIVE for this work. Phase 5 Search remains planned but is not the current next step.

**Next step:** Totaal Design / UX Exploration using the frozen interaction/data/day-selector/typography constraints; after owner acceptance, canonicalize the final production design/spec before Development.

---

## 21 september 2026 — Phase 4 closed; persistent schedule cache not selected

Phase 4 Core Guide MVP hardening is closed on iPhone after Totaal performance hardening, Per-zender production convergence, Programme Detail production convergence and Nu & Straks production convergence were merged and accepted. Nu & Straks PR #96 merged as `b0df0cc08f565aa1a36edf794e60ced0f391f67c`; exact-main CI #754 succeeded including the main/release full-ABI Android build. Canonical Nu & Straks closeout PR #105 merged as `958f0ebd68ffbc4e2ca7d4bc36816446ef451128`; exact-main docs CI #758 succeeded. PR #106 then clarified historical ledger wording without changing runtime or scope.

The final Phase 4 architecture decision is **not to add persistent mobile schedule caching now**. Issue #67 measured the cold Guide path before any cache/prefetch change and showed the dominant bottleneck was Totaal React/render + large-grid commit/mount work rather than network. Issues #70/#73 and the accepted bounded horizontal programme-windowing work resolved that performance path without persistent storage, eager horizon prefetch or a new dependency. No separate measured offline requirement was found that would justify SQLite, TanStack Query or another schedule-persistence layer during Phase 4.

Current graceful degradation remains deterministic fixture-first rendering plus preservation of usable in-memory runtime schedule state across failed refreshes. The PRODUCT MVP promise for local caching/graceful offline fallback is not deleted: true no-network cold-start behaviour and any concrete persistent-cache technology selection remain a Phase 9 release-like hardening gate, where standalone/dev-build evidence can actually prove the requirement outside Expo Go.

Physical Android interaction validation remains deferred because Android hardware is not available; native compilation is not physical acceptance.

**Next step:** Phase 5 Search and Discovery starts with Search. Tonight remains later in Phase 5 only after its value and data requirements are clear.

---

## 21 september 2026 — Nu & Straks production convergence merged through PR #96

Nu & Straks production convergence is merged to `main` through PR #96. Final exact implementation head `f7e88a4a2cb3a212d59a4827e7f28c1e2e665975` passed exact-head CI #753 with **64 test files / 448 tests**, strict TypeScript, lint, iOS/Android/web exports and the PR native Android/config gate. Owner physical iPhone validation passed on the final visual/product composition and, after Independent QA found two implementation-correctness blockers, a focused physical revalidation passed the corrected live rail ownership and unavailable-state VoiceOver behaviour on the final head. Independent QA then returned PASS on that exact head.

The final QA corrections keep live semantics on the exact clock minute while recentering the rail once when a live session crosses to a new nearest-quarter target; entering native browse/drag relinquishes that clock-driven rail ownership synchronously so momentum is never fought. During temporary schedule unavailability, an already established channel catalogue now remains semantically discoverable to VoiceOver/TalkBack; normal programme-present rows continue to avoid redundant channel focus stops because programme actions already carry the full channel name.

PR #96 merge commit: `b0df0cc08f565aa1a36edf794e60ced0f391f67c`. Exact-main CI #754 completed **SUCCESS**, including strict TypeScript, lint, the full test suite, iOS/Android/web exports and the main/release **full-ABI Android debug APK build**.

Physical Android interaction validation remains deferred because Android hardware is not available; successful native compilation is not represented as physical Android acceptance.

**Next step:** complete the canonical project-state closeout. The remaining Phase 4 decision is whether measured MVP/offline requirements justify local schedule persistence/cache; do not add it speculatively.

---

## 21 september 2026 — PR #96 Independent QA correctness fixes

Independent QA on exact head `ea2c45d65837903724684a7cd99c77314ef9a2d3` found two implementation correctness blockers without reopening any accepted Nu & Straks visual/layout contract.

Live mode now keeps the rail spatially coherent as the Guide clock advances. The exact semantic live reference continues to follow the actual minute, while a dedicated last-live-centred slot ref recentres the rail once when the nearest quarter-hour target changes. Repeated clock ticks inside the same target do not scroll again. Native drag switches live ownership off synchronously before state reconciliation, so clock advancement cannot fight a user drag or native momentum; direct slot/Nu/Primetime behaviour and the no-secondary-scrollTo settle contract remain unchanged. Nu tests freeze `Date.now()` to the injected Guide clock and now cover both same-television-day restore and a cross-06:00 restore deterministically.

When a previously established channel catalogue is retained during schedule unavailability, each retained channel identity now exposes its full `displayName` to VoiceOver/TalkBack because no programme actions are present to carry that identity. Normal schedule-present rows keep their existing non-redundant treatment: channel identity remains excluded as a separate accessibility focus stop while programme actions include the full channel name. The single calm unavailable-state message and no-fabricated-programme contract remain unchanged.

Regression coverage now includes live 20:17 -> 20:23 nearest-quarter recentering exactly once, no repeat recenter inside the same target, exact programme advancement while the target stays unchanged, live->browse cancellation before momentum settles, deterministic Nu restore, retained-channel accessibility in the unavailable state, absence of redundant channel focus stops in normal rows and the real `ChannelIdentity` accessible/non-accessible contract.

**Verification:** exact-head CI is required before re-gating. **Next step:** Lead exact-head review, focused physical iPhone validation of live boundary recentering and VoiceOver retained-channel discovery, then Independent QA re-review of these two blockers. Do not merge before those gates pass.

---

## 21 september 2026 — PR #96 implements final standard-text following density

Existing runtime PR #96 is reconciled with canonical `main` `957125a607dac7d69b46cdfb87618c568ed09044`, preserving the PR #104 design/docs baseline exactly.

Runtime changes are limited to the standard-text following-list content placement requested by the final Lead handoff. At fontScale <=1.35 the existing 44-pt iOS / 48-dp Android following Pressables remain adjacent and non-overlapping, while the one-line visible content uses `visibleSlack = targetHeight - 20` with progressive top offsets of 2/3, 1/3 and 0. This resolves to **16 / 8 / 0 pt on iOS** and **19 / 9 / 0 dp on Android**. The content remains inside its own target. Above fontScale 1.35 no offset is applied: the already physically accepted inline accessibility and extreme stacked fallback compositions remain vertically centred and keep their existing height formulas.

All other accepted Nu & Straks behaviour and geometry remain unchanged, including the 64-pt bottom-aligned reference block, 0-pt reference→following gap, 12-pt channel bottom padding, 216/228 base row totals, 52+52=104 functional stack, rail-bottom `railTick`, 15-minute rail semantics, native momentum ownership, vertical context preservation, Programme Detail round-trip, Per-zender shell reconciliation, unavailable-data behaviour and deferred loading.

Deterministic coverage now locks the 16/8/0 and 19/9/0 standard offsets, content containment through fontScale 1.35, adjacent 44/48-safe target rects, and centred Larger Text behaviour without changing the frozen row/layout formulas.

**Verification:** exact-head CI is required before handoff. **Next step:** Lead exact-head re-review, then one focused physical iPhone recheck of following-list density plus minimal regression smoke. Independent QA remains blocked until physical PASS.

---

## 21 september 2026 — Nu & Straks final standard-text following density micro-refinement

Physical iPhone review of PR #96 exact head `3cafcc6bee996eb1923549bb3b65fdabb6666262` accepted the final reference-time removal, rail-bottom treatment, dark mode, Larger Text, 15-minute rail/ticks, Nu/Primetime, vertical channel-position preservation and the tightened reference→first-following transition. One visual issue remained: at standard text, following #1→#2 and #2→#3 still read too loose because each one-line content block was centred in its independent 44-pt iOS / 48-dp Android Pressable.

The interaction geometry remains frozen. The final owner correction changes only standard-text content placement inside the existing targets. With `visibleSlack = followingTargetHeight - 20`, following #1 uses top offset `round(slack × 2/3)`, #2 uses `round(slack × 1/3)`, and #3 uses 0. This produces approximately 16-pt visible gaps on iOS and 18–19-dp gaps on Android while retaining separate, adjacent, non-overlapping targets and keeping all visible content inside its own Pressable. Larger Text (>1.35) remains physically accepted and vertically centred.

**Next step:** update the existing PR #96 only for this standard-text content-placement rule, add deterministic coverage, run exact-head CI and perform one final focused physical iPhone recheck. Independent QA remains blocked until physical PASS.

---

## 21 september 2026 — Nu & Straks final physical composition canonical via PR #102

Physical iPhone review of PR #96 exact head `224e7df1d47dbb5c42694cb36469de673496e7d5` produced a partial PASS: dark mode, Larger Text/Dynamic Type composition, vertical channel-position preservation, Nu, Primetime, 15-minute navigation and the vertical rail ticks were accepted. Three presentation details remained open and were owner-refined in design/spec PR #102.

PR #102 merged with exact design head `67a15db6e7f325247ca49bc95e34811449cd1729`; merge commit `778445acbf8f71b1383fdede4178f861e4074f62`. Post-merge docs/design CI #725 is green.

The final refinement removes all standalone visible reference-time copy in both live and browse modes and deletes the obsolete Larger Text reference-time lane. Nu & Straks now keeps a 52-pt utility-only Primetime/Nu context plus 52-pt rail = **104 pt persistent functional stack at every font scale**. Shared Guide Larger Text tabs remain unchanged at 64 pt/max two lines. The rail-bottom line becomes **exactly 1 pt semantic `railTick` @0.78**, matching the approved quarter-hour ticks rather than generic `border`/platform hairline treatment.

Reference/following density is tightened without changing hit geometry: reference minimum stays 64 pt but the title is bottom-aligned with 0 pt extra bottom inset; the dedicated transition becomes **0 pt**; channel bottom padding becomes **12 pt** so normal rows remain **216 pt iOS / 228 dp Android**; all three following visible content blocks are centred while the Pressables stay adjacent, independent and minimum 44/48. The already physically accepted Larger Text following layout/formulas remain frozen.

**Next step:** Development reconciles the existing PR #96 against this final canonical baseline, updates deterministic tests/PR body/DEVLOG and produces a new exact-head CI candidate. Then Lead re-review and focused physical iPhone revalidation; Independent QA only after physical PASS.

---

## 21 september 2026 — Nu & Straks physical accessibility refinement canonical via PR #100

The owner accepted the targeted refinement derived from physical iPhone rejection of PR #96 exact head `32db9459d265e8546c7137baf82e623f015ad652`. Design/spec PR #100 merged with exact design head `d2ece22771b35f369d40e58a51f8b85ffb461933`; merge commit `319e3caad758d0d7b511f2a01180ad91847a293f`. Post-merge docs/design CI #695 is green.

The refinement remains narrow. Rail ticks keep their 1-pt geometry but move from generic `border` to a dedicated `railTick` semantic: light `#80807A`, dark `#72726B`, major opacity 1.00 and quarter opacity 0.78. Larger-text shared Guide tabs become 64 pt / max two lines above fontScale 1.35 while retaining the 1.20 compact-label cap. Nu & Straks reference/utilities become an 88-pt 40+48 two-lane context above 1.35, producing a 140-pt persistent accessibility functional stack. Following programmes above 1.35 now use an inline time+title, maximum-two-line composition; stacked time-above-title is reserved for the extreme fontScale >2.0 plus programme-width <180 pt fallback. The three following touch targets remain independent 44/48 minimums, while visible content is clustered #1 bottom / #2 centre / #3 top to tighten perceived rhythm.

The shared presentation-tab accessibility rule also updates the Per-zender canonical shell geometry above fontScale 1.35, without changing its 52-pt temporal context or product/content model.

**Next step:** Development updates the existing PR #96 against the PR #100 canonical baseline, including deterministic tests for the new railTick, responsive shared shell and larger-text/density rules. Physical iPhone acceptance remains paused until Lead accepts the new exact runtime head for another physical pass; Independent QA remains after physical PASS.

---

## 21 september 2026 — Nu & Straks physical candidate not accepted

Runtime PR #96 was successfully reconciled to the PR #97 canonical baseline and reached exact head `32db9459d265e8546c7137baf82e623f015ad652`. Exact-head CI #691 was green with 62 test files / 424 tests, exports and native/config checks. Lead opened the physical iPhone gate.

Physical review did **not** accept this candidate. Dark mode as a whole is accepted, but three targeted issues remain: time-rail major/quarter hairlines are physically too low-contrast (especially dark mode); large-text/Dynamic Type composition produces material chrome truncation and excessive following-row growth; and the three following programmes still read visually too loose even though the runtime already meets the current 44/48 minimum-target and zero-extra-gap numeric spec.

This is therefore classified as a canonical refinement, not an ordinary implementation miss. Physical validation, Independent QA and merge of PR #96 remain paused. Next step is targeted Design / UX refinement of rail-tick contrast, large-text composition and visual density while preserving independent minimum touch targets and the rest of the accepted Nu & Straks interaction model.

---

## 21 september 2026 — Nu & Straks owner refinement canonical via PR #97

Fysieke iPhone-review van de open Nu & Straks production-convergence candidate leverde concrete UX/visual evidence op voor een kleine owner-approved refinement van de canonical baseline. Design/spec PR #97 is gemergd met exacte design-head `d0834ce2f25ec25c9e969354bc5241790960e10a`; merge-commit op `main`: `8b838fc71e2dd3aea601731defb11e9680a5d99b`. Post-merge docs/design CI #677 is groen.

De refinement supersedeert alleen expliciete Nu & Straks-calibraties: browse-rail van 30 naar **15 minuten**; tekstlabels alleen op hele/halve uren; langere hairline op hele/halve uren en kortere unlabeled kwartierhairline; live `Nu` blijft de exacte actuele minuut; zichtbaar `Referentietijd` en reference-programme `tot HH:MM` vervallen; reference block wordt minimaal **64 pt** met **4 pt** overgang naar de following list; drie following targets sluiten direct aan met behoud van **44 pt iOS / 48 dp Android** minimumtargets; active/current `Nu` en return-to-live `Nu` krijgen verschillende states; normale channel rows worden **216 pt iOS / 228 dp Android**.

Open runtime PR #96 was gebouwd tegen de eerdere calibratie. De lopende fysieke acceptatie is daarom **gestopt**. De eerdere runtimearchitectuur en fixes blijven behouden voor zover PR #97 ze niet supersedeert, inclusief 06:00 television-day semantics, native rail fling/settle ownership, stable vertical channel context, Programme Detail round-trip, unavailable-data catalogue preservation, deferred `NowNextGuideView` loading en de Expo Router route-tree test-isolationfix.

**Volgende stap:** Development reconcileert PR #96 tegen de nieuwe canonical spec op `main`, levert een nieuwe exact-head met volledige deterministic coverage en exact-head CI, daarna Lead re-review en opnieuw fysieke iPhone-validatie. Independent QA pas na nieuwe fysieke acceptance.

---

## 18 september 2026 — Nu & Straks production design canonical via PR #93

De owner-approved Nu & Straks Accepted Design Refinement is canoniek gemergd. Finale exacte design-head: `18ee2b81357819b39ee35b9196d7f984ad59e9b7`; merge-commit op `main`: `21e1e61b950046fd0e77308be5a64d09721e6310`. Post-merge CI #654 is groen.

De nieuwe production handoff staat in `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`. De reeds geaccepteerde compositie blijft intact: één gedeeld reference instant, dominant reference programme, exact drie following-programme slots, Nu/Primetime, stabiele verticale channel-context, native rail fling/settle, direct Programme Detail en deferred `NowNextGuideView`.

De refinement maakt de bekende accessibility/density debt production-ready: echte niet-overlappende 44-pt iOS / 48-dp Android targets, deterministic row geometry, stacked following time/title boven fontScale 1.35, substantive Dynamic Type, Instrument Sans en expliciete light/dark/system, safe-area, VoiceOver/TalkBack en Reduce Motion-contracten. Daarnaast maakt de spec duidelijk dat strict-midnight day bounds, prototype standalone header/floating selector, 24-pt following rows, system-font styling en opacity-heavy pressed feedback runtime debt zijn en geen designauthority.

**Volgende stap:** implementeer deze production specification als één afzonderlijke HIGH-risk Nu & Straks runtime-convergence increment. Vereist: deterministic tests, exact-head CI, fysieke iPhone-validatie en daarna Independent QA. Geen nieuwe designexploration tenzij concrete implementatie-evidence een fundamentele product/UX-keuze noodzakelijk maakt.

---

## 18 september 2026 — PR #92 Programme Detail production convergence gesloten

PR #92 is na meerdere gerichte Independent QA-rondes gemergd. Finale exacte implementatie-head: `4a21b36c690aaa0df598dcc5ddf33ada1c790bcf`; merge-commit op `main`: `ba59ea72c41d0ee73c8fea30bb4de8b59454e00b`.

Productiegedrag is nu vastgelegd en geïmplementeerd: title-first Programme Detail vanuit alle drie Guide-presentaties, gemounte Guide/context-preserving modal boundary, `Herinner mij` met vaste vijf-minutenlead en immediate fallback, persisted `Bewaar`, contextual sticky action copies, Dynamic-Type-safe stacking, safe-area ownership en handle-zone swipe-to-dismiss.

De HIGH-risk reminderflow is tijdens QA gehard voor tijdgrenzen/resume, permission-await crossings, native reconciliation failures, cancellation-vs-`Bewaar` concurrency en Android 12+ exact-alarm special access. Android gebruikt bewust `SCHEDULE_EXACT_ALARM`, controleert `canScheduleExactAlarms()`, biedt de app-specifieke settings-route, failt gesloten bij ontbrekende/indeterminate capability en annuleert bij geverifieerde revocation eerst de native Expo scheduled request voordat lokale metadata wordt verwijderd. Bij onbevestigde cancellation blijft het notification-id inactief bewaard als cleanup-handle.

Fysieke iPhone-validatie en gerichte post-fix smoke zijn PASS. Independent QA gaf finale PASS op exact head `4a21b36c690aaa0df598dcc5ddf33ada1c790bcf`. Post-merge CI #650 op exact `main` `ba59ea72c41d0ee73c8fea30bb4de8b59454e00b` is volledig groen voor `classify`, `quality` en `android-native`, inclusief de main/release full-ABI Android build. Fysieke Android special-access interactie blijft conform projectstatus deferred wegens ontbreken van Android-hardware.

**Volgende stap:** geen nieuwe vrije designexploratie. Start Accepted Design Refinement voor de reeds geaccepteerde Nu & Straks-baseline en leg eerst de production implementation specification vast als `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`; daarna pas runtime Development.

---

## 18 september 2026 — PR #92 final QA fix: Android exact-alarm special-access lifecycle

Independent QA re-review bevestigde de eerdere vijf Programme Detail/reminder-fixes en vond nog één Android-blocker: `SCHEDULE_EXACT_ALARM` stond correct in de manifest, maar runtime kon niet bewijzen dat Android 12+ de speciale “Alarmen en herinneringen”-toegang daadwerkelijk had verleend voordat een reminder als actief werd opgeslagen.

De fix houdt bewust `SCHEDULE_EXACT_ALARM` aan. Teevee schakelt niet naar `USE_EXACT_ALARM`; deze reminderfunctie is een secundaire user-facing feature en de bredere, user-controlled special-access route past bij de Android/Play-policygrens. Een kleine lokale Android Expo-module exposeert exact twee platformprimitives: `AlarmManager.canScheduleExactAlarms()` en de app-specifieke `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` settings-intent. Er is geen brede native abstraction of database/state-framework toegevoegd.

Scheduling op Android 12+ is nu fail-closed: na notification-permission/channel setup moet exact-alarm capability aantoonbaar beschikbaar zijn. Ontbreekt de toegang, dan opent Teevee vanuit de expliciete `Herinner mij`-actie de relevante Android-instelling, wacht op app-resume en controleert opnieuw. Direct vóór `scheduleNotificationAsync` volgt nog een tweede capability-check tegen revocation/races. Alleen een succesvolle native schedule-call ná bewezen capability mag persisted/visible `Herinnering aan` state opleveren. iOS en de canonical vijf-minutentiming blijven ongewijzigd.

Reconciliation behandelt revocation eveneens expliciet. Voor een nog niet afgevuurde reminder met `canScheduleExactAlarms() == false` probeert Teevee eerst de onderliggende Expo scheduled notification via het bestaande notification-id te annuleren. Alleen bevestigde native cancellation levert `verified-invalid` op, waarna Programme Detail de lokale metadata mag verwijderen. Als cancellation niet bevestigd kan worden, blijft het notification-id als cleanup-handle bewaard in een inactieve `indeterminate` state; ook een indeterminate capability-check blijft metadata behouden zonder de reminder actief te presenteren. Programme Detail voert reconciliation opnieuw uit bij app-resume, zodat intrekking tijdens settings/background direct wordt verwerkt zonder een orphan native request bewust achter te laten.

Deterministische coverage dekt capability available/unavailable, settings round-trip na grant, native-boundary failure, revocation vlak vóór scheduling, confirmed native cancellation vóór lokale revocation-cleanup, cancellation failure met behoud van persisted notification-id, revocation bij reconciliation/resume, geen persisted/active reminder bij ontbrekende capability en ongewijzigde iOS scheduling. Native CI verifieert naast manifest-permission ook Expo autolinking van `TeeveeExactAlarmModule`, clean prebuild en Android APK compile.

**Volgende stap:** exact-head CI volledig groen; daarna alleen niet-Android fysieke smoke waar zinvol. Android exact-time delivery blijft conform projectstatus deferred totdat Android-hardware beschikbaar is. Independent QA moet de nieuwe exact head opnieuw beoordelen; niet mergen vóór QA PASS.

---

## 18 september 2026 — PR #92 Independent QA required-fix pass

Independent QA op Programme Detail head `22fa7a36de071a528da0192f91e7c615d37f060b` vond vijf blocking lifecycle/concurrency-contracten. De fix-pass verandert geen producttiming of Guide-architectuur: de Guide blijft gemount onder de modal en de reminder blijft exact vijf minuten vóór start, met immediate fallback binnen vijf minuten.

Android declareert nu expliciet `android.permission.SCHEDULE_EXACT_ALARM`; de native CI-gate controleert na een schone Expo prebuild dat deze permission daadwerkelijk in de gegenereerde AndroidManifest staat. Programme Detail gebruikt een boundary-driven clock die op programmastart, programma-einde en app-resume ververst, zodat `Herinner mij` en `Nu bezig` niet op een oude render bevriezen. De native reminder-service herberekent de actuele fire instant na permission/channel-awaits en weigert scheduling wanneer de programmastart inmiddels is gepasseerd.

Reminder reconciliation heeft voortaan drie expliciete uitkomsten: verified-valid, verified-invalid en indeterminate. Native query/cancel failures verwijderen het persistente notification-id niet; een aantoonbaar stale maar niet bevestigbaar gecancelde reminder wordt tegelijk niet als actief gepresenteerd. Bij async cancellation wordt na de native await altijd verse personal state gelezen en alleen de nog-identieke reminder compare-and-apply verwijderd, zodat een gelijktijdige `Bewaar`-mutatie behouden blijft.

Deterministische regressies dekken start/eind/resume, permission-prompt crossings van vijf-minutengrens en programmastart, native reconciliation failure paths en de reminder-cancel-versus-Bewaar interleaving. **Volgende stap:** exact-head CI; daarna gerichte fysieke revalidatie van de gewijzigde reminder/lifecyclepaden en Independent QA re-review. Niet mergen.

---

## 18 september 2026 — PR #88 rebased onto accepted PR #89 4/24 spacing calibration

Accepted Design Refinement PR #89 is merged on `main` and supersedes only the expanded/rest Per-zender gap distribution. PR #88 is rebased onto that canonical baseline rather than carrying its pre-#89 design documentation forward.

Runtime calibration changes only the expanded endpoints from 16/12 to **4 pt rail→temporal context** and **24 pt temporal context→schedule**. The sum remains 28 pt, so the frozen PR #81 geometry is unchanged: **140 pt** full visual contraction, **56 pt** native collapse, **84 pt** visual compensation, **112 pt** fixed viewport top and **140 pt** schedule content top inset. Condensed remains 0/52/0.

The previously accepted safe-area, collapse-isolation, programme-anchor, selected-schedule-height/trailing-whitespace, channel-switching, Nu/Primetime and theme fixes are preserved unchanged. The explicit opaque gap ownership introduced after physical validation also remains; only its accepted endpoint heights change.

Deterministic coverage proves visible rest rail→context = 4 pt, context = 52 pt, context→schedule = 24 pt, condensed gaps = 0/0, rest/settled overlay bottoms = 252/112 pt, total contraction = 140 pt and semantic native↔schedule anchor round-tripping. Full HIGH-risk exact-head CI remains required; do not merge or request Independent QA yet.

---

## 18 september 2026 — Per-zender required visual-convergence follow-up on PR #88

Physical iPhone validation of PR #88 head `75cd5f7148bab4583b335924100f2684e96b16bf` accepted the safe-area, scroll-isolation, programme-anchor, trailing-whitespace, channel-switching, Nu/Primetime and light/dark fixes. One required visual issue remained: the canonical 16-pt rail→context gap read visibly larger while the canonical 12-pt context→schedule gap read effectively absent.

The numeric 16/52/12 → 0/52/0 geometry and frozen 140/56/84 collapse math were already correct. The remaining defect was visual ownership: the two functional gaps were transparent overlay spacers while the independently scrolling schedule renders underneath the overlay. The context→schedule spacer therefore relied on the enclosing overlay background/bounds to mask schedule content, which physical iOS rendering did not preserve strongly enough as visible whitespace. Both canonical gap zones now render their own opaque semantic background while retaining the exact accepted dimensions. No metric, safe-area coordinate, programme-row geometry, semantic anchor or collapse architecture changed.

Deterministic coverage now models explicit rail, context and schedule-content boundaries and proves rest-state visible gaps of exactly 16 and 12 pt, fixed 52-pt context, and settled-condensed gaps of 0/0. Exact-head CI and renewed physical Lead validation remain required before Independent QA; do not merge yet.

## 18 september 2026 — Per-zender PR #86/#87 runtime convergence + iOS safe area + trailing whitespace

Deze HIGH-risk Guide candidate convergeert de Per-zender runtime naar de na PR #86/#87 canonical 52-only temporal context zonder de PR #81 fixed-native-viewport/collapse-isolation terug te draaien. De obsolete 88-pt wrap-state, wrap-detectie en wrap-anchorcompensatie verdwijnen; rest/condensed geometry gebruikt 16/12 → 0/0 gaps, 72→60 rail, 56 pt native collapse, 140 pt totale visuele contractie en 84 pt visual compensation. Per-zender datumlabels volgen de expliciete 06:00-regel en geselecteerde-zendertekst wordt nergens buiten de logo-rail geïnjecteerd.

De fysieke iOS-statusbar overlap kwam uit absolute Per-zender chrome/schedule-posities binnen de core React Native SafeAreaView: de safe-area padding was geen betrouwbare coordinate origin voor de absolute kinderen. De candidate gebruikt daarom de daadwerkelijke top inset uit react-native-safe-area-context één keer als origin voor zowel overlay als fixed schedule viewport; er is geen device-specifieke padding en geen tweede SafeAreaView-compensatie.

De enorme trailing whitespace kwam niet uit TV-day bounds of ontbrekende providerdata maar uit verticale ownership: scheduleHeight was het maximum van de vorige, geselecteerde en volgende horizontale pager-page. Een zender met weinig programma's erfde daardoor de scrollhoogte van een veel langere buur. De verticale contenthoogte volgt nu uitsluitend de geselecteerde zender. Een daadwerkelijk lege, authoritative selected schedule-page toont een expliciete empty state; er worden geen fictieve programma's of providerworkarounds toegevoegd.

Deterministische regressies dekken 52-only context/no-wrap, 140/56/84 geometry, safe-area coordinate calculation, geselecteerde-zender height ownership, empty-state basisgeometry en de Per-zender 06:00 Vandaag/Morgen/weekday+date-semantiek. **Volgende stap:** exact-head CI; daarna Lead fysieke iPhone product/visual validation. Nog geen Independent QA en niet mergen.

---

## 18 september 2026 — PR #81 QA required fix: 52/88 context-anchor invariant

Independent QA vond op exact head `ce030817ff64db570a0a78ec779824e7662fedd8` één blocking edge case in de verder stabiele fixed-native-viewport architectuur: `contextWrapped` kon live 52→88 of 88→52 schakelen zonder equivalente schedule-anchorcompensatie. Daardoor verschoof programme-content 36 pt wanneer bijvoorbeeld de condensed channel prefix wrapping veroorzaakte of channel/day/font/viewport-hermeting de wrap-mode wijzigde.

De required fix maakt native↔semantic schedule-offsetconversie wrap-aware en compenseert een echte wrap-mode transition éénmalig op de UI-thread: native schedule offset en collapse anchor bewegen samen ±36 pt, zodat zowel het semantic programme als zijn visuele screen anchor en de huidige collapse progress gelijk blijven. De actieve ScrollView-viewport blijft absoluut/fixed; er is geen per-frame normal-flow mutatie toegevoegd. Wrap-detectie observeert voortaan de natuurlijke flex-layout en reset de live wrap-mode niet meer kunstmatig bij channel/day/fontScale/viewport-width changes.

Deterministische regressies starten op non-zero schedule offsets en dekken 52→88→52 door condensed-prefix wrapping, channel/day remeasurement in wrapped state, Dynamic Type en viewport-width transitions, plus wrap-aware native↔semantic round-tripping en collapse-progress behoud.

**Volgende stap:** exact-head CI volledig groen krijgen, daarna alleen deze required-fix set terug naar Independent QA. Niet mergen.

---

## 18 september 2026 — PR #81 Per-zender scroll feedback root cause geïsoleerd

De blocking verticale post-swipe oscillatie is op fysieke iPhone met tijdelijke native-scrollinstrumentatie gereproduceerd en verklaard. Een control fling zonder collapse decelereerde monotonic; zodra collapse actief werd, volgden herhaaldelijk negatieve contentOffset-sprongen op positieve beweging. De limit-cycle bleef bestaan nadat de binaire React condensed-state niet meer wisselde. Daarmee was React commit-churn niet de primaire oorzaak.

Root cause: dezelfde native verticale ScrollView stuurde collapseProgress, terwijl die progress tot 148 pt normal-flow geometry boven de ScrollView wijzigde binnen 56 pt native collapse. iOS compenseerde die sibling-heightmutaties in contentOffset; die gecompenseerde offset stuurde vervolgens de tegenovergestelde collapse-state en sloot de feedbacklus.

De structurele fix houdt de native schedule-viewport vast op de settled functional-stack baseline. Guide chrome, 72→60 rail en 24→0 / 12→0 gaps blijven visueel scroll-coupled, maar staan in een absolute overlay. De schedule reserveert de 148-pt rest-inset statisch; 56 pt komt uit native scroll en de resterende 92 pt uit visual content compensation. Native↔semantic schedule-offsetconversie bewaart programme/timestamp anchors en geanimeerde Nu/Primetime-targets. Deterministische regressietests bewaken rest/mid/condensed alignment, wrapped context, de 148 = 56 + 92 contractie-invariant en semantic offset round-tripping.

De tijdelijke TEEVEE_SCROLL_* instrumentation is na het fysieke root-causebewijs volledig uit de production candidate verwijderd. De scroll-layout invariant staat duurzaam in docs/PER_ZENDER_VISUAL_CONVERGENCE.md.

**Volgende stap:** run exact-head CI op de production-clean PR #81 head en laat daarna exact die head fysiek op iPhone revalideren. Geen Independent QA en geen merge vóór owner physical acceptance.

---

## 18 september 2026 — PR #81 final Per-zender convergence: stable day-switch identity + 176-pt current row

Canonical main through PR #85 is geïntegreerd in PR #81 zonder de fixed-row runtime terug te draaien. De production spec verwijdert de grote selected-channel heading uit de rest state en vervangt de oude 120-pt current row door een ruimere 176-pt base row: current title 19/23, synopsis 15/22 maximaal vier regels, 10 pt title→description, minimaal 20 pt vrije ruimte voor de lokale 4-pt progressbar. Dynamic Type gebruikt de canonical content-safe minimumformule; standaardrows blijven uniform 52 × contentScale.

De fysieke day-switch bug had een concrete ownership-oorzaak: Per zender renderde bij een nog niet geladen non-current dag tijdelijk `buildRuntimeGuideFixture(selectedDayStartMs)`. Daardoor wisselde een reeds canonical NPO/RTL/SBS-kanaalcatalogus naar de 48-kanaals generieke fixture (`channel-1`, `Publiek 1`, `Vier`, enz.), verdwenen lokale logo-resolutions en werden rail/pager/rows plus scroll-anchor eerst voor fallback en daarna opnieuw voor canonical data opgebouwd. Dat verklaart de waargenomen structurele churn en is de primaire performance-root-cause die in deze pass is verwijderd.

De presentatie houdt broadcaster identity en programme ownership nu apart. Zodra canonical channels zijn vastgesteld, blijft die catalogus tijdens selected-day loading/unavailable staan en toont de programme-area alleen een rustige loading/unavailable state. De generieke deterministic fixture blijft uitsluitend actief in echte fixture mode. Zenderselectie wordt semantisch op channel-id bewaard in plaats van op array-index; de programma-anchor wordt pas opnieuw gezet wanneer de echte selected-day schedule beschikbaar is; pager keys blijven stabiel over dagwissels. Hiermee verdwijnen de fallback→real catalogue swap en dubbele programme-anchor reset uit de normale real-data day-switch path. Dit is deterministic/static evidence; vloeiendheid ná de fix moet nog fysiek op iPhone worden bewezen.

Dark-mode asset audit: de bestaande provenance-checked NPO-marks blijven bruikbaar. Voor RTL 4, RTL 5 en SBS6 is in de huidige geverifieerde assetbronnen geen afzonderlijke betrouwbare dark-background variant vastgesteld. Er is daarom bewust niet getint, gerecolour’d, op een generieke witte tegel geplaatst of een merkvariant nagetekend. Deze drie dark-mode marks blijven een expliciete asset-input/physical-acceptance blocker en staan ook in `docs/CHANNEL_LOGO_ASSETS.md`.

**Volgende stap:** exact-head CI op de finale PR #81 head volledig groen krijgen en daarna dezelfde head fysiek op iPhone revalideren: day switch, scrolljank, 176-pt current row, rest/condensed compositie en dark-mode logo’s. Pas na owner acceptance mag Independent QA worden aangevraagd.

---

## 17 september 2026 — PR #81 geïntegreerd met canonical Per-zender refinement en lokale channel-logo laag

PR #81 is veilig bijgewerkt met canonical `main` na Design PR #83. De nieuwe designbaseline wint voor de vier gewijzigde design/documentatiebestanden; de bestaande fixed-row runtime en eerder fysiek aangebrachte polish blijven behouden en zijn vervolgens aangepast aan de nieuwe accepted delta.

Gebouwd in de PR-branch:
- Per-zender titels 17/21 Medium en current 19/23 Bold, met 52/120 fixed-row geometry intact;
- 72-pt rest rail naar 60-pt settled condensed rail zonder 48×48 channel items te schalen;
- deterministic selected-channel recentering met rail-bounds als hoogste prioriteit en Reduce Motion zonder recenteranimatie;
- semantic Nu/Primetime current/action/disabled states op programme/timestamp anchors, inclusief Nu-precedence;
- full-row temporary `surface` press feedback zonder permanente card treatment;
- lokale provider-onafhankelijke logo registry voor NPO 1, NPO 2, NPO 3, RTL 4, RTL 5 en SBS6; provider `logoUrl` blijft secondary fallback input;
- provenance en ingest-hashes vastgelegd in `docs/CHANNEL_LOGO_ASSETS.md` en `assets/channels/SHA256SUMS`;
- deterministic coverage voor geometry/typography, rail targets, temporal-state precedence/unavailability, press surface, local-logo manifest en ChannelIdentity fallback/accessibility.

Deze entry claimt nog geen fysieke acceptatie of Independent QA. Exact-head CI-evidence hoort bij PR #81; iedere latere headwijziging maakt eerdere evidence ongeldig.

**Volgende stap:** exact-head CI voor PR #81 groen maken en daarna de owner de volledige fysieke iPhone Per-zender acceptance laten uitvoeren, inclusief minimaal één screenshot met presentation selector, echte logo's, selected channel, datum/Nu/Primetime en current programme. Pas daarna mag Independent QA worden aangevraagd.

---

## 15 september 2026 — Phase 4 television-day domain foundation gemergd

PR #62 is als eerste Phase 4 runtime-foundation increment gemergd naar `main` als `36468ed19eca7411079d2845763ca8de36c8d10f`. De wijziging legt de gedeelde productsemantiek voor televisiedagen in code vast, maar migreert bewust nog geen Guide UI, hosted loader of runtime lifecycle.

Gebouwd:
- 06:00 Europe/Amsterdam als expliciete television-day boundary;
- typed D-2..D+7 offsets en exact tien aaneengesloten television-day windows;
- DST-veilige `guideTelevisionDayStart()` en `guideTelevisionDayHorizon()` zonder canonical programme timestamps te verschuiven;
- gedeelde Amsterdam wall-clock resolver terwijl de tijdelijke Phase 3 `guideDayStart()` strict-midnight primitive behouden blijft.

De eerste onafhankelijke QA-review vond een blocking evidence-gap in de tests. Die is op de finale head `2d83c101b749083c39530ed2473103319f1311cf` gesloten met directe coverage voor exact 00:00, horizon-contiguïteit over beide 2026 DST-transities inclusief 23/25 uur, en out-of-range integer offsets. QA herbeoordeelde exact die head daarna zonder blocking of non-blocking findings. Exact-head CI run #362 was volledig groen voor `quality` en `android-native`.

Omdat deze PR alleen domain primitives/tests toevoegt en de bestaande runtime nog `guideDayStart()` + `loadTwoDayGuideSchedule()` gebruikt, was geen fysieke device-gate nodig voor deze increment.

**Volgende stap:** migreer de mobiele hosted schedule/runtime boundary van strict calendar `today + tomorrow` naar television-day-aware bounded loading/anchoring op de nieuwe 06:00 primitives, zonder in dezelfde increment de accepted Guide day-selector UI of frozen gestures te wijzigen.

---

## 15 september 2026 — Phase 3 fysiek gesloten; automatische development-EPG freshness

De volledige mobiele real-data boundary is op een fysieke iPhone geaccepteerd. De app toont eerst direct de deterministische fixture en schakelt daarna zonder crash of layoutbreuk over op canonical hosted EPG-data. Totaal, Per zender en deferred Nu & Straks blijven op echte data bruikbaar; Programme Detail opent en keert vanuit alle drie correct terug.

Aanvullende fysieke checks:
- Per zender adjacent-channel navigatie heen en terug blijft intact;
- Nu & Straks reference-time rail en verticale mixed gestures blijven coherent;
- background/resume behoudt reference time en zichtbare Guide-context;
- ontbrekende hosted coverage houdt de deterministische fixture actief;
- runtime netwerkuitval vernietigt de bestaande Guide-state niet.

Een echte no-network cold start is via Expo Go niet valide te testen omdat Expo Go na force-quit zelf Metro/netwerk nodig heeft. Dat blijft deferred naar een standalone/dev build en is geen Phase 3 blocker. Volledige evidence staat in `docs/PHYSICAL_EVIDENCE_2026-09-15_PHASE3.md`.

Om de tijdelijke development-EPG niet opnieuw handmatig te hoeven seeden, voegt PR #59 server-side automatische refresh toe:
- `pg_cron` + `pg_net` iedere zes uur;
- rolling Amsterdam-buffer voor vandaag, morgen en één rollover-dag;
- dedicated random cron-token encrypted in Supabase Vault;
- Supabase secret key blijft uitsluitend in de Edge Function omgeving;
- `epg-refresh` blijft voor `anon`/`authenticated` ontoegankelijk;
- partial current-day provider coverage wordt veilig overgeslagen in plaats van canonical coverage te beschadigen.

Live end-to-end smoke bewees de Vault-tokenroute tot en met canonical public read: 12 channels / 498 programma's vandaag, 12 / 485 morgen en 12 / 489 rollover. Anonymous direct refresh bleef 401. De tijdelijke smoke-helper is na verificatie weer inert (410) en JWT-protected.

**Verificatie:** fysieke iPhone Phase 3 gate volledig PASS. De PR moet nog exact-head CI groen hebben voordat hij mag mergen; daarna is Phase 4 de actieve fase. Physical Android blijft apart deferred.

**Volgende stap:** start Phase 4 met de shared television-day-aware D-2..D+7 schedule/day-selection foundation en wire die in Totaal en Per zender zonder de fysiek bewezen Guide gestures te retunen.

---

## 15 september 2026 — Televisiedag en minimale Guide-horizon frozen

De productowner heeft de definitieve dagsemantiek en minimale Guide-horizon vastgesteld. De Guide volgt voortaan niet een harde kalenderdaggrens om 00:00, maar een **televisiedag van 06:00 Europe/Amsterdam tot 06:00 de volgende kalenderdag**.

Producteffect:
- een gebruiker die om 00:05 opent blijft inhoudelijk in de televisieavond van de voorafgaande datum;
- iemand die om 21:00 bladert kan zonder expliciete datumwissel door naar programma's na 00:00;
- `Nu` blijft de echte actuele tijd, maar hoort tussen 00:00 en 05:59 bij de voorafgaande televisiedag;
- Totaal en Per zender moeten minimaal **D-2 t/m D+7** volledige televisiedagen ondersteunen;
- Nu & Straks blijft één actieve-dagpresentatie, maar gebruikt dezelfde 06:00-grens;
- gebruikers zien gewone datums/labels; `televisiedag` is een intern product- en architectuurbegrip.

Architectuur:
- canonical programme timestamps blijven echte UTC-instants; niets wordt verschoven om de televisiedag te simuleren;
- ADR 0008 legt de 06:00-grens, midnight continuity en D-2..D+7 vast;
- Phase 3 bewaakt dat de datalaag/query-contracten niet aan midnight of een permanente today+tomorrow-horizon worden gekoppeld;
- de huidige twee-daagse Phase 3 mobile loader blijft bewust slechts vertical-slice scope;
- Phase 4 implementeert en valideert de volledige multi-day UX, 06:00-rollover, historische/future navigatie, cache/refresh en contextbehoud;
- Phase 8 moet bewijzen dat de uiteindelijke productie-EPG de minimale horizon, historie, freshness en rechten kan leveren.

Documentatie bijgewerkt: `PROJECT_STATE.md`, `PRODUCT.md`, `UX.md`, `DATA.md`, `BUILD_SPEC.md` en ADR 0008.

**Verificatie:** documentatie-only wijziging; er is nog geen runtimegedrag gewijzigd of fysiek gevalideerd. De bestaande Phase 3 physical real-data smoke blijft ongewijzigd de actieve exitgate.

**Volgende stap:** eerst de bestaande Phase 3 iPhone real-data smoke afronden; daarna in Phase 4 de television-day-aware D-2..D+7 Guide implementeren.

---

## 14 september 2026 — Mobile Guide aangesloten op canonical hosted EPG met fixture-first fallback

PR #50 is gemergd als `b60e2501ee757a20a080de393f618101b0970f90`. Daarmee accepteert de hosted transportlaag naast normale Amsterdamse kalenderdagen ook de 25-uurs wintertijd-dag. De exacte merge-commit op `main` had CI run #315 volledig groen voor zowel `quality` als `android-native`.

PR #51 is daarna gemergd als `0886cbe61272703323ba30cd2deb9cbc037754a8`. Dit is de eerste wijziging waarbij de mobiele Guide de provider-onafhankelijke canonical hosted schedule daadwerkelijk kan gebruiken.

Gebouwd:
- dependencyvrije `HostedGuideScheduleClient` naar alleen de publieke Teevee `guide-schedule` Edge Function;
- runtime-validatie van serialized canonical schedule responses;
- Amsterdam-correcte today+tomorrow loader, inclusief 23/25-uurs DST-dagen;
- deduplicatie van programma's die over de daggrens in beide reads voorkomen;
- kleine provider-onafhankelijke in-memory runtime schedule-store;
- fixture-first startup: de eerste frame blijft volledig lokaal/deterministisch;
- automatische hosted refresh na startup, bij app-resume en na Amsterdamse dagwissel;
- offline, `unavailable`, netwerkfout, invalid response of lege hosted data laat de fixture actief;
- freshness-only updates remounten de Guide niet, zodat scroll-/zendercontext behouden blijft;
- alleen user-visible schedulewijzigingen verhogen de app-shell data-version;
- Totaal, Per zender, Nu & Straks en Programme Detail mechanics zijn inhoudelijk niet gewijzigd;
- deferred `import()` voor Nu & Straks blijft intact;
- geen SQLite, TanStack Query, nieuwe dependency of native-config toegevoegd.

Exacte PR #51 head `08497e10ab65803c1ce91ca5b3b060fdfb0166f2` had CI run #323 volledig groen voor `quality` en `android-native` vóór merge.

Live hosted prerequisite is aanwezig: `guide-schedule` Edge Function v5 en `epg-refresh` v3 zijn actief. De publieke Guide-read bevat geen provider-ID's of privileged key; database/RPC en development-providerdetails blijven achter de servergrens.

**Gate:** omdat deze wijziging voor het eerst de mobiele Guide-boundary met real data kruist, is Phase 3 nog niet gesloten. Er is nu een gerichte fysieke iPhone smoke nodig voor Totaal, Per zender, Nu & Straks, Programme Detail, fixture→real transition en contextbehoud bij resume. Android-deviceacceptatie blijft apart deferred.

**Volgende stap:** voer de gerichte iPhone real-data smoke uit en leg bewijs vast. Alleen wanneer die regressievrij is, kan de mobile real-data vertical slice als fysiek bewezen worden beschouwd en kan Phase 3 richting exit/Phase 4 worden gesloten.

---

## 14 september 2026 — Hosted schedule-store + gratis development-EPG operationeel als Phase 3 foundation

Phase 3 is voorbij de oude backend/provider-intakegate. Teevee heeft nu een eigen hosted canonical schedule-store én een vervangbare adapter voor een echte gratis Nederlandse XMLTV-feed.

### PR #40 — Supabase canonical persistence
PR #40 is gemergd als `da08c10e170ea8fe3843e16b76247eccd6c0502a` nadat exact-head CI #283 zowel `quality` als `android-native` volledig groen afrondde.

Dedicated backend:
- Supabase project `teevee` (`eokszvpityhtysbwdduy`);
- organisatie `teevee`;
- Free plan;
- regio `eu-west-2`.

Gebouwd:
- private `teevee` schema voor channels, programmes en authoritative coverage;
- transactionele `[from,to)` replacement en stale-write protection conform ADR 0007;
- covered-empty versus unavailable;
- conservative freshness;
- private tables zonder `anon`/`authenticated` toegang;
- service-role-only public RPC bridges;
- `SupabaseScheduleRepository` achter het bestaande repositorycontract.

Security advisor WARN/ERROR is na hardening leeg. RLS/no-policy INFO voor de private Teevee-tabellen is bewust: clienttoegang is volledig dicht.

### PR #42 — development-only XMLTV provider
De eigenaar koos voor Phase 3 voorlopig een gratis externe EPG. PR #42 is gemergd als `4ea4a73bb38580cc8ab0acf454ccfc5849350bab`.

`XmltvEpgProvider` gebruikt standaard `https://iptv-epg.org/files/epg-nl.xml` en blijft server-side achter `EpgProvider`.

Correctnessregels:
- expliciete XMLTV timezone-offset vereist; geldige tijden gaan naar UTC;
- malformed tijden blijven diagnosable, geen timezone-guessing;
- title/subtitle/description/category/live/repeat parsing;
- `[from,to)` programme filtering;
- alleen continue coverage over iedere gevraagde provider-channel geeft `complete`;
- gaps geven `partial`, zodat ingest geen canonical data destructief overschrijft;
- injected `fetch` houdt tests/CI onafhankelijk van internet.

De eerste CI-run vond één echte CDATA-parserbug. Die is in de parser hersteld vóór merge. Exact finale head `2af9d6cc6afb8b0618b196eebdc33b1b940d25d9` had CI #290 volledig groen voor `quality` én `android-native`.

### Live feed-inspectie — tijdelijke PR #43, niet gemergd
Omdat de agent-runtime de raw feed niet direct kon uitlezen, is een tijdelijke GitHub Actions-inspectie gebruikt. PR #43 is na succesvolle inspectie gesloten zonder merge; er staat dus geen live-feed afhankelijkheid in normale CI.

Gemeten op 14 september 2026:
- 30,237,192 bytes XML;
- 184 channels;
- 33,117 programme records;
- feedrange `20260913000600 +0000` t/m `20260919235500 +0000`;
- kern-ID's bevestigd: `NPO1.nl`, `NPO2.nl`, `NPO3.nl`, `RTL4.nl`, `RTL5.nl`, `RTL7.nl`, `RTL8.nl`, `RTLZ.nl`, `SBS6.nl`, `SBS9.nl`, `Net5.nl`, `VeronicaDisneyXD.nl` plus sport/internationale zenders.

De publieke overview-teller van IPTV-EPG.org wijkt momenteel af van de werkelijk opgehaalde feed. Daarom worden websitecijfers niet gebruikt voor coverage/correctness.

### Rechtenboundary
Deze gratis feed is **alleen development input**. Publieke bereikbaarheid is geen bewijs van commerciële/publicatierechten. Geen raw XMLTV, logo's of artwork wordt in Git opgenomen en mobile krijgt nooit een directe providerdependency.

Production EPG/logo/artwork/SLA blijft een aparte release-gate. Een geautoriseerde Bindinc/TVgids bron blijft voorkeursroute; EPGdata.tv/Gracenote blijven mogelijke commerciële alternatieven.

**Volgende stap:** een kleine expliciete real-channel catalog/mapping op basis van de bevestigde provider-ID's, daarna één server-side ingest naar Supabase en typed canonical query terug. Meet eerst de echte ~30 MB feed-kosten voordat mobile caching wordt gekozen.

---

## 14 september 2026 — Canonical repository + veilige ingest/service-keten

PR #38 (`5d997e58cd86de75a7de83367cc0e47b783657a2`) legde backend-onafhankelijke canonical schedule-semantiek vast:
- expliciete channel/time replacement scope;
- `[from,to)` intersection;
- coverage onafhankelijk van programme presence;
- covered-empty vs unavailable;
- conservative freshness;
- atomair `ignored-stale` vóór mutatie.

PR #39 (`a39f5e432f0f3dcba946f5e8ca49bdd060ad0928`) voegde safe provider ingestion en `GuideScheduleApi` toe:
- complete vs partial provider coverage;
- attributable malformed data blokkeert alleen veilige affected channel scope;
- unattributed malformed data blokkeert destructive replacement;
- request-start freshness;
- concurrencytest voor late oudere providerresponse;
- typed canonical service-output zonder provider/database leakage.

**Volgende stap destijds:** echte hosted repository + provider — gerealiseerd in #40/#42.

---

## 14 september 2026 — Phase 2 gesloten; Phase 3 geactiveerd

De finale Per zender-recheck `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md` sloot de laatste Phase 2 devicegate. `Publiek 1/2/3` blijven onder larger text onderscheidend; directe zenderselectie, adjacent paging en strip/schedule-synchronisatie zijn fysiek geaccepteerd.

PR #36 sloot Phase 2 / activeerde Phase 3. PR #37 (`491bc728adfb4ec70d060833d49d17bca25bbdc9`) bouwde daarna de provider-onafhankelijke normalisatiekern: `GuideSchedule`, server-only `EpgProvider`, mapping, UTC-normalisatie, deterministic broadcast identities en record-level diagnostics.

---

## 13 september 2026 — App Shell en Guide interaction baseline fysiek geaccepteerd

Belangrijkste afgeronde mobiele foundation:
- Totaal: 2D time/channel Guide, native inertia/bounce/directional lock, Vandaag/Morgen/Nu, Programme Detail;
- Per zender: verticale wall-clock schedule, horizontal adjacent-channel pager, direct-tap zenderstrip en contextbehoud;
- Nu & Straks: shared reference time, live/browse, tijdrail, Nu/Primetime en detail round-trip;
- Nu & Straks startup blijft achter deferred `import()` na een fysiek aangetoonde eerdere startup-regressie;
- Gids / Vanavond / Zoeken tabs, Settings secundair;
- versioned preferences en live/persisted Light/Dark/System;
- navigator-level error recovery;
- shared headers/safe areas;
- representative 135% iOS text acceptance;
- Programme Detail targetacties later: `Herinner mij` + `Bewaar`, geen Share requirement.

Exacte device-evidence:
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2310.md`;
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md`.

De 24pt Nu & Straks following rows blijven niet-blockerende accessibility/density debt.

---

## 11–13 september 2026 — Bootstrap en Phase 1 stabilization

Projectfoundation, Expo/React Native strict TypeScript, deterministic fixtures, Programme Detail, Amsterdam/DST runtime fixture, CI en device-workflow zijn opgebouwd.

Belangrijke stabilisatie:
- title/time-axis readability tijdens Guide-scroll;
- VoiceOver/self-contained labels;
- performanceverbeteringen door per-frame JS bridges/rerender-bottlenecks te verwijderen;
- `[start,end)` current-programme semantics;
- lockfile + `npm ci`;
- clean Android prebuild + Gradle debug APK in CI.

Een eerdere high-volume per-programme Reanimated-architectuur was CI-groen maar crashte fysiek en blijft expliciet afgewezen.

---

## Doorlopende open punten
- **Phase 4 active:** television-day domain primitives zijn gemergd; de runtime loader/store en daarna accepted day navigation moeten nog naar ADR 0008 D-2..D+7 + 06:00 semantics migreren.
- **Production provider/rights:** nog open; gratis XMLTV is development-only en uiteindelijke provider moet ook de minimale historische/future horizon bewijzen.
- **Offline cold start:** echte no-network cold start later in standalone/dev build; Expo Go kan die test niet zelfstandig dragen.
- **Guide interaction baseline:** fysiek geaccepteerd op iPhone; alleen heropenen met regressie-evidence.
- **Nu & Straks 24pt following rows:** Phase 4 density-aware accessibility-hardening.
- **Android:** fysieke Back/gestures/performance deferred wegens geen Android-device; CI-native compile is geen deviceacceptatie.
- **Programme Detail:** `Herinner mij` + `Bewaar` nog niet geïmplementeerd.
- **Release-like performance:** later buiten Expo Go valideren.
- **Dependencies:** moderate advisories gericht analyseren; nooit `npm audit fix --force`.
- **Production rights:** EPG/logo/artwork/SLA expliciet bevestigen vóór paid release.
- Pricing/trial/paywall, production font licensing en definitieve Tonight composition blijven later.