# Teevee — Canonical Project State

Last updated: 2026-09-13 15:31 CEST.
Status: ACTIVE — Phase 1 Guide prototype. The iPhone Guide interaction/stability baseline is physically accepted through PR #15. PR #16 current-time/progress accuracy and PR #17 finite-fixture lifecycle hardening are merged and fully green. The next unresolved Phase 1 gate is physical Android gesture/back/performance validation.
Current phase: **Phase 1 — Guide Interaction Prototype**
Previous phase: **Phase 0 — Project Foundation: COMPLETE**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository.

## Product
Teevee is a premium, paid, ad-free television-guide app for iOS and Android under Bindinc/TVgids.nl supervision. The Guide is the product: fast, calm, reliable and polished. Netherlands first; no mandatory account for core Guide use.

## Frozen decisions
- React Native/Expo SDK 57 and strict TypeScript for iOS and Android.
- Paid, ad-free and Guide-first; no mandatory core-use account.
- Light, dark and system appearance.
- Provider-independent Teevee EPG model; mobile never consumes/parses an external EPG directly.
- Deterministic fixtures keep core development independent of external services.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility and system text scaling are product-quality requirements.
- PROJECT_STATE is canonical cross-session memory; complexity requires evidence.

Relevant ADRs: `0001` through `0004` in `docs/decisions/`.

## Guide presentations
The implemented runtime presentation is **Totaal**. Two additional accepted presentations are specified but not yet implemented:
- **Per zender:** one channel's scrollable schedule; persistent horizontal channel-logo strip; horizontal swipe to adjacent channel; direct logo tap; preserve viewed time where practical; contextual `Primetime`/`Nu`.
- **Nu & Straks:** compact all-channel list around one shared reference time today; current programme + three following; `Nu` restores live mode; no progress bars/genres/artwork/chevrons/`Daarna` labels.

One Guide destination with a locally remembered presentation preference remains the working proposal. No new primary tabs are authorised.

## Owner-approved visual/UX baseline — 13 September 2026
- Premium utility, restrained chrome, open schedule canvas.
- Söhne preferred typography direction, subject to production licensing/technical verification.
- Near-white light canvas; dark-anthracite dark canvas; red used sparingly for selected/current/primary-action emphasis.
- Channel logo primary, channel name secondary/contextual.
- **Totaal:** horizontal time / vertical channels; restrained current-time marker; no low-value cell metadata.
- **Programme Detail:** direct from Guide; current-phase actions `Herinner mij` + `Bewaar`; no share/overflow/calendar/recommendation controls; one-handed sticky action copy may appear once canonical actions scroll away.
- Larger system text may reduce density/reflow rather than clip.
- Tonight/Vanavond remains promising but provisional.

Detailed rules live in `docs/UX.md`, `docs/DESIGN_SYSTEM.md`, `docs/PRODUCT.md` and `docs/BUILD_SPEC.md`.

## Current accepted implementation baseline
- Teevee-owned `Channel`, `Programme` and `GuideFixture` types.
- 48 synthetic channels and a deterministic 49-elapsed-hour runtime fixture aligned to Amsterdam calendar days.
- Amsterdam calendar helpers cover normal days, 23-hour/25-hour DST transitions and year rollover.
- Totaal uses one continuous horizontal timeline with half-hour ticks, duration-based programme blocks, current-time line and programme progress.
- Fixed channel rail plus synchronised vertical movement; native bounce/directional lock and `normal` deceleration.
- Programme Detail selection is isolated from the heavy Guide render. Native Modal slide, button/backdrop close, `onRequestClose`, accessibility escape and deliberate swipe-down dismissal are implemented.
- Optional `Channel.logoUrl`; target treatment is logo first, channel name second, with textual fallback.
- Totaal adapts content geometry to larger system text; tested iPhone large-text corrections are accepted.
- **Vandaag · Morgen · Nu** stay on one row; compact labels cap scaling at 1.2x. Explicit day state updates immediately; `Nu` restores today/current time.
- PR #9 live partial-left programme readability is physically accepted through drag, momentum, settle and programme boundaries; only 48 edge rows carry live animated geometry.
- PR #11 single left-edge mask is physically accepted for time-axis clipping; departing labels disappear whole while tick coordinates stay truthful.
- PR #12 historically corrected stale settled-readability state during reverse scrolling. PR #15 later removed that entire settled React-state path; PR #9 now owns partial-left readability continuously.
- PR #13 VoiceOver semantics and live light/dark switching are physically accepted on iPhone.
- PR #14 removed the per-frame horizontal UI→JS bridge and materially improved post-fling detail response.
- PR #15 removed the remaining horizontal settle full-grid rerenders. Physical A/B validation now shows post-horizontal-fling detail response practically equal to the still-Guide case.
- PR #16 centralises `[start,end)` current-programme semantics, uses one `nowMs` snapshot for progress, preserves fractional progress precision and tests sub-minute current-time geometry.
- PR #17 refreshes the Guide clock immediately on app resume and rebuilds the finite runtime fixture when the Amsterdam calendar day changes, including DST boundaries.
- CI runs install, strict TypeScript, lint, tests and iOS/Android/web Expo bundle exports. Bundle export is not a signed/native device test.

No real production EPG, production artwork, account system or subscription/paywall has been introduced.

## Frozen interaction baselines
Do not retune without concrete regression evidence:
- standard platform scroll inertia;
- native bounce and directional lock;
- continuous timeline/day navigation and animated `Nu`;
- programme `left` and duration-derived `width`;
- close by button/backdrop and deliberate swipe-down dismissal;
- PR #7 one-row controls and immediate selected-day state;
- PR #9 UI-thread edge-readability synchronisation and programme-boundary semantics;
- PR #11 single-mask time-axis treatment and truthful tick coordinates;
- PR #13 VoiceOver traversal/labels and live system-theme response;
- PR #14/#15 horizontal performance architecture: per-frame `scrollX` stays on UI thread; no settled full-grid readability state.

## Physical evidence — iPhone
### Core interaction history
- PR #6 physically rejected: >1000 per-programme Reanimated styles caused white screen/Expo Go crash despite green CI.
- PR #8 physically rejected: React-state edge overlay lagged native ScrollView.
- PR #9 physically accepted: UI-thread edge overlay remains coherent through drag/momentum/boundaries.
- PR #10 physically rejected: per-tick animated time labels still produced a clipped `30` fragment.
- PR #11 physically accepted: one fixed left-edge mask removes clipped time-label fragments without moving truthful ticks.
- PR #12 physically accepted: strong reverse scrolling no longer blanks programme titles.
- PR #13 physically accepted: VoiceOver order/labels/escape and live light↔dark switching work.

### Post-horizontal-scroll Programme Detail performance
`ScreenRecording_09-13-2026 14-28-46_1.MP4` exposed roughly 0.7–0.9 s press→modal delay after recent horizontal movement.

PR #14 removed the per-frame horizontal UI→JS bridge. `ScreenRecording_09-13-2026 14-49-22_1.MP4` plus owner feedback confirmed a clear improvement, but horizontal-fling response still lagged a still Guide while a vertical-fling control was fast.

PR #15 then removed legacy `readabilityViewportX` updates at horizontal finger-up/momentum settle, eliminating two possible full renders of the >1000-cell Guide.

`ScreenRecording_09-13-2026 15-11-35_1.MP4` physically closes this gate:
- post-horizontal-fling press feedback begins around 2.40 s and modal dimming around 2.42 s;
- still-Guide comparison shows press feedback around 5.72 s and modal dimming around 5.74 s;
- the difference is within roughly one captured video frame;
- no recurrence of PR #9 title blanking or PR #11 chopped time-label fragments is visible.

Conclusion: **PR #15 and the combined PR #14/#15 post-scroll performance correction are physically accepted/frozen on iPhone.**

## PR #16 — current-time/progress accuracy
Technical changes:
- shared `isProgrammeCurrent(programme, nowMs)` with start-inclusive/end-exclusive semantics;
- exact boundary tests: before start, start, end−1 ms, end;
- progress uses the same numeric `nowMs` snapshot and remains clamped 0…1;
- visible fill uses fractional percentage instead of rounding to whole percentages;
- sub-minute `timeToX` precision explicitly tested.

Evidence:
- PR head `534b21dd1e14709553535638683078c5267f6e90` passed PR CI #173 / `34759584228` completely;
- merged as `c65715886a81c932d6096e000a2e13aba12a1406`;
- exact merged main passed CI #174 / `34759721513` completely.

## PR #17 — finite fixture lifecycle
Problem: the finite fixture was anchored once at mount while `nowMs` continued advancing. A long-running or overnight-backgrounded app could therefore retain yesterday's `Vandaag/Morgen` horizon and make `Nu` target stale data.

Correction:
- `runtimeGuideFixtureNeedsRefresh` compares the fixture generation day with the current **Amsterdam calendar day** rather than assuming 24-hour days;
- tests cover same-day stability, normal midnight, spring DST, autumn DST and a device clock moving to another day;
- `useGuideClock` immediately refreshes on `AppState → active` and cleans up its listener;
- GuideView holds a refreshable fixture anchor;
- when the Amsterdam day changes, the finite fixture is rebuilt as current `Vandaag + Morgen`, selected day resets to Vandaag, and the Guide reanchors to the current time;
- `Nu` also validates the fixture day before scrolling.

Evidence:
- PR head `5ee42f8089cd2d4428c3f46e1da6cb609f78429c` passed PR CI #175 / `34759940178` completely;
- merged as `0853cdebaccb4036ff6567c17ded444def8d5401`;
- exact merged main passed CI #176 / `34760047645` completely.

## Android/back audit
Programme Detail already supplies React Native Modal `onRequestClose={requestClose}`, and the integration suite exercises the equivalent native-request-close path alongside button/backdrop/swipe close. The modal also places gestures in an Android-native `GestureHandlerRootView`. This gives good automated confidence, but it does **not** substitute for a real Android device: native back arbitration, gesture interaction and realistic performance remain physically unverified.

## Remaining Phase 1 work
- **Physical Android validation:** startup, horizontal/vertical Guide movement, programme tap response, Android system/hardware Back closing Programme Detail, deliberate swipe-down dismissal, and basic stability/performance.
- Release-like performance validation outside Expo Go when a suitable build path/device is available.
- CI reproducibility cleanup; previously reported 15 moderate advisories require deliberate review, never `npm audit fix --force`.
- Later explicit builds for Per zender and Nu & Straks.
- Production EPG/logo/artwork rights/reliability, pricing/trial/paywall, production tokens/font licensing and final Tonight composition remain later gates.

## EXACT NEXT STEP
**Run the current `main` on a physical Android device in Expo Go (or an equivalent current native development build). Validate only the Android-specific gap: app opens normally; horizontal and vertical Guide movement remain usable; a programme opens promptly; Android system/hardware Back closes Programme Detail once and returns to the unchanged Guide; reopen Detail and confirm deliberate swipe-down dismissal works; perform a short mixed-scroll session and confirm no crash/white screen or obvious performance collapse. Do not retune the already frozen iPhone scroll baseline from Android impressions alone.**

Owner checkout: `~/projects/teevee`. Before testing: `git pull --ff-only`, `npm run start:clean`, then open the project from the Android device.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.
