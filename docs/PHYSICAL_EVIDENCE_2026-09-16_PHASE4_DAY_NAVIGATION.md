# Phase 4 Guide day-navigation physical acceptance

Date: 2026-09-16
Status: **ACCEPTED FOR PR #66 SCOPE**

## Exact code under test
- PR: #66 — `Wire D-2..D+7 Guide day navigation`
- exact tested PR head: `87bc533139223734f2a2fa51fad5fd3b237e861b`
- device: iPhone 13
- OS: iOS 26.6
- tester explicitly confirmed the checkout SHA with `git rev-parse HEAD` after the physical pass.

## Physical acceptance result
No functional failures were observed during the focused iPhone acceptance pass.

The pass covered the user-facing Guide day-navigation increment, including:
- shared bounded D-2..D+7 date selection;
- Totaal day switching and wall-clock context preservation;
- Totaal `Nu` returning to the actual current instant/current television day;
- continuous browsing semantics across midnight within the same 06:00 television day;
- Per-zender date switching;
- Per-zender channel tap/swipe navigation;
- Per-zender `Primetime` keeping the selected television day and jumping to 20:30;
- Per-zender `Nu` returning to the actual current day/time;
- rapid day switching without visible stale-response corruption, blank state, crash or stuck Guide;
- background/resume on a non-current day with usable preserved context;
- Programme Detail round-trip from a non-current Guide context;
- representative larger-text/accessibility use;
- Light/Dark/System appearance;
- accepted Guide gesture behaviour and general physical responsiveness.

Exact 00:00, 05:59, 06:00 and spring/fall DST boundary branches were not device-clock manipulated; those exact semantics remain covered by deterministic automated tests on the approved PR head.

## Non-blocking responsiveness observation
The tester reported one repeatable but non-blocking feel issue:
- immediately after a cold date switch, a very quick first follow-up date interaction could feel less responsive once;
- after that first hesitation, subsequent date switches felt normal;
- switching to another Guide overview could make the first date switch there feel cold again.

No functional error accompanied the hesitation: no wrong date/context, crash, blank screen or stuck navigation was observed. The supplied screen recording was reviewed by Lead and was consistent with a cold-path responsiveness concern rather than a correctness failure.

This observation is tracked separately as issue #67, `Measure cold Guide day-switch responsiveness`. The accepted architecture must not be changed to eager D-2..D+7 loading, persistent caching or a new dependency on this observation alone; first measure tap-to-state, state-to-meaningful-paint, selected-window network duration, JS/UI frame stalls and overview-remount/cache behaviour.

## Acceptance conclusion
The focused physical iPhone gate for PR #66 is **passed** on exact head `87bc533139223734f2a2fa51fad5fd3b237e861b`.

The cold first-switch responsiveness observation is explicit follow-up debt, not a PR #66 merge blocker.

Physical Android interaction acceptance remains separately deferred by current project state; CI/native compilation is build evidence, not Android device acceptance.
