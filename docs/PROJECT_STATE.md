# Teevee — Canonical Project State

Last updated: 2026-09-13 (visual/UX baseline synchronized; exact commit time is in GitHub).
Status: ACTIVE — Phase 1 Guide prototype; PR #8 is physically rejected from screen-recording evidence; PR #9 native-synchronised edge readability is integrated on main and technically green, pending focused iPhone validation. Owner-approved Guide/Programme Detail visual-UX baselines are now documented for subsequent implementation.
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

## Owner-approved visual/UX baseline — 13 September 2026
The visual-design thread produced an accepted target for Guide and Programme Detail. This is a **target baseline, not a claim of current runtime implementation**. `docs/UX.md` and `docs/DESIGN_SYSTEM.md` contain the detailed rules; `docs/PRODUCT.md` and `docs/BUILD_SPEC.md` are aligned with them.

Accepted direction:
- premium utility, restrained chrome, open schedule canvas rather than stacked cards;
- Söhne is the preferred typography direction, subject to production licensing/technical verification;
- near-white neutral light canvas; dark-anthracite dark canvas; red used sparingly for meaningful selected/current/primary-action emphasis;
- channel logo primary, channel name secondary/contextual;
- the shared Guide shell may condense nonessential brand chrome during vertical scrolling while retaining view-specific context;
- **Totaal:** horizontal time / vertical channels; restrained current-time marker; low-value cell metadata removed;
- **Per zender:** sticky horizontal channel-logo strip, vertical day list, horizontal swipe across the schedule moves to adjacent channel, direct logo tap changes channel, viewed time anchor preserved where practical, `Primetime`/`Nu` as contextual shortcuts; no genre/artwork clutter;
- **Nu & Straks:** today-only shared horizontal reference time, `Primetime` shortcut from live and `Nu` to restore live, programme at the reference instant plus **three following programmes** per channel, no progress bars/genres/artwork/chevrons/`Daarna` labels;
- **Programme Detail:** tap Guide programme opens detail directly; current-phase actions limited to `Herinner mij` + `Bewaar`; no preview sheet/share/overflow/calendar/recommendation controls; artwork optional; once canonical actions scroll out of view a compact sticky bottom copy appears for one-handed reach, disappearing again when originals return;
- larger system text may reduce density/reflow actions rather than clipping content.

Tonight/Vanavond has a promising more visual discovery direction, but its exact module composition remains provisional and is not frozen with the Guide/Detail baseline.

Documentation sync commits preceding this state update:
- UX baseline: `c0f30a1354fe59a7ce783b1bb90e3600d41c04a1`;
- Design System baseline: `5de5eee993fabf14e19a10f246622f4af0ea8514`;
- Product alignment: `af6208e5be94f308a4905bcf111ec349845b3019`;
- Build-spec alignment: `8cd40d59614b88853d24f7e850911e3bf4bebee4`.

These documentation commits do not supersede the Phase 1 runtime validation below and do not authorise skipping the exact next step.

## Current accepted implementation baseline
- Expo SDK 57 / Expo Router / strict TypeScript with semantic system-aware themes.
- Teevee-owned Channel, Programme and GuideFixture types.
- 48 synthetic channels and 49 elapsed hours of deterministic runtime-aligned data.
- Shared Amsterdam calendar helpers with DST/23-hour/25-hour/year-rollover tests.
- Totaal uses one continuous horizontal timeline with half-hour ticks, duration-based programme blocks, current-time line and programme progress.
- Fixed channel rail plus synchronised vertical movement; native bounce/directional lock and `normal` deceleration on both axes.
- Programme detail selection is isolated from the heavy Guide render. Native Modal slide, button close, outside-tap close and deliberate swipe-down dismissal remain accepted.
- Optional `Channel.logoUrl` exists. Target treatment is logo first, channel name second, with full accessible textual identity and text fallback.
- Totaal adapts content geometry to larger system text; the tested iPhone large-text correction is accepted.
- **Vandaag · Morgen · Nu** remain on one row. Only these compact labels cap font scaling at 1.2x; Guide content continues to follow larger system text. Explicit Vandaag/Morgen selection updates immediately; `Nu` restores today/current time.
- PR #5 settled readability remains the safe fallback: after horizontal movement settles, text inside a partially hidden programme block can re-anchor to the visible remainder without changing the real start position or duration-derived width.
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

The product owner previously described targeted scroll, detail-response and swipe-dismiss retests as **"perfect"**. PR #7 is physically accepted for startup stability, one-row controls, immediate selected state, `Nu` return behaviour and unchanged horizontal scroll feel. These are qualitative iPhone confirmations, not blanket accessibility/performance approval.

## Larger-text iPhone validation — accepted
The first materially enlarged system-text test exposed clipped Guide chrome. PR #4 corrected it. A follow-up screenshot at 08:59 showed `Gids`, `Nu`, day labels and time-axis labels fully readable, with channel/programme rows aligned and programme-title typography no longer vertically clipped.

The tested programme detail content plus `Sluiten` remained reachable at larger text, so no internal ProgrammeDetail ScrollView is justified solely by current evidence.

## 09:20 feedback and recovery history
The PR #5 retest established three requirements:
- a partial-left programme title should move continuously with horizontal drag/momentum rather than only re-anchor after release;
- explicit day selection should update its selected visual state immediately;
- **Vandaag · Morgen · Nu** should remain on one row, with bounded scaling allowed only for these compact labels.

PR #6 attempted all three using per-programme Reanimated animated styles over the realistic Guide. PR/main CI were green, but Expo Go showed a white screen followed by a physical iPhone crash. Main was rolled back with **`f7c9f73568341d29e518be21e0de071e4ef7877d`**, after which the product owner confirmed normal startup. The exact native crash cause is unproven; the high-volume per-programme animated/worklet setup remains the leading hypothesis and must not be reintroduced unchanged.

PR #7 safely reintroduced only the two control requirements without new Reanimated/worklet logic. It merged as **`c697c4e7b9bb026409962f319d26cebad75a3a56`** and is fully physically accepted.

## PR #8 — physically rejected despite green CI
PR #8 merged as **`1fbc4095ea50959f80a87db5db1f91905f46c2e2`** after PR CI #120 and exact-main CI #121 both passed. Its overlay kept the core programme geometry truthful and avoided the PR #6 per-programme worklet approach, but it still derived live edge geometry through JavaScript/React state updated from scroll events.

The product owner supplied an iPhone screen recording at 10:49. Frame-by-frame review showed a concrete runtime defect:
- the native horizontal ScrollView moved ahead of the React overlay during drag and especially momentum;
- a stale overlay could continue showing an already-ended programme while the underlying timeline had moved into later programmes;
- the stale opaque edge layer visibly covered and clipped successor programme titles/times;
- the underlying Guide scroll and programme-block geometry themselves appeared stable.

Therefore PR #8 is **physically rejected**. Its green CI is retained as technical history, not acceptance evidence. The recording starts after the app is already open, so it does not independently prove cold-start stability.

## PR #9 — native/UI-thread-synchronised edge readability
PR #9 replaces only the rejected synchronisation layer for the same product requirement.

Design:
- horizontal and vertical ScrollViews expose shared UI-thread positions through Reanimated scroll handlers;
- the left-edge overlay width, visibility, vertical translation and repeated current-time line follow those shared values directly on the UI thread;
- React changes edge **programme identity** only when a programme start/end boundary is crossed, instead of recomputing overlay geometry every scroll frame;
- if that React identity update is late, the old edge row becomes invisible/zero-width immediately when the UI-thread scroll position leaves its real programme frame, so it cannot cover the following programme;
- only 48 small edge rows have animated geometry, not the >1000 programme cells used in the rejected PR #6 architecture;
- the live edge layer shows the title only; PR #5 settled readability remains responsible for the fuller title/time treatment after scrolling stops;
- programme `left`, duration-derived `width`, scroll inertia, bounce, directional lock, day controls and detail interactions are not intentionally changed;
- overlay content remains pointer-transparent and removed from accessibility traversal; underlying programme buttons remain authoritative.

Pure tests cover start/end edge boundaries and exact boundary switching. The existing 48-channel Guide/detail integration path remains present with expanded animation mocks.

Implementation head **`ff39a16e717e5f89f57509d6b18b54b72e9d1d3a`** passed PR CI #125 / run **`34748926153`** completely. The final documented PR head **`8a37cef550e0558a03d0876a356e295ff4ac424b`** then passed PR CI #128 / run **`34749068020`** completely: install, strict TypeScript, lint, tests and iOS/Android/web exports.

PR #9 is now integrated on main at **`8a37cef550e0558a03d0876a356e295ff4ac424b`**. GitHub recognises PR #9 as merged; exact-main push CI #129 / run **`34749225666`** also passed all gates completely. This is technical evidence only. Because both PR #6 and PR #8 exposed device-only failures after green CI, PR #9 is not physically accepted until the focused iPhone test below.

## Remaining Phase 1 work
- physically validate PR #9 startup, title movement during drag/momentum, stale-overlay prevention and unchanged scroll feel;
- separately address partially clipped time-axis labels at the left viewport edge after the title-motion increment is settled;
- VoiceOver/screen-reader behaviour and live theme switching;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup; previously reported 15 moderate advisories require deliberate review, never `npm audit fix --force`;
- later explicit builds for the accepted Per zender and Nu & Straks baselines;
- production EPG/logo/artwork rights/reliability, pricing/trial/paywall, exact production design tokens/font licensing, and final Tonight composition remain later gates.

## EXACT NEXT STEP
**On the same iPhone, pull current main and restart Metro cleanly. Confirm: (1) Teevee opens normally; (2) while horizontally dragging, the partial-left programme title follows the visible left edge without lagging behind the native timeline; (3) the same remains true through momentum after release; (4) an old edge disappears at its real programme end and never covers a successor programme; (5) programme blocks do not jump/change width and horizontal scrolling still feels like the accepted baseline. Prefer one short screen recording similar to the 10:49 recording because drag/momentum synchronisation cannot be proven by a screenshot. Do not re-test already accepted Vandaag/Morgen/Nu or detail behaviour unless a regression is noticed.**

Owner checkout: `~/projects/teevee`. Test with: stop Metro using Control+C, run `git pull --ff-only`, then `npm run start:clean`, and reopen Expo Go.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.
