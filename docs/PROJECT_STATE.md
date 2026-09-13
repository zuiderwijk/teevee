# Teevee — Canonical Project State

Last updated: 2026-09-13 07:36 CEST (Europe/Amsterdam; swipe-dismiss increment). Exact commit times are in GitHub.
Status: ACTIVE — iPhone detail responsiveness accepted; swipe dismissal implemented, native retest open
Current phase: **Phase 1 — Guide Interaction Prototype**
Previous phase: **Phase 0 — Project Foundation: COMPLETE**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository.

## Product
Teevee is a premium, paid, ad-free television-guide app for iOS and Android under Bindinc/TVgids.nl supervision. The Guide is the product: fast, calm, reliable and polished. Netherlands first; no mandatory account for core Guide use.

## Frozen decisions
- React Native/Expo and strict TypeScript for iOS and Android.
- Paid, ad-free, Guide-first; no mandatory core-use account.
- Light, dark and system appearance.
- Provider-independent Teevee EPG model; mobile never consumes/parses an external EPG directly.
- Deterministic fixtures mandatory; free external EPG development-only until rights/reliability approved.
- Core Guide cannot depend on artwork/enrichment.
- PROJECT_STATE is canonical cross-session memory. Complexity requires evidence.

Relevant ADRs: `0001` through `0004` in `docs/decisions/`.

## Working hypotheses and visual state
Later primary navigation Guide / Tonight / Search; RevenueCat, Supabase/PostgreSQL and Sentry are preferences, not Phase 1 requirements. Existing light/dark visuals are Visual Direction 01, not a frozen UI specification. Preserve calm utility, hierarchy and functional density. No final design acceptance yet.

## Implementation reality
- Expo SDK 57 / Expo Router / strict TypeScript and semantic system-aware themes.
- Teevee-owned Channel, Programme and GuideFixture types.
- 48 synthetic channels; 49 elapsed hours of deterministic source data, runtime-aligned to Amsterdam midnight at launch.
- Shared guideDayStart logic with timezone, DST, 23/25-hour and year-rollover tests.
- One continuous timeline, half-hour ticks, duration-based cells, compact narrow cells and current-time/progress updates every 30 seconds.
- Fixed channel column and synchronised vertical movement; native bounce/directional lock and `normal` deceleration on both axes.
- Day buttons and Nu animate within that same timeline. Active day follows horizontal position.
- A small route owns detail selection; stable callbacks and memoized GuideView prevent selection-only Guide rerenders. Guide time/day/theme updates remain independent.
- Separate ProgrammeDetail retains selected text during native Modal dismissal. Backdrop and sheet remain siblings; text taps do not dismiss.
- Programme cells and close button retain pressed feedback; opening still uses onPress, never onPressIn.
- New swipe-down on the detail sheet: downward pan follows the finger using existing Gesture Handler 2 + Reanimated 4/Worklets. No new package/native dependency.
- Small/cancelled gestures spring back. A deliberate downward drag or flick invokes the existing close action. Clear upward reversal and multiple-finger input do not dismiss.
- Native `animationType="slide"` remains the sole exit animation. A committed swipe retains its translated position while native dismissal continues; no spring-to-top or extra exit animation first.
- Motion state resets before a new visible presentation. Gesture is gated until native onShow. Button, backdrop, accessibility escape and Android back remain alternatives.
- The modal contains its own GestureHandlerRootView, as required for Android modal gestures. This does NOT change the Guide's scroll implementation.
- CI now exports iOS/Android/web bundles after typecheck, lint and Vitest. Bundles are not signed native builds or device tests.

No real EPG, production artwork, accounts or subscriptions introduced. No dependency versions changed in this increment.

## Latest device evidence
The owner accepted the scroll baseline with "perfect" after testing normal inertia, browsing beyond 16:00/across midnight and animated Nu.

The earlier detail test confirmed opening/closing and preserved Guide position, but both actions felt slow. After the render-isolation update the owner now says **"perfect"**, confirms closing both with the button and by tapping outside the details, and requests swipe-down as an extra close option.

Record this as qualitative acceptance of the improved detail response and the two reported close paths, not measured latency or acceptance of the newly implemented swipe. No device model, OS, Expo Go version, exact installed SHA, timings or new framerate results supplied. Prior position-retention evidence remains valid history; verify after the swipe change without inventing a new result.

## Verification evidence
- Historical scroll/calendar code passed CI #49/#50; acceptance docs #51.
- Detail render-isolation PR #1 passed #53/#55, merged as `1211630a424f61b83079d695df0cefa24c80c5d6`, and main CI #56 succeeded. The current user reply adds qualitative device acceptance for that change.
- Swipe work is developed in **PR #2**, branch `feat/detail-swipe-dismiss`, starting at `4e450141`. Mock callback types were tightened in `26a733d591b0e8f9e4222391e5769f1b35557900` under exact optional typing; first run #57 failed typecheck.
- **CI #58** passed for `26a733d5`: install, TypeScript, lint, tests and web export. No weakened checks or forced dependency changes.
- CI extension `762f0f46148dbdbc5319cf80f04c0ab643a805ea` adds iOS and Android bundle exports. Its run and the documentation/merge runs need their own results; inspect PR #2/latest CI before reporting current-main status.
- Pure tests cover drag bounds, distance/flick thresholds, invalid inputs and upward reversal. React tests use actual components/48-channel fixture plus mocked native hosts, gesture callbacks and shared values. They check cancellation, repeated/reopened detail, all close routes, content, unchanged Guide render count and retained mock scroll hosts/offsets.
- Mocked gesture tests do NOT validate actual native recognition, the gesture-to-native-dismissal transition, spring feel, accessibility or device performance.
- Container clone failed on DNS; no local native runtime executed. Full toolchain verification runs in GitHub Actions.

## Accepted baselines and boundaries
Keep normal platform inertia, native bounce/directional lock, geometry, continuous day navigation and Nu unchanged. Preserve render isolation and the accepted native Modal slide for button/backdrop closing.

The new swipe is a requested interaction, not a new global scroll architecture. Its distance/flick thresholds are initial implementation choices for device validation, not proven universal optima. No fixed two-screens-per-swipe requirement.

The current detail body is not an internal ScrollView, so dragging can begin across the sheet. When long scrollable descriptions are added, scope the pan to a header or coordinate it with the content's top boundary. Do not let reading-scroll unintentionally dismiss details.

## Phase 1 exit gate and outstanding work
Phase 1 remains open until the Guide preserves context, Now/progress are understandable, cells/detail are usable, light/dark and accessibility work, logic is tested and representative iOS/Android interaction is validated.

Still outstanding:
- Native swipe retest: track finger, cancel, dismiss, reopen, button/backdrop and retained Guide position. Verify no empty panel or duplicate exit animation.
- Short cells, metadata fallbacks, larger text/detail reachability, light/dark, screen-reader behaviour and progress correctness.
- Android gesture/back-button tests and signed/release-like device performance. JS bundle export cannot close those gates.
- Full rendering load and label synchronisation during long flings/bounce; Guide clock updates may still cause work independently of detail selection.
- Finite launch-anchored fixture: resume after midnight, expiry and final partial-day labels need a lifecycle pass.
- CI still generates a lockfile before npm ci. Reproducibility and previously reported 15 moderate advisories need deliberate cleanup; do not force-upgrade.
- Production data/logo/artwork rights and reliability, exact price/trial/paywall, and final visual design are later gates.

## EXACT NEXT STEP
**After verifying PR #2 integration CI, obtain a focused iPhone retest of swipe-down detail dismissal: drag partway and release to return, drag/flick down to close, reopen the same and another programme, recheck button/backdrop, and confirm time/channel position remains unchanged. Record actual observations in DEVICE_TEST_REPORT. Keep accepted scroll and detail-response baselines unchanged; then continue the open readability/accessibility checks.**

Owner checkout: `~/projects/teevee`. GitHub changes are not automatically local. Stop Metro with Control+C, `git pull --ff-only`, then `npm run start:clean` and reopen Expo Go. No npm install is required solely for this increment because package.json is unchanged and the gesture libraries were already installed. No Expo Go reinstall required.

Do not introduce real EPG, subscriptions, accounts, Tonight, enrichment or specialised Guide virtualisation here.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.
