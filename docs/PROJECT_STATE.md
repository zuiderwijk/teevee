# Teevee — Canonical Project State

Last updated: 2026-09-13 13:17 CEST.
Status: ACTIVE — Phase 1 Guide prototype. PR #9 remains the physically accepted/frozen Guide scroll/readability baseline. PR #10 is physically rejected from the 13:09 iPhone recording. PR #11 replaces the rejected per-tick animation approach with one left-edge time-axis mask, is merged on main as `9ed7113bc114911218107263b6df224940d5dd09`, and is technically green on PR CI #145 pending focused iPhone validation.
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
- Accessibility and system text scaling are product-quality requirements.
- PROJECT_STATE is canonical cross-session memory. Complexity requires evidence.

Relevant ADRs: `0001` through `0004` in `docs/decisions/`.

## Guide presentations
The implemented grid is **Totaal**. Two additional Guide presentations are specified but not yet implemented:
- **Per zender:** one channel's scrollable schedule, initially around the current programme; the channel-icon bar remains available; horizontal swipe may move to the previous/next channel while preserving the viewed time anchor where practical.
- **Nu & Straks:** compact all-channel list around one common reference time today; no date selector. Entry starts in live/current mode, moving the selector pins a past/future time today, and `Nu` restores live mode.

One Guide destination with a locally remembered presentation preference remains the working proposal. No new primary tabs are authorised.

## Owner-approved visual/UX baseline — 13 September 2026
Accepted direction:
- premium utility, restrained chrome, open schedule canvas;
- Söhne preferred typography direction, subject to production licensing/technical verification;
- near-white light canvas, dark-anthracite dark canvas, red used sparingly for selected/current/primary-action emphasis;
- channel logo primary, channel name secondary/contextual;
- **Totaal:** horizontal time / vertical channels, restrained current-time marker, no low-value cell metadata;
- **Per zender:** sticky horizontal channel-logo strip, vertical day list, horizontal swipe to adjacent channel, direct logo tap, contextual `Primetime`/`Nu`;
- **Nu & Straks:** today-only shared reference time, programme at that instant plus three following programmes per channel; no progress bars/genres/artwork/chevrons/`Daarna` labels;
- **Programme Detail:** direct from Guide; current-phase actions `Herinner mij` + `Bewaar`; no share/overflow/calendar/recommendation controls; one-handed sticky action copy may appear once canonical actions scroll away;
- larger system text may reduce density/reflow rather than clip.

Tonight/Vanavond remains promising but provisional.

## Current accepted implementation baseline
- Expo SDK 57 / Expo Router / strict TypeScript with semantic system-aware themes.
- Teevee-owned Channel, Programme and GuideFixture types.
- 48 synthetic channels and 49 elapsed hours of deterministic runtime-aligned data.
- Shared Amsterdam calendar helpers with DST/23-hour/25-hour/year-rollover tests.
- Totaal uses one continuous horizontal timeline with half-hour ticks, duration-based programme blocks, current-time line and programme progress.
- Fixed channel rail plus synchronised vertical movement; native bounce/directional lock and `normal` deceleration.
- Programme detail selection is isolated from the heavy Guide render. Native Modal slide, button close, outside-tap close and deliberate swipe-down dismissal remain accepted.
- Optional `Channel.logoUrl`; target treatment is logo first, channel name second, with accessible textual fallback.
- Totaal adapts content geometry to larger system text; the tested iPhone large-text correction is accepted.
- **Vandaag · Morgen · Nu** remain on one row; only these compact labels cap scaling at 1.2x. Explicit day state updates immediately; `Nu` restores today/current time.
- PR #5 settled readability remains the geometry-safe fallback after horizontal movement settles.
- PR #9 live partial-left programme readability is physically accepted on iPhone through drag, momentum and programme boundaries.
- CI runs install, strict TypeScript, lint, tests and iOS/Android/web Expo bundle exports. Bundle export is not a signed/native device test.

No real production EPG, production artwork, account system or subscription/paywall has been introduced.

## Frozen interaction baselines
Do not retune without concrete regression evidence:
- standard platform scroll inertia;
- native bounce and directional lock;
- continuous timeline/day navigation and animated `Nu`;
- programme-detail response and retained Guide position;
- button/backdrop close and deliberate swipe-down dismissal;
- PR #7 one-row controls and immediate selected-day state;
- PR #9 UI-thread edge-readability synchronisation, programme-boundary disappearance semantics and programme geometry.

The product owner previously described targeted scroll/detail/swipe-dismiss retests as **"perfect"**. PR #7 and PR #9 are physically accepted. This is not blanket accessibility/performance approval.

## Recovery history that constrains implementation
### PR #6 — physically rejected
Per-programme Reanimated animated styles over the realistic >1000-cell Guide produced a white screen/iPhone crash despite green CI. The exact native cause is unproven, but high-volume per-programme worklet setup remains the leading hypothesis. Do not reintroduce that architecture unchanged.

### PR #8 — physically rejected
A React-state overlay lagged behind the native ScrollView during drag/momentum and could cover successor programme content. Green CI did not catch it.

### PR #9 — physically accepted and frozen
PR #9 moved edge geometry to shared UI-thread positions, with React only changing edge programme identity at boundaries. Old edge rows become invisible at their real programme end even if identity updates lag. Only 48 small edge rows are live-animated. The 11:35 recording physically accepted startup/session stability, drag/momentum synchronisation, boundary safety and unchanged programme geometry/scroll feel.

## PR #10 — physically rejected time-axis implementation
PR #10 added a Reanimated opacity style to every half-hour time label and reused PR #9 `scrollX`. It was technically green: final head `efeedc08d3a6c50f3ef3fc9f119e8da5e3860b2b` passed PR CI #140 / `34750478071`, and main subsequently passed CI as well.

The product owner then supplied `ScreenRecording_09-13-2026 13-09-16_1.MP4`. Frame-by-frame review physically rejects this implementation:
- around 8.7 s the left time axis still shows only `30` from an otherwise clipped time label;
- during fast horizontal movement, programme titles disappear for sustained intervals and reappear after settling, violating the frozen PR #9 expectation that partial-left titles remain useful during drag/momentum;
- programme frames themselves still appear geometrically stable; no evidence justifies changing their position/width or native scroll physics.

The likely implementation risk is the added per-tick animated workload (roughly two animated labels per elapsed hour) competing with the already accepted PR #9 live edge layer. This is an evidence-backed hypothesis, not a proven native root cause.

**PR #10 is physically rejected. Do not restore the per-tick Reanimated-opacity architecture.**

## PR #11 — single left-edge time-axis mask
PR #11 (`Replace per-tick animations with one left-edge time-axis mask`) replaces only PR #10's rejected label mechanism:
- all half-hour tick lines and text are static/native ScrollView content again;
- no Reanimated style exists per tick label;
- one small `TimeAxisLeftMask` sits at the fixed left edge of the time-axis viewport;
- on the UI thread, the mask width equals exactly the visible remainder of the one label whose text has begun to clip;
- once that label is fully outside the viewport, mask width returns to zero;
- with current layout metrics, half-hour spacing remains wider than label width, so the next tick/label is outside the mask;
- the existing PR #9 `scrollX` shared value is reused; no new React state is written per scroll frame;
- programme geometry, PR #9 edge-readability, inertia, bounce, directional lock, controls and detail interactions are unchanged.

Focused pure tests cover first/subsequent labels, exact boundaries, negative bounce and large-text metrics.

Technical evidence:
- PR head `8cba485c4c24bbf5160c652a13aba685c5520b3e` passed PR CI #145 / run `34754026981` completely: install, strict TypeScript, lint, tests and iOS/Android/web Expo exports;
- PR #11 merged to main as `9ed7113bc114911218107263b6df224940d5dd09`.

This is technical evidence only. PR #11 is not physically accepted until the focused iPhone test below.

## Remaining Phase 1 work
- physically validate PR #11: no partial left-edge time labels and frozen PR #9 programme-title behaviour restored during drag/momentum;
- VoiceOver/screen-reader behaviour and live theme switching;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup; 15 moderate advisories require deliberate review, never `npm audit fix --force`;
- later explicit builds for Per zender and Nu & Straks;
- production EPG/logo/artwork rights/reliability, pricing/trial/paywall, production tokens/font licensing and final Tonight composition remain later gates.

## EXACT NEXT STEP
**On the same iPhone, pull current `main` and restart Metro cleanly. Make one short screen recording focused on horizontal Guide movement. Confirm: (1) Teevee remains stable; (2) slowly scroll across several half-hour ticks and then fling with momentum — a label leaving on the left must never appear as a partial `:30`, `30`, hour fragment or other chopped text; (3) tick positions remain time-truthful with no timeline jump; (4) programme blocks keep their real position/width; (5) during both drag and momentum, the frozen PR #9 partial-left programme titles remain visible/coherent instead of disappearing until settle. Do not re-test Vandaag/Morgen/Nu or Programme Detail unless a spontaneous regression appears.**

Owner checkout: `~/projects/teevee`. Test with: stop Metro using Control+C, run `git pull --ff-only`, then `npm run start:clean`, and reopen Expo Go.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.
