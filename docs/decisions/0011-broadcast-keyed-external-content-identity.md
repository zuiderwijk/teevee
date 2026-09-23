# ADR 0011 — Broadcast-keyed external content identity enrichment

Status: **Proposed in issue #159 / PR #161; pending Technical Lead + Independent QA**  
Date: 2026-09-24

## Context

Teevee needs a production-safe external content identity for Film and Series before programme artwork can be added. Canonical `Programme.id` is intentionally one concrete broadcast, while a TMDB Film/TV ID is content identity that may be shared by many broadcasts.

Empirical source research in `docs/PROGRAMME_EXTERNAL_IDENTITY_SOURCE_RESEARCH_2026-09-23.md` proved that the current XMLTV provider exposes useful transient production-year, role-preserving people, complete category and episode evidence. TMDB matching research in `docs/TMDB_MATCHING_RESEARCH_2026-09-23.md` then resolved 44/45 reviewed Film broadcasts and 49/50 reviewed Series broadcasts at the final high-confidence tier, with no known false-positive accepted IDs.

PR #158 productionized only the transient provider evidence. It deliberately did not change canonical `Programme`, public Guide transport or mobile.

PR #152 is not a foundation. Its controlled D0 classification recovery found 512 provider candidates, 319 exact retained-broadcast matches and 193 unmatched; physical owner validation then exposed `Cold Pursuit` as a retained canonical broadcast that still lacked the expected sibling. That disproves later provider refetch + exact retained-broadcast reconciliation as a universal bootstrap/replay strategy.

The governing product rule is: **wrong artwork is worse than missing artwork**.

## Decision

Introduce one small private external-content-reference sibling keyed by canonical broadcast:

`provider observation -> canonical Programme + ProgrammeClassification -> high-confidence TMDB decision -> ProgrammeExternalContentReference`

Canonical `Programme` remains unchanged. Core Guide transport remains unchanged. Mobile does not call TMDB, receive the TMDB credential or receive raw provider identity evidence.

### Identity contract

A stored reference contains only:
- canonical `programme_id`;
- `source = tmdb`;
- `media_type = film | series`;
- positive TMDB content ID;
- `confidence = high`;
- matcher version;
- provider-observation timestamp used as the stale-write owner;
- resolution timestamp.

There is no uniqueness constraint on TMDB content identity. Multiple concrete broadcasts may safely reference the same TMDB Film/Series ID.

No title, production year, director, actor, provider category, TMDB payload, artwork URL or episode ID is persisted in this sibling.

### Entry gates

External identity never interprets `Programme.genre`.

Film is eligible only through central provider-independent classification when:
- `contentType = film`;
- `confidence = high`.

Series is eligible only when:
- `contentType = series`;
- `seriesType = scripted-episodic`;
- `audience = general-mainstream`;
- `confidence = high`.

Sport is out of scope.

### Film matching

Film is fail-closed:
1. provider production year must be present;
2. at least one provider director must be present;
3. direct TMDB search evaluates at most five candidate IDs;
4. primary/original title identity requires year within ±1 and director overlap;
5. an alternative/localized-title-only identity additionally requires at least two actor overlaps;
6. exactly one qualifying candidate resolves;
7. more than one qualifying candidate is ambiguous;
8. no qualifying candidate may use a bounded director-filmography fallback;
9. the fallback inspects at most two provider directors and at most three year-compatible directed Film IDs before applying the same qualification rules.

Title + year alone never resolves Film.

### Series matching

Series matching keeps series identity separate from episode identity:
1. search the full provider title first;
2. require conservative title identity (with the researched leading-article variation) and actor overlap;
3. when coherent explicit S/E evidence exists, validate that coordinate against the candidate Series;
4. exactly one qualifying full-title candidate resolves;
5. ambiguity fails closed;
6. only after full-title failure may a clear separator-derived base title be searched;
7. base-title fallback requires explicit S/E evidence and at least two actor overlaps when the coordinate exists;
8. the researched numbering-disagreement fallback may still resolve **Series identity only** when the base title is unique, the coordinate disagrees and at least four actor names overlap;
9. no TMDB episode ID is produced or persisted;
10. provider production year is not treated as TMDB first-air year.

### TMDB request boundary

All TMDB traffic is server-side through one injectable gateway.

Production policy:
- credential name: `TMDB_API_READ_ACCESS_TOKEN`;
- token is read only from server/Edge secret state and sent only as a bearer credential;
- no token logging or mobile/public exposure;
- 2.5 s timeout per attempt;
- at most one retry;
- retry only network/timeout, 5xx and bounded 429 failures;
- `Retry-After` is honored only inside a 1 s retry budget; larger values fail open instead of sleeping unbounded;
- 4xx authentication/client failures and malformed JSON are not retried;
- one enrichment invocation has a 20 s owner-controlled budget and request cancellation;
- candidate/detail/credits/alternative-title/season calls use request-scope Promise caching;
- identical identity work in one provider observation is deduplicated;
- at most three identity work items execute concurrently;
- no unbounded director filmography traversal and no persistent content cache in this increment.

### Ingest sequencing and failure ownership

For one provider observation, normalisation now retains an internal server-only tuple of canonical `Programme`, central `ProgrammeClassification` and transient `ExternalProgramme` evidence.

Only an authoritative **stored** schedule replacement produces an enrichment observation. Partial provider coverage, unsafe attribution, no safe scope and stale schedule writes produce no identity work.

Guide authority wins:
- canonical schedule replacement commits first;
- for a guide-horizon refresh, all canonical window writes complete before the first TMDB request;
- TMDB timeout, 429, 5xx, network, malformed response, matcher failure or external-reference persistence failure cannot roll back or change the already-stored Guide schedule;
- operational TMDB failures do not create negative identity decisions;
- unresolved/ambiguous deterministic matcher outcomes fail closed.

Missing identity is acceptable. Wrong identity is not.

### Persistence and stale ownership

`teevee.programme_external_content_references` has one row per concrete canonical `programme_id` and an FK with update/delete cascade.

The protected write RPC:
- accepts at most 256 decisions;
- uses the same sorted per-channel advisory transaction lock as canonical schedule replacement;
- revalidates exact `programme_id + channel_id + start_at + end_at + title`;
- requires overlapping authoritative schedule coverage whose `generated_at` equals the decision's provider-observation timestamp;
- rejects any overlapping newer schedule coverage;
- rejects overwriting a newer external-reference observation;
- upserts only resolved/high-confidence references;
- a current unresolved/ambiguous deterministic decision may clear an older reference for that exact current broadcast.

Consequences:
- corrected/rekeyed Programme deletes the old reference by FK ownership;
- deleted Programme cannot leave a dangling reference;
- a late result cannot land on a replacement broadcast;
- repeated resolution is idempotent;
- many broadcasts may share one TMDB identity;
- the RPC cannot be used as a fuzzy historical attachment API because same-observation authoritative coverage is mandatory.

The advisory lock is necessary here because identity resolution is asynchronous with schedule replacement; without sharing the canonical channel lock, an exact-row check could race a concurrent correction/delete.

### D0/bootstrap/warm-up

There is **no historical D0 bootstrap** in this increment.

Identity is forward-filled only from authoritative complete observations for current/future broadcasts. The sibling then remains associated with that concrete broadcast as it ages into D0 until canonical schedule ownership replaces/deletes it.

After deployment, retained broadcasts that were never processed by this path may temporarily lack identity. That explicit warm-up gap is preferred over fuzzy/refetched historical reconciliation.

The dormant PR #152 migration/RPC (`20260923201300_recover_programme_classification_siblings.sql` / `teevee_recover_programme_classifications`) is **superseded for external-identity bootstrap and is not called by this architecture**. Because that migration already exists in hosted migration history, it is not silently deleted or rewritten. If its classification-recovery RPC is retired, that must be a separate forward cleanup migration after verifying no remaining operational caller.

### Read/UI scope

This increment adds no public/mobile external-content read API. It establishes private persistence only.

Posters, backdrops, image provenance transport, image proxy/cache/CDN, TMDB attribution UI and Vanavond/Programme Detail artwork remain separate follow-up work. Any user-visible TMDB-derived surface must implement the applicable branding/attribution requirements before release.

## Alternatives rejected

### Put TMDB ID on canonical Programme
Rejected: concrete broadcast identity and reusable content identity have different lifecycle/cardinality.

### Mobile/direct TMDB integration
Rejected: credential/provider leakage, duplicated matching logic and Guide coupling.

### Generic Teevee content catalogue
Rejected: no current technical requirement justifies a new aggregate/content-entity domain.

### Historical title/start/fuzzy bootstrap
Rejected: #152/Cold Pursuit evidence proves later refetch does not reliably reproduce retained D0; fuzzy attachment raises false-positive risk.

### Transactional TMDB inside schedule replacement
Rejected: an external API must not own Guide availability or canonical EPG transactions.

### Persistent TMDB content cache now
Rejected: request-scope caching and bounded deduplication satisfy the measured v1 workload; a persistent catalogue/cache requires new evidence.

## Consequences

Positive:
- external content identity is provider-independent, private and safe for repeated broadcasts;
- Guide/mobile architecture and payload remain unchanged;
- matching uses the rich evidence before it is discarded;
- TMDB failures are operationally isolated from canonical EPG;
- rekey/delete/stale races are enforced by database ownership, not process timing.

Costs:
- one private sibling row per resolved retained broadcast;
- future/current eligible Film/Series may be re-resolved after authoritative schedule replacement;
- deployment has a deliberate warm-up period for broadcasts that lack forward-filled identity;
- the migration/trust-boundary change is High risk and requires Independent QA before merge/deploy.
