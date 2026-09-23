# Vanavond D0 classification recovery — development evidence

Date: 2026-09-23  
Issue: #151  
PR: #152  
Development branch: `fix/d0-classification-recovery`  
Canonical base at implementation start: `ca499efb8563a5344f47552be8b2937a4331c98b`  
Hosted project inspected read-only: `eokszvpityhtysbwdduy`

## Problem

The accepted production Vanavond runtime correctly fails closed when a concrete programme has no `ProgrammeClassification` sibling.

Physical Live validation on 23 September exposed a classification bootstrap gap in the active television day, not a Vanavond UI/content-selection bug and not a classifier failure.

Read-only hosted SQL before this change proved:

| Scope | Canonical programmes | Classifications | Evening candidates | Classified evening | Film eligible | Series eligible | Sport eligible |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| D0 — 23 Sep 06:00 → 24 Sep 06:00 CEST | 513 | 5 | 136 | 5 | 0 | 0 | 0 |
| D+1 — 24 Sep 06:00 → 25 Sep 06:00 CEST | 520 | 520 | 142 | 142 | 6 | 14 | 1 |

Additional hosted evidence:

- D0 has 12 canonical `schedule_coverage` rows, all generated at `2026-09-23T00:17:01.240Z`;
- D+1 has 12 coverage rows generated at `2026-09-23T18:17:01.183Z`;
- the five D0 classification rows are all classified at `2026-09-23T18:17:01.183Z` and belong to broadcasts crossing/intersecting the D+1 replacement boundary;
- classification orphans before recovery: **0**;
- hosted `epg-refresh` is ACTIVE v7 and `programme-classifications` is ACTIVE v1;
- migration history contains the original classification foundation `20260923144656_create_programme_classification_foundation`, but no recovery migration.

No hosted data was modified while collecting this evidence.

## Root cause

The original classification deployment deliberately used the normal authoritative `guide-horizon` refresh as its backfill.

That path is correct for complete provider windows because normal ingest atomically replaces the canonical schedule and its classification siblings. At the deployment refresh, D+1…D+5 were source-complete and stored; D0 was partial and correctly skipped under ADR-0007.

D0 canonical rows already existed from an earlier pre-classification authoritative write. Because the migration intentionally cannot reconstruct semantics from lossy canonical `Programme.genre`, those retained rows stayed without siblings.

The missing architectural distinction was:

> **authoritative schedule replacement completeness != enrichment recovery eligibility**

A partial provider window must never become schedule authority. But one concrete provider row inside that partial observation can still carry enough full structured evidence to derive a classification for an exact already-retained canonical broadcast.

## Development solution

PR #152 adds one protected classification-specific recovery path. It does not change mobile Vanavond, classification semantics or normal schedule replacement.

Flow:

`bounded provider observation → existing normaliser + central classifier → exact current canonical reconciliation → classification-only upsert`

### Provider observation

`observeProviderSchedule` separates fetch/normalisation from write authority. Normal authoritative `ingestProviderSchedule` delegates to that observation but retains all existing rules:

- partial coverage → schedule write skipped;
- unattributed unsafe provider data → schedule write skipped;
- no safe channel scope → schedule write skipped;
- complete safe scope → existing classified `replaceWindow`.

### Exact reconciliation

The recovery RPC writes only when the currently stored canonical row exactly equals the normalized provider candidate on:

- canonical `Programme.id`;
- `channelId`;
- `startAt`;
- `endAt`;
- title.

This deliberately rejects title-only/start-near matching.

For the current XMLTV source, no stable provider programme ID is exposed, so canonical identity is generated from provider key + canonical channel + start + end + title. Start/end/title correction therefore generates a different ID and cannot accidentally attach the corrected evidence to the stale retained row.

A future provider with stable programme IDs still must pass channel/start/end/title equality before recovery writes.

### Concurrency and staleness

The persistence RPC:

- takes the same per-channel PostgreSQL advisory locks as canonical schedule replacement;
- compares recovery `observedAt` with current overlapping `schedule_coverage.generated_at`;
- compares `observedAt` with an already-present sibling's `classified_at`;
- writes nothing for a newer schedule/classification;
- upserts only `teevee.programme_classifications`;
- never mutates `teevee.programmes`, `teevee.channels`, `teevee.schedule_coverage` or unrelated siblings.

If recovery wins the lock first, a later authoritative replacement still owns correction/deletion and cascade lifecycle. If authoritative replacement wins first with newer evidence, recovery observes the newer coverage/classification and skips.

### Hosted transport

The existing protected `epg-refresh` function gains a bounded `classification-recovery` mode with the same authentication and provider-channel allowlist as other refresh operations.

The mode is limited to the existing hosted maximum 25-hour window. It is not called by Guide or Vanavond and does not alter mobile loading.

## PostgreSQL lifecycle proof

A disposable PostgreSQL 17 workflow executes the real base schedule migration, original classification migration, new recovery migration and `server/classification/classificationMigrationSmoke.sql`.

The smoke covers:

- exact missing sibling recovery;
- canonical programme count unchanged;
- unrelated canonical programme retained;
- schedule coverage/freshness unchanged;
- repeated recovery idempotency;
- corrected/rekeyed provider row failing closed;
- later authoritative correction owning the new programme/sibling pair;
- stale recovery not rolling back newer classification;
- zero orphan classifications.

The disposable workflow is removed before final PR handoff. Its run/job is recorded in the PR handoff.

## Production deployment/recovery plan — NOT EXECUTED

No migration, Edge Function deployment or production recovery is authorized before Technical Lead review.

After merge/review approval, the intended bounded sequence is:

1. verify exact merged main + CI;
2. apply the exact merged recovery migration;
3. deploy exact merged `epg-refresh` bundle;
4. snapshot pre-recovery D0:
   - canonical programme count;
   - schedule coverage row count and `generated_at`;
   - classification count/completeness;
   - evening candidate/classified count;
   - eligible Film/Series/Sport counts;
   - orphan count;
   - D+1…D+5 classification completeness;
5. invoke protected `classification-recovery` for exactly:
   - from: `2026-09-23T04:00:00.000Z`;
   - to: `2026-09-24T04:00:00.000Z`;
   - allow-listed current development provider channels;
6. record provider coverage plus candidate/matched/recovered/stale/unmatched response counts;
7. verify post-recovery:
   - D0 canonical programme count remains **513** unless an independently authorized newer schedule refresh has changed canonical state before execution;
   - the 12 D0 coverage rows and their freshness remain byte/semantically unchanged by the recovery invocation itself;
   - classification sibling count increases only for exact current matches supported by returned provider evidence;
   - no sibling is fabricated for missing/corrected provider rows;
   - eligible Film/Series/Sport reflect recovered real semantics, with missing classifications still failing closed;
   - orphan classifications = **0**;
   - D+1…D+5 schedule/classification completeness does not regress;
8. physically verify Vanavond → Live against the recovered production data.

If canonical D0 has legitimately moved before deployment, capture the then-current baseline and apply the same invariants rather than asserting historical count 513 blindly.

## Safety conclusion

This is not a relaxation of ADR-0007. Partial provider coverage remains non-authoritative for schedule state.

It is also not an independent classification truth source: recovery uses the same provider evidence interpreter and central classifier as normal ingest, attaches only to exact current canonical broadcasts, and remains subordinate to authoritative correction/deletion lifecycle.

No production recovery has been executed by this Development work.
