# ADR 0012 — Durable bounded EPG refresh orchestration

Status: **Proposed in issue #167 / PR #172; pending Technical Lead + Independent QA**
Date: 2026-09-24

## Context

ADR 0008 requires a backend safety horizon of D-3..D+8 around the product-visible D-2..D+7 Guide range. ADR 0007 makes every canonical replacement authoritative for an explicit channel/time scope and rejects stale writes. ADR 0011 requires a guide-horizon refresh to finish all canonical Guide work before its first TMDB request.

PR #168 fixed the original feed-wide XMLTV materialisation problem with a bounded streaming parser. Hosted evidence after merge proves two different CPU shapes:

- one RTL4 four-hour window completes at ~1.28 s CPU and ~12–14 MB;
- one complete current 12-channel television day, including canonical persistence and TMDB enrichment, completes at 1145 ms CPU / ~34.9 MiB;
- one monolithic D-3..D+8 Edge invocation still reaches the hosted 2 s CPU ceiling and is killed after partial canonical progress.

The owner-approved next catalog contains 49 channels and spans at least the Netherlands and Belgian XMLTV feeds. Therefore “one day = all channels” and “one provider feed” cannot become orchestration invariants merely because the present 12-channel NL day fits.

Cron enqueue success is also insufficient operational evidence: production `cron.job_run_details` can report `succeeded` while the asynchronously queued pg_net Edge request later returns HTTP 546.

## Decision

Hosted Guide-horizon refresh is a durable parent run composed of bounded child work items.

The Guide child identity axis is:

`provider source/feed × Amsterdam television-day window × bounded provider-channel group`

### Parent run ownership

A run owns:

- one idempotency/request key;
- one `observed_at` shared by every Guide child and its deferred identity work;
- one horizon anchor;
- durable Guide authority status `queued | running | completed | incomplete | failed`;
- separately observable external-content lifecycle `pending | running | completed | skipped | failed`;
- the exact child set created by the server-side planner.

Authenticated scheduled guide-horizon calls derive a stable six-hour request key. Manual service-key calls receive a unique key unless an explicit safe key is provided. Only an **exact duplicate request key** reuses its existing run. A distinct six-hour bucket is always persisted as its own queued run even while older work is active; it is never silently coalesced into another run.

### Child scope and run envelope

Postgres owns the real source/window/channel-group scope.

A dispatched HTTP child contains only:

- database job id;
- per-attempt UUID token.

The Edge worker must claim that attempt before doing work. Guide claim returns the server-owned source key, exact [from,to) television-day window, channel-group identity, provider channel IDs and parent `observed_at`. Deferred external-content claim returns only the private lifecycle-staged observation for that already-completed Guide child. The caller cannot supply or enlarge either scope.

The durable run envelope is **1..1024 work items**. This is an operational bound, not a catalog constant. The approved 49-channel topology fits even at the deliberately worst-case group size of one channel: **49 × 12 television days = 588 Guide work items**. Deterministic planner and executable SQL regressions lock that boundary.

### Bounded execution and concurrency

Current operational concurrency is one hosted child globally across both phases.

A terminal Guide child permits the dispatcher to continue with the next available Guide job. A low-frequency recovery pump exists to recover queued retries and expired leases; it is not the primary throughput mechanism. Dispatch-unavailable conditions such as a missing Vault cron token are persisted on the queued run/job rather than existing only in transient SQL output.

Each source config owns `maxProviderChannelsPerWorkItem`. The current NL source may use 12 because the exact production shape measured 1145 ms CPU including persistence/TMDB. This value is capacity evidence, not product semantics and not a promise that 49 channels fit one invocation.

Future source/channel expansion changes configuration and measurements, not orchestration architecture.

### Retry and idempotency

Every Guide or external-content dispatch has its own lease, bounded attempt count and unique attempt token.

The lease is **8 minutes**. Supabase's current paid hosted Edge limit is 400 seconds wall-clock, so the lease deliberately exceeds the maximum possible worker lifetime by 80 seconds. The recovery pump therefore cannot dispatch a replacement while the previous hosted worker can still be alive, even if pg_net timed out or the client disconnected. This is the single-flight liveness invariant; changing the hosted maximum requires revalidating the lease before rollout. Platform-limit source: [Supabase Edge Functions — Limits](https://supabase.com/docs/guides/functions/limits).

- duplicate delivery of the same active token performs no second work;
- an expired/old token cannot claim or complete a replacement attempt;
- handled failures may return the relevant phase to queued state after a bounded delay;
- worker kills/timeouts are recovered only after the 8-minute lease expiry;
- Guide retries keep the original parent observation timestamp.

A Guide child may have committed canonical schedule state before its Edge process dies. Retrying the same observation is safe under ADR 0007; if newer authoritative coverage already exists, the older retry is `ignored-stale` rather than rolling data backwards.

### Guide authority

Every Guide child still runs the existing provider adapter → normalization/classification → ADR-0007 replacement path.

Durable orchestration authority is stricter than “ingest did not throw”:

- child `succeeded` requires either `stored` for **exactly the whole expected canonical channel set**, or `ignored-stale` for that exact set because newer authority already owns it;
- provider partial coverage, unattributed records, no-safe-channel scope, or a channel-local blocked subset are terminal child `incomplete` outcomes;
- parent `completed` means every Guide child succeeded authoritatively;
- parent `incomplete` means no child exhausted to `failed`, but at least one child is terminal incomplete;
- parent `failed` means at least one Guide child exhausted retries;
- partial provider coverage never becomes destructive canonical authority;
- classification ownership remains ingest-owned under ADR 0010.

### ADR-0011 external-content phase

PR #172 preserves ADR 0011 rather than weakening it.

A Guide child **never calls TMDB**. After a successfully stored canonical observation it may stage only the already-existing eligible server-only tuple needed for Film/Series matching inside its private orchestration row. That staging is:

- lifecycle-bound, not canonical content storage;
- unavailable to mobile/public callers;
- derived from the same provider observation as the canonical write;
- limited to current/future high-confidence Film/Series candidates;
- cleared when its external-content lifecycle becomes terminal.

The dispatcher gives canonical Guide work strict priority. No new `external-content-work-item` is dispatched while any Guide job is `queued | dispatched | running`. Therefore all non-throwing Guide processing finishes before the first TMDB request.

After Guide processing is terminal:

- a `completed` run may enrich its staged observations;
- an `incomplete` run may enrich only authoritative stored safe subsets; the incomplete Guide authority is not upgraded by enrichment;
- a `failed` run **does not run TMDB**. Any staged evidence is marked `skipped`, given reason `guide-run-failed-before-enrichment`, and deleted.

Deferred enrichment then uses the unchanged ADR-0011 matcher/persistence pipeline and existing **20 s owner budget per attempt**. Its durable success rule is operational, not semantic: `completed` is allowed only when the owner-level result is available **and** both `providerFailureCount` and `persistenceFailureCount` are zero. Legitimate matcher outcomes such as unresolved or ambiguous remain successful work and do not retry.

Owner-level `unavailable` (including missing TMDB secret or owner timeout/catastrophic enrichment failure), any non-zero provider failure count, and any non-zero persistence failure count are `retryable-failure`. The same lifecycle-staged observation is retained across those attempts; replay is safe because matching is deterministic for the same evidence and broadcast-keyed persistence already owns freshness/idempotency. Attempts remain bounded at three and use the existing 30-second retry delay plus 8-minute lease. On retry success, staging is cleared and external-content becomes `completed`. On third-attempt failure, external-content becomes durably `failed` and staging is cleared so no later worker can consume stale lifecycle evidence.

This failure lifecycle is **strictly fail-open relative to Guide**: it never changes `completed | incomplete | failed` Guide authority, never rolls back canonical schedule state, and never blocks a Guide child. The run exposes Guide authority and external-content lifecycle independently.

### Operational truth

Durable parent/child state is the refresh completion authority.

pg_cron success means only that its enqueue SQL ran. pg_net/Edge transport, Guide authority and deferred external-content state are independently observable. Failures/incomplete authority are attributable to source, television day, channel group, attempt and request id. Distinct scheduled request keys are never discarded while older runs are active, and dispatch-unavailable reasons are persisted.

The exact migration is behaviorally executed in normal CI against disposable **PostgreSQL 17**, with controlled Supabase-compatible stubs. The smoke exercises the migration itself: role boundaries, duplicate/stale attempts, lease recovery, retries/exhaustion, distinct buckets, Guide authority aggregation, Guide-before-TMDB ordering, failed-run suppression, owner-level unavailable retry, provider/persistence failure retry, retry-to-success, external-content max-attempt failure with staging cleanup, Guide-authority isolation and the 588-job worst-case envelope.

## Deployment ordering

The orchestration migration must be safe before the new Edge runtime:

1. create private run/job state, protected RPCs and recovery pump;
2. do **not** replace the existing six-hour enqueue function in the migration;
3. merge + exact-main CI;
4. apply the exact reviewed migration;
5. deploy the exact merged `epg-refresh`;
6. execute one protected guide-horizon run and prove every Guide child plus the deferred external-content lifecycle and canonical integrity;
7. require a subsequent normal six-hour cron run as independent operational proof.

No production migration, cron mutation or Edge deployment occurs during Development.

## Consequences

Positive:
- no single Edge CPU budget owns the whole horizon;
- partial Guide progress is explicit rather than masquerading as all-or-nothing success;
- ADR-0011 Guide-before-TMDB sequencing survives multi-invocation orchestration;
- retries and crash recovery are durable and idempotent;
- the 49-channel/multi-feed expansion fits the same architecture even at group size one;
- source/day/channel-group/phase failures are diagnosable.

Costs:
- full horizon completion is asynchronous;
- eligible provider identity evidence may live briefly in a private orchestration row between the Guide and TMDB phases;
- durable orchestration state and one recovery cron are added;
- serial execution favors resource safety and Guide priority over minimum completion latency;
- crash recovery may wait up to the 8-minute lease so replacement dispatch cannot overlap a still-live hosted worker.

## Non-decisions

This ADR does not:
- implement the 49-channel catalog or Belgian mappings;
- change XMLTV parser semantics from PR #168;
- change ADR 0007/0008 canonical schedule semantics;
- change TMDB matching thresholds, persistence ownership, timeout or 20 s budget;
- turn staged provider evidence into canonical/history/cache state;
- change Guide/mobile runtime;
- choose long-term production EPG rights/provider.
