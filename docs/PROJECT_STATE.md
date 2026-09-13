# Teevee — Canonical Project State

Last updated: 2026-09-13 09:12 CEST (Europe/Amsterdam). Exact commit time is in GitHub.
Status: ACTIVE — iPhone interaction and large-text baselines accepted; geometry-safe partial-left programme readability is integrated and technically green; one focused iPhone retest remains
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
- Day buttons and `Nu` move within the same timeline; active day follows horizontal position.
- Programme detail selection is isolated from the heavy Guide render. The existing native Modal slide, button close, outside-tap close and swipe-down dismissal remain the accepted baseline.
- Optional `Channel.logoUrl` exists. Channel identity is logo-first when a suitable asset exists, while the channel name remains visible/accessible and is the fallback when the logo is absent or fails. Current fixtures deliberately contain no real logos.
- Totaal adapts to Dynamic Type: row/channel/time-axis geometry expands with font scale and large-text chrome stacks so primary controls remain readable.
- Programme text now has a separate viewport-aware readability treatment: after horizontal drag/momentum settles, title/start-time content can shift inside the unchanged programme block to the visible remainder when the programme's real start lies left of the viewport. The programme frame itself never moves or changes duration; start time is suppressed if the remaining visible width is too small to show it completely.
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
The first larger-text physical test at 08:44 confirmed row alignment and detail reachability, but exposed clipped Guide chrome: `Gids` was cut off and day labels were ellipsized. PR #4 corrected the scoped layout problem without changing accepted scroll or dismissal behaviour.

The product owner then supplied a corrected-build screenshot at **08:59** on the same materially enlarged system-text setting. Physical visual evidence now shows:
- `Gids` fully visible;
- `Nu` fully visible;
- `Vandaag` and `Ma 14 Sep` fully readable;
- time-axis labels (`08:30`, `09:00`, `09:30`) fully readable;
- channel rail and programme rows still aligned;
- programme-title typography no longer vertically clipped by the former fixed line-height boxes.

This closes the targeted large-text/chrome increment on the tested iPhone.

Because the tested detail content remained reachable at large text, **do not add an internal ProgrammeDetail ScrollView solely on this evidence**. Revisit coordinated reading-scroll versus swipe-dismiss only when real long content proves it necessary.

A blue floating gear control overlaps the Guide in the screenshots, but its origin remains unverified and it is not treated as Teevee product chrome.

## Partial-left programme readability — integrated, device retest pending
The 08:59 screenshot also re-confirmed the separate pre-existing issue where the beginning of a programme title disappears when the programme starts left of the currently visible horizontal viewport.

PR #5 implements a constrained treatment without falsifying EPG geometry:
- `programmeFrame` remains the source of the real programme left position and duration-based width;
- a pure `programmeVisibleContent` helper calculates only the hidden-left amount and remaining readable width for inner content;
- after user drag/momentum ends, text is translated within the same clipped programme block so the title can start inside the visible remainder;
- text width is constrained to that visible remainder so ellipsis is honest rather than hard-clipped by the programme edge;
- a start-time label is hidden when the remaining visible width is below the threshold required to show it completely;
- the programme accessibility label still contains full title, start time and end time;
- readability position is not stored on every scroll frame, avoiding a full heavy-Guide re-render at scroll frequency.

Technical verification:
- PR #5 exact head **`de308881e102b40d4f7739944b32c0c5e9e22888`** passed **CI #86, run `34744460640`**, including install, typecheck, lint, tests and iOS/Android/web exports.
- PR #5 merged to main as **`1e8aa125819472eb6ac76b0a41c0243973c4a003`**.
- Main **CI #87, run `34744549991`, completed successfully** for that exact merge SHA with the same gates.

This is technically green but **not yet physically accepted**. The device check must confirm the settled visual behaviour and that no perceived scroll regression was introduced.

## Remaining Phase 1 work
Still open after this increment:
- one focused iPhone retest of a programme whose real left edge sits behind the fixed channel rail;
- VoiceOver/screen-reader behaviour and live theme switching;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- long-fling/render-load instrumentation if performance becomes suspect;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup: workflow still generates a lockfile before `npm ci`; previously reported moderate advisories need deliberate review, never `npm audit fix --force`;
- subsequent explicit build increments for Per zender and today-only Nu & Straks;
- production EPG/logo/artwork rights/reliability, price/trial/paywall and final visual design are later gates.

## EXACT NEXT STEP
**Retest main `1e8aa125819472eb6ac76b0a41c0243973c4a003` or newer on the iPhone. Horizontally scroll Totaal until at least one longer programme starts partly behind the fixed zenderrail, release the gesture and let momentum stop. Confirm that the programme block keeps its real geometry while its title becomes readable from the visible remainder; a start time must either be fully readable or absent, never shown as a clipped fragment. Also report any new jumpiness or regression in the already accepted horizontal scroll feel. One screenshot after scrolling has settled is sufficient.**

Owner checkout: `~/projects/teevee`. To test: stop Metro with Control+C, run `git pull --ff-only`, then `npm run start:clean` and reopen Expo Go.

Do not introduce real EPG, subscriptions, accounts, Tonight, enrichment or specialised Guide virtualisation in this validation step.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.