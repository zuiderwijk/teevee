# Teevee — Canonical Project State

Last updated: 2026-09-13 16:07 CEST.
Status: ACTIVE — **Phase 1B Guide Presentation Prototypes**. Phase 1A Totaal is physically accepted/frozen on iPhone. Per zender is now technically implemented as the first Phase 1B prototype and awaits physical iPhone interaction acceptance. Nu & Straks follows after that gate. Physical Android interaction validation is explicitly deferred because the owner currently has no Android device; native Android compilation is now covered in CI but is not device acceptance.
Current phase: **Phase 1B — Guide Presentation Prototypes**
Previous phase: **Phase 1A — Totaal Interaction Prototype: physically accepted on iPhone**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository.

## Product
Teevee is a premium, paid, ad-free television-guide app for iOS and Android under Bindinc/TVgids.nl supervision. The Guide is the product: fast, calm, reliable and polished. Netherlands first; no mandatory account for core Guide use.

## Frozen product/technical decisions
- React Native/Expo SDK 57 and strict TypeScript for iOS and Android.
- Paid, ad-free and Guide-first; no mandatory core-use account.
- Light, dark and system appearance.
- Provider-independent Teevee EPG model; mobile never consumes/parses an external EPG directly.
- Deterministic fixtures keep core development independent of external services.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility and system text scaling are product-quality requirements.
- `PROJECT_STATE.md` is canonical cross-session memory; complexity requires evidence.

Relevant ADRs: `0001` through `0005` in `docs/decisions/`.

## Phasing decision — ADR 0005
Per zender and Nu & Straks were defined during Phase 1, after the original build plan had already placed broader Guide MVP work in Phase 4. The owner approved correcting that sequence so architecture is not hardened around Totaal alone.

Current sequence:
1. **Phase 1A — Totaal:** prove the difficult two-dimensional Guide interaction. Complete on available iPhone.
2. **Phase 1B — Guide presentations:** prove Per zender first, then Nu & Straks, on deterministic fixture data and the existing Programme Detail path.
3. **Phase 2 — App Shell:** only after all three Guide interaction models are understood; define shared presentation state/navigation/persistence then.
4. **Phase 3 — Real Data Vertical Slice.**
5. **Phase 4 — Core Guide MVP hardening:** production-grade versions of Totaal, Per zender and Nu & Straks plus channel management/offline production behaviour.

Phase 1B does **not** pull production EPG integration, accounts, subscriptions, production offline behaviour or persistent channel management forward.

## Guide presentations
### Totaal — implemented and frozen
- Two-dimensional Guide: horizontal time, vertical channels.
- Continuous timeline, real duration geometry, current-time marker/progress, `Vandaag · Morgen · Nu`.
- Fixed channel rail and time context.
- Native bounce/directional lock/standard inertia.
- Physically accepted iPhone fixes through PR #15 remain frozen unless concrete regression evidence exists.

### Per zender — Phase 1B prototype implemented, physical acceptance OPEN
Purpose: inspect one channel through the day while switching adjacent channels without losing time context.

Current implementation from PR #20:
- vertical Y is a **time axis**, not programme-row index;
- programme top/height follow real start/duration and are clipped to Amsterdam day boundaries;
- outer native vertical ScrollView owns the viewed time position;
- inner horizontal `pagingEnabled` pager mounts only previous/current/next channel pages;
- because horizontal channel paging occurs inside the same vertical schedule surface, the Y/time anchor stays unchanged when changing channel;
- pager recentres without animation after an accepted previous/next channel change;
- persistent/browsable horizontal channel strip supports direct channel selection and recentres the active item;
- `Vandaag`, `Morgen` and `Nu` are available; `Nu` validates fixture freshness and returns to current time today;
- programme tap reuses the existing Programme Detail path;
- no per-frame vertical scroll position is bridged into React state/JS;
- fixture channels currently lack licensed `logoUrl`, so the intentional text fallback is visible; this is not the intended final production logo treatment.

`app/index.tsx` temporarily starts in frozen **Totaal** and exposes a small bottom-right `Per zender`/`Totaal` switch for Phase 1B comparison. This is test scaffolding, **not** the final presentation selector, default-view decision or persistence model.

### Nu & Straks — accepted UX, not yet implemented
- Today only; one shared reference time for all channels.
- Live mode follows actual time; moving away pins browse time; `Nu` restores live.
- `Primetime` shortcut.
- Current/reference programme + three following programmes per channel.
- Stable channel order/vertical position when reference time changes.
- No progress bars, genre labels, artwork, chevrons or `Daarna` labels.
- Schedule semantics remain `startAt <= referenceTime < endAt`; gaps must be honest.

## Programme Detail
- Direct from every Guide presentation; no intermediate preview sheet.
- Native React Native Modal presentation.
- Close button/backdrop, `onRequestClose`, accessibility escape and deliberate swipe-down dismissal.
- Current-phase actions: `Herinner mij` + `Bewaar`; no share action in this phase.
- Returning from detail must preserve the originating Guide channel/time/scroll context.

## Phase 1A frozen iPhone interaction baseline
Do not retune without concrete regression evidence:
- standard platform scroll inertia;
- native bounce and directional lock;
- continuous timeline/day navigation and animated `Nu`;
- programme `left` and duration-derived `width` in Totaal;
- PR #9 UI-thread partial-left programme readability and programme-boundary semantics;
- PR #11 single fixed time-axis left mask and truthful tick coordinates;
- PR #13 VoiceOver traversal/labels and live system-theme response;
- PR #14/#15 horizontal performance architecture: per-frame `scrollX` stays on UI thread and no settled full-grid readability state remains;
- Programme Detail button/backdrop/native-request/swipe dismissal behaviour.

Important historical evidence:
- PR #6 rejected physically: >1000 per-programme Reanimated styles produced white screen/Expo Go crash despite green CI.
- PR #8 rejected physically: React-state edge overlay lagged native ScrollView.
- PR #9 accepted: only 48 UI-thread edge rows for partial-left title readability.
- PR #10 rejected: clipped `30` time fragment remained.
- PR #11 accepted: one fixed UI-thread left mask.
- PR #13 accepted: VoiceOver and live light/dark.
- PR #14/#15 accepted: post-horizontal-fling Programme Detail response became practically equal to still-Guide response in `ScreenRecording_09-13-2026 15-11-35_1.MP4`.

## Data/time baseline
- Teevee-owned `Channel`, `Programme` and `GuideFixture` types.
- 48 synthetic channels and deterministic runtime schedule fixture aligned to Amsterdam calendar days.
- Calendar helpers handle normal days, 23-hour/25-hour DST transitions and year rollover.
- Shared `[start,end)` `isProgrammeCurrent` semantics from PR #16; progress uses one numeric `nowMs` snapshot and fractional precision.
- PR #17 refreshes Guide clock immediately on app resume and rebuilds the finite fixture when the Amsterdam calendar day changes; `Nu` also checks fixture freshness.

## CI / reproducibility baseline
### PR #18 — deterministic npm install
- committed npm lockfile v3;
- normal CI uses `npm ci` and npm cache;
- no lockfile regeneration inside normal CI;
- no `npm audit fix --force`.

Evidence: PR head `142a92d9ffdc836af063c91200a315832cff1071` passed CI #181 / `34760300933`; merge `8ee173794d60cebf171b307400e5dcd21d48e488` passed exact-main CI #182 / `34760389374` completely.

### PR #20 — Per zender Phase 1B prototype
The first red run `34761329960` exposed that replacing `app/index.tsx` outright broke the established Totaal Programme Detail integration harness because its mocked ScrollView refs do not implement native `scrollTo`. The solution preserved the Totaal initial boundary and added temporary prototype switching; existing tests were **not** weakened.

Evidence:
- final PR head `67ad6133e84a632b0354721186f439858a49174f` passed PR CI #193 / `34761468823`: deterministic install, strict TypeScript, lint, **100/100 tests** and iOS/Android/web Expo exports;
- merged as `5f71cf30175a4c5686a058d86eda7f0873e99238`;
- exact PR #20 merge passed main CI #194 / `34761570305` completely.

### PR #19 — native Android compile gate
Because no physical Android device is currently available, CI now adds technical Android build evidence without pretending it proves interaction quality:
- Expo generates a clean Android native project;
- Java 17/Gradle are configured in CI;
- Gradle compiles `:app:assembleDebug`;
- generated `/android/` and `/ios/` directories are ignored for the Continuous Native Generation workflow.

Evidence:
- original PR head `60db410901e6a6607f6b049c8197c9593b36d251` passed PR CI #185 / `34760593076` completely, including Expo Android prebuild and Gradle debug APK compilation;
- branch reconciled with PR #20/current main as `3b72fafac09fafdc1e3a9c10134c08972301c83e`;
- merged as `eac7cae6df8083d4906a3ea1280c0add646dcc40`;
- exact combined-main CI #196 / `34761643473`: quality job is fully green; Android prebuild is green and the Gradle debug compile is still running at this document timestamp.

## Android validation status
Automated confidence is materially stronger but physical Android acceptance remains **OPEN/DEFERRED** because the owner has no Android device.

Already covered technically:
- Android JS/native bundle export;
- native Expo Android prebuild;
- Gradle debug APK compilation on PR #19 evidence;
- Programme Detail `onRequestClose` wiring and integration equivalent;
- `GestureHandlerRootView` inside the native Modal path.

Still unproven without a real/interactive Android environment:
- Android system/hardware Back arbitration on-device;
- nested-scroll/gesture feel and accidental gesture arbitration;
- realistic Android frame pacing/performance;
- device-specific visual/runtime defects.

Do not claim these as accepted from CI.

## Remaining Phase 1B work
1. **Physical iPhone acceptance of Per zender.**
2. Iterate Per zender only on concrete device evidence until interaction gate closes.
3. Build and physically validate **Nu & Straks**.
4. Only then enter Phase 2 and formalise the shared Guide presentation-state/shell contract.

Deferred but tracked:
- physical Android validation when a suitable Android device/interactive environment becomes available;
- release-like performance outside Expo Go;
- targeted review of the previously reported 15 moderate dependency advisories; never `npm audit fix --force`;
- production EPG/logo/artwork rights and reliability;
- pricing/trial/paywall;
- production design tokens/font licensing;
- final Tonight composition.

## EXACT NEXT STEP
**Physically validate the merged Per zender Phase 1B prototype on the available iPhone.**

Owner checkout: `~/projects/teevee`.

Before testing:
```bash
git pull --ff-only
npm run start:clean
```

The app opens in the frozen **Totaal** prototype. Tap the temporary bottom-right **Per zender** control, then validate:
1. Per zender opens around the current time on `Vandaag`.
2. Vertical slow scroll and fling feel native/stable; hour/programme geometry stays coherent.
3. Horizontal swipe **inside the schedule** changes exactly one adjacent channel; reverse repeatedly and confirm the viewed time does not jump.
4. Diagonal movement should not accidentally switch channels during normal vertical browsing.
5. Browse the channel strip horizontally and tap a distant channel; the selected channel becomes active/visible while the schedule stays at the same time anchor.
6. `Morgen` and `Vandaag` preserve the approximate viewed time; `Nu` returns to today/current time.
7. Open a programme and close Programme Detail; the same channel/day/time context must remain. Repeat immediately after horizontal channel swipes and note any latency.
8. Run a short mixed session of vertical flings, horizontal channel swipes and strip browsing; no crash, white screen, blank schedule or obvious performance collapse.
9. Confirm light/dark remain usable; sample a larger system-text size if convenient.

Do **not** retune the frozen Totaal interaction from Per zender impressions alone.

## Resume instruction
> Read `AGENTS.md` and `PROJECT_STATE.md`. Execute EXACT NEXT STEP where possible. Phase 1B order is Per zender physical acceptance -> Nu & Straks prototype/acceptance -> Phase 2 App Shell. Update PROJECT_STATE and the Dutch timestamped DEVLOG after every substantive increment. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI for physical acceptance.
