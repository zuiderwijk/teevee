# Teevee — Canonical Project State

Last updated: 2026-09-13 09:56 CEST (Europe/Amsterdam). Exact commit time is in GitHub.
Status: ACTIVE — Phase 1 Guide prototype; PR #6 was reverted after a physical iPhone startup crash; main is restored to the last iPhone-runnable PR #5 Guide implementation pending one startup confirmation.
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
The PR #5 retest confirmed three product requirements that remain valid:
- when a programme title disappears behind the fixed channel rail, the title should eventually move continuously with the horizontal swipe rather than re-anchor only after release;
- explicit day selection should update the selected visual state immediately;
- the primary controls should be **Vandaag · Morgen · Nu** on one row, with only these compact control labels allowed to use a bounded font multiplier if needed to preserve that row.

## PR #6 startup regression and rollback
PR #6 attempted all three corrections. Its final PR CI and merged-main CI were technically green, but the physical iPhone test immediately showed a white screen followed by an app crash on Expo Go startup. Physical device evidence overrides CI for native-runtime acceptance.

The risky PR #6 implementation added animated per-programme readability content driven by a shared viewport value across the full realistic 48-channel fixture. The exact crash cause is not yet proven from a native error log; excessive native animated/worklet setup is a leading hypothesis, not a confirmed diagnosis.

To restore a runnable baseline, main was advanced with rollback commit **`f7c9f73568341d29e518be21e0de071e4ef7877d`**, restoring the PR #5 versions of `GuideView.tsx`, `geometry.ts`, `layout.ts` and `layout.test.ts`. This removes the PR #6 live-title animation and one-row control changes from runtime while preserving their requirements here for a safer reimplementation.

Do not reintroduce the same per-programme animated-worklet architecture at realistic fixture volume without stronger runtime evidence.

## Remaining Phase 1 work
- confirm the rollback build opens again on the same iPhone;
- then reintroduce **Vandaag · Morgen · Nu** one-row controls and immediate selected-day state as a small non-Reanimated increment;
- design a lower-overhead continuous partial-left title treatment before rebuilding that behaviour;
- VoiceOver/screen-reader behaviour and live theme switching;
- explicit progress/current-time accuracy checks;
- Android gesture/back behaviour and release-like performance;
- lifecycle behaviour for the launch-anchored finite fixture after midnight/expiry;
- CI reproducibility cleanup; previously reported 15 moderate advisories require deliberate review, never `npm audit fix --force`;
- later explicit builds for Per zender and Nu & Straks;
- production EPG/logo/artwork rights/reliability, pricing/trial/paywall and final visual design are later gates.

## EXACT NEXT STEP
**On the same iPhone, pull main at `f7c9f73568341d29e518be21e0de071e4ef7877d` or newer, restart Metro cleanly and confirm only whether Teevee opens normally again instead of showing a white screen/crashing. If it still crashes, capture the last visible Expo/Terminal error text or screenshot. Do not retest the PR #6 UX requirements until startup stability is restored.**

Owner checkout: `~/projects/teevee`. Test with: stop Metro using Control+C, run `git pull --ff-only`, then `npm run start:clean`, and reopen Expo Go.

## Resume instruction
> Read AGENTS.md and PROJECT_STATE. Execute EXACT NEXT STEP where possible, follow the Definition of Done, and update this state plus Dutch timestamped DEVLOG with evidence. Ask only for product choices or genuinely necessary physical-device observations. Never substitute CI or a mock for device acceptance.