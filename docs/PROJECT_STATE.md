# Teevee — Canonical Project State

Last updated: 2026-09-13 08:05 CEST (Europe/Amsterdam; guide-view requirements recording started). Exact commit time is in GitHub.
Status: ACTIVE — iPhone scroll/detail/swipe baselines accepted; readability checks open; alternative Guide views specified but not built
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

## New owner requirements — guide presentations, 13 September 2026
The existing grid is now called **Totaal**. The owner also requests **Per zender** (one channel's scrollable day, current-time opening, channel navigation and secondary date selection) and **Nu & Straks** (all chosen channels, programme at a common reference time plus following programme(s)). These are requirements for further work, not implemented features.

The latest correction overrides the earlier suggestion of date selection in Nu & Straks: **no date selector; a horizontal time selector restricted to today**. Moving through today's hours dynamically changes all channel cards at the selected instant. Nu restores actual current-time tracking. A chosen future/past moment is a browsing reference, not "live".

PRODUCT and UX now record this scope and its derived implementation rules: live versus pinned browsing mode, visible reference time, stable channel order/vertical position, programme-boundary/gap handling and explicit midnight semantics. Totaal and Per zender keep date navigation. The 08:02 screenshot is an interaction example, not a request to copy advertisements, colours or the date dropdown.

One Guide destination with a remembered local presentation preference is the working proposal; exact control placement, initial default and one versus two following programmes remain open. Popularity, rare switching and journey overlap are user/agent hypotheses, not validated research. No new primary tabs are authorised. Do not mark Per zender or Nu & Straks as available in the current app.

The existing Phase 1 acceptance gates and immediate readability pass remain open. A subsequent build specification must plan the new views explicitly rather than silently skip those gates. No runtime code, packages or accepted interactions change in this requirements-recording increment.

## Implementation reality
- Expo SDK 57 / Expo Router / strict TypeScript and semantic system-aware themes.
- Teevee-owned Channel, Programme and GuideFixture types.
- 48 synthetic channels; 49 elapsed hours of deterministic source data, runtime-aligned to Amsterdam midnight at launch.
- Shared guideDayStart logic with timezone, DST, 23/25-hour and year-rollover tests.
- One continuous timeline (Totaal), half-hour ticks, duration-based cells, compact narrow cells and current-time/progress updates every 30 seconds.
- Fixed channel column and synchronised vertical movement; native bounce/directional lock and `normal` deceleration on both axes.
- Day buttons and Nu animate within that same timeline. Active day follows horizontal position.
- A small route owns detail selection; stable callbacks and memoized GuideView prevent selection-only Guide rerenders. Guide time/day/theme updates remain independent.
- Separate ProgrammeDetail retains selected text during native Modal dismissal. Backdrop and sheet remain siblings; text taps do not dismiss.
- Programme cells and close button retain pressed feedback; opening still uses onPress, never onPressIn.
- Swipe-down on the detail sheet uses existing Gesture Handler 2 + Reanimated 4/Worklets. No new package/native dependency.
- Small/cancelled gestures spring back. A deliberate downward drag or flick invokes the close action. Clear upward reversal and multiple-finger input do not dismiss by implementation; individual edge cases are not all device-verified.
- Native `animationType="slide"` remains the exit animation. A committed swipe retains its translated position while native dismissal continues; no spring-to-top or extra exit animation first.
- Motion state resets before a new visible presentation. Gesture is gated until native onShow. Button, backdrop, accessibility escape and Android back remain alternatives.
- The modal contains its own GestureHandlerRootView for Android modal gestures. This does NOT change the Guide's scroll implementation.
- CI exports iOS/Android/web bundles after typecheck, lint and Vitest. Bundles are not signed native builds or device tests.

No real EPG, production artwork, accounts or subscriptions introduced. The current requirements record changes documentation only; no appcode, dependency or gesture-setting changes.

## Latest device evidence
On 13 September the owner replied **"perfect"** to the requested iPhone retest of swipe-down dismissal, short-drag return, reopening and existing close paths. Record this as **qualitative acceptance of the targeted swipe-dismiss change set**, not as individual measured passes for every gesture edge case. No new timings, device model, OS, Expo Go version or exact installed SHA were supplied. The requested test build was main code `1242f7d64f8abc594f11f043459e07893a25e5b6` (PR #2); the actual local SHA was not independently confirmed.

Earlier evidence remains:
- Scroll baseline accepted after testing normal inertia, browsing beyond 16:00/across midnight and animated Nu.
- Original detail test confirmed opening/closing and retained Guide position but reported subjective delay.
- After render isolation (PR #1), the owner said "perfect" and explicitly confirmed both button and outside-tap closing.

The owner has since supplied dark-mode screenshots of both the Guide and the open detail in this thread. They provide visual inspection evidence, not blanket accessibility approval. The prior status response noted awkward long-channel-name wrapping and clipped leading text in partly scrolled programme cells. The 08:02 image of the existing TVgids.nl Nu & Straks screen is a separate interaction reference, not a Teevee device test. Record the screenshot observations in the pending readability pass; do not ask for the already supplied images again.

These confirmations do not approve larger text, screen-reader behaviour, Android, production performance or the final design. See DEVICE_TEST_REPORT for exact scope. Do not repeat the same accepted swipe test unless a concrete regression appears.

## Verification evidence
- Historical scroll/calendar code passed CI #49/#50; acceptance docs #51.
- Detail render-isolation PR #1 passed #53/#55, merged as `1211630a424f61b83079d695df0cefa24c80c5d6`; main CI #56 succeeded, followed by qualitative iPhone acceptance.
- Swipe PR #2 started at `4e450141`. Run #57 failed typecheck in the new testmock; callbacks were tightened in `26a733d5` without weakening checks. CI #58 then passed.
- `762f0f46` extended bundle verification to iOS/Android/web. PR CI #60 passed on exact head `6e87b769` before integration.
- Swipe PR #2 merged as **`1242f7d64f8abc594f11f043459e07893a25e5b6`**. **Main CI #61, run `34740881328`, completed successfully**, verified in the preceding implementation session.
- Acceptance-recording commit `b3318df524157e4be4e86a382de3f42778bea321` passed CI #62, as checked in the preceding status response. This new documentation commit has a separate CI result; do not presume it has passed.
- Pure tests cover drag bounds, distance/flick thresholds, invalid inputs and upward reversal. React tests use actual components/48-channel fixture plus mocked native hosts, gesture callbacks and shared values. They check cancellation, repeated/reopened detail, close routes, content, unchanged Guide render count and retained mock scroll hosts/offsets.
- Mocked gesture tests are not native recognition, accessibility, timing or performance measurements. The owner acceptance is separate qualitative iPhone evidence.
- Earlier container clone failed on DNS; no local native runtime was executed. Full toolchain verification ran in GitHub Actions.

## Accepted baselines and boundaries
Keep normal platform inertia, native bounce/directional lock, geometry, continuous day navigation and Nu unchanged. Preserve render isolation and native Modal slide. Detail response, button/outside-tap dismissal and the targeted swipe-dismiss interaction are accepted working iPhone baselines.

Do not retune gesture thresholds or animation without a concrete problem. No fixed two-screens-per-swipe requirement. The current detail body is not an internal ScrollView, so dragging can begin across the sheet. If long scrollable descriptions are added, scope the pan to a header or coordinate it with the content's top boundary. Reading-scroll must not unintentionally dismiss details.

## Phase 1 exit gate and outstanding work
Phase 1 remains open until the Guide preserves context, Now/progress are understandable, cells/detail are usable, light/dark and accessibility work, logic is tested and representative iOS/Android interaction is validated.

Still outstanding:
- Complete the light/dark screenshot inspection and record it in DEVICE_TEST_REPORT; theme switching, short cells, metadata fallbacks, larger text/detail reachability, screen-reader behaviour and progress correctness remain open.
- Android gesture/back-button tests and signed/release-like device performance. JS bundle export cannot close those gates.
- Full rendering load and label synchronisation during long flings/bounce; Guide clock updates may still cause work independently of detail selection. Qualitative acceptance is not an instrumented measurement.
- Finite launch-anchored fixture: resume after midnight, expiry and final partial-day labels need a lifecycle pass.
- CI still generates a lockfile before npm ci. Reproducibility and previously reported 15 moderate advisories need deliberate cleanup; do not force-upgrade.
- Plan and build the requested Per zender and today-only Nu & Straks views in subsequent explicit increments; this amendment is not an implementation.
- Production data/logo/artwork rights and reliability, exact price/trial/paywall, and final visual design are later gates.

## EXACT NEXT STEP
**Complete the focused Phase 1 readability/accessibility pass: inspect and record the already supplied dark-mode Guide and detail screenshots, address concrete readability defects without changing accepted scrolling/dismissal, and obtain only the remaining observations for larger system text and content reachability. Keep the newly recorded Guide-view requirements intact for the subsequent build specification.**

Owner checkout: `~/projects/teevee`. No reload, pull or install is needed for this documentation-only amendment. For subsequent appcode changes, stop Metro with Control+C, `git pull --ff-only`, then `npm run start:clean` and reopen Expo Go. GitHub commits do not automatically update the local checkout.

Do not introduce real EPG, subscriptions, accounts, Tonight, enrichment or specialised Guide virtualisation here.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.
