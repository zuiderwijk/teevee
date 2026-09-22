# PR #127 Editorial Persistence Recovery Evidence — 2026-09-23

Status: **Development evidence complete; return to Lead required. Do not merge or send to Independent QA yet.**

## Scope

Lead REQUIRED FIX #5785619629 reviewed PR #127 at `c23609dc579438242c46fb5888ea0483b80b94e9` and accepted the current Guide UI/runtime. This correction therefore changes **persistence only**.

Frozen and untouched:
- Nu & Straks `channelIdentityZone` bottom alignment;
- all Nu & Straks row/reference/following geometry;
- Per-zender time origin X24;
- Per-zender surface X19, padding5, min width48;
- standard surface Y2…50;
- current surface Y16…64;
- title X100/right24;
- editorial colours and all other Guide visual/runtime contracts.

## Direct historical source evidence

No general TVgids news source and no title-only inference is used.

PR #120 temporarily captured the live, rights-cleared `https://www.tvgids.nl/tips.rss` source in GitHub Actions.

### Raw feed evidence

PR #120 job `106846180653` succeeded and captured at `2026-09-22T16:55:31.244Z`.

RSS item 9:
- title: `De slimste mens`;
- channel: `NPO 1`;
- start: `Tue, 22 Sep 2026 21:30:00 +0200` = `2026-09-22T19:30:00Z`;
- end: `22:20 +0200`;
- pubDate: `Mon, 21 Sep 2026 22:15:00 +0200`;
- GUID/link: `https://www.tvgids.nl/nieuws/televisie/de-slimste-mens-kiki-boreel-amusement-quiz-npo-1-2026-09-22`.

The `/nieuws/televisie/` URL is evidence only because it was the GUID/link emitted by **tips.rss**. Its existence as an article is not used as Kijktip evidence.

### Deterministic match evidence

PR #120 job `106846829261` succeeded and matched that exact item under the established Tier-B rules:
- status: `matched`;
- canonical programme: `programme-0gh2ai605h9qyw`;
- canonical title: `De slimste mens`;
- canonical start: `2026-09-22T19:30:00Z`;
- start delta: **0 minutes**.

A read-only inspection of the hosted Teevee database during this fix found that exact retained canonical NPO 1 programme at 19:30 UTC with **no** persisted editorial signal. That closes the evidence chain for a narrowly scoped recovery.

## Recovery contract

The still-unapplied forward migration contains one allowlisted source-evidence tuple, but deliberately does **not** hardcode canonical programme ID.

At migration application it resolves the captured evidence using a strict Tier-B subset:
1. source = `tvgids`, signal type = `kijktip`;
2. explicit canonical channel = `nl-npo-1`;
3. exact source title = `De slimste mens`;
4. source start = `2026-09-22T19:30:00Z`, tolerance ±5 minutes;
5. exactly one retained canonical candidate;
6. broadcast has started;
7. neither that source item nor that canonical programme already owns a signal.

Missing/ambiguous/conflicting state produces no recovery row. The insert uses `ON CONFLICT DO NOTHING`, so reevaluating the migration body is idempotent.

The recovery stores:
- the captured tips.rss GUID/link as `source_item_id` / `source_url`;
- the captured publication instant;
- `matched_by = channel-title-start`;
- the PR #120 feed capture instant as recovery `refreshed_at`.

It never changes `editorial_source_state.last_success_at`; only the diagnostic signal count is reconciled.

## Reconciliation-order correction

Canonical `Programme.id` includes broadcast start. A schedule correction can therefore produce:

`same TVgids sourceItemId -> corrected start -> new canonical programmeId`.

The unique `(source, signal_type, source_item_id)` constraint stays intact.

Within the existing source advisory lock and after stale/validation checks, reconciliation order is now:
1. delete an existing binding when the same incoming `sourceItemId` explicitly points to a different canonical programme;
2. remove orphan signals whose canonical programme no longer exists;
3. remove omitted signals whose canonical programme is still future;
4. upsert incoming matched signals;
5. recompute source diagnostic signal count and update source freshness.

Started historical retention still applies to **simple omission**. An explicit same-source-item rematch is stronger evidence and rekeys the source identity instead.

## Executed disposable PostgreSQL smoke

The local agent container does not provide Docker, Postgres, `psql` or the Supabase CLI. No disposable hosted Supabase branch already existed, and creating one would be a separate cost-bearing action.

The existing GitHub Actions environment does support isolated service containers, so a temporary PR-only job ran the actual migration against **PostgreSQL 17** without touching production.

Evidence:
- smoke head: `e927eb320283742c5b1f403527b0bc33e7666f5f`;
- CI run: **#961 / 35795611230**;
- job: **editorial-migration-smoke / 106974086358 — SUCCESS**;
- migration file under test: `supabase/migrations/20260922235737_preserve_started_editorial_signals.sql`;
- transaction: explicit `BEGIN` … `ROLLBACK`.

Observed execution:
- first migration evaluation recovered the owner-observed evidence: `INSERT 0 1`;
- second evaluation proved recovery idempotence: `INSERT 0 0`;
- lifecycle assertion block completed as `DO`;
- transaction completed as `ROLLBACK`.

The assertion block executed all required cases:
- future present;
- future omitted;
- started present;
- started omitted;
- same sourceItemId rematched from an old canonical programme at 14:00 to a corrected canonical programme at 14:02;
- orphan cleanup;
- stale refresh rejection without mutation;
- historical getter visibility.

The temporary workflow job is removed before the final PR head. The reusable smoke SQL remains at `server/editorial/editorialMigrationSmoke.sql`.

## Production migration state

The PR migration has **not** been applied to the hosted Teevee project.

The hosted database remains on the pre-PR editorial migration history. No production DDL, data backfill or migration-history repair was performed during this Development session.

## Remaining gates

1. final exact-head CI;
2. Lead exact-head review.

Do not merge and do not send to Independent QA from Development.
