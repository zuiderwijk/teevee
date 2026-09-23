# Guide Search hosted deployment evidence — 2026-09-23

Status: **DEPLOYED / LIVE VERIFIED**

## Accepted repository candidate

- PR #132 — `Phase 5A: establish Guide Search architecture`
- exact accepted head: `8bdc679f28289a7ccf5b8445aa7f2c42e13b35df`
- merge commit: `3c7ebcf906ff64bb2b6b71c04d177a20519eb2a0`
- Independent QA PASS: PR comment #5787177734
- final Lead merge gate PASS: PR comment #5787185229

Exact-main CI #985 / run `35804775124` completed successfully on the merge commit:
- classifier: PASS;
- strict TypeScript: PASS;
- lint: PASS;
- 89 test files / 670 tests: PASS;
- iOS/Android/web export: PASS;
- clean Android prebuild/autolinking/exact-alarm verification: PASS;
- full-ABI Android debug APK build: PASS.

## Database deployment

The exact reviewed Search migration SQL blob:

`d232eacbf3b809d23ae9c4eeb9a15ea2ffc20380`

was applied to hosted Teevee project `eokszvpityhtysbwdduy` after PR #132 merged.

Supabase recorded the deployment as:

`20260923064120_create_guide_search_read_boundary`

Repository closeout aligns the canonical migration filename to that remote version without changing SQL bytes.

Live verification after deployment:
- `unaccent` is installed in schema `extensions`;
- `teevee.search_guide` is `SECURITY INVOKER`;
- function `search_path` is empty;
- `anon` EXECUTE on `public.teevee_search_guide(...)`: false;
- `authenticated` EXECUTE: false;
- `service_role` EXECUTE: true.

Supabase security advisors reported no new Guide Search-specific blocker. Existing notices remain the intentional no-policy state on private `teevee` RLS tables and the pre-existing `pg_net`-in-public warning.

## Edge deployment

### `guide-search`

- status: ACTIVE;
- version: 1;
- `verify_jwt=false` (public read endpoint; privileged database capability remains inside the Edge runtime);
- deployed bundle hash: `a97e82bd59bb43c175926b2d475e3abf5057b5f000583cc269e6027797d41629`;
- 12/12 deployed files were compared to merge commit `3c7ebcf...` and matched byte-for-byte.

### `guide-schedule` shared runtime refactor

PR #132 also moved the existing public Guide read onto the shared hardened Edge runtime helper. That non-product-behaviour refactor was deployed so production matches `main`:

- status: ACTIVE;
- version: 7;
- `verify_jwt=false`;
- deployed bundle hash: `585de9ce13f43ff374db2fd8e51595379adfe2cd27dc5eb513fa5c4888a38530`;
- 10/10 deployed files matched merge commit `3c7ebcf...` byte-for-byte.

## Real production endpoint smoke

A temporary PR-only GitHub Actions job called the actual public production endpoint:

`https://eokszvpityhtysbwdduy.supabase.co/functions/v1/guide-search`

CI #986 / run `35828454528`, job `guide-search-live-smoke` / `107075306874`: **SUCCESS**.

Assertions passed:
1. channel query `NPO` returned `status: ok`, a valid programme-coverage value and canonical channel `nl-npo-1`;
2. programme query `Goedemorgen Nederland` returned `status: ok` and a concrete canonical NPO 1 broadcast with matching programme/channel identity.

`Goedemorgen Nederland` was selected from the live canonical store immediately before the smoke, so this was not a fixture-only verification.

The temporary workflow job is removed again before the final closeout head. The permanent evidence is this document plus the retained contract/unit/migration tests.

## Tooling boundary

The local container available to the deployment session had no outbound DNS, and the Supabase SQL connector runs read-only for `pg_net` plus without `service_role` role-switch privileges. Those limitations prevented using local `curl` or MCP SQL as the final public HTTP smoke. They were not treated as proof. The network-enabled GitHub Actions live smoke above independently exercised the real public Edge endpoint instead.

## Outcome

The hosted Guide Search boundary is now operationally proven end-to-end:

`public Edge POST -> server-owned D-2..D+7 horizon -> service-role-only canonical Search RPC -> bounded canonical channel/programme response`

Phase 5A may proceed to the mobile Search UI/runtime increment. That next increment still owns debounce/stale-response handling, loading/no-match/partial/unavailable presentation, Programme Detail and Per-zender navigation wiring, accessibility, Dynamic Type, measured performance, physical iPhone validation and Independent QA.
