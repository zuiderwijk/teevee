# ADR 0012 — Durable bounded EPG refresh orchestration

Status: **Proposed in issue #167 / PR #172; pending Technical Lead + Independent QA**
Date: 2026-09-24

## Context

ADR 0008 requires a backend safety horizon of D-3..D+8 around the product-visible D-2..D+7 Guide range. ADR 0007 makes every canonical replacement authoritative for an explicit channel/time scope and rejects stale writes.

PR #168 fixed the original feed-wide XMLTV materialisation problem with a bounded streaming parser. Hosted evidence after merge proves two different CPU shapes:

- one RTL4 four-hour window completes at ~1.28 s CPU and ~12–14 MB;
- one complete current 12-channel television day, including canonical persistence and TMDB enrichment, completes at 1145 ms CPU / ~34.9 MiB;
- one monolithic D-3..D+8 Edge invocation still reaches the hosted 2 s CPU ceiling and is killed after partial canonical progress.

The owner-approved next catalog contains 49 channels and spans at least the Netherlands and Belgian XMLTV feeds. Therefore “one day = all channels” and “one provider feed” cannot become orchestration invariants merely because the present 12-channel NL day fits.

Cron enqueue success is also insufficient operational evidence: production `cron.job_run_details` can report `succeeded` while the asynchronously queued pg_net Edge request later returns HTTP 546.

## Decision

Hosted Guide-horizon refresh is a durable parent run composed of bounded child work items.

The child identity axis is:

`provider source/feed × Amsterdam television-day window × bounded provider-channel group`

### Parent run ownership

A run owns:

- one idempotency/request key;
- one `observed_at` shared by every child;
- one horizon anchor;
- durable queued/running/completed/failed status;
- the exact child set created by the server-side planner.

Authenticated scheduled guide-horizon calls derive a stable six-hour request key. Manual service-key calls receive a unique key unless an explicit safe key is provided. Only an **exact duplicate request key** reuses its existing run. A distinct six-hour bucket is always persisted as its own queued run even while older work is active; it is never silently coalesced into another run. This preserves durable evidence for every scheduled bucket and its anchor/observation ownership.

### Child scope

Postgres owns the real source/window/channel-group scope.

A child HTTP dispatch contains only:

- database job id;
- per-attempt UUID token.

The Edge worker must claim that attempt before doing provider work. Claim returns the server-owned source key, exact [from,to) television-day window, channel-group identity, provider channel IDs and parent `observed_at`.

The caller cannot supply or enlarge child source/window/channel scope.

### Bounded execution and concurrency

Current operational concurrency is one active child globally.

A successful, incomplete or exhausted child immediately allows the next available child to continue. A low-frequency recovery pump exists to recover queued retries and leases whose Edge execution died before terminal completion. It is not the primary throughput mechanism. Dispatch-unavailable conditions such as a missing Vault cron token are persisted on the queued run/job rather than existing only in transient SQL output.

Each source config owns `maxProviderChannelsPerWorkItem`. The current NL source may use 12 because the exact production shape measured 1145 ms CPU including persistence/TMDB. This value is operational capacity evidence, not product semantics and not a promise that 49 channels fit one invocation.

Future source/channel expansion changes configuration and measurements, not orchestration architecture.

### Retry and idempotency

Every dispatch has a lease, bounded attempt count and unique attempt token.

The lease is **8 minutes**. Supabase's current paid hosted Edge limit is 400 seconds wall-clock, so the lease deliberately exceeds the maximum possible worker lifetime by 80 seconds. The recovery pump therefore cannot dispatch a replacement while the previous hosted worker can still be alive, even if pg_net timed out or the client disconnected. This is the single-flight liveness invariant; changing the hosted maximum requires revalidating the lease before rollout.

- duplicate delivery of the same active token performs no second work;
- an expired/old token cannot claim or complete a replacement attempt;
- handled failures may return the job to queued state after a bounded delay;
- worker kills/timeouts are recovered only after the 8-minute lease expiry, when the old hosted worker must already be dead;
- retries keep the original parent observation timestamp.

A child may have committed canonical schedule state before its Edge process dies. Retrying the same observation is safe under ADR 0007; if newer authoritative coverage already exists, the older retry is ignored-stale rather than rolling data backwards.

### Authority and enrichment

Every child still runs the existing provider adapter → normalization/classification → ADR-0007 replacement path.

Durable orchestration authority is stricter than "ingest did not throw":

- child `succeeded` requires either `stored` for **exactly the whole expected canonical channel set**, or `ignored-stale` for that exact set because newer authority already owns it;
- provider partial coverage, unattributed records, no-safe-channel scope, or a channel-local blocked subset are terminal child `incomplete` outcomes;
- parent `completed` means every child succeeded authoritatively;
- parent `incomplete` means no child exhausted to `failed`, but at least one child is terminal incomplete;
- parent `failed` means at least one child exhausted retries; queued/running siblings continue before terminal parent recomputation;
- partial provider coverage never becomes destructive canonical authority;
- classification ownership remains ingest-owned under ADR 0010;
- external-content enrichment remains post-write/fail-open under ADR 0011;
- only a successfully stored observation is eligible for external-content matching; a safe stored subset may be enriched while the enclosing child remains durably incomplete;
- the existing 20 s external-content owner budget and matcher thresholds remain unchanged.

### Operational truth

Durable parent/child state is the refresh completion authority.

pg_cron success means only that its enqueue SQL ran. pg_net/Edge transport and every child terminal state remain independently observable. Failures and incomplete authority are attributable to source, television day, channel group, attempt and request id. Distinct scheduled request keys are never discarded while older runs are active, and dispatch-unavailable reasons are persisted on the affected run/job.

## Deployment ordering

The orchestration migration must be safe before the new Edge runtime:

1. create private run/job state, protected RPCs and recovery pump;
2. do **not** replace the existing six-hour enqueue function in the migration;
3. merge + exact-main CI;
4. apply the exact reviewed migration;
5. deploy the exact merged `epg-refresh`;
6. execute one protected guide-horizon run and prove every child plus canonical/external-content integrity;
7. require a subsequent normal six-hour cron run as independent operational proof.

No production migration, cron mutation or Edge deployment occurs during Development.

## Consequences

Positive:
- no single Edge CPU budget owns the whole horizon;
- partial progress is explicit rather than masquerading as an all-or-nothing failure;
- retries and crash recovery are durable and idempotent;
- 49-channel/multi-feed expansion does not require freshness/auth/retry redesign;
- source/day/channel-group failures are diagnosable.

Costs:
- full horizon completion becomes asynchronous;
- durable orchestration state and one recovery cron are added;
- current serial execution favors resource safety over minimum completion latency;
- crash recovery may wait up to the 8-minute lease so replacement dispatch cannot overlap a still-live hosted worker.

## Non-decisions

This ADR does not:
- implement the 49-channel catalog or Belgian mappings;
- change XMLTV parser semantics from PR #168;
- change ADR 0007/0008 canonical schedule semantics;
- change TMDB matching, persistence, timeout or ownership;
- change Guide/mobile runtime;
- choose long-term production EPG rights/provider.
