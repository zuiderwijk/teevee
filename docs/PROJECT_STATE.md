# Teevee — Canonical Project State

Last updated: 2026-09-13 10:35 CEST (Europe/Amsterdam). Exact commit time is in GitHub.
Status: ACTIVE — Phase 1 Guide prototype; PR #7 controls are physically accepted; PR #8 low-overhead live edge readability is integrated and technically green, pending one focused iPhone validation
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
The implemented grid is **Totaal**. Two additional Guide presentations are specified but not yet implemented:
- **Per zender:** one channel's scrollable schedule, initially around the current programme; channel navigation primary, date navigation secondary.
- **Nu & Straks:** compact all-channel list around one common reference time today; no date selector. Entry starts in live/current mode, moving the selector pins a past/future time today, and `Nu` restores live mode.

One Guide destination with a locally remembered presentation preference remains the working proposal. No new primary tabs are authorised.

## Current implementation reality
- Expo SDK 57 / Expo Router / strict TypeScript with semantic system-aware themes.
- Teevee-owned Channel, Programme and GuideFixture types.
- 48 synthetic channels and 49 elapsed hours of deterministic runtime-aligned data.
- Shared Amsterdam calendar helpers with DST/23-hour/25-hour/year-rollover tests.
- Totaal uses one continuous horizontal timeline with half-hour ticks, duration-based programme blocks, current-time line and programme progress.
- Fixed channel rail plus synchronised vertical movement; native bounce/directional lock and `normal` deceleration on both axes.
- Programme detail selection is isolated from the heavy Guide render. Native Modal slide, button close, outside-tap close and deliberate swipe-down dismissal remain the accepted baseline.
- Optional `Channel.logoUrl` exists. Target treatment is logo first, channel name second, with full accessible textual identity and text fallback.
- Totaal adapts content geometry to larger system text. The tested iPhone large-text chrome correction is accepted.
- Main shows **Vandaag · Morgen · Nu** on one row. Only these compact labels cap font scaling at 1.2x; Guide content itself continues to follow larger system text. Explicit Vandaag/Morgen selection updates immediately; `Nu` restores today/current time.
- PR #5 settled readability remains as fallback: when horizontal motion settles, text inside a partially hidden programme block can re-anchor to the visible remainder without changing its real `left` or duration-derived `width`.
- PR #8 adds a separate live edge-readability overlay. Horizontal/vertical viewport updates are coalesced to one overlay state update per animation frame; only visible channel rows plus small overscan render an edge mask. The heavy 48-channel Guide tree is not re-rendered per scroll frame and no new Reanimated/worklet path is used.
- The PR #8 overlay is pointer-transparent and removed from accessibility traversal; the underlying programme controls retain the full accessible title and times. The current-time line is repeated over the overlay so it is not visually hidden.
- CI runs install, strict TypeScript, lint, tests and iOS/Android/web Expo bundle exports. Bundle export is not a signed/native device test.

No real production EPG, production artwork, account system or subscription/paywall has been introduced.

## Accepted interaction baselines
Do not retune these without concrete regression evidence:
- standard platform scroll inertia on both axes;
- native bounce and directional lock;
- continuous timeline/day navigation and animated `Nu`;
- programme-detail response and retained Guide position;
- close by button and outside tap;
- deliberate swipe-down dismissal with short/cancelled drag returning to position;
- PR #7 one-row **Vandaag · Morgen · Nu** controls and immediate selected-day state.

The product owner previously described targeted scroll, detail-response and swipe-dismiss retests as **"perfect"**. PR #7 is also physically accepted for startup stability, one-row controls, immediate selected state, `Nu` return behavior and unchanged horizontal scroll feel. These are qualitative iPhone confirmations, not blanket accessibility/performance approval.

## Larger-text iPhone validation — accepted
The first materially enlarged system-text test exposed clipped Guide chrome. PR #4 corrected it. A follow-up screenshot at 08:59 showed `Gids`, `Nu`, day labels and time-axis labels fully readable, with channel/programme rows aligned and programme-title typography no longer vertically clipped.

The tested programme detail content plus `Sluiten` remained reachable at larger text, so no internal ProgrammeDetail ScrollView is justified solely by current evidence.

## 09:20 feedback and recovery history
The PR #5 retest established three requirements:
- a partial-left programme title should move continuously with horizontal drag/momentum rather than only re-anchor after release;
- explicit day selection should update its selected visual state immediately;
- **Vandaag · Morgen · Nu** should remain on one row, with bounded scaling allowed only for these compact labels.

PR #6 attempted all three using per-programme Reanimated animated styles. PR/main CI were green, but Expo Go showed a white screen followed by a physical iPhone crash. Main was rolled back with **`f7c9f73568341d29e518be21e0de071e4ef7877d`**, after which the product owner confirmed normal startup. The exact native crash cause is unproven; the high-volume per-programme animated/worklet setup remains the leading hypothesis and must not be reintroduced unchanged.

PR #7 safely reintroduced only the control requirements without new Reanimated/worklet logic. It merged as **`c697c4e7b9bb026409962f319d26cebad75a3a56`** and is fully physically accepted: startup normal, controls one row, selected state/`Nu` correct and horizontal scroll still natural.

## PR #8 — low-overhead live edge readability
PR #8 rebuilds only the remaining continuous partial-left title behavior with a different architecture:
- one isolated overlay for the programme viewport, rather than an animated style/worklet per programme;
- viewport changes are coalesced through `requestAnimationFrame` inside that small overlay;
- only visible rows plus one overscan row participate in live edge rendering;
- real programme start, duration, block position and block width remain untouched;
- PR #5 settled readability stays underneath as a fallback;
- Today/Morgen/Nu, scroll parameters, detail modal and dismissal behavior are not retuned.

New pure tests cover edge-programme selection, remaining visible width and visible-row windowing/clamping. The existing Guide integration suite also mounts the full 48-channel Guide with the overlay during its render/detail tests.

The first PR #8 CI run (#119 / `34747757890`) failed at strict TypeScript because this React Native typing exposes `StyleSheet.absoluteFill` rather than `absoluteFillObject`; no quality gate was disabled. The overlay was changed to explicit absolute bounds. Final PR head **`35282fffc558115f60eded7534c4eb03266cf4f7`** then passed PR CI #120 / `34747825150` completely: install, typecheck, lint, tests and iOS/Android/web exports.

PR #8 merged to main as **`1fbc4095ea50959f80a87db5db1f91905f46c2e2`**. Exact-main CI #121 / `34747935259` also passed all gates completely. This is technical evidence only; because PR #6 previously crashed despite green CI, PR #8 is not physically accepted until the focused iPhone test below.

## Remaining Phase 1 work
- physically validate PR #8 startup stability and title movement during drag/momentum without scroll/geometry regression;
- VoiceOver/screen-reader behaviour and live theme switching;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup; previously reported 15 moderate advisories require deliberate review, never `npm audit fix --force`;
- later explicit builds for Per zender and Nu & Straks;
- production EPG/logo/artwork rights/reliability, pricing/trial/paywall and final visual design are later gates.

## EXACT NEXT STEP
**On the same iPhone, pull main at `1fbc4095ea50959f80a87db5db1f91905f46c2e2` or newer and restart Metro cleanly. Confirm only: (1) Teevee opens normally; (2) while dragging horizontally, a title whose programme start moves behind the fixed channel rail remains readable at the left edge instead of waiting for release; (3) the same remains true during momentum after release; (4) the programme block itself does not jump/change width and horizontal scrolling still feels like the accepted baseline. Do not re-test already accepted Today/Morgen/Nu or detail behavior unless a regression is noticed.**

Owner checkout: `~/projects/teevee`. Test with: stop Metro using Control+C, run `git pull --ff-only`, then `npm run start:clean`, and reopen Expo Go.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.