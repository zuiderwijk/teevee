# ADR 0010 — Provider-independent programme classification sibling enrichment

Status: **Proposed in issue #142 / PR #144; pending Lead + Independent QA**
Date: 2026-09-23

## Context

Vanavond needs production-safe population for Film, Series and Sport without teaching mobile code the current EPG provider vocabulary.

Empirical research in `docs/TONIGHT_CLASSIFICATION_RESEARCH_2026-09-23.md` proved that canonical `Programme.genre` is not sufficient:
- exact `Film` is precise but feature films can arrive with a broader first category such as `Drama`;
- explicit series genres are precise, but scripted episodic series also arrive under generic categories;
- children's scripted series collide with adult/general series classification;
- exact `Sport` mixes events, highlights, talk and documentary/magazine content;
- `isLive` / `isRepeat` are currently positive-only provider evidence and were undefined for the entire reviewed evening sample.

A follow-up live XMLTV evidence probe for issue #142 confirmed why information is lost: the source often contains multiple categories and structured episode numbers while the existing canonical route stores only the first category as `Programme.genre`. Evidence is recorded in `docs/TONIGHT_CLASSIFICATION_SOURCE_EVIDENCE_2026-09-23.md`.

## Decision

Introduce one central **provider-independent sibling classification** for each concrete canonical programme broadcast.

Canonical `Programme` remains unchanged.

### Provider evidence ownership

`ExternalProgramme` at the server/provider boundary may preserve structured provider evidence needed for classification:
- the complete category set;
- structured episode-number values;
- existing live/repeat flags;
- existing programme description.

Raw provider categories and episode-number vocabulary never become canonical/mobile `Programme` fields and are not persisted in the public classification contract.

The current XMLTV interpreter is implemented centrally in `server/classification/classifyProgramme.ts`. A future provider changes/adds that mapping boundary rather than Vanavond/mobile code.

### Public semantic contract

For one canonical `programmeId`, Teevee exposes:
- `contentType`: film / series / sport / other / unknown;
- `seriesType`: scripted-episodic / non-scripted / unknown;
- `audience`: general-mainstream / primarily-children / unknown;
- `sportType`: event / highlights / talk / magazine-documentary / other / unknown;
- tri-state live/repeat: true / false / unknown;
- confidence: high / unknown.

Only high-confidence semantics can make a programme eligible for a Vanavond category:
- Film: high-confidence film;
- Series: high-confidence scripted episodic + general/mainstream;
- Sport: high-confidence event or highlights.

Unknown/ambiguous state always fails closed.

### Classification evidence and precedence

Current XMLTV mapping uses structured evidence first:
1. conflicting target-family evidence => unknown;
2. Film requires explicit `Film` anywhere in the full category set;
3. Series uses explicit series categories or strong season+episode evidence combined with a scripted-content category and without non-scripted blockers;
4. audience uses explicit children-audience categories or a provider-specific scripted/general category mapping;
5. Sport first excludes talk and documentary/magazine categories, then recognizes explicit highlights/summary wording inside already-structured Sport evidence, then event wording plus a sport/event category;
6. generic `Sport` alone remains sport/unknown and is not Vanavond-eligible.

Title is not classification evidence. Description text is used only inside an already-established Sport context for deliberately narrow, explicit Dutch provider phrases such as `samenvatting`, `hoogtepunten`, `voorbeschouwing`, `nabeschouwing` and `verslag`. No LLM/NLP classification is used.

### Persistence ownership

Classification is **ingest-owned**, not an independent editorial snapshot.

A private `teevee.programme_classifications` table is keyed by canonical `programme_id` and references `teevee.programmes(id)` with cascade lifecycle.

A classified schedule replacement RPC wraps the existing ADR-0007 schedule replacement transaction:
1. validate provider-independent classification payload and completeness for the in-scope programmes;
2. execute the existing authoritative schedule replacement/stale-write logic;
3. if the schedule write is stale, return without classification mutation;
4. after a stored replacement, insert/update the classification rows in the same database transaction.

Consequences:
- same broadcast re-ingest is idempotent;
- a start-time correction that changes canonical `Programme.id` deletes the old programme/classification and inserts the new pair atomically;
- programme deletion/authoritative empty replacement cascades stale classifications;
- stale schedule writes cannot roll classifications back;
- no orphan classification can survive canonical programme deletion.

### Backfill/recovery

The migration does not infer classifications from old canonical `genre` because that would recreate the research failure modes after the full provider evidence has already been discarded.

After the migration and updated `epg-refresh` runtime are deployed from reviewed `main`, run one authoritative `guide-horizon` refresh. The normal D-3..D+8 provider ingest then recreates current retained broadcasts and their sibling classifications from full structured provider evidence.

This provider re-ingest is the classification backfill/recovery mechanism.

### Read/transport boundary

Guide schedule transport is unchanged.

Classification has a separate bounded read path:
- private `teevee.get_programme_classifications`;
- service-role-only public PostgREST bridge;
- `ProgrammeClassificationRepository`;
- typed `ProgrammeClassificationApi`;
- `programme-classifications` Edge Function;
- bounded request of at most 256 canonical programme IDs.

This keeps classification out of Guide startup/rendering and avoids eager D-2..D+7 mobile prefetch. A future Vanavond runtime can fetch only one bounded evening schedule and then request semantics for those concrete programme IDs.

## Why sibling enrichment

Adding these fields to canonical `Programme` would make every Guide/Search payload and mobile schedule object pay for Vanavond-only semantics and would blur provider-independent programme identity with a derived product classification.

An independent snapshot lifecycle like Kijktip is also wrong: classification is deterministically derived from the same provider record that creates the canonical broadcast and should share the canonical broadcast's correction/deletion transaction.

## Alternatives considered

### Use `Programme.genre` directly
Rejected: empirically false-negative for Film, incomplete for Series, too broad for Sport.

### Expose all raw provider categories to mobile
Rejected: provider coupling and future-provider swap would require mobile changes.

### Classify on every mobile render
Rejected: repeats work, moves provider heuristics into the client and creates Guide performance coupling.

### Independent asynchronous classification refresh
Rejected for v1: unnecessary race/staleness lifecycle for deterministic ingest-owned evidence.

### Title-specific exceptions or LLM classification
Rejected: brittle, non-deterministic and contrary to fail-closed/provider-independent ownership.

## Consequences

Positive:
- Vanavond receives one stable semantic contract;
- provider swaps are mapping changes at the server boundary;
- canonical Programme identity remains clean;
- correction/deletion lifecycle is atomic with schedule storage;
- Guide runtime/payload remains unchanged;
- deterministic tests can cover research failure modes without live network data.

Costs:
- EPG ingest now parses/preserves all source categories and episode numbers before canonicalization;
- one classification row is stored per retained canonical programme;
- `epg-refresh` and the new classification read Edge Function must be deployed after migration review/merge;
- existing retained rows require one authoritative horizon refresh after deployment.

## Deployment gate

This ADR does not authorize pre-review production changes.

After PR #144 has Lead + Independent QA approval and is merged:
1. apply the exact merged migration;
2. deploy the exact merged `epg-refresh` bundle;
3. deploy `programme-classifications`;
4. run one bounded authoritative `guide-horizon` refresh to backfill retained rows;
5. verify classification row count/orphans and bounded semantic reads;
6. compare deployed migration/runtime bytes with canonical `main`;
7. record production evidence.

No production Vanavond UI is part of this ADR.
