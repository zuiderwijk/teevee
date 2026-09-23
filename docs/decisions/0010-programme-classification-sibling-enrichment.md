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
- a minimal boolean `hasDirectorCredit` signal when the provider supplies a credits block;
- existing live/repeat flags;
- existing programme description.

Credit names/cast are deliberately not propagated into the classification boundary. The current source frequently labels factual hosts as actors, while the only precision-improving signal required by the researched generic-series boundary is whether a director credit is explicitly present.

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

`audience` is an independent semantic dimension from `contentType`. The contract intentionally allows a known audience with an unknown programme family, for example `contentType: unknown` + `audience: primarily-children` + `confidence: unknown`. Knowing the audience never upgrades content-type certainty.

### Classification evidence and precedence

Current XMLTV mapping uses structured evidence first:
1. conflicting target-family evidence => unknown;
2. Film requires explicit `Film` anywhere in the full category set;
3. Series treats strong scripted-form categories (`Dramaseries`, `Misdaaddrama`, `Sitcoms`, `Soap`) as positive evidence unless a strong non-scripted format such as Reality/Documentaire/Talkshow conflicts;
4. generic Series recovery requires explicit season+episode evidence plus either multiple compatible scripted-content categories or one compatible scripted category together with an explicit director-credit signal;
5. broad context/subject categories may block generic scripted inference, but **blocking Series inference is not positive evidence for `other`**; without stronger positive evidence the classification remains `unknown`;
6. only strong structured non-scripted/other evidence may produce high-confidence `other`; broad context blockers and children-audience categories are never automatically promoted to `other/high`;
7. children's scripted recovery is limited to explicit season+episode + children-audience + animation evidence and maps to `primarily-children`, so it remains in semantic classification but fails the Vanavond Series eligibility helper;
8. explicit strong scripted-form evidence may also classify a children's programme as semantic Series when no strong non-scripted conflict exists;
9. `Miniseries` is not itself treated as scripted-form evidence because the live source also uses it for documentary/factual miniseries;
10. audience is orthogonal to content type: explicit children-audience categories may set `primarily-children` even when `contentType` and confidence remain `unknown`; children-audience evidence alone never proves `other`;
11. Sport first excludes talk and documentary/magazine categories, then recognizes explicit highlights/summary wording inside already-structured Sport evidence, then event wording plus a sport/event category;
12. generic `Sport` alone remains sport/unknown and is not Vanavond-eligible.

Title is not classification evidence. Actor names/counts are not classification evidence. Description text is used only inside an already-established Sport context for deliberately narrow, explicit Dutch provider phrases such as `samenvatting`, `hoogtepunten`, `voorbeschouwing`, `nabeschouwing` and `verslag`. No LLM/NLP classification is used.

Disposable exact-implementation live probes exposed three separate certainty boundaries during review. First, the initial generic rule admitted rows whose structured evidence was not sufficient for Vanavond Series. Second, Technical Lead review #5794926935 found that the correction reused broad generic-Series blockers as positive `other/high` evidence. Third, Technical Lead review #5795818040 found that children-audience evidence was still being reused as positive `other/high` evidence when no content family had been proven.

The mapping now separates all three concepts: strong non-scripted format evidence can prove `other/high`; broad context blockers only prevent generic Series inference; and children-audience evidence only establishes `audience: primarily-children`. A known children audience may therefore coexist with `contentType: unknown / confidence: unknown`. `Sluipschutters` remains the broad-context ambiguity example; `Kinderen + Komedie + Sx Ey` is the deterministic audience/content-type ambiguity example. Strong explicit scripted labels continue to outrank broad subject/context categories when no strong non-scripted format conflict exists, including when children audience is present. Research titles remain evidence labels only; production code contains no title exceptions.

Post-#5795818040 live revalidation run `35868756695`, job `107206994998`, kept Film / general-mainstream Series / semantic Series / Sport eligibility at **36 / 99 / 182 / 3** and moved exactly one current evening row from `other/high` to `unknown/unknown` (content types now 620 other / 182 series / 36 film / 118 unknown / 9 sport). Of 91 children-audience rows, 83 are semantic `series/high`, 7 are `other/high` from independent strong non-scripted evidence, and 1 remains `unknown/unknown`.

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

The preferred classification lifecycle remains the atomic classified authoritative schedule replacement above. When a provider window is complete, normal `epg-refresh` replacement stores the canonical broadcast and its classification sibling together and owns correction/deletion cleanup.

However, **authoritative schedule replacement completeness is not the same as enrichment recovery eligibility**. A provider observation may be incomplete for the requested window and therefore unsafe to use as an ADR-0007 replacement, while still containing full structured evidence for individual concrete broadcasts that already exist in canonical storage.

For bootstrap/recovery of an already-retained broadcast, Teevee therefore permits a separate bounded, service-owned classification recovery operation with these constraints:
1. fetch provider evidence through the existing provider adapter and run the same normalisation + central classifier as normal ingest;
2. never treat partial provider coverage as schedule authority;
3. reconcile only to an **existing current canonical broadcast** using the regenerated canonical id plus exact channel, start, end and title equality;
4. ambiguity/correction/missing provider rows fail closed and write nothing;
5. take the same per-channel advisory locks as canonical schedule replacement;
6. reject a recovery observation when newer canonical coverage or a newer classification already owns that broadcast;
7. upsert only the classification sibling; never create/delete/update canonical programmes, channels, coverage or unrelated classifications;
8. retain the existing FK/cascade lifecycle, so later authoritative rekey/deletion still removes any recovered obsolete sibling;
9. repeated recovery is safe and idempotent.

The exact equality guard is intentionally stricter than a title/start reconciliation heuristic. For the current XMLTV source, a start/end/title correction changes the regenerated canonical id when no stable provider programme id exists, so a partial corrected provider row remains unmatched until an authoritative refresh can safely replace the schedule. A future provider with stable IDs still must pass channel/start/end/title equality before recovery can attach evidence.

This path is classification-specific rather than a generic enrichment framework, but the lifecycle principle is reusable for future sibling enrichments: non-destructive enrichment may be recoverable from exact current broadcast evidence even when the surrounding provider window is not authoritative enough to replace schedule state.

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

### Unbounded independent asynchronous classification refresh
Rejected: classification remains ingest/provider-evidence owned. The bounded recovery operation above is not a second snapshot lifecycle; it reuses the same provider interpreter/classifier, exact current canonical identity, channel serialization and stale-write ownership solely to repair missing/obsolete siblings without claiming schedule authority.

### Title-specific exceptions or LLM classification
Rejected: brittle, non-deterministic and contrary to fail-closed/provider-independent ownership.

## Consequences

Positive:
- Vanavond receives one stable semantic contract;
- provider swaps are mapping changes at the server boundary;
- canonical Programme identity remains clean;
- correction/deletion lifecycle remains atomic on normal schedule storage;
- exact-match recovery can bootstrap retained siblings without destructive partial-window replacement;
- Guide runtime/payload remains unchanged;
- deterministic tests can cover research failure modes without live network data.

Costs:
- EPG ingest now parses/preserves all source categories, episode numbers and minimal director-credit presence before canonicalization;
- one classification row is stored per retained canonical programme;
- `epg-refresh` and the new classification read Edge Function must be deployed after migration review/merge;
- existing retained rows normally recover through authoritative horizon refresh; partial current-day gaps may require one reviewed bounded non-destructive recovery invocation.

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
