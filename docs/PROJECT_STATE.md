# Teevee — Canonical Project State

Last updated: 2026-09-13 08:55 CEST (Europe/Amsterdam). Exact commit time is in GitHub.
Status: ACTIVE — iPhone interaction baselines accepted; large-text defect correction integrated and technically green; one focused iPhone retest remains before closing this accessibility increment
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

## Latest larger-text device evidence — 13 September 2026, 08:44 screenshot
The product owner tested the first Dynamic Type increment on the same iPhone with system text materially larger than normal. Exact local SHA, iPhone model, iOS version and Expo Go version are still not independently recorded.

Reported results:
- **zenderkolom/programmarijen blijven uitgelijnd:** `Ja`;
- **programmadetail blijft bereikbaar inclusief `Sluiten`:** `Ja`;
- the supplied screenshot showed a concrete large-text defect in Guide chrome: the large `Gids` heading was visibly clipped and the day labels were ellipsized (`Van...`, `Ma 1...`). The time axis/chrome also remained too horizontally dense for that font scale.

Because detail content remained reachable, **do not add an internal ProgrammeDetail ScrollView solely on the basis of this test**. Revisit coordinated reading-scroll versus swipe-dismiss only when real long content proves it necessary.

## Large-text correction integrated
The screenshot defect was addressed in PR #4 without changing accepted scroll or dismissal behaviour:
- scalable heading/programme text no longer uses fixed line-height boxes that can clip enlarged glyphs;
- from large-text mode onward, header/day controls receive their own width rather than competing horizontally;
- horizontal minute density and time-label room increase gradually with system font scale;
- programme geometry, current-time calculations, day jumps and visible-time calculations all use the same font-scale-dependent minute width;
- the 100% font-scale geometry remains the accepted baseline.

Verification:
- PR #4 exact head **`536de5b778725d2f91dba3f734c4efecd8d78028`** passed **CI #74, run `34743728065`**, including install, typecheck, lint, tests and iOS/Android/web exports.
- PR #4 merged to main as **`4f4fa94c6b1968ca03bb551fde9bb7ed376b2113`**.
- Main **CI #75, run `34743812493`, completed successfully** for that exact merge SHA with the same gates.

CI validates code/build integrity, not the resulting large-text layout on a physical iPhone.

## Remaining Phase 1 work
Still open after this increment:
- one focused iPhone retest of the corrected large-text Guide chrome;
- partially horizontally hidden programme content behind the fixed channel rail remains a separate readability issue and is not declared solved by this increment;
- VoiceOver/screen-reader behaviour and live theme switching;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- long-fling/render-load instrumentation if performance becomes suspect;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup: workflow still generates a lockfile before `npm ci`; previously reported moderate advisories need deliberate review, never `npm audit fix --force`;
- subsequent explicit build increments for Per zender and today-only Nu & Straks;
- production EPG/logo/artwork rights/reliability, price/trial/paywall and final visual design are later gates.

## EXACT NEXT STEP
**Retest the merged large-text correction on the same iPhone at the same materially enlarged system-text setting: confirm that `Gids`, `Nu`, both day labels, the time axis and programme titles are fully readable while zender/programme alignment and detail reachability remain intact. Report only concrete regressions; do not reopen the accepted scroll or dismissal tuning without evidence.**

Owner checkout: `~/projects/teevee`. To test this appcode increment: stop Metro with Control+C, run `git pull --ff-only`, then `npm run start:clean` and reopen Expo Go.

Do not introduce real EPG, subscriptions, accounts, Tonight, enrichment or specialised Guide virtualisation in this validation step.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.
