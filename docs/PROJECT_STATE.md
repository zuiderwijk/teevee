# Teevee — Canonical Project State

Last updated: 2026-09-13 17:40 CEST.
Status: ACTIVE — **Phase 1B Guide Presentation Prototypes**. Phase 1A Totaal is physically accepted/frozen on iPhone. The core Per zender gesture/time-anchor architecture is physically evidenced on iPhone; a small set of targeted controls/detail/theme checks remains open. Nu & Straks is technically implemented, deferred loading is physically proven, and the serious time-rail momentum feedback-loop found in the first interaction recording has been fixed by PR #24 and physically revalidated on iPhone. Remaining Phase 1B work is now limited to residual context/detail/theme checks before entering Phase 2. Physical Android interaction validation remains explicitly deferred because the owner currently has no Android device; native Android compilation is covered in CI but is not device acceptance.
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
Per zender and Nu & Straks were defined during Phase 1, after the original plan had placed broader Guide MVP work in Phase 4. The owner approved correcting the order so the app shell and data architecture are not hardened around Totaal alone.

Current sequence:
1. **Phase 1A — Totaal:** prove the difficult two-dimensional Guide interaction. Complete on the available iPhone.
2. **Phase 1B — Guide presentations:** prove Per zender and Nu & Straks on deterministic fixture data and the existing Programme Detail path.
3. **Phase 2 — App Shell:** only after all three Guide interaction models are understood; define the shared presentation state/navigation/persistence contract then.
4. **Phase 3 — Real Data Vertical Slice.**
5. **Phase 4 — Core Guide MVP hardening:** production-grade Totaal, Per zender and Nu & Straks plus channel management/offline production behaviour.

Phase 1B does **not** pull production EPG integration, accounts, subscriptions, production offline behaviour or persistent channel management forward.

## Guide presentations
### Totaal — implemented and frozen on iPhone
- Two-dimensional Guide: horizontal time, vertical channels.
- Continuous timeline, real duration geometry, current-time marker/progress, `Vandaag · Morgen · Nu`.
- Fixed channel rail and time context.
- Native bounce/directional lock/standard inertia.
- Physically accepted fixes through PR #15 remain frozen unless concrete regression evidence exists.

### Per zender — prototype implemented; core physical architecture evidenced
Purpose: inspect one channel through the day while switching adjacent channels without losing time context.

Implementation from PR #20:
- vertical Y is a **time axis**, not programme-row index;
- programme top/height follow real start/duration and clip to Amsterdam day boundaries;
- one native vertical ScrollView owns the viewed time position;
- a horizontal `pagingEnabled` pager mounts only previous/current/next channel pages;
- horizontal paging therefore preserves the vertical wall-clock anchor without bridging scroll position to React state;
- pager recentres after previous/next channel selection;
- persistent/browsable horizontal channel strip supports direct selection and recentres the active item;
- `Vandaag`, `Morgen` and `Nu` are available;
- programme tap reuses the existing Programme Detail path;
- fixture channels currently lack licensed `logoUrl`, so the intentional text fallback is visible.

Physical evidence — `ScreenRecording_09-13-2026 16-16-00_1.MP4`:
- opens around actual current time;
- strong vertical movement through the day remains coherent/stable;
- horizontal schedule swipes move Publiek 1 → Publiek 2 → Publiek 3 one adjacent channel at a time;
- active channel state follows the schedule page;
- viewed wall-clock position stays materially unchanged across channel changes;
- no white screen, crash or obvious gesture collapse is visible.

Conclusion: the **main Per zender nested-gesture/time-anchor architecture risk is closed on the available iPhone**. This recording did not deliberately exercise every acceptance item, so the following remain targeted residual checks:
- horizontal browsing and direct tap of a distant channel in the top strip;
- `Vandaag`/`Morgen`/`Nu` behaviour;
- Programme Detail round-trip/context preservation and immediate post-swipe response;
- light/dark and representative larger system text.

### Nu & Straks — core interaction architecture physically evidenced; residual checks OPEN
Purpose: answer quickly what is on now/at one shared reference time and what follows on each channel.

Implementation from PR #21:
- today only; no date selector;
- all 48 fixture channels share one reference instant;
- live mode follows actual current time;
- interacting with the horizontal time rail leaves live mode and pins a browse time;
- the rail uses 30-minute slots and native snapping; live mode itself retains the actual current instant rather than rounding the schedule semantics;
- `Nu` restores live mode/current time and recentres the rail;
- `Primetime` selects **20:30 as a prototype value**; this exact value is not yet a frozen product/commercial decision;
- each channel row shows the reference programme plus up to **three following programmes**;
- reference programme is visually dominant; following programmes are quieter and show start time only;
- live/current programme shows useful `Nu · tot …` context;
- honest `Geen programma` state is shown for schedule gaps;
- no progress bars, genres, artwork, chevrons or `Daarna` labels;
- channel order/vertical list position is structurally independent from reference-time state;
- schedule semantics use start-inclusive/end-exclusive `[start,end)` matching;
- Programme Detail opens directly through the existing shared path;
- Amsterdam day boundaries generate the available time slots, including non-24-hour DST days.

Startup isolation/reintegration:
- PR #21 originally added a static `NowNextGuideView` import to the startup module graph; physical iPhone startup then produced duplicate secondary `RCTEventEmitter.receiveEvent()` redboxes even though CI was green;
- PR #22 removed that static startup import and restored the previously proven Totaal + Per zender startup boundary; the owner physically confirmed clean startup on iPhone;
- PR #23 reintroduced Nu & Straks through deferred module loading, evaluating `NowNextGuideView` only when the owner explicitly requests the presentation;
- on current `main`, the owner physically confirmed that **Nu & Straks successfully loads and opens on the iPhone**;
- deferred loading remains the accepted Phase 1B integration boundary. Do not restore a static startup import without separate evidence.

Time-rail defect and fix:
- first interaction recording `ScreenRecording_09-13-2026 17-07-22_1.MP4` exposed a serious rail oscillation/tug-of-war around 00:08–00:09 and again around 00:18;
- root cause: rail selection was committed from both `onScrollEndDrag` and `onMomentumScrollEnd`; those commits called `scrollTo()`, while a separate selected-slot effect also recentred, allowing React/state-driven scrolling to fight native momentum + snapping;
- PR #24 removed that feedback loop: rail-originated commits update reference state without programmatic recentering, momentum end is authoritative for flings, zero-velocity drags may commit on drag-end, and broad selected-slot recentering is removed;
- PR #24 head passed both required CI jobs completely, including quality and native Android debug APK compilation, and merged as `1ce614a097ee15c20e4805424302fe711c58d339`;
- physical retest `ScreenRecording_09-13-2026 17-36-54_1.MP4` deliberately exercises repeated fast flings/reversals; the previous oscillation is no longer visible, the rail stays controllable, settles to a single slot, `Nu` returns to the current reference, and `Primetime`/20:30 movement remains coherent;
- therefore the **Nu & Straks momentum/rail-control blocker is physically closed on the available iPhone**.

The physical evidence now supports the core live/browse time-rail architecture. Remaining Nu & Straks checks before Phase 1B closure:
- Programme Detail round-trip must preserve reference time and vertical channel context;
- mixed vertical list movement plus rail changes should preserve channel position/order in a targeted pass;
- dark mode and a representative larger system-text size remain to be sampled;
- final visual hierarchy is explicitly not a Phase 1B acceptance requirement unless it blocks usability.

Temporary Phase 1B test scaffolding in `app/index.tsx` cycles:
**Totaal → Per zender → Nu & Straks → Totaal**.
This is not the final presentation selector, default-view decision or persistence model.

## Programme Detail
- Direct from every Guide presentation; no intermediate preview sheet.
- Native React Native Modal presentation.
- Close button/backdrop, `onRequestClose`, accessibility escape and deliberate swipe-down dismissal.
- Current-phase actions: `Herinner mij` + `Bewaar`; no share action in this phase.
- Returning from detail must preserve the originating Guide presentation and relevant channel/time/scroll context.

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

Important rejected/accepted history is retained in `docs/DEVLOG.md`.

## Data/time baseline
- Teevee-owned `Channel`, `Programme` and `GuideFixture` types.
- 48 synthetic channels and deterministic runtime schedule fixture aligned to Amsterdam calendar days.
- Calendar helpers handle normal days, 23-hour/25-hour DST transitions and year rollover.
- Shared `[start,end)` current-programme semantics from PR #16; progress uses one numeric `nowMs` snapshot and fractional precision.
- PR #17 refreshes Guide clock immediately on app resume and rebuilds the finite fixture when the Amsterdam calendar day changes.
- Nu & Straks helper tests cover reference boundaries, three-following selection, honest gaps, day clamping, non-24-hour slot generation and nearest-slot positioning.

## CI / reproducibility baseline
- `package-lock.json` v3 is committed; normal CI installs only with `npm ci` and uses the npm cache.
- CI `quality` runs strict TypeScript, lint, tests and iOS/Android/web Expo exports.
- CI `android-native` performs a clean Expo Android prebuild and Gradle `:app:assembleDebug`.
- Never run `npm audit fix --force`; the previously reported 15 moderate advisories require targeted review.

Key evidence:
- PR #18 reproducible install: head `142a92d9ffdc836afc91200a315832cff1071` passed CI #181 / `34760300933`; merge `8ee173794d60cebf171b307400e5dcd21d48e488` passed main CI #182 / `34760389374`.
- PR #20 Per zender: head `67ad6133e84a632b0354721186f439858a49174f` passed CI #193 / `34761468823`; merge `5f71cf30175a4c5686a058d86eda7f0873e99238` passed main CI #194 / `34761570305`.
- PR #19 Android native compile gate: head `60db410901e6a6607f6b049c8197c9593b36d251` passed CI #185 / `34760593076`, including Expo Android prebuild and Gradle debug APK compilation; merged as `eac7cae6df8083d4906a3ea1280c0add646dcc40`.
- PR #21 Nu & Straks: final head `fb388f1fefbc9dd64891bd69e70e4b79d7bb574d`; CI #200 / `34762548963` passed `npm ci`, typecheck, lint, tests and all-platform Expo exports. It merged as `dccc02d635cb9b3189a4ea7a857b56100e2e3ab9`.
- PR #22 startup hotfix restored the physically proven startup boundary by removing the static Nu & Straks import; the owner physically confirmed clean startup on iPhone afterward.
- PR #23 deferred reintegration merged as `c3ee101ea29e60d0b5b1ae88cde86191f5ba4bab`; its PR quality job passed install, typecheck, lint, tests and all-platform exports. The owner then physically confirmed that Nu & Straks loads and opens successfully when requested after startup.
- PR #24 rail momentum fix: head `9e6ce84751be4a71c1c2eb283a86b4c4cd2d301a` passed CI #215 / `34765048160` completely: both `quality` and `android-native` completed successfully. It merged as `1ce614a097ee15c20e4805424302fe711c58d339`. Physical iPhone retest subsequently closed the original oscillation defect. Exact-main CI #216 / `34765990513` was still in progress when last observed; do not claim that merge run green until its jobs are explicitly rechecked.

## Android validation status
Physical Android interaction acceptance remains **OPEN/DEFERRED** because no Android device is currently available.

Automated confidence covers:
- Android JS/native bundle export;
- clean Expo Android prebuild;
- Gradle debug APK compilation on established PR/CI evidence;
- Programme Detail `onRequestClose` wiring and integration equivalent;
- `GestureHandlerRootView` inside the native Modal path.

Still physically unproven:
- Android system/hardware Back arbitration;
- nested-scroll/gesture feel;
- realistic Android frame pacing/performance;
- device-specific visual/runtime defects.

## Remaining Phase 1B work
1. **One short residual iPhone pass:** Nu & Straks Programme Detail/context + mixed vertical/time movement + dark/large-text sample; Per zender distant-channel selection + day/Nu + Programme Detail/context + dark-mode sample.
2. Iterate only on concrete device evidence from that residual pass.
3. If no blocking defect remains, close Phase 1B and enter **Phase 2 App Shell**, formalising one shared Guide presentation-state/navigation/persistence contract.

Deferred but tracked:
- physical Android validation when a suitable Android device/interactive environment becomes available;
- release-like performance outside Expo Go;
- targeted review of the 15 moderate dependency advisories;
- production EPG/logo/artwork rights and reliability;
- pricing/trial/paywall;
- production design tokens/font licensing;
- final Tonight composition.

## EXACT NEXT STEP
**Perform one short residual Phase 1B iPhone pass; do not start Phase 2 until this pass is clean or any found blockers are fixed.**

Owner checkout: `~/projects/teevee`.

If current `main` is not already running:
```bash
git pull --ff-only
npm run start:clean
```

### Nu & Straks — residual checks
1. Scroll vertically several channels away from the starting position, then change the time rail twice; the vertical channel context must not jump.
2. Open a programme, close Programme Detail, and verify the same reference time + vertical channel position remain.
3. Repeat once immediately after a fast rail fling.
4. Toggle dark mode while Nu & Straks is visible; layout/contrast must remain usable.
5. If convenient, sample one larger system-text size; no critical control/content may become unusable.

### Per zender — residual checks
1. Browse the top channel strip horizontally and directly tap a distant channel.
2. Test `Morgen`, `Vandaag` and `Nu`.
3. Open/close Programme Detail and verify channel/day/time context is preserved, including immediately after a horizontal channel swipe.
4. Toggle dark mode; layout and interaction remain usable.

Do **not** retune frozen Totaal from Phase 1B impressions alone.

## Resume instruction
> Read `AGENTS.md` and `PROJECT_STATE.md`. Execute EXACT NEXT STEP where possible. Phase 1B now has frozen Totaal acceptance, Per zender core gesture/time-anchor evidence, clean startup with deferred Nu & Straks loading, and physical proof that PR #24 removed the serious time-rail momentum feedback loop. The only active gate before Phase 2 is the short residual iPhone pass for context/detail/theme behaviour in Per zender and Nu & Straks. Update PROJECT_STATE and the Dutch timestamped DEVLOG after every substantive increment. Ask only for genuinely necessary physical-device observations. Never substitute CI for physical acceptance.