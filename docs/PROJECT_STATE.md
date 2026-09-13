# Teevee — Canonical Project State

Last updated: 2026-09-13 15:00 CEST.
Status: ACTIVE — Phase 1 Guide prototype. The Guide scroll/readability baseline (PR #9 + PR #11, with PR #12 historical stale-state correction) and PR #13 VoiceOver/live-theme behaviour are physically accepted. PR #14 materially improved post-horizontal-scroll Programme Detail response on iPhone but did not eliminate the remaining gap versus a still Guide. PR #15 removes the remaining redundant settled-readability full-grid rerenders; it is merged on `main` as `48e54008d8925fe4533bdbfd44f8639c63e645bc` after fully green PR CI #168 / run `34758480218`, pending one focused iPhone A/B latency validation.
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
- Deterministic fixtures keep core development and tests independent of external services.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility and system text scaling are product-quality requirements.
- PROJECT_STATE is canonical cross-session memory; complexity requires evidence.

Relevant ADRs: `0001` through `0004` in `docs/decisions/`.

## Guide presentations
The implemented runtime presentation is **Totaal**. Two additional accepted presentations are specified but not yet implemented:
- **Per zender:** one channel's scrollable schedule; the horizontal channel-icon bar remains available; horizontal swipe may move to the previous/next channel while preserving the viewed time anchor where practical.
- **Nu & Straks:** compact all-channel list around one shared reference time today; moving the selector pins a past/future time and `Nu` restores live mode.

One Guide destination with a locally remembered presentation preference remains the working proposal. No new primary tabs are authorised.

## Owner-approved visual/UX baseline — 13 September 2026
- Premium utility, restrained chrome, open schedule canvas.
- Söhne preferred typography direction, subject to production licensing/technical verification.
- Near-white light canvas; dark-anthracite dark canvas; red used sparingly for selected/current/primary-action emphasis.
- Channel logo primary, channel name secondary/contextual.
- **Totaal:** horizontal time / vertical channels; restrained current-time marker; no low-value cell metadata.
- **Per zender:** sticky horizontal channel-logo strip; vertical day list; horizontal swipe to adjacent channel; direct logo tap; contextual `Primetime`/`Nu`.
- **Nu & Straks:** today-only shared reference time; programme at that instant plus three following programmes per channel; no progress bars/genres/artwork/chevrons/`Daarna` labels.
- **Programme Detail:** direct from Guide; current-phase actions `Herinner mij` + `Bewaar`; no share/overflow/calendar/recommendation controls; one-handed sticky action copy may appear once canonical actions scroll away.
- Larger system text may reduce density/reflow rather than clip.
- Tonight/Vanavond remains promising but provisional.

Detailed rules live in `docs/UX.md`, `docs/DESIGN_SYSTEM.md`, `docs/PRODUCT.md` and `docs/BUILD_SPEC.md`.

## Current accepted implementation baseline
- Teevee-owned `Channel`, `Programme` and `GuideFixture` types.
- 48 synthetic channels and 49 elapsed hours of deterministic runtime-aligned data.
- Amsterdam calendar helpers with DST/23-hour/25-hour/year-rollover tests.
- Totaal uses one continuous horizontal timeline with half-hour ticks, duration-based programme blocks, current-time line and programme progress.
- Fixed channel rail plus synchronised vertical movement; native bounce/directional lock and `normal` deceleration.
- Programme Detail selection is isolated from the heavy Guide render. Native Modal slide, button close, outside-tap close and deliberate swipe-down dismissal remain accepted.
- Optional `Channel.logoUrl`; target treatment is logo first, channel name second, with textual fallback.
- Totaal adapts content geometry to larger system text; tested iPhone large-text corrections are accepted.
- **Vandaag · Morgen · Nu** remain on one row; compact labels cap scaling at 1.2x. Explicit day state updates immediately; `Nu` restores today/current time.
- PR #9 live partial-left programme readability is physically accepted through drag, momentum, settle and programme boundaries; only 48 edge rows carry live animated geometry.
- PR #11 single left-edge mask is physically accepted for time-axis clipping; departing labels disappear whole while tick coordinates stay truthful.
- PR #12 historically corrected stale settled-readability state during reverse scrolling. PR #15 retires that entire settled-readability React-state path from `GuideView`; PR #9 now owns partial-left readability continuously.
- PR #13 screen-reader semantics are physically accepted: duplicated channel/time rails are excluded, programme buttons announce channel + title + begin/end time, current programmes add `nu bezig`, and Programme Detail closes with VoiceOver accessibility escape/two-finger scrub.
- PR #13 live system-theme behaviour is physically accepted on iPhone: Guide, Programme Detail and status-bar treatment follow system light/dark changes without app restart.
- PR #14 keeps horizontal per-frame `scrollX` work on the UI thread and bridges day state only when needed; physical testing confirms a clear response improvement after horizontal flings.
- PR #15 removes the remaining `readabilityViewportX` state and the full Guide rerenders formerly triggered at horizontal finger-up/momentum settle. Underlying programme text stays on true programme geometry; PR #9 supplies the visible left-edge title.
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
- PR #13 VoiceOver traversal/labels and live system-theme response.

The product owner previously described targeted scroll/detail/swipe-dismiss retests as **"perfect"**. New evidence only reopens **Programme Detail response latency immediately after horizontal movement**; it does not reopen the accepted native scroll physics, geometry or detail gesture behaviour.

## Recovery history that constrains implementation
- **PR #6 — physically rejected:** >1000 per-programme Reanimated styles produced a white screen/iPhone crash despite green CI. Do not reintroduce that high-volume worklet architecture unchanged.
- **PR #8 — physically rejected:** React-state edge overlay lagged behind native ScrollView during drag/momentum and could cover successor content.
- **PR #9 — physically accepted/frozen:** only 48 small edge rows use live UI-thread geometry; old edge rows stop drawing at their real programme end.
- **PR #10 — physically rejected:** per-tick Reanimated opacity still left a `30` time-label fragment. Do not restore it.
- **PR #11 — physically accepted/frozen:** one fixed UI-thread left-edge mask makes departing time labels disappear whole.
- **PR #12 — physically accepted historical correction:** prevented stale settled viewport positions from blanking programme text during reverse scroll. Its settled state is now removed by PR #15 rather than retained as a second readability system.

## Physical evidence — 14:28 accessibility/theme recording
`ScreenRecording_09-13-2026 14-28-46_1.MP4` plus the owner's written VoiceOver observation closes PR #13 physically:
- traversal order is correct;
- programme is spoken as channel + title + begin/end time;
- VoiceOver two-finger scrub closes Programme Detail;
- Guide and Programme Detail follow live light/dark system changes without reload.

The same session exposed post-horizontal-scroll Programme Detail latency. Sampled openings showed roughly 0.7–0.9 s between press feedback and visible modal presentation after recent horizontal movement.

## PR #14 — remove per-frame horizontal JS bridge
PR #14 removed `scheduleOnRN(...)` from every horizontal `onScroll` frame while retaining UI-thread `scrollX` for PR #9/PR #11. `Vandaag/Morgen` is derived on the UI thread and bridges only when the actual day changes.

Technical evidence:
- PR head `33bcb83381f575a0f1a22cc4a571f4325a957582` passed PR CI #163 / `34757663408` completely;
- merged as `e7f45a04544106803b2f49fe4e086d304bf061c8`;
- exact merged code passed main CI #164 / `34757796962` completely.

### Physical result — 14:49
Owner feedback plus `ScreenRecording_09-13-2026 14-49-22_1.MP4` establishes:
- tapping just after a horizontal fling is **clearly faster than before PR #14**;
- it is still not as fast as tapping after the Guide has been still for about two seconds;
- after a **vertical** fling, Programme Detail opens as fast as in the still case;
- manual Vandaag→Morgen transition remains correct.

Conclusion: **PR #14 is physically validated as a material improvement, but it did not fully close the latency objective.** The vertical control strongly isolates the remaining cost to horizontal settle work rather than general Modal/Pressable performance.

## PR #15 — remove settled-readability full-grid rerenders
Code audit after the 14:49 evidence found a second horizontal-only cost:
- legacy PR #5 `readabilityViewportX` React state was still updated at `onEndDrag` and again at `onMomentumEnd`;
- each update rerendered the realistic 48-channel / >1000-programme-cell Guide;
- PR #9 already provides partial-left readability continuously, including after movement settles, making this state redundant.

PR #15 therefore:
- removes `readabilityViewportX` and all setters from `GuideView`;
- removes the horizontal `onEndDrag` JS callback completely;
- leaves `onMomentumEnd` only as a lightweight final day-state check;
- renders underlying programme text against the programme's real frame width; PR #9 handles the visible partial-left copy;
- does **not** change native inertia/bounce/directional lock, programme `left`/`width`, PR #9 overlay, PR #11 mask, PR #14 UI-thread scroll path, Programme Detail or vertical synchronisation.

Technical evidence:
- PR head `bf743618b3d062d8771d220fc94ae9f99cc01c87` passed PR CI #168 / run `34758480218` completely: install, strict TypeScript, lint, tests and iOS/Android/web Expo exports;
- PR #15 merged to main as `48e54008d8925fe4533bdbfd44f8639c63e645bc`.

**PR #15 is technically accepted; physical latency/regression validation is pending.**

## Remaining Phase 1 work
- focused physical iPhone validation of PR #15 post-horizontal-scroll Programme Detail response and PR #9/PR #11 visual regressions;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup; previously reported 15 moderate advisories require deliberate review, never `npm audit fix --force`;
- later explicit builds for Per zender and Nu & Straks;
- production EPG/logo/artwork rights/reliability, pricing/trial/paywall, production tokens/font licensing and final Tonight composition remain later gates.

## EXACT NEXT STEP
**On the same iPhone, pull current `main` and restart Metro cleanly. Make one short A/B recording: (A) give the time axis a strong horizontal fling and tap a programme as soon as it is practically tappable after the movement; close Detail; (B) leave the Guide fully still for about two seconds and tap another programme. Confirm whether the start of Programme Detail now feels practically equal in A and B. During the horizontal movement/settle, also confirm the PR #9 partial-left programme title still behaves naturally and the PR #11 time axis shows no chopped `:30`/`30` fragment. Vandaag→Morgen does not need another dedicated retest because the 14:49 device test already passed it, unless a spontaneous regression appears.**

Owner checkout: `~/projects/teevee`. Test with: stop Metro using Control+C, run `git pull --ff-only`, then `npm run start:clean`, and reopen Expo Go.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.
