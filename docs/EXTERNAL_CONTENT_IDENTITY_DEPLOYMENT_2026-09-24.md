# PR #161 external-content identity deployment — 2026-09-24

## Scope

This document records the production rollout evidence for issue #159 / PR #161, the server-side TMDB Film/Series external-content identity foundation.

The increment does **not** add artwork UI, TMDB episode identity, Sport identity, a generic Teevee catalogue, or any mobile TMDB dependency.

## Accepted implementation

PR #161 exact accepted head:

`708cb6f180c24755c9ff40b1b34cafabff6543b3`

Independent QA final PASS:

- PR comment #5805450167.

Technical Lead final merge gate:

- PR comment #5805462778.

Merge commit on `main`:

`9188061d76e9a2f9a0a94e44e92323beffb823ef`

Issue #159 closed automatically with the merge.

## Exact-main verification

Exact-main CI:

- run: `35940305485`
- CI number: `#1244`
- result: **SUCCESS**
- classify: PASS
- quality: PASS
- android-native: PASS
- strict TypeScript: PASS
- lint: PASS
- 112 / 112 test files PASS
- 875 / 875 tests PASS
- iOS / Android / web Expo export PASS
- main/release full-ABI Android debug build PASS

No hosted state was changed before this exact-main CI completed successfully.

## Database migration

Reviewed repository migration:

`supabase/migrations/20260924001500_create_programme_external_content_reference.sql`

Reviewed Git blob:

`3cd8bbc2d0e6a1a7bb4320d0bc4510f0b543650e`

The connected Supabase migration API applied that exact SQL successfully. Hosted migration history recorded:

`20260924010656_create_programme_external_content_reference`

The timestamp differs from the repository filename because the Management API records its own remote migration version. Do not rewrite already-applied hosted migration history.

Post-apply verification:

- `teevee.programme_external_content_references` exists;
- RLS enabled;
- current reference count immediately after rollout: 0;
- dangling-reference count: 0;
- `anon` has no SELECT/INSERT authority;
- `authenticated` has no SELECT/INSERT authority;
- `service_role` has intended SELECT/INSERT authority;
- private and public writer functions exist;
- both writers are `SECURITY INVOKER`;
- both writers have empty `search_path`;
- `anon` / `authenticated` cannot execute the public writer bridge;
- `service_role` can execute the public writer bridge;
- before-write ownership trigger exists;
- programme-side ownership cleanup trigger is DEFERRABLE and INITIALLY DEFERRED.

The no-cascade-FK design remains intentional under ADR 0007: normal canonical schedule replacement deletes/reinserts unchanged programme rows, so ownership is enforced by exact-broadcast triggers instead.

## Edge runtime deployment

Hosted `epg-refresh` was upgraded from v9 to:

- version: **v10**
- status: **ACTIVE**
- `verify_jwt=false`, unchanged because the function owns its existing custom `apikey` / cron-token authorization boundary
- deployed bundle hash: `3616b02ae05628d1ec6389bf8dd8264166ab903c0848362e420b5fe315ee4b9b`

The deployed v10 source bundle was re-read from Supabase and every returned source file matched merge commit `9188061...` byte-for-byte.

Runtime changes include:

- server-only TMDB client/session;
- Film and Series high-confidence matching;
- fail-open enrichment after canonical Guide writes;
- private external-content persistence;
- shared 20 s owner signal for TMDB work plus the external-content PostgREST persistence request;
- no change to public/mobile Guide payloads.

## Trust-boundary closure

Final Independent QA verified the full corrected candidate, including:

- HTTP-200 season arrays are fully decoded before episode membership is derived;
- a matching episode followed by a malformed trailing element is operational `malformed`, not positive identity evidence;
- malformed season data yields provider failure and zero persistence decisions;
- optional Film `release_date` keeps missing/null/empty/whitespace-only as unknown year;
- every other present release date must itself be exact valid calendar `YYYY-MM-DD`;
- whitespace-padded otherwise-valid dates are malformed;
- malformed TMDB schema cannot become deterministic positive or negative identity evidence;
- Film/Series matching thresholds, persistence ownership, D0 forward-fill and leakage boundaries remain unchanged.

## First live enrichment activation

The development EPG cron is:

`17 */6 * * *`

and calls `teevee.enqueue_development_epg_refresh()`.

The migration/runtime deployment completed after the 00:17 UTC EPG run. The connected management SQL channel is intentionally read-only and cannot assume `service_role` or decrypt the Vault cron token. No privilege/security boundary was weakened merely to force a smoke.

The first hosted activation attempt subsequently exposed issue #167. Its production evidence now has two separate phases.

### Phase 1 — pre-filter XMLTV resource failure, closed by PR #168

Before PR #168:
- full `{"mode":"guide-horizon"}` -> HTTP 546 / `WORKER_RESOURCE_LIMIT`, `reason=CPUTime`, 2144 ms CPU, 182,785,670 B memory;
- RTL4-only four-hour window -> the same HTTP 546, 2165 ms CPU, 181,521,784 B memory;
- external-content references remained 0.

The near-identical narrow/full cost proved requested bounds did not constrain the old feed-wide parse. PR #168 merged as `6a9b601ae7e2cac8aa0c2c94302c5aa16411a76f` and replaced schedule reads with the bounded streaming parser.

Post-merge narrow production proof:
- RTL4 four-hour schedule: 5/5 programmes stored, zero diagnostics;
- CPU ~1279–1284 ms, memory ~12–14 MB, normal `EarlyDrop`;
- after `TMDB_API_READ_ACCESS_TOKEN` configuration: 3 eligible / 3 resolved / 3 persisted, zero provider/persistence failures, zero dangling references.

This closes the original parser/materialisation blocker and proves PR #161 external-content identity can populate in production.

### Phase 2 — monolithic guide-horizon CPU ownership, active in issue #167 / PR #172

The required full v12 `guide-horizon` smoke still failed:
- execution `e197a283-8494-4331-94a4-d89e10f52a32`;
- HTTP 546 / `WORKER_RESOURCE_LIMIT`;
- exactly 2000 ms CPU;
- 42,721,750 B (~40.7 MiB) memory;
- 60 schedule-coverage rows had already committed: five television days × twelve channels;
- horizon-level TMDB enrichment had not started.

A realistic one-full-television-day/all-current-12-channel smoke then passed end-to-end:
- 524 programmes stored, zero warnings/errors;
- TMDB 35 eligible / 34 unique identity work / 33 resolved / 2 unresolved;
- 33 references persisted, zero provider/persistence failures;
- 1145 ms CPU, 36,575,924 B (~34.9 MiB), HTTP 200;
- 12 exact coverage rows, zero dangling references.

Therefore the residual correction is orchestration, not another parser rewrite. PR #172 / proposed ADR 0012 makes `guide-horizon` a lightweight durable planner and executes bounded children keyed by source/feed × 06:00 Amsterdam television day × configurable channel group. One common observation timestamp preserves ADR-0007 freshness semantics; each child claims database-owned scope, retries under a lease/attempt token, records durable outcome, and runs existing fail-open TMDB enrichment only after an authoritative stored schedule observation. Current child concurrency is one. The current 12-channel NL group is a measured operational setting, not a catalog invariant; the owner-approved 49-channel iteration can split NL groups and add the Belgian feed without changing orchestration semantics.

Deployment remains gated. During PR #172 Development the connected Supabase project is inspected read-only only: no migration, cron mutation or Edge deployment is performed. After merge/exact-main CI, apply the reviewed orchestration migration first (safe with existing v12 because it does not replace the six-hour enqueue function), deploy exact merged `epg-refresh`, trigger one protected guide-horizon run and verify every child/coverage/external-content outcome, then require the next normal six-hour cron run as independent proof.

Do not manually weaken custom auth, expose secrets, or add a temporary privileged endpoint to accelerate this check.

## Physical-device gate

No physical iPhone/Android gate applies to PR #161 itself because the increment adds no user-visible mobile/UI behavior.

Physical acceptance becomes relevant when external identity is consumed by visible artwork or other mobile presentation.

## Next step

Complete issue #167 / PR #172 through Development, Technical Lead review, Independent QA, merge and exact-main CI; then deploy the durable orchestration migration + exact merged Edge runtime and prove a complete bounded D-3..D+8 run followed by an independent normal six-hour cron run before declaring the production refresh path healthy.
