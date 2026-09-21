# Guide EPG horizon — live rollout and physical iPhone evidence

Date: 2026-09-21  
Scope: PR #116 television-day horizon correction + PR #117 Edge boot hotfix  
Canonical backend/main after hotfix merge: `c875922225e27c825fa9b0c6cbde2d08b8d22205`  
Physical app runtime used for the Guide smoke: PR #114 exact head `4c3a2d97c67814d71861298ef8a8d341ad1924c2`  
Environment: physical iPhone via Expo Go / local Metro

## Purpose

The original production incident was an asymmetry in Totaal:
- horizontally browsing from Vandaag into Morgen could show programmes;
- explicitly selecting Morgen through the day selector could return `Geen gidsinformatie`.

The backend root cause was incorrect refresh materialisation around calendar-midnight windows rather than canonical 06:00 Europe/Amsterdam television-day windows. PR #116 corrected the horizon refresh semantics. Its first live Edge deployment failed before handler boot with HTTP 503 `BOOT_ERROR`; PR #117 then hardened the newly introduced runtime module-resolution path.

## Live backend evidence

After PR #117 merged:
- exact-main CI #839 completed successfully on `c875922225e27c825fa9b0c6cbde2d08b8d22205`;
- `epg-refresh` was redeployed as live version 6;
- protected one-shot refresh request id **88** returned HTTP **200**;
- response mode was `guide-horizon`;
- D0 through D+5 complete provider windows were stored;
- incomplete D-3/D-2/D-1 and D+6/D+7/D+8 provider windows were skipped with `partial-provider-coverage`;
- no partial window destructively replaced canonical coverage.

Canonical storage then contained authoritative 06:00 Europe/Amsterdam television-day windows (04:00Z at the observed CEST date) for D0 through D+5, each across all 12 development channels.

Remote Supabase migration history was reconciled with the canonical repository migration versions. Local and remote history now match for all nine migrations through `20260921213000_refresh_guide_television_day_horizon.sql`.

## Physical iPhone smoke

The owner physically validated the current Totaal production-convergence runtime on PR #114 against the corrected live backend.

Observed:
- Vandaag loaded normally;
- horizontal browsing from Vandaag through the next 06:00 boundary into Morgen retained programme data;
- explicitly selecting Morgen through the day selector loaded programme data rather than `Geen gidsinformatie`;
- subsequent selected days remained available through 25 September;
- the first `Geen gidsinformatie` state appeared on **26 September**.

The original Vandaag -> Morgen asymmetry is therefore physically closed.

## 26 September boundary explanation

The 26 September observation is expected under the current Totaal loading contract and the temporary development provider.

Totaal loads a selected non-current television day plus its following television day when that following day remains inside D-2..D+7. The two bounded reads are deliberately all-or-nothing: if either required hosted window is unavailable, `loadTwoTelevisionDayGuideSchedule` returns `null`.

On this live snapshot:
- 26 September (D+5) itself had complete authoritative 12-channel coverage;
- 27 September (D+6) was incomplete in the development XMLTV provider and was correctly skipped;
- selecting 26 September in Totaal therefore required D+5 + D+6 and surfaced `Geen gidsinformatie`.

This is not evidence that D+5 canonical storage is missing, and it is not a regression of PR #116/#117. It is the visible edge of the existing Totaal continuity contract combined with a development-only provider that does not satisfy the full product horizon.

No product/UX contract is changed by this evidence. A production provider must still satisfy the complete D-2..D+7 promise.

## Acceptance conclusion

For the PR #116/#117 incident scope:
- Edge boot: PASS;
- protected guide-horizon refresh: PASS;
- 06:00 canonical storage materialisation: PASS;
- partial-window safety: PASS;
- migration-history reconciliation: PASS;
- original physical Morgen selection regression: PASS.

The EPG horizon incident is operationally closed. The temporary development provider still does not prove the release-level D-2..D+7 guarantee.

The next project gate remains the broader physical acceptance of open Totaal production-convergence PR #114.
