# ADR 0007 — Canonical schedule storage and refresh semantics

Status: Accepted  
Date: 2026-09-14

## Context
Phase 3 introduces real schedule data without coupling Teevee to one EPG provider or one database. Schedule data is mutable: broadcasters correct start/end times, feeds can be partial, multiple channel windows may refresh independently, and network requests can complete out of order.

A simple programme upsert is not enough to distinguish a legitimate empty schedule from missing data, protect unrelated channels during partial refreshes, or stop an older late response from rolling newer schedule data backwards.

## Decision
Canonical schedule persistence follows these backend-independent semantics:

- Reads use a serialisable `GuideScheduleQuery` with a `[from,to)` time range and optional canonical channel IDs.
- A programme belongs to a query when `programme.start < to && programme.end > from`.
- Replacement writes always declare both their time window and explicit canonical channel scope.
- Channel/time coverage is authoritative metadata, separate from whether programmes happen to exist in that window.
- A fully covered window with zero programmes is a valid empty schedule. An uncovered or only partly covered requested scope is unavailable and must not be presented as an authoritative empty result.
- Freshness is tracked per covered channel/time segment. A combined read reports the oldest freshness that contributes to the returned scope rather than a misleading global latest timestamp.
- An incoming write that overlaps newer authoritative coverage is rejected atomically as `ignored-stale`; it may not partly overwrite newer canonical data.
- Ingestion timestamps a refresh when the provider request starts, not when it finishes, so completion order cannot make an older delayed request appear newer.
- Provider adapters explicitly classify schedule batches as `complete` or `partial`. Only complete/authoritative batches may replace canonical windows.
- Malformed provider data blocks destructive replacement only for safely attributable affected channels. An unattributed malformed row blocks the destructive write because its scope cannot be proven safe.
- Provider-specific fields and IDs remain outside the public canonical schedule/API contract.

The in-memory repository is an executable reference for these semantics and deterministic tests only. It is not the production persistence choice.

## Scope boundary
This ADR deliberately does **not** choose PostgreSQL, Supabase, SQLite or another database, nor a concrete EPG supplier. Any production repository implementation must preserve these semantics.

Mobile offline-cache policy is also separate. A future mobile cache may use a different storage engine while still consuming the same provider-independent `GuideSchedule` contract.

## Consequences
- Schedule corrections can replace stale rows without erasing neighbouring time windows or unrelated channels.
- Legitimate empty provider windows cannot be confused with absence of canonical data.
- Out-of-order refresh completion is safe by construction.
- A future SQL schema must model authoritative coverage/freshness as well as programme rows; programme rows alone are insufficient.
- Backend migrations and API transports can be changed without changing Guide components, provided the repository/API contracts remain intact.
- Conservative stale-write rejection may skip a mixed multi-channel write when any target channel overlaps newer coverage. This is intentional safety; batching can be refined later if measurement demonstrates a need.
