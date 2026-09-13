# Teevee — Canonical Project State

Last updated: 2026-09-13 14:07 CEST.
Status: ACTIVE — Phase 1 Guide prototype. PR #9 remains the physically accepted/frozen Guide scroll/readability baseline. PR #11 single-mask time-axis behaviour and PR #12 reverse-scroll title correction are both physically accepted on iPhone. The next Phase 1 increment is VoiceOver/screen-reader behaviour plus live system-theme switching.
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
- PR #5 settled readability remains the geometry-safe fallback after horizontal movement settles, with the PR #12 correction that a stale settled viewport beyond a programme may never collapse that programme's text geometry.
- PR #9 live partial-left programme readability is physically accepted on iPhone through drag, momentum and programme boundaries.
- PR #11 single left-edge mask is physically accepted for the time-axis clipping problem: departing time labels disappear without partial `:30`/`30` fragments while tick coordinates remain truthful.
- PR #12 is physically accepted for strong forward and reverse movement: programme titles remain rendered through reverse drag/momentum and the PR #9/PR #11 baselines remain intact.
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
- PR #9 UI-thread edge-readability synchronisation, programme-boundary disappearance semantics and programme geometry;
- PR #11 single-mask time-axis treatment and truthful tick coordinates;
- PR #12 settled-readability stale-state correction for reverse scrolling.

The product owner previously described targeted scroll/detail/swipe-dismiss retests as **"perfect"**. PR #7 and PR #9 are physically accepted. PR #11 and PR #12 are additionally physically accepted for the isolated time-axis and reverse-scroll readability behaviours. This is not blanket accessibility/performance approval.

## Recovery history that constrains implementation
### PR #6 — physically rejected
Per-programme Reanimated animated styles over the realistic >1000-cell Guide produced a white screen/iPhone crash despite green CI. The exact native cause is unproven, but high-volume per-programme worklet setup remains the leading hypothesis. Do not reintroduce that architecture unchanged.

### PR #8 — physically rejected
A React-state overlay lagged behind the native ScrollView during drag/momentum and could cover successor programme content. Green CI did not catch it.

### PR #9 — physically accepted and frozen
PR #9 moved edge geometry to shared UI-thread positions, with React only changing edge programme identity at boundaries. Old edge rows become invisible at their real programme end even if identity updates lag. Only 48 small edge rows are live-animated. The 11:35 recording physically accepted startup/session stability, drag/momentum synchronisation, boundary safety and unchanged programme geometry/scroll feel.

## PR #10 — physically rejected time-axis implementation
PR #10 added a Reanimated opacity style to every half-hour time label and reused PR #9 `scrollX`. It was technically green: final head `efeedc08d3a6c50f3ef3fc9f119e8da5e3860b2b` passed PR CI #140 / `34750478071`, and main subsequently passed CI as well.

The product owner supplied `ScreenRecording_09-13-2026 13-09-16_1.MP4`. Frame-by-frame review physically rejected PR #10 because around 8.7 s the left time axis still showed only `30` from an otherwise clipped label. That recording also showed programme-title disappearance during fast horizontal movement.

At the time, extra per-tick animated workload was considered a plausible explanation for the title disappearance. The later PR #11 recording disproved that as the primary root cause: the same title blanking remained after per-tick animations were removed. The actual cause was the older settled-readability state described under PR #12.

**PR #10 remains physically rejected. Do not restore the per-tick Reanimated-opacity architecture.**

## PR #11 — single left-edge time-axis mask: physically accepted
PR #11 (`Replace per-tick animations with one left-edge time-axis mask`) replaced only PR #10's rejected label mechanism:
- all half-hour tick lines and text are static/native ScrollView content again;
- no Reanimated style exists per tick label;
- one small `TimeAxisLeftMask` sits at the fixed left edge of the time-axis viewport;
- on the UI thread, the mask width equals exactly the visible remainder of the one label whose text has begun to clip;
- once that label is fully outside the viewport, mask width returns to zero;
- with current layout metrics, half-hour spacing remains wider than label width, so the next tick/label is outside the mask;
- the existing PR #9 `scrollX` shared value is reused; no new React state is written per scroll frame;
- programme geometry, PR #9 edge-readability, inertia, bounce, directional lock, controls and detail interactions are unchanged.

Technical evidence:
- PR head `8cba485c4c24bbf5160c652a13aba685c5520b3e` passed PR CI #145 / run `34754026981` completely;
- PR #11 merged to main as `9ed7113bc114911218107263b6df224940d5dd09`.

Physical evidence from `ScreenRecording_09-13-2026 13-48-10_1.MP4`:
- the time-axis mask behaves correctly across slow and fast horizontal movement;
- the 13:30 → 14:00 transition was checked frame-by-frame: 13:30 disappears as a whole between frames, without an intermediate `:30`/`30` fragment;
- the same whole-label disappearance pattern is visible across other sampled transitions;
- tick positions remain visually stable and time-truthful;
- programme block position/width remains stable.

**PR #11 is physically accepted and its single-mask time-axis behaviour is frozen.**

## PR #12 — reverse-scroll programme-title blanking fix: physically accepted
Root cause from the 13:48 recording:
- the PR #5 settled-readability state stores `readabilityViewportX` only at drag/momentum settle points;
- during a rapid reverse scroll, native content can move left before that React state updates;
- `programmeVisibleContent(frame, readabilityViewportX)` previously interpreted a stale viewport already beyond a newly visible programme as if the entire programme were hidden, producing `visibleWidth: 0` and temporarily blanking its text;
- this asymmetry mainly appears when scrolling back toward earlier times; forward scrolling does not create the same stale-ahead condition.

PR #12 changes only this pure settled-readability calculation:
- re-anchoring is applied only when the remembered viewport actually cuts through a programme frame;
- if the remembered viewport is before the programme or already at/past its end, normal full content geometry is retained;
- PR #9 remains responsible for the live partial-left edge title;
- programme `left`/`width`, native inertia/bounce/directional lock, PR #11 time-axis mask, controls and detail behaviour are untouched.

Regression tests explicitly cover a stale remembered viewport beyond the programme end and the exact end boundary.

Technical evidence:
- PR head `0f00e69b3fc7d5211e8522367a8217ce360b9649` passed PR CI #150 / run `34755583818` completely: install, strict TypeScript, lint, tests and iOS/Android/web Expo exports;
- PR #12 merged to main as `b76edfab972b1d6194b2cbf1460515256de0e5c4`;
- the documented post-merge main state passed CI #154 / run `34755760369` completely.

Physical evidence from `ScreenRecording_09-13-2026 14-04-35_1.MP4` (10.93 s, 1170×2532):
- a strong fling toward later times and a strong reverse fling toward earlier times are visible;
- programme titles remain rendered throughout the reverse movement; the broad blank-title state from the 13:48 recording does not recur;
- PR #9 partial-left edge readability remains coherent;
- PR #11 continues to hide departing time labels as whole labels, with no observed `:30`/`30` left-edge fragments;
- tick positions and programme block position/width remain visually stable.

**PR #12 is physically accepted. Freeze this settled-readability correction together with the already accepted PR #9/PR #11 interaction baseline.**

## Remaining Phase 1 work
- VoiceOver/screen-reader behaviour and live theme switching;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup; 15 moderate advisories require deliberate review, never `npm audit fix --force`;
- later explicit builds for Per zender and Nu & Straks;
- production EPG/logo/artwork rights/reliability, pricing/trial/paywall, production tokens/font licensing and final Tonight composition remain later gates.

## EXACT NEXT STEP
**Audit and harden VoiceOver/screen-reader semantics plus live system-theme switching without changing the frozen Guide geometry or scroll mechanics. Specifically: (1) reduce decorative/duplicated accessibility noise from the visual channel/time rails; (2) make every programme button self-contained for non-visual navigation by including channel, title and time in its accessibility label plus a concise action hint; (3) preserve Programme Detail modal escape/close semantics; (4) add automated coverage proving light↔dark system-scheme changes are observed live by `useTeeveeTheme`; (5) run the full CI gate. After technical green, request only the smallest necessary physical iPhone VoiceOver + live-theme validation.**

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.
