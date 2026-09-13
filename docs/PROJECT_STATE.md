# Teevee — Canonical Project State

Last updated: 2026-09-13 10:08 CEST (Europe/Amsterdam). Exact commit time is in GitHub.
Status: ACTIVE — Phase 1 Guide prototype; PR #6 startup regression is rolled back and physically recovered; safe one-row controls are reintroduced on main pending one focused iPhone retest
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
- PR #5 provides a geometry-safe partial-left readability treatment: after horizontal drag/momentum settles, title/start-time content can shift inside the unchanged programme block to the visible remainder. Programme `left` and duration-based `width` stay truthful.
- Main now again shows **Vandaag · Morgen · Nu** on one row. Only these compact labels cap font scaling at 1.2x; Guide content itself continues to follow larger system text.
- Explicit Vandaag/Morgen taps update selected state immediately and are guarded against temporary scroll-driven flips during their own animated jump. `Nu` restores today/current time.
- The continuous during-swipe title movement attempted in PR #6 is **not currently implemented**; it remains an open requirement pending a lower-overhead approach.
- CI runs install, strict TypeScript, lint, tests and iOS/Android/web Expo bundle exports. Bundle export is not a signed/native device test.

No real production EPG, production artwork, account system or subscription/paywall has been introduced.

## Accepted interaction baselines
Do not retune these without concrete regression evidence:
- standard platform scroll inertia on both axes;
- native bounce and directional lock;
- continuous timeline/day navigation and animated `Nu`;
- programme-detail response and retained Guide position;
- close by button and outside tap;
- deliberate swipe-down dismissal with short/cancelled drag returning to position.

The product owner previously described targeted scroll, detail-response and swipe-dismiss retests as **"perfect"**. These are qualitative iPhone confirmations, not blanket accessibility/performance approval.

## Larger-text iPhone validation — accepted
The first materially enlarged system-text test exposed clipped Guide chrome. PR #4 corrected it. A follow-up screenshot at 08:59 showed `Gids`, `Nu`, day labels and time-axis labels fully readable, with channel/programme rows aligned and programme-title typography no longer vertically clipped.

The tested programme detail content plus `Sluiten` remained reachable at larger text, so no internal ProgrammeDetail ScrollView is justified solely by current evidence.

## 09:20 iPhone feedback
The PR #5 retest established three requirements:
- a partial-left programme title should eventually move continuously with horizontal drag/momentum rather than only re-anchor after release;
- explicit day selection should update its selected visual state immediately;
- **Vandaag · Morgen · Nu** should remain on one row, with bounded scaling allowed only for these compact labels.

## PR #6 startup regression — physically recovered
PR #6 attempted all three requirements using per-programme Reanimated animated styles driven by a shared viewport value. Its PR and main CI were green, but the physical iPhone test produced a white screen followed by an Expo Go crash. Physical device evidence overruled CI.

Main was rolled back to the PR #5 runtime baseline with **`f7c9f73568341d29e518be21e0de071e4ef7877d`**. The product owner then confirmed: **the app opens normally again**. This physically validates the rollback as the recovered runnable baseline.

The exact PR #6 crash cause is not proven from a native error log. The per-programme animated/worklet setup across the realistic 48-channel fixture remains the leading hypothesis and must not be reintroduced unchanged.

## Safe controls reimplementation — PR #7
PR #7 deliberately reintroduced only the low-risk control changes, with no new Reanimated/worklet usage:
- Vandaag, Morgen and Nu are one horizontal row;
- Morgen is the compact visible label, while its accessibility label includes the actual date;
- only these three compact labels cap scaling at 1.2x;
- explicit Vandaag/Morgen selection updates immediately and is protected from intermediate scroll events during its own animated jump;
- Nu restores today/current time;
- PR #5 programme-readability behavior is otherwise untouched.

PR #7 head **`67925d17913f5eac1aa00417f17bbf880e3724a9`** passed CI #104 / run `34746652205` completely. It merged to main as **`c697c4e7b9bb026409962f319d26cebad75a3a56`**.

Main CI #105 attempt 1 failed before install because npm temporarily reported `ETARGET` for transitive package `@csstools/css-calc@^3.4.0`; no code/test step ran. A rerun of the same exact main SHA, attempt 2, passed install, strict TypeScript, lint, all tests and iOS/Android/web exports. Treat the first failure as an external registry-resolution failure, not a code failure.

## Remaining Phase 1 work
- physically confirm main `c697c4e7...` still opens normally and that Vandaag/Morgen/Nu behave as intended on the same enlarged-text iPhone setup;
- design a lower-overhead continuous partial-left title treatment before rebuilding during-swipe movement;
- VoiceOver/screen-reader behaviour and live theme switching;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup; previously reported 15 moderate advisories require deliberate review, never `npm audit fix --force`;
- later explicit builds for Per zender and Nu & Straks;
- production EPG/logo/artwork rights/reliability, pricing/trial/paywall and final visual design are later gates.

## EXACT NEXT STEP
**On the same iPhone and the same enlarged-system-text setting, pull main `c697c4e7b9bb026409962f319d26cebad75a3a56` or newer, restart Metro cleanly and confirm: (1) Teevee still opens normally; (2) Vandaag, Morgen and Nu stay on one row; (3) tapping Morgen makes Morgen immediately selected/black, tapping Vandaag makes Vandaag immediately selected/black, and Nu returns to today/current time; (4) horizontal scrolling still feels like the accepted baseline. Do not retest continuous partial-left title movement yet; that behavior was intentionally left on the safe PR #5 settled-update implementation.**

Owner checkout: `~/projects/teevee`. Test with: stop Metro using Control+C, run `git pull --ff-only`, then `npm run start:clean`, and reopen Expo Go.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.