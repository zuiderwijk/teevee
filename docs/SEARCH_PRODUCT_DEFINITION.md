# Phase 5A — Guide Search Product Definition

Status: **CANONICAL PRODUCT CONTRACT — Phase 5A closed; amended 24 September 2026 with queued channel-personalisation/Search bridge**  
Activated: 2026-09-23  
Owner: Teevee product  
Scope: first slice of Phase 5 — Search and Discovery

## Purpose

Guide Search answers one concrete television question as quickly as possible:

> **Is this programme on television, when is it on, and on which channel?**

It also gives direct access to a known channel.

Search is retrieval, not a second discovery feed. It operates on the same canonical linear-TV domain as Guide and Programme Detail.

## Product principles

1. **Broadcast-first, not catalogue-first.** Teevee's useful object is a concrete broadcast with a real channel and time.
2. **Fast and calm.** One prominent field, immediate useful results, no engagement mechanics.
3. **Guide-consistent.** Search uses the same canonical `Channel`, `Programme`, television-day horizon and Programme Detail semantics as Guide.
4. **Provider-independent.** Mobile Search never reads an external EPG feed or provider-specific identity directly.
5. **Fail honestly.** No-result and unavailable-guide-data states are different.
6. **No inferred programme identity.** Repeats are not grouped into a fictional series/title entity merely because normalized titles match.

## Jobs to be done

Primary:

- “Wanneer is **De slimste mens** op tv?”
- “Op welke zender is dit programma?”
- “Is dit programma vanavond of morgen op tv?”
- “Ga naar **NPO 1**.”

Secondary:

- find a recent broadcast inside Teevee's retained Guide history;
- find another upcoming airing of a programme title.

Search is not intended to answer where a programme can be streamed.

## Searchable objects

### 1. Programme broadcasts

A programme result is one existing canonical `Programme` broadcast.

Searchable in the first slice:

- `Programme.title`.

Not searchable in the first slice:

- description;
- genre;
- cast/person;
- article/editorial copy;
- streaming provider;
- free-text semantic concepts.

`subtitle` may be shown as secondary result metadata when useful, but it is **not** an independent query field in Phase 5A.

### 2. Channels

Search channel identity against the existing canonical channel fields:

- `displayName`;
- `shortName` when present;
- `name`.

Channel identity remains canonical Teevee identity. External provider IDs never appear in Search.

## Search horizon

Programme Search covers the complete currently supported Guide horizon:

**D-2 through D+7 television days**, where a television day is **06:00 Europe/Amsterdam → 06:00 the following local calendar day**.

Rules:

- horizon membership uses the shared television-day primitives from ADR 0008;
- canonical programme timestamps remain real UTC instants;
- result presentation uses the actual Europe/Amsterdam civil broadcast date/time;
- a programme at 02:00 may belong to the preceding television day for Guide grouping while still displaying its actual calendar date/time in Search;
- only authoritative canonical schedule windows may contribute programme results;
- Search must not fabricate results from partial/uncovered provider windows.

The horizon is recalculated from the actual current instant. Crossing 06:00 changes D and therefore the Search horizon.

## Query behaviour

Input:

- one prominent search field;
- trim leading/trailing whitespace;
- collapse repeated internal whitespace;
- case-insensitive matching;
- diacritic-insensitive matching;
- normalize common punctuation differences without turning Search into fuzzy matching.

Programme querying begins after **2 non-whitespace characters**.

Phase 5A deliberately does **not** provide:

- fuzzy/Levenshtein matching;
- typo correction;
- semantic/vector search;
- AI query interpretation;
- external autosuggest.

These can be reconsidered only from measured zero-result/query-reformulation evidence.

## Match classes

For both programme titles and channel names:

1. exact normalized match;
2. normalized prefix match;
3. normalized substring match.

No weaker match class exists in Phase 5A.

## Result model and ordering

Channel and programme results are separate semantic result types. The UI may visually group them, but ranking never converts one into the other.

### Channel ordering

Within channel results:

1. exact match;
2. prefix match;
3. substring match;
4. existing canonical `sortOrder`;
5. canonical channel ID as deterministic tie-breaker.

### Programme ordering

Programme results are concrete broadcasts and remain individually addressable.

Primary ranking dimension: **match quality**.

Within the same match class:

1. currently airing broadcast;
2. future broadcasts, nearest start first;
3. historical broadcasts inside D-2/D-1/D, newest first.

Deterministic tie-breakers:

1. `startAt`;
2. canonical channel order;
3. canonical `Programme.id`.

A programme title that airs multiple times therefore produces multiple concrete broadcast results. Do **not** collapse repeats by normalized title alone.

A future EPG start-time correction may legitimately produce a new canonical `Programme.id`; Search must return only the current canonical store state rather than persisting a stale result identity.

## Result content

Every programme result must answer **what / where / when** without requiring a tap.

Required:

- title;
- channel identity;
- local broadcast date;
- local start time.

For a currently airing result:

- clearly indicate `Nu`;
- useful end time may replace redundant start emphasis.

Optional when already available:

- subtitle;
- quiet Kijktip metadata for the exact broadcast.

Kijktip is **not a ranking signal** in Phase 5A.

Artwork, genre chips and descriptions are not required for Search usefulness and must not become structural dependencies.

## Navigation

### Programme result

Tap opens the existing **Programme Detail** for that exact canonical broadcast.

Contract:

- no intermediate preview;
- back returns to Search;
- query and result context are retained;
- opening a result must not require first navigating through Guide;
- Kijktip/personal state shown in Programme Detail remains keyed to the canonical broadcast as elsewhere in Teevee.

### Channel result

Tap navigates to **Guide → Per zender** with that canonical channel selected and useful current-time context.

This navigation is contextual. It must not silently rewrite unrelated long-term user preferences merely as an implementation shortcut.

The implementation must preserve a natural route back to Search through the existing app navigation model.

### Channel personalisation bridge — queued with catalog expansion

TVgids.nl app Search evidence on 24 September 2026 materially strengthens channel retrieval as a Search job and establishes a future bridge to channel personalisation. Canonical evidence and interpretation: `docs/TVGIDS_APP_SEARCH_CHANNEL_EVIDENCE_2026-09-24.md`.

When Teevee's expanded catalog and channel selection/order capability are implemented:

- Search continues to search the **complete canonical channel catalog**, not only channels currently visible in the user's Guide;
- a hidden/unselected channel result remains visible and may still open Per zender contextually;
- opening that result does **not** auto-add the channel or mutate persisted order;
- a hidden/unselected channel result should expose a quiet explicit path to add it to the user's selected channel set;
- after explicit addition, a route to reorder/manage channels may be offered without blocking the primary open-channel action;
- deterministic channel-management queries such as `zenders`, `alle zenders`, `zenderoverzicht`, `mijn zenders`, `zenders instellen`, `zenders toevoegen` and `zendervolgorde` should surface a bounded navigation/action result rather than an ordinary no-match state;
- this does not authorize general semantic/AI Search. It is a finite product-navigation intent set;
- canonical channel alias normalisation should handle safe spacing/punctuation variants such as `RTL8`, `NPO1` and `RTLZ` without provider-specific mobile heuristics.

The working user-facing concept is **Mijn zenders**; exact final microcopy and management-screen visual treatment remain part of the dedicated implementation/design increment.

## Search screen states

### Empty / untouched

Before a meaningful query:

- show the search field;
- no fake trending/popular/recommended content;
- no empty “results” chrome.

### Query too short

For fewer than 2 non-whitespace characters:

- do not run programme Search;
- keep the state neutral rather than showing “no results”.

### Loading

- keep typed input interactive;
- never block keyboard interaction;
- a newer query owns the result surface immediately;
- late responses from older queries must be ignored.

### Results

- useful result metadata is visible without opening detail;
- results remain bounded; no infinite engagement feed.

### No match

Show a genuine no-result state only when the searched authoritative scope is sufficient to establish that no match exists.

### Guide data unavailable

If required canonical schedule coverage is unavailable:

- do not present that absence as “no programmes found”;
- if some authoritative windows are searchable, results may be shown with a quiet incomplete-horizon indication;
- if no useful authoritative search scope is available, show a retryable availability state.

Channel search is independent of programme-window availability when canonical channel identity is already known.

## Architecture handoff constraints

These are implementation constraints derived from the current accepted runtime, not permission to redesign Guide data loading.

### Full-horizon Search must be a dedicated read boundary

The current mobile Guide runtime intentionally loads:

- the current runtime window;
- selected television-day windows on demand;
- at most a small session cache of visited windows.

It does **not** keep the full D-2…D+7 horizon resident.

Therefore Phase 5A must **not** implement Search by:

- eagerly prefetching all ten Guide days into mobile memory;
- issuing a new ten-window Guide preload on every query;
- indexing only whichever Guide days the user happened to visit;
- reading the external EPG directly.

Search requires a provider-independent hosted search/read boundary over the canonical Teevee schedule store so every query sees the same D-2…D+7 product horizon without changing the proven Guide loading architecture.

ADR 0009 defines the repository/API/storage shape: one hosted provider-independent Search boundary over canonical storage, with server-owned D-2…D+7 windows and explicit complete/partial/unavailable programme coverage.

### Domain integrity

Do not add a generic title/series entity to `Programme` merely to implement Search.

Do not mutate canonical `Programme` with Search ranking or presentation fields.

A Search result may wrap/reference:

- canonical `Programme`;
- canonical `Channel`;
- optional sibling editorial signal metadata.

## Performance and concurrency

Product expectation: Search should feel immediate while typing.

Implementation requirements:

- debounce/throttle exact value is an implementation detail and must be measured rather than guessed;
- stale/out-of-order network responses never replace newer-query results;
- query processing must not block the React Native input thread;
- result payload is bounded;
- do not download a full ten-day schedule payload just to search it;
- preserve the existing Guide startup/render performance architecture.

Performance evidence must be collected before Phase 5A exit on a physical iPhone. Android physical validation remains a later hardware gate if no device is available.

## Accessibility

- substantive result text supports Dynamic Type;
- programme/channel rows remain platform-safe touch targets;
- screen-reader programme result semantics include title, channel and useful date/time context;
- current state and Kijktip state are not colour-only;
- channel logos never replace accessible channel names;
- keyboard/input clear affordances receive useful accessibility labels;
- result ordering remains understandable without visual grouping alone.

## Privacy and analytics

Search success should be measured without making raw user queries a default analytics dependency.

Phase 5A may measure:

- query-length bucket;
- time to first result;
- result count / zero-result;
- selected result type (programme/channel);
- query → result selection;
- reformulation count;
- unavailable/partial-horizon rate.

Do **not** log raw search text by default. Any future raw-query collection requires an explicit privacy/data decision.

The 24 September 2026 TVgids.nl app Search export used for product research is an external historical evidence set and does not change this Teevee analytics contract. Its raw query rows are not committed to the repository.

Primary product-quality metrics:

- successful result selection rate;
- zero-result rate;
- query reformulation rate;
- query → useful-result latency;
- programme vs channel selection split.

Session length is not a Search success metric.

## Explicit non-scope — Phase 5A

- universal streaming search;
- VOD catalogue results;
- actors, presenters or other people;
- genre/category search;
- descriptions/full-text corpus search;
- editorial/news article search;
- Kijktip-only filtering;
- recommendations or “for you” ranking;
- recent searches / synced history;
- trending/popular queries;
- voice search;
- AI/semantic search;
- typo correction;
- saved searches;
- generic programme/series catalogue pages;
- title-only repeat grouping;
- artwork dependency;
- Tonight discovery modules.

Tonight remains a later Phase 5 slice with separate value/data definition.

## Acceptance scenarios

Phase 5A is not complete until deterministic coverage includes at least:

1. exact programme title with one upcoming broadcast;
2. exact programme title with multiple upcoming/repeat broadcasts;
3. currently airing exact title;
4. historical match inside D-2/D-1;
5. exact channel match;
6. channel prefix and substring matches;
7. programme prefix and substring matches;
8. case, whitespace, punctuation and diacritic normalization;
9. no-match with full authoritative scope;
10. incomplete/unavailable Guide coverage distinct from no-match;
11. 05:59 → 06:00 horizon rollover;
12. 23-hour and 25-hour DST horizon windows;
13. corrected programme start producing current canonical identity only;
14. out-of-order request protection;
15. Programme Detail round-trip preserving Search query/results;
16. channel result opening Per zender on the selected channel;
17. Larger Text / screen-reader semantics;
18. Kijktip result metadata, when present, without ranking impact.

## Phase 5A exit gate

Guide Search may be considered complete when:

- programme + channel retrieval works over the canonical D-2…D+7 horizon;
- results answer what/where/when directly;
- programme selection opens exact-broadcast Programme Detail and round-trips cleanly;
- channel selection opens the intended Per-zender context;
- no-result and unavailable-data states are semantically correct;
- Search does not change the existing Guide loading/performance architecture;
- deterministic correctness/edge-case tests pass;
- strict TypeScript/lint/export/native checks pass;
- focused physical iPhone validation passes;
- Independent QA passes;
- canonical docs reflect the final implementation.

## Post-Phase-5A product follow-up

Phase 5A Search is closed. Do not reopen its proven hosted/mobile architecture merely to implement the channel-personalisation bridge.

The channel-personalisation/Search follow-up is queued with the expanded channel catalog. Its implementation must preserve the existing Search read boundary, provider-independent canonical channel identity, query/result continuity and contextual Per-zender navigation while adding only the minimum personal-channel state/action surface required by the product contract.

