# Issue #175 — hosted source-specific capacity smoke

Status: **PASS FOR GROUP SIZE 12 CAPACITY / PRODUCTION ACTIVATION STILL SEPARATE**  
Measured: 2026-09-25  
Candidate source/mapping code: PR #176

## Purpose

This smoke closes the source-specific capacity evidence requested by Issue #175 without activating production refresh topology.

The smoke used the PR #176 streaming XMLTV parser, exact NL/BE mapping tables, normalisation and coverage semantics inside a temporary JWT-protected Supabase Edge Function. It performed no database writes, no refresh-run/orchestration mutations and no cron changes.

The temporary function version used for measurement:

- function: `epg-capacity-smoke-175`
- deployment id: `eokszvpityhtysbwdduy_1c4b682f-6e8c-4449-942d-f22ba558adc5_1`
- evidence deployment SHA-256: `15e189f972a7e085ded0c5a28d037e434f0ddbc0e91f79f4cd10e5828f0c7944`
- `verify_jwt=true`

After evidence capture the same function was replaced by version 2 that returns HTTP 410 only:

- disabled deployment SHA-256: `c1b89d2b2cc38f49095574705567717263b4a543cc13e5b6fd891432fe030fb0`

The production `epg-refresh` function, production cron and database schema were not modified by this smoke.

## Accepted measurement window

The provider files are rolling/future-oriented. A first smoke of the currently-running television day correctly returned `partial` for NL group 0 and BE group 0 because continuous provider coverage through the following 06:00 was not yet available. A historical-day trial was also partial because the provider no longer retains a complete prior day.

The capacity acceptance therefore used the next fully-published Amsterdam television day:

- local television day: **2026-09-26 06:00 CEST → 2026-09-27 06:00 CEST**
- UTC: **2026-09-26T04:00:00Z → 2026-09-27T04:00:00Z**
- exact duration: **24 hours**

This is a source-data availability choice only; the same `guideTelevisionDayStart` boundary and continuous-coverage test are used.

## Results

| Source | Group | Channels | Programmes | HTTP | Coverage | Diagnostics | Wall time | CPU time | Edge memory total | failClosedReady |
| --- | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | --- |
| NL | 0 | 12 | 398 | 200 | complete | 0 warning / 0 error | 1178 ms | 979 ms | 11,399,271 B | true |
| NL | 1 | 12 | 320 | 200 | complete | 0 warning / 0 error | 1169 ms | 938 ms | 11,399,639 B | true |
| NL | 2 | 12 | 360 | 200 | complete | 0 warning / 0 error | 1511 ms | 1283 ms | 13,126,847 B | true |
| BE | 0 | 12 | 294 | 200 | complete | 0 warning / 0 error | 1151 ms | 911 ms | 11,409,559 B | true |
| BE | 1 | 1 | 96 | 200 | complete | 0 warning / 0 error | 1133 ms | 891 ms | 11,380,335 B | true |

Scanner evidence:

- NL feed: 184 channel blocks and 40,666 programme blocks scanned; maximum buffered XML chunk 5,762 characters.
- BE feed: 282 channel blocks and 44,705 programme blocks scanned; maximum buffered XML chunk 5,754 characters.
- only requested group programmes were materialised.
- every accepted group had programmes for every mapped canonical channel.

Supabase hosted Edge Function limits at measurement time are 2 seconds CPU per request and 256 MB memory. The worst 12-channel group measured:

- CPU: **1283 ms = 64.15% of the 2 s limit**;
- memory: **13.13 MB ≈ 5% of the 256 MB limit**.

Therefore the already-designed source-specific group size of **12** has measured hosted capacity headroom for both NL and BE source files.

## Fail-closed evidence

The smoke did not weaken coverage semantics to obtain a pass.

On the running 2026-09-25 television day:

- NL group 0 returned `coverage=partial`, `failClosedReady=false`;
- BE group 0 returned `coverage=partial`, `failClosedReady=false`.

Both source fetches themselves were HTTP 200 and had zero normalisation errors. The rejection was specifically due to incomplete continuous television-day coverage. This proves the source/mapping smoke distinguishes capacity success from incomplete provider data and remains fail-closed.

## Conclusion

Issue #175 source-specific **capacity gate for group size 12 passes**.

This result does **not** activate production. Production topology/cron activation remains governed by the existing release policy and requires the separately approved production step.
