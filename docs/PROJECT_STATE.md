# Teevee — Canonical Project State

Last updated: 2026-09-13 14:16 CEST.
Status: ACTIVE — Phase 1 Guide prototype. The Guide scroll/readability baseline (PR #9 + PR #11 + PR #12) is physically accepted and frozen. PR #13 hardens screen-reader semantics and proves live system-theme subscription in automated tests; it is merged on `main` as `a8651b26c2521b53d0077bbd499862c3b1b71ed2` after fully green PR CI #158 / run `34756492990`. One focused iPhone VoiceOver + live-theme gate remains.
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
- Programme detail selection is isolated from the heavy Guide render. Native Modal slide, button close, outside-tap close and deliberate swipe-down dismissal remain accepted.
- Optional `Channel.logoUrl`; target treatment is logo first, channel name second, with textual fallback.
- Totaal adapts content geometry to larger system text; tested iPhone large-text corrections are accepted.
- **Vandaag · Morgen · Nu** remain on one row; only these compact labels cap scaling at 1.2x. Explicit day state updates immediately; `Nu` restores today/current time.
- PR #5 settled readability is the geometry-safe fallback after horizontal movement settles, with PR #12 preventing a stale settled viewport from collapsing text during reverse scrolling.
- PR #9 live partial-left programme readability is physically accepted through drag, momentum and programme boundaries.
- PR #11 single left-edge mask is physically accepted for time-axis clipping; departing labels disappear whole while tick coordinates stay truthful.
- PR #12 is physically accepted for strong forward/reverse movement; titles remain rendered and PR #9/PR #11 remain intact.
- PR #13 hides duplicated visual rails from the accessibility tree and makes every programme button self-contained with channel + title + begin/end time + optional `nu bezig`, plus the hint `Opent programmadetails`.
- Programme Detail retains `accessibilityViewIsModal`, accessibility escape and an explicitly labelled close button.
- `useTeeveeTheme()` uses React Native `useColorScheme()`. Automated render coverage now proves one mounted component follows light → dark → light live and treats a null system scheme as light.
- CI runs install, strict TypeScript, lint, tests and iOS/Android/web Expo bundle exports. Bundle export is not a signed/native device test.

No real production EPG, production artwork, account system or subscription/paywall has been introduced.

## Frozen interaction baselines
Do not retune without concrete regression evidence:
- standard platform scroll inertia;
- native bounce and directional lock;
- continuous timeline/day navigation and animated `Nu`;
- programme-detail response and retained Guide position;
- close by button/backdrop and deliberate swipe-down dismissal;
- PR #7 one-row controls and immediate selected-day state;
- PR #9 UI-thread edge-readability synchronisation and programme-boundary semantics;
- programme `left` and duration-derived `width`;
- PR #11 single-mask time-axis treatment and truthful tick coordinates;
- PR #12 settled-readability stale-state correction for reverse scrolling.

The product owner previously described targeted scroll/detail/swipe-dismiss retests as **"perfect"**. PR #7, PR #9, PR #11 and PR #12 are physically accepted for their scoped behaviours. This is not blanket accessibility/performance approval.

## Recovery history that constrains implementation
- **PR #6 — physically rejected:** >1000 per-programme Reanimated styles produced a white screen/iPhone crash despite green CI. Exact native cause is unproven; do not reintroduce that high-volume worklet architecture unchanged.
- **PR #8 — physically rejected:** a React-state overlay lagged behind native ScrollView during drag/momentum and could cover successor content. Green CI did not catch it.
- **PR #9 — physically accepted/frozen:** only 48 small edge rows use live UI-thread geometry; old edge rows stop drawing at their real programme end even if React identity changes lag.
- **PR #10 — physically rejected:** per-tick Reanimated opacity still left a `30` fragment and was abandoned. Do not restore this architecture.
- **PR #11 — physically accepted/frozen:** one fixed UI-thread left-edge mask replaces per-tick animation; time labels disappear whole.
- **PR #12 — physically accepted/frozen:** settled-readability re-anchoring only applies while the remembered viewport actually cuts through the programme frame; stale positions beyond a programme no longer blank text during reverse scroll.

## Physical evidence — latest Guide baseline
### PR #11 recording — 13:48
`ScreenRecording_09-13-2026 13-48-10_1.MP4` physically accepted the single-mask time-axis behaviour. The 13:30 → 14:00 transition and other sampled transitions showed whole-label disappearance without `:30`/`30` remnants; tick and programme geometry remained stable. The same recording exposed the separate reverse-scroll stale-state bug fixed by PR #12.

### PR #12 recording — 14:04
`ScreenRecording_09-13-2026 14-04-35_1.MP4` (10.93 s, 1170×2532) physically accepted PR #12:
- strong movement toward later times and a strong reverse fling are visible;
- programme titles remain rendered through reverse drag/momentum;
- the broad blank-title state from the 13:48 recording does not recur;
- PR #9 partial-left edge readability remains coherent;
- PR #11 still shows no chopped `:30`/`30` time-label fragments;
- tick positions and programme block position/width remain visually stable.

Technical evidence for PR #12: PR CI #150 / `34755583818` passed completely; merge `b76edfab972b1d6194b2cbf1460515256de0e5c4`; documented post-merge main CI #154 / `34755760369` passed completely.

## PR #13 — screen-reader semantics + live system-theme subscription
PR #13 changes accessibility semantics only; it does not alter Guide layout, scroll, gesture or programme geometry.

Implementation:
- the visual fixed channel rail is removed from accessibility traversal to avoid 48 duplicated standalone channel announcements before programme content;
- the visual half-hour time axis is removed from accessibility traversal because programme buttons carry their own times;
- decorative `TEEVEE` eyebrow is not separately announced; `Gids` remains a header;
- every programme button announces `channel, title, start tot end`, adds `nu bezig` when applicable, and exposes `Opent programmadetails` as its hint;
- the pointer-transparent PR #9 edge overlay remains excluded from accessibility;
- Programme Detail modal/escape/close semantics are unchanged and remain covered by the existing integration test.

Theme verification:
- production `useTeeveeTheme()` required no code change because it already subscribes through React Native `useColorScheme()`;
- new render tests prove a mounted consumer updates live light → dark → light without remounting;
- a null system scheme deterministically falls back to light.

Technical evidence:
- PR head `766be594f6e8af193e3f9b364c7c6378a7c210df` passed PR CI #158 / run `34756492990` completely: install, strict TypeScript, lint, tests and iOS/Android/web Expo exports;
- PR #13 merged to main as `a8651b26c2521b53d0077bbd499862c3b1b71ed2`.

Native VoiceOver focus order/spoken output and an actual iOS Appearance switch remain physical-device observations and are not claimed from CI.

## Remaining Phase 1 work
- focused physical iPhone validation of PR #13 VoiceOver traversal/labels and live system-theme switching;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup; previously reported 15 moderate advisories require deliberate review, never `npm audit fix --force`;
- later explicit builds for Per zender and Nu & Straks;
- production EPG/logo/artwork rights/reliability, pricing/trial/paywall, production tokens/font licensing and final Tonight composition remain later gates.

## EXACT NEXT STEP
**On the same iPhone, pull current `main` and restart Metro cleanly. Perform one focused native accessibility/theme gate only: (1) enable VoiceOver and traverse the Guide from the top — `Gids` and the day/`Nu` controls must be reachable, but the fixed channel rail and visual half-hour time axis must not produce long duplicate focus sequences; (2) focus several programme cells and confirm each speaks the channel, title and begin/end time, with `nu bezig` for a current programme where applicable and an action hint for opening details; (3) open one Programme Detail, confirm its content and `Programmadetails sluiten` are reachable, then close once with the VoiceOver two-finger scrub/accessibility escape; (4) with Teevee still open, switch iOS Appearance Light → Dark → Light and confirm the Guide updates immediately without restart; repeat one switch while Programme Detail is open and confirm the sheet plus status bar update as well. Do not re-test scroll mechanics. Prefer one short screen recording for the visual theme change plus a brief written note of the VoiceOver wording/order if the recording does not capture spoken audio.**

Owner checkout: `~/projects/teevee`. Test with: stop Metro using Control+C, run `git pull --ff-only`, then `npm run start:clean`, and reopen Expo Go.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.
