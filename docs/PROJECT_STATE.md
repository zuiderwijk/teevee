# Teevee — Canonical Project State

Last updated: 2026-09-13 14:42 CEST.
Status: ACTIVE — Phase 1 Guide prototype. The Guide scroll/readability baseline (PR #9 + PR #11 + PR #12) and PR #13 VoiceOver/live-theme behaviour are physically accepted. PR #14 removes the per-frame horizontal UI→JS bridge implicated in post-scroll Programme Detail latency; it is merged on `main` as `e7f45a04544106803b2f49fe4e086d304bf061c8`, technically green on PR CI #163 and exact-main CI #164, pending one focused iPhone latency validation.
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
- Deterministic fixtures keep core development independent of external services.
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
- PR #9 live partial-left programme readability is physically accepted through drag, momentum and programme boundaries.
- PR #11 single left-edge mask is physically accepted for time-axis clipping; departing labels disappear whole while tick coordinates stay truthful.
- PR #12 is physically accepted for strong forward/reverse movement; titles remain rendered and PR #9/PR #11 remain intact.
- PR #13 screen-reader semantics are physically accepted: duplicated channel/time rails are excluded, programme buttons announce channel + title + begin/end time, current programmes add `nu bezig`, and Programme Detail closes with VoiceOver accessibility escape/two-finger scrub.
- PR #13 live system-theme behaviour is physically accepted on iPhone: Guide, Programme Detail and status-bar treatment follow system light/dark changes without app restart.
- PR #14 keeps horizontal per-frame `scrollX` work on the UI thread. JS is contacted only for real day-boundary changes and drag/momentum settle events; this is technically accepted but still needs the targeted latency device check.
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
- PR #12 settled-readability stale-state correction for reverse scrolling;
- PR #13 VoiceOver traversal/labels and live system-theme response.

The product owner previously described targeted scroll/detail/swipe-dismiss retests as **"perfect"**. New evidence in the 14:28 recording qualifies only the **post-horizontal-scroll Programme Detail response latency**; it does not reopen the accepted native scroll physics or detail gesture behaviour.

## Recovery history that constrains implementation
- **PR #6 — physically rejected:** >1000 per-programme Reanimated styles produced a white screen/iPhone crash despite green CI. Do not reintroduce that high-volume worklet architecture unchanged.
- **PR #8 — physically rejected:** React-state overlay lagged behind native ScrollView during drag/momentum and could cover successor content.
- **PR #9 — physically accepted/frozen:** only 48 small edge rows use live UI-thread geometry; old edge rows stop drawing at their real programme end.
- **PR #10 — physically rejected:** per-tick Reanimated opacity still left a `30` time-label fragment. Do not restore it.
- **PR #11 — physically accepted/frozen:** one fixed UI-thread left-edge mask makes departing time labels disappear whole.
- **PR #12 — physically accepted/frozen:** stale settled viewport positions no longer blank programme text during reverse scrolling.

## Physical evidence — 14:28 accessibility/theme recording
`ScreenRecording_09-13-2026 14-28-46_1.MP4` (43.75 s, 1170×2532) plus the owner's written VoiceOver observation closes PR #13 physically:
- traversal order is reported as correct;
- a programme is spoken as channel + title + begin/end time (owner example: `NPO 1, titel, 14:00 tot 15:00`);
- VoiceOver two-finger scrub closes Programme Detail;
- frame review shows live light → dark → light changes while Teevee remains open;
- an Appearance change while Programme Detail is open updates the presented interface and status-bar treatment without reload.

The same session exposes a performance regression/latent bottleneck: after horizontal time scrolling, tapping a programme feels materially slower than the same action after the Guide has been still. In sampled openings in the recording, press feedback precedes visible modal presentation by roughly 0.7–0.9 seconds after recent horizontal movement.

## PR #14 — remove per-frame horizontal JS bridge
Root-cause hypothesis supported by code architecture:
- horizontal `scrollEventThrottle={16}` previously updated the UI-thread `scrollX` **and** called `scheduleOnRN(handleHorizontalScroll, viewportX)` every scroll frame;
- Programme Detail selection/React state also runs on JS;
- a fling could therefore leave frequent scroll-to-JS work competing with a programme tap even after native movement visually settled.

PR #14 changes only that bridge pattern:
- horizontal `onScroll` updates `scrollX` on the UI thread and does not schedule JS work per frame;
- a lightweight `useAnimatedReaction` derives `Vandaag/Morgen` on the UI thread and bridges only when the actual day boundary changes;
- `onEndDrag` and `onMomentumEnd` still bridge once for settled readability/end-state synchronisation;
- explicit `Vandaag`, `Morgen` and `Nu` actions still update React state immediately;
- native inertia, bounce, directional lock, `decelerationRate`, programme geometry, PR #9, PR #11, PR #12, Programme Detail animation/gesture code and vertical synchronisation are unchanged;
- `guideDayOffsetForViewport` has threshold regression tests.

Technical evidence:
- PR head `33bcb83381f575a0f1a22cc4a571f4325a957582` passed PR CI #163 / run `34757663408` completely;
- PR #14 merged to main as `e7f45a04544106803b2f49fe4e086d304bf061c8`;
- exact merged code passed main CI #164 / run `34757796962` completely.

**PR #14 is technically accepted but not yet physically accepted for the latency objective.**

## Remaining Phase 1 work
- focused physical iPhone validation of PR #14 post-scroll Programme Detail latency;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup; previously reported 15 moderate advisories require deliberate review, never `npm audit fix --force`;
- later explicit builds for Per zender and Nu & Straks;
- production EPG/logo/artwork rights/reliability, pricing/trial/paywall, production tokens/font licensing and final Tonight composition remain later gates.

## EXACT NEXT STEP
**On the same iPhone, pull current `main` and restart Metro cleanly. Make one short screen recording that compares the two cases directly: (A) give the time axis a clear horizontal fling and, as soon as a programme is tappable after the movement, tap it; close Detail; (B) leave the Guide completely still for about 2 seconds and tap another programme. Confirm that Programme Detail now starts opening with no obvious extra delay in case A versus B. Also cross the Vandaag→Morgen boundary once by manual horizontal scrolling and confirm the selected day still changes correctly. Do not retune/retest general scroll feel unless a spontaneous regression appears.**

Owner checkout: `~/projects/teevee`. Test with: stop Metro using Control+C, run `git pull --ff-only`, then `npm run start:clean`, and reopen Expo Go.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.
