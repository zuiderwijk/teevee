# Vanavond classification foundation — hosted deployment evidence

Date: 2026-09-23  
Scope: PR #144 / issue #142 central programme classification enrichment foundation  
Merged implementation: `ca738e3c80d714ad6f95833554c6319674647fdb`  
Hosted Supabase project: `eokszvpityhtysbwdduy`

## Purpose

This document closes the hosted deployment gate for the provider-independent Film / Series / Sport classification foundation. It records exact-main CI, migration/runtime deployment, authoritative schedule/classification backfill, live bounded-read evidence and security/lifecycle checks.

This is foundation-only. No production Vanavond UI, TMDB/artwork runtime or recommendation surface is introduced by PR #144.

## Merge and exact-main CI

PR #144 merged as:

`ca738e3c80d714ad6f95833554c6319674647fdb`

Post-merge CI:

- run `35873133619` / CI #1072: **SUCCESS**;
- 100 test files / 727 tests PASS;
- strict TypeScript PASS;
- lint PASS;
- iOS / Android / web exports PASS;
- Android exact-alarm autolinking + permission checks PASS;
- clean Android prebuild PASS;
- main/release full-ABI `assembleDebug`: **BUILD SUCCESSFUL**.

The final classifier blob on canonical main remains:

`763b844db21c806415c7a3d877e709e4635842cd`

This is the same classifier blob that passed the final exact-classifier live revalidation before merge.

## Hosted migration

Reviewed migration SQL blob:

`f39e728b2098806f31b237319396436fc0a4e618`

The exact reviewed SQL bytes were applied successfully to the hosted Teevee project.

Supabase recorded remote migration history as:

`20260923144656_create_programme_classification_foundation`

Repository closeout aligns the canonical migration filename to that remote version:

`supabase/migrations/20260923144656_create_programme_classification_foundation.sql`

The SQL contents are unchanged from the reviewed/QA-proven blob.

Live schema after deployment:

- private `teevee.programme_classifications` exists;
- primary key = concrete canonical `programme_id`;
- FK lifecycle remains cascade update/delete with canonical `teevee.programmes`;
- RLS enabled;
- no anon/authenticated table read;
- no anon/authenticated execution of classification read/write RPC bridges;
- service_role retains the required table/RPC privileges.

## Edge Functions

### epg-refresh

Hosted function:

- ACTIVE v7;
- `verify_jwt=false` retained because the handler uses the existing dedicated cron-token policy;
- deployed bundle hash:
  `5bf51eed598ff7fec251496d5da4d791ec8912a2a4048b8d0832373e6c68a218`.

All 16 deployed runtime files were independently compared against merge SHA `ca738e3c...` and matched byte-for-byte, including:

- full XMLTV category preservation;
- episode-number evidence;
- director-credit presence;
- central classifier;
- classified schedule replacement.

### programme-classifications

Hosted function:

- ACTIVE v1;
- `verify_jwt=false` by design for the public bounded semantic read boundary;
- deployed bundle hash:
  `1799bc5f428ed6fe0396f460e2cf5aa635255e03f61d67f281997ef6e0cadb4f`.

All 9 deployed runtime files were independently compared against merge SHA and matched byte-for-byte.

The response contract contains only provider-independent Teevee semantics:

- programmeId;
- contentType;
- seriesType;
- audience;
- sportType;
- liveStatus;
- repeatStatus;
- confidence.

Raw provider categories/evidence do not cross this boundary.

## Authoritative backfill

After migration + Edge deployment, the owner triggered the protected existing refresh RPC:

`select teevee.enqueue_development_epg_refresh();`

It returned request id:

`118`

Hosted `net._http_response` evidence:

- request `118`;
- HTTP **200**;
- `application/json`;
- no timeout;
- no error;
- response mode = `guide-horizon`;
- elapsed = 3557 ms.

The current development XMLTV source was complete for D+1 through D+5 at the observed refresh and partial outside that range. The refresh therefore correctly stored only complete windows and skipped incomplete windows with `partial-provider-coverage`.

Stored television-day windows:

| Window | Canonical programmes | Classifications | Missing |
| --- | ---: | ---: | ---: |
| 2026-09-24 06:00 → 2026-09-25 06:00 CEST | 520 | 520 | 0 |
| 2026-09-25 06:00 → 2026-09-26 06:00 CEST | 524 | 524 | 0 |
| 2026-09-26 06:00 → 2026-09-27 06:00 CEST | 406 | 406 | 0 |
| 2026-09-27 06:00 → 2026-09-28 06:00 CEST | 409 | 409 | 0 |
| 2026-09-28 06:00 → 2026-09-29 06:00 CEST | 517 | 517 | 0 |

Because programmes can intersect adjacent television-day windows, the distinct union is smaller than the sum of per-window counts.

Exact union check:

- distinct canonical programmes in stored backfill scope: **2,358**;
- persisted classification rows: **2,358**;
- missing classification siblings: **0**;
- classifications outside stored scope: **0**;
- orphan classifications: **0**;
- one shared `classified_at` generation for this backfill.

Classification distribution over the stored union:

- Film: 32;
- Series: 561;
- Sport: 25;
- Other: 1,227;
- Unknown: 513.

Current module-eligible semantic counts over this complete stored union:

- Film/high: 32;
- general/mainstream scripted Series/high: 134;
- Sport event/highlights/high: 11.

These counts are operational observations for this provider snapshot, not product quotas or ranking targets.

## Live bounded-read smoke

A temporary, intentionally non-mergeable GitHub Actions workflow on closeout PR #146 tested the deployed public HTTP boundary after backfill.

Workflow:

`Tonight classification live smoke`

Run:

`35878911866`

Job:

`107241960510 — SUCCESS`

It verified one request containing three real persisted canonical broadcasts:

- `The Martian` → Film/high;
- `Goede Tijden, Slechte Tijden` → scripted episodic + general/mainstream Series/high;
- `De Sterkste Man van Nederland` → eligible Sport event/highlights semantic.

The smoke also asserted that:

- exactly the requested rows were returned;
- no raw/provider-specific fields leaked;
- an oversized 257-ID request was rejected with HTTP 400.

The temporary workflow was removed before final closeout review and is not intended to merge.

## Security and performance advisors

Post-deployment Supabase advisor review introduced no blocking security/performance finding.

Expected INFO:
- RLS enabled with no policies on private Teevee tables, including the new classification table. This is intentional because client access is revoked and reads/writes are mediated by the service-owned RPC/Edge boundaries.

Pre-existing unrelated findings remain:
- `pg_net` extension in `public` warning;
- unused `programmes_channel_airing_idx` performance INFO.

Neither was introduced by PR #144.

## Acceptance conclusion

For issue #142 / PR #144:

- provider-independent semantic classifier: PASS;
- both Lead certainty blockers: closed;
- Independent QA: PASS;
- merge: PASS;
- exact-main CI: PASS;
- migration deployment: PASS;
- exact merged Edge deployment: PASS;
- authoritative classified schedule backfill: PASS for all source-complete windows;
- classification completeness: PASS;
- orphan/lifecycle check: PASS;
- bounded live HTTP read: PASS;
- 256-ID guard: PASS;
- direct database/RPC client exposure: blocked as designed.

The Vanavond classification/enrichment foundation is therefore **MERGED, DEPLOYED AND LIVE VERIFIED**.

The temporary development EPG still does not satisfy the production D-2..D+7 coverage/rights gate. Partial windows remain deliberately non-authoritative. This deployment does not change the Phase 8 production-provider decision.

## Next step

Proceed to the **first production Vanavond runtime** against the frozen product/design contracts and this provider-independent classification boundary.

Required sequence for that user-facing surface:

**production runtime implementation → Acc Design Refinement on real runtime → Development corrections → physical iPhone convergence/acceptance → Independent QA → Technical Lead merge gate.**

Do not reintroduce raw provider taxonomy or title-specific classification logic in the Vanavond UI.
