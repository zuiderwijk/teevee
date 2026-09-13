# Teevee — Canonical Project State

Last updated: 2026-09-13 09:34 CEST (Europe/Amsterdam). Exact commit time is in GitHub.
Status: ACTIVE — accepted iPhone scroll/detail and large-text baselines remain intact; live partial-left programme readability plus one-row Guide controls are integrated and technically green; one focused iPhone retest remains
Current phase: **Phase 1 — Guide Interaction Prototype**
Previous phase: **Phase 0 — Project Foundation: COMPLETE**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository.

## Product
Teevee is a premium, paid, ad-free television-guide app for iOS and Android under Bindinc/TVgids.nl supervision. The Guide is the product: fast, calm, reliable and polished. Netherlands first; no mandatory account for core Guide use.

## Frozen decisions
- React Native/Expo and strict TypeScript for iOS and Android.
- Paid, ad-free and Guide-first; no mandatory core-use account.
- Light, dark and system appearance.
- Provider-independent Teevee EPG model; mobile never consumes/parses an external EPG directly.
- Deterministic fixtures mandatory; free external EPG remains development-only until rights/reliability are approved.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility and system text scaling are product-quality requirements, not optional polish.
- PROJECT_STATE is canonical cross-session memory. Complexity requires evidence.

Relevant ADRs: `0001` through `0004` in `docs/decisions/`.

## Guide presentations
The current implemented grid is **Totaal**. Two additional Guide presentations are specified but not yet implemented:

- **Per zender:** one channel's scrollable schedule, initially around the current programme; channel navigation primary, date navigation secondary.
- **Nu & Straks:** compact all-channel list around one common reference time. There is **no date selector**. A horizontal time selector moves within the current Amsterdam calendar day. Entry starts in live/current mode; `Nu` restores live mode. Moving the selector pins a past/future time today without calling that snapshot live.

For Nu & Straks, every channel resolves `startAt <= referenceTime < endAt`, followed by the next scheduled programme(s). Keep channel order and vertical reading position stable while the selected time changes. Show gaps honestly. The selector itself does not cross into tomorrow, although a following programme may start after midnight with an explicit day indication. An accessible non-drag alternative is required.

One Guide destination with a locally remembered presentation preference remains the working proposal. Exact selector placement, first-install default, and one versus two following programmes remain open. No new primary tabs are authorised. Popularity of a presentation and frequency of switching are hypotheses, not validated research.

## Current implementation reality
- Expo SDK 57 / Expo Router / strict TypeScript with semantic system-aware themes.
- Teevee-owned Channel, Programme and GuideFixture types.
- 48 synthetic channels and 49 elapsed hours of deterministic runtime-aligned data.
- Shared Amsterdam calendar helpers with DST/23-hour/25-hour/year-rollover tests.
- Totaal uses one continuous horizontal timeline with half-hour ticks, duration-based programme blocks, current-time line and programme progress.
- Fixed channel rail plus synchronised vertical movement; native bounce/directional lock and `normal` deceleration on both axes.
- Totaal primary time navigation is one fixed row: **Vandaag · Morgen · Nu**. `Morgen` is the compact visual label; its accessibility label includes the actual next-day date.
- Explicitly tapping Vandaag or Morgen updates the selected/active state immediately before the animated time jump. Manual horizontal browsing still lets the active day follow the visible timeline.
- Only the compact `Vandaag`, `Morgen` and `Nu` labels cap Dynamic Type at `maxFontSizeMultiplier=1.2` to preserve all three controls on one row. Guide content, channel/programme identity and time geometry continue to adapt to larger system text.
- Programme detail selection is isolated from the heavy Guide render. The existing native Modal slide, button close, outside-tap close and swipe-down dismissal remain the accepted baseline.
- Optional `Channel.logoUrl` exists. Channel identity is logo-first when a suitable asset exists, while the channel name remains visible/accessible and is the fallback when the logo is absent or fails. Current fixtures deliberately contain no real logos.
- Totaal adapts its content geometry to Dynamic Type: row/channel/time-axis geometry expands with font scale and compact cells reduce secondary metadata at larger sizes.
- Programme text has a viewport-aware readability treatment. The actual programme frame remains fixed to real start and duration, while the inner title/time content repositions and constrains itself to the visible remainder when its left side moves behind the fixed channel rail.
- As of PR #6, that inner programme content follows the horizontal viewport **continuously during drag and momentum**, rather than jumping only after release. A start time is hidden once there is no room to show it completely.
- CI runs install, strict TypeScript, lint, tests and iOS/Android/web Expo bundle exports. Bundle export is not a signed device build.

No real production EPG, production artwork, account system or subscription/paywall has been introduced.

## Accepted interaction baselines
Do not retune these without a concrete regression:
- standard platform scroll inertia on both axes;
- native bounce and directional lock;
- continuous timeline/day navigation and animated `Nu`;
- programme-detail response and retained Guide position;
- close by button and outside tap;
- deliberate swipe-down dismissal with short/cancelled drag returning to position.

The product owner previously described the targeted scroll, detail-response and swipe-dismiss retests as **"perfect"**. Those are qualitative iPhone confirmations, not performance measurements or blanket accessibility approval.

## Larger-text iPhone validation — accepted
The first larger-text physical test at 08:44 confirmed row alignment and detail reachability, but exposed clipped Guide chrome. PR #4 corrected it without changing accepted scroll/dismissal behaviour.

The corrected-build screenshot at **08:59** on the same materially enlarged system-text setting showed `Gids`, `Nu`, both day labels and the time axis fully readable, with channel/programme rows still aligned. This closed the targeted large-text/chrome increment on the tested iPhone.

Because the tested detail content remained reachable at large text, **do not add an internal ProgrammeDetail ScrollView solely on this evidence**. Revisit coordinated reading-scroll versus swipe-dismiss only when real long content proves it necessary.

A blue floating gear control overlaps the Guide in screenshots, but its origin remains unverified and it is not treated as Teevee product chrome.

## 09:20 iPhone evidence and PR #6 correction
The iPhone retest of PR #5 produced three concrete findings:
- the geometry-safe programme-content treatment only re-anchored after the swipe was released; the product owner requires the visible title to follow continuously while swiping;
- after an explicit Today/next-day tap, the black selected-day styling did not update reliably/immediately;
- the product owner requires the three primary time-navigation controls to remain on **one row**, with **Morgen** instead of the weekday/date as the compact visual label. Their label font may be locally bounded rather than forcing this small control row to reflow vertically.

PR #6 implements those corrections while preserving programme geometry and the accepted scroll settings:
- the existing scroll-event stream writes viewport x directly to a Reanimated shared value; animated inner programme content follows that value during drag and momentum without putting viewport x into React state on every frame;
- actual programme `left` and duration-based `width` never move;
- the start-time sublabel is live-suppressed when the remaining visible width cannot show it completely;
- explicit day taps set the active state immediately and guard against temporary scroll-driven flips during the animated jump;
- `Vandaag`, `Morgen`, `Nu` render in one horizontal row; only these compact labels use a 1.2x max font multiplier.

Technical verification:
- the first PR #6 run, **CI #91 / run `34745304913`**, reached successful typecheck/lint but failed two integration tests because the first implementation added `useAnimatedScrollHandler` without extending the existing Reanimated test mock. No quality gate was disabled.
- the implementation was simplified to the existing RN scroll event path plus a Reanimated shared value.
- final PR #6 head **`fd80c4d66cb6bab2b57f39f7ca12104fe9b419ce`** passed **CI #92 / run `34745389220`**, including install, typecheck, lint, tests and iOS/Android/web exports.
- PR #6 merged to main as **`dd01a36055e4f2f7841d4a1b9ecf8461e3820002`**.
- exact main merge **CI #93 / run `34745481415` completed successfully**, including install, typecheck, lint, tests and iOS/Android/web exports.

CI proves code/build integrity only. The continuous-motion behaviour, one-row controls and immediate selected-day response still require the focused iPhone retest below.

## Remaining Phase 1 work
Still open after this increment:
- one focused iPhone retest of PR #6 live title movement + one-row controls + selected-day response;
- VoiceOver/screen-reader behaviour and live theme switching;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- long-fling/render-load instrumentation if performance becomes suspect;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup: workflow still generates a lockfile before `npm ci`; previously reported 15 moderate advisories need deliberate review, never `npm audit fix --force`;
- subsequent explicit build increments for Per zender and today-only Nu & Straks;
- production EPG/logo/artwork rights/reliability, price/trial/paywall and final visual design are later gates.

## EXACT NEXT STEP
**Retest main `dd01a36055e4f2f7841d4a1b9ecf8461e3820002` or newer on the same iPhone and enlarged-system-text setting. During horizontal drag and momentum, confirm that a programme whose real left edge disappears behind the fixed channel rail has its title move continuously into the visible remainder without the programme block itself moving or changing width. Confirm that `Vandaag`, `Morgen` and `Nu` remain on one row; tapping `Morgen` must make it selected/black immediately, tapping `Vandaag` must do the same, and `Nu` must return to today/current time. Report any new horizontal-scroll jumpiness. One settled screenshot plus yes/no on continuous title movement and selected-day response is sufficient.**

Owner checkout: `~/projects/teevee`. To test: stop Metro with Control+C, run `git pull --ff-only`, then `npm run start:clean` and reopen Expo Go.

Do not introduce real EPG, subscriptions, accounts, Tonight, enrichment or specialised Guide virtualisation in this validation step.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.