# ADR 0009 — Hosted canonical Guide Search read boundary

Status: ACCEPTED / FROZEN  
Date: 2026-09-23

## Context

Phase 5A Guide Search must answer whether a concrete programme is on television, when it airs and on which channel, across the same D-2..D+7 television-day horizon as Guide.

The accepted mobile Guide architecture deliberately does **not** keep those ten television days resident. Current/selected Guide windows are loaded independently and only visited windows are retained in a small in-memory session cache. Implementing Search by eager ten-day mobile prefetch would therefore duplicate data, increase memory/network work and reopen a proven Guide loading architecture for no product benefit.

Search also needs to distinguish:
- a true no-match over authoritative canonical data;
- a partially searchable horizon;
- unavailable programme coverage;
- channel retrieval, which can remain useful even when programme windows are unavailable.

The Search product contract explicitly excludes fuzzy/semantic/AI search and title-only catalogue identity.

## Decision

Teevee implements Phase 5A Guide Search as a **dedicated provider-independent hosted read boundary over canonical schedule storage**.

### Server-owned horizon

- The server derives the exact ten D-2..D+7 television-day windows through the shared ADR 0008 `guideTelevisionDayHorizon` primitive.
- Windows remain 06:00 Europe/Amsterdam → 06:00 next local day and therefore preserve 23/24/25-hour DST behaviour.
- Mobile sends only the normalized user query to the public Search endpoint. It never constructs provider/storage queries or preloads the full Guide horizon.

### Canonical Search repository

A dedicated `GuideSearchRepository` separates Search semantics from `ScheduleRepository`.

One repository call receives:
- the query;
- the server reference instant;
- the ten exact canonical television-day windows;
- bounded programme/channel result limits.

It returns only:
- canonical `Channel` matches;
- concrete canonical `Programme` + `Channel` broadcast matches;
- aggregate programme coverage: `complete | partial | unavailable`.

Full `GuideSchedule` payloads do not cross this boundary.

### Coverage semantics

Canonical `schedule_coverage` remains authoritative.

Coverage is evaluated per **active canonical channel × television-day window**:
- a programme may contribute only when its own channel/window pair is fully authoritative;
- `complete` means every required active-channel/window pair is covered;
- `partial` means at least one but not all required pairs are covered;
- `unavailable` means none of the required programme scope is authoritative.

This deliberately allows useful programme results from covered channel/day pairs without fabricating certainty for uncovered pairs.

Channel Search is independent from programme-window coverage and may remain available from canonical channel identity when programme coverage is unavailable.

### Lexical matching and ranking

Phase 5A remains deliberately lexical:
- trim/collapse whitespace;
- case-insensitive;
- diacritic-insensitive;
- normalize common punctuation/apostrophe differences;
- `&` normalizes to `en`;
- match classes are exact, then prefix, then substring;
- no fuzzy/Levenshtein, trigram similarity, vector/semantic or AI interpretation.

Programme ranking follows the product contract:
1. match class;
2. within that class: currently airing;
3. future nearest-first;
4. historical newest-first;
5. canonical channel order;
6. canonical `Programme.id`.

Concrete repeats stay separate broadcasts.

### Bounded results

Phase 5A bounds both programme and channel results at the API/repository boundary. The initial limit is 24 for each result type.

No pagination or infinite result feed is introduced in this slice.

### Supabase implementation

The current hosted implementation uses:
- private `teevee.search_guide`;
- public PostgREST bridge `public.teevee_search_guide`;
- `SECURITY INVOKER`;
- empty `search_path`;
- execute revoked from `PUBLIC`, `anon` and `authenticated`;
- execute granted only to `service_role`;
- `unaccent` installed in the `extensions` schema for deterministic diacritic-insensitive matching.

The public `guide-search` Edge Function owns the service-role secret and exposes only the typed provider-independent Search contract. Mobile never receives database/provider identity or privileged credentials.

This is an implementation behind the repository/API contract, not a product dependency on Supabase.

### Editorial enrichment

Kijktip remains optional sibling metadata keyed by exact canonical `Programme.id`.

Search fetches editorial signals only for the bounded returned programme IDs. Editorial read failure yields no Search editorial metadata and does not downgrade otherwise valid canonical results.

Kijktip is not a ranking signal.

### Navigation ownership

Search produces transient explicit navigation intent:
- programme result → Programme Detail for that exact canonical broadcast;
- channel result → Per zender for that canonical channel at a useful reference instant.

Search navigation must not rewrite unrelated persistent Guide/user preferences as an implementation shortcut.

## Consequences

- Guide loading/runtime architecture remains unchanged.
- Search has a single bounded hosted request instead of ten full schedule payloads per query.
- No new catalogue/series identity is introduced.
- No new mobile cache/state framework is introduced.
- No trigram/vector/search-service dependency is introduced.
- A future storage implementation can replace Supabase without changing the mobile Search contract.
- Partial coverage remains explicitly visible to UI/runtime and cannot be mistaken for a trustworthy global no-result state.
- Query cancellation/stale-response ownership remains a mobile Search-runtime concern; the API/repository contract is deterministic and stateless per request.
- Performance should be measured with realistic retained programme volume before adding normalized-title indexes or stronger search infrastructure.

## Verification contract

Architecture changes at this boundary require deterministic evidence for:
- exact/prefix/substring normalization/ranking;
- 05:59 → 06:00 horizon rollover;
- 23/25-hour DST television days;
- complete/partial/unavailable coverage;
- channel Search independence from programme coverage;
- covered channel/day contribution while another pair is uncovered;
- bounded result identities;
- canonical transport validation;
- service-role-only database privileges;
- optional editorial fail-open;
- deployable Edge runtime import graph;
- executable PostgreSQL migration smoke.

Physical-device acceptance is not required for this ADR itself because it changes no user-facing Search UI, Guide gesture/layout or native interaction. The subsequent Search UI/runtime increment receives its own accessibility/performance/device gates.
