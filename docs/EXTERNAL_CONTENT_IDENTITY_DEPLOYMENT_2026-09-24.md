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

The first hosted activation attempt subsequently exposed a separate provider-ingest resource blocker rather than a TMDB/persistence failure.

Production evidence:

- full request `{"mode":"guide-horizon"}` -> HTTP **546** / `WORKER_RESOURCE_LIMIT`, worker shutdown `reason=CPUTime`, `cpu_time_used=2144 ms`, total memory `182,785,670 B`;
- narrow request `{"mode":"window","from":"2026-09-24T09:30:00Z","to":"2026-09-24T13:30:00Z","providerChannelIds":["RTL4.nl"]}` -> the same HTTP **546** / `WORKER_RESOURCE_LIMIT`, `reason=CPUTime`, `cpu_time_used=2165 ms`, total memory `181,521,784 B`;
- external-content reference count remained **0**.

The narrow one-channel/four-hour failure rules out guide-horizon size and TMDB fan-out as sufficient explanations. The pre-issue-#167 XMLTV adapter performed `response.text()`, parsed/materialised every source channel and programme plus rich evidence, and only then filtered the requested provider channel IDs and time range. Requested bounds therefore did not reduce peak provider parse/materialisation.

Issue #167 / PR #168 owns the server-only correction. Development changes only provider consumption/resource ownership: incremental chunk-safe XMLTV scanning applies channel/time bounds before full programme evidence materialisation, and guide-horizon consumes one upstream provider session while preserving independent window authority. PR #161's accepted TMDB matching thresholds, external-content persistence, ADR 0011 ownership and 20 s owner budget remain unchanged.

After #168 review/merge/exact-main CI, production verification must run in this order:

1. deploy the exact merged `epg-refresh`;
2. narrow RTL4 four-hour smoke;
3. full `guide-horizon` smoke;
4. inspect external-content counts/freshness/orphans and fail-open behavior;
5. allow the normal cron run to succeed as an independent operational proof.

Do not manually weaken custom auth, expose secrets, or add a temporary privileged endpoint to accelerate this check.

## Physical-device gate

No physical iPhone/Android gate applies to PR #161 itself because the increment adds no user-visible mobile/UI behavior.

Physical acceptance becomes relevant when external identity is consumed by visible artwork or other mobile presentation.

## Next step

Complete issue #167 / PR #168 through Technical Lead review, Independent QA, merge and exact-main CI; then deploy and prove narrow RTL4 -> full guide-horizon -> normal cron in that order before declaring hosted external-content activation healthy.
