# Phase 4 runtime boundary — physical iPhone evidence

Date: 2026-09-15
Scope: PR #64 — `Migrate mobile runtime to television-day boundaries`
Exact tested PR head: `5356877fd1effb05e7ed5ce1a87c36544ac1dcf7`
Merged to `main` as: `ad71bcbb569affcaa9b9b4be12ed583489018b94`
Device: iPhone 13
OS: iOS 26.6
Runtime: Expo Go / local Metro device path

## Purpose

PR #64 changes the shared mobile hosted schedule/runtime lifecycle boundary from strict Amsterdam calendar-day semantics to ADR 0008 television-day semantics with a 06:00 Europe/Amsterdam boundary. Automated tests prove the deterministic temporal branches, but CI cannot credibly prove the real React Native lifecycle transition and preservation of Guide context on a physical device.

Independent QA therefore required a focused physical iPhone gate on the exact reviewed PR head. The full historical Guide acceptance matrix was intentionally not reopened because PR #64 does not modify Guide layout, gestures or visual design.

## Exact-head confirmation

The test session was run after checking out PR head:

`5356877fd1effb05e7ed5ce1a87c36544ac1dcf7`

After the screen recording was supplied, the tester explicitly confirmed the local checkout with `git rev-parse HEAD`, returning the same SHA.

## Evidence observed

### 1. Fixture-first -> hosted canonical replacement — PASS

The recording shows the Guide becoming immediately usable with deterministic synthetic fixture channels (`Publiek 1`, `Publiek 2`, `Publiek 3`). The runtime then replaces that fixture data with hosted canonical schedule data (`NPO 1`, `NPO 2`, `NPO 3`, RTL and real programme listings).

Observed result:
- no blank Guide state;
- no stuck loading state;
- no crash;
- no unusable intermediate state;
- successful transition from fixture-first content to canonical hosted content.

### 2. Same-television-day background/resume context retention — PASS

A non-default Nu & Straks context was established at reference time `23:00`. The recording shows the app leaving to the iOS home/background state and subsequently resuming.

After resume, the same `23:00` reference time and the same visible programme context remained present, including the visible rows for `24 Hours in A&E`, `Shownieuws - late editie` and `Bad Boys II`.

Observed result:
- Guide presentation remains usable after resume;
- reference time remains `23:00`;
- visible programme context is preserved rather than reset to a default state;
- hosted/canonical runtime remains usable after lifecycle refresh.

## Automated evidence intentionally not repeated physically

The following branches are directly and deterministically covered by the PR #64 automated suite and were not tested by manipulating the device clock:
- exact 00:00;
- 05:59;
- exact 06:00 television-day rollover;
- Europe/Amsterdam spring-DST 23-hour television day;
- Europe/Amsterdam fall-DST 25-hour television day;
- bounded D and D+1 hosted requests;
- stale/out-of-order response protection;
- freshness-only refresh equality.

## Remaining deferred gates

This evidence does not close previously deferred project-wide gates:
- physical Android interaction validation remains deferred until suitable Android hardware is available;
- true no-network cold start remains deferred to a standalone/development build because Expo Go depends on Metro/network after force-quit;
- D-2..D+7 user-facing day navigation is a subsequent Phase 4 increment;
- production provider horizon/rights remain a later release gate.

## Acceptance conclusion

The focused physical iPhone lifecycle gate required by independent QA for PR #64 is satisfied on the exact reviewed head. Combined with exact-head automated CI and independent QA, the runtime-boundary increment is physically accepted for this scope.
