# Teevee — Canonical Project State

Last updated: 2026-09-13 08:40 CEST (Europe/Amsterdam). Exact commit time is in GitHub.
Status: ACTIVE — Phase 1 interaction baselines accepted; Dynamic Type groundwork integrated; larger-text device validation still open; Per zender and Nu & Straks specified but not built
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
- Deterministic fixtures mandatory; free external EPG is development-only until rights/reliability are approved.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility and system text scaling are product quality requirements, not optional polish.
- PROJECT_STATE is canonical cross-session memory. Complexity requires evidence.

Relevant ADRs: `0001` through `0004` in `docs/decisions/`.

## Guide presentations
The current grid is **Totaal**. Two additional Guide presentations are requested and documented but not implemented:

- **Per zender:** one channel's scrollable schedule, initially around the current programme; channel navigation primary, date navigation secondary.
- **Nu & Straks:** compact all-channel list around one common reference time. There is **no date selector**. A horizontal time selector moves within the current Amsterdam calendar day. Entry starts in live/current mode; `Nu` restores live mode. Moving the selector pins a past/future time today without calling that snapshot live.

For Nu & Straks, every channel resolves `startAt <= referenceTime < endAt`, then shows following programme(s). Keep channel order and vertical reading position stable while the selected time changes. Gaps are shown honestly. The selector itself does not cross into tomorrow, although a following programme may start after midnight with an explicit day indication. An accessible alternative to dragging is required.

One Guide destination with a locally remembered presentation preference remains the working proposal. Exact selector placement, first-install default, and one versus two following programmes are still open. No new primary tabs are authorised. Popularity of a presentation and frequency of switching are hypotheses, not validated research.

## Channel identity and larger text
Owner direction is now explicit:
- channel **logo is primary** when a suitable licensed asset exists;
- channel name remains visible but secondary, because logo recognition cannot be assumed for every channel;
- the full channel name remains available to assistive technology;
- when no logo is available or an image fails, show a clean text fallback rather than a broken placeholder;
- production logo rights remain a separate later gate.

Larger system text must remain usable. Do not preserve default density by disabling font scaling or clipping essential information. Totaal may use taller rows, a wider channel rail and less secondary metadata as font scale increases. Programme detail must remain fully reachable; if it becomes scrollable, coordinate reading-scroll with the accepted swipe-to-dismiss interaction.

## Implementation reality
- Expo SDK 57 / Expo Router / strict TypeScript and semantic system-aware themes.
- Teevee-owned Channel, Programme and GuideFixture types; `Channel` now supports optional `logoUrl` without introducing real logo assets.
- 48 synthetic channels and 49 elapsed hours of deterministic source data, runtime-aligned to Amsterdam midnight at launch.
- Shared `guideDayStart` logic covers timezone, DST, 23/25-hour days and year rollover.
- Totaal uses one continuous timeline with half-hour ticks, duration-based programme cells and current-time/progress updates every 30 seconds.
- Fixed channel column and synchronised vertical movement; native bounce/directional lock and `normal` deceleration on both axes.
- Day controls and `Nu` animate inside the same timeline; active day follows horizontal position.
- Detail selection lives outside the memoized Guide so opening/closing does not rebuild the heavy grid.
- ProgrammeDetail uses the accepted native Modal slide plus button, backdrop, accessibility escape/Android back and downward swipe dismissal.
- Gesture Handler 2 + Reanimated 4/Worklets are already present; no new runtime/native dependency was introduced by the accessibility increment.

### Dynamic Type increment integrated on main
PR #3 was merged as **`da61b3cf10f8bf79e552f2b3eacdb289439810ce`**.

Totaal now reads the platform `fontScale` and derives layout metrics from it. At default scale the accepted geometry remains unchanged. As scale increases:
- row height, channel-identity rail width and time-axis height grow;
- programme titles keep priority while the secondary programme-time line is dropped in the denser large-text mode;
- channel names stay on one line with ellipsis rather than splitting in the middle of a word;
- day and `Nu` controls retain at least 44 logical points of touch height;
- channel identity is structurally ready for logo-first presentation with an accessible text fallback.

The deterministic fixture intentionally remains text-only. This increment validates layout behaviour, not real logo design or logo licensing.

No accepted scroll physics, timeline semantics, detail dismissal thresholds or native modal animation were changed.

## Verification evidence
- PR #3 exact head `4c67e6cfc369e0b0f54c93ecd26bfc457336f631`: **CI #69 succeeded**, including install, TypeScript, lint, tests and iOS/Android/web Expo bundle exports.
- PR #3 merged to main as `da61b3cf10f8bf79e552f2b3eacdb289439810ce`: **main CI #70, run `34743172096`, succeeded** with the same quality/bundle gates.
- Pure tests verify default geometry, larger-scale growth, accessibility-sized continued growth and invalid-font-scale fallback.
- React integration mocks were updated for `useWindowDimensions`/Image without weakening the existing Guide/detail render-isolation and dismissal checks.
- These automated checks are not native visual, screen-reader or touch tests.

Earlier accepted evidence remains:
- standard platform scroll inertia, bounce, continuous day navigation and animated `Nu`: qualitative iPhone acceptance;
- detail response, close button and backdrop dismissal: qualitative iPhone acceptance;
- downward swipe dismissal and short-drag return/reopen change set: qualitative iPhone acceptance;
- dark-mode Guide/detail screenshots: visually usable base with concrete open readability findings recorded in `DEVICE_TEST_REPORT.md`.

Do not retune those accepted interaction baselines without a concrete regression.

## Open Phase 1 work
- **Physical larger-text validation is still required.** No device result exists yet for the new Dynamic Type layout.
- Confirm Totaal remains readable/aligned at a materially enlarged iPhone system-text setting and that programme detail content plus `Sluiten` remain reachable.
- ProgrammeDetail still has no internal ScrollView. Add one only if reachability evidence requires it, then coordinate it with swipe-to-dismiss rather than allowing reading-scroll to dismiss the sheet.
- The screenshot finding where the leading portion of a partly off-screen programme title/time disappears behind the fixed channel rail remains open; the Dynamic Type increment did not claim to solve it.
- Theme switching during use, screen-reader navigation, formal contrast checking, short-cell/metadata fallbacks and current-time/progress correctness remain to be validated explicitly.
- Android gesture/back-button tests and release-like device performance remain open; JS bundle export does not replace them.
- Finite launch-anchored fixture lifecycle across resume-after-midnight/expiry remains open.
- CI still generates a lockfile before `npm ci`; reproducibility cleanup and previously reported moderate npm advisories require deliberate work. Do not force-upgrade.
- Per zender and today-only Nu & Straks need explicit subsequent build increments after the current Phase 1 accessibility gate.
- Production EPG/logo/artwork rights and reliability, exact price/trial/paywall and final visual design are later gates.

No real EPG, production artwork, accounts or subscriptions have been introduced.

## EXACT NEXT STEP
**Validate the merged Dynamic Type increment on the same iPhone at a materially larger system-text setting: update the local checkout, reopen the app, inspect Totaal alignment/readability and open a programme detail to verify all content and `Sluiten` remain reachable. Record only concrete observations. If detail content is unreachable, the next implementation must add coordinated detail scrolling without changing the accepted Guide scroll or dismissal feel.**

Owner checkout: `~/projects/teevee`. For this appcode increment, stop Metro with Control+C, run `git pull --ff-only`, then `npm run start:clean` and reopen Expo Go. GitHub commits do not automatically update the local checkout.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.
