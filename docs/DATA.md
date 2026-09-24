# Teevee Programme Data Strategy

Status: **Phase 5 data/runtime foundations are merged; owner-priority inter-phase Premium Artwork & Content Identity enrichment is active before Phase 6 Personal Features. PR #161 is merged/deployed at the database/runtime layer, while issue #167 / PR #168 is the active production-blocking EPG resource correction required before hosted TMDB activation can proceed.** Phase 3 proved the provider-independent hosted data path, Phase 4 closed the television-day-aware Guide runtime and D-2..D+7 navigation/horizon behaviour, Kijktip is merged/deployed/physically verified, Phase 5A Guide Search is closed, PR #144 / issue #142 established the provider-independent Film/Series/Sport classification sibling, and PR #149 consumes those deployed lanes without changing Guide loading. Issue #157 / PR #158 adds only the typed server-side provider evidence required by the already-completed external-identity research; Phase 5 remains closed. The Phase 4 cache decision is unchanged: keep the current fixture-first + in-memory runtime fallback and do not introduce persistent mobile schedule caching without new measured evidence. Production **EPG** provider selection/rights remain a later release gate and release-like offline cold-start/persistent-cache validation remains Phase 9.

## Goal
Teevee must support the complete core Guide without coupling the mobile experience to one EPG supplier. Replacing the temporary development source with an authorized Bindinc/TVgids or commercial provider must not require a Guide rewrite.

## Core rule
The mobile client never consumes an external EPG feed directly.

## Kijktip enrichment deployment state
The Kijktip vertical slice is merged, deployed and physically verified end-to-end. Its post-deployment historical iPhone browse-back is PASS; Phase 5A Guide Search and the first production Vanavond runtime are also closed.

- **PR #120** completed empirical matching research and is canonical in `docs/TVGIDS_EDITORIAL_FEED_MATCHING_2026-09-22.md`: `tips.rss` is ingested server-side; matching is deterministic/fail-closed against canonical Teevee programmes; unresolved or ambiguous items do not create a Kijktip signal; the core `Programme` provider identity remains unchanged.
- **PR #126** provides production server-side RSS parsing/matching, private signal persistence, an independent protected refresh, optional typed hosted transport and separate mobile runtime signal state.
- **PR #127** wires those signals into the accepted Per-zender/Nu & Straks presentations and fixes editorial lifecycle persistence. Accepted head `b9867105fdf331dcd6a920c71d0f5e637e3b232c` merged as `6b11ee2fe4a5cbdf4012a680c2558b11b762d999` after Lead, owner physical iPhone and Independent QA PASS.
- The exact reviewed persistence migration blob `c41b059f627406d12c684fa92a1e1179109d8dbe` is deployed to hosted project `eokszvpityhtysbwdduy` as remote migration `20260922235737_preserve_started_editorial_signals`. Live verification found 58 persisted signals, matching source-state count 58, zero orphans and exactly one recovered 22 September NPO 1 `De slimste mens` Kijktip.

### Production Kijktip editorial enrichment

Editorial enrichment is optional and parallel to core EPG state:

`TVgids tips.rss -> editorial-refresh -> deterministic matching against canonical ScheduleRepository -> private programme_editorial_signals lifecycle store -> guide-schedule sibling editorialSignals -> mobile runtime editorial state`

Hard invariants:
- the mobile app never fetches or parses TVgids RSS;
- `guide-schedule` never makes a live RSS request;
- editorial refresh/storage failure never changes a valid schedule to `unavailable`;
- `GuideSchedule`, `Programme`, schedule replacement and coverage semantics remain enrichment-independent;
- missing, malformed or unavailable editorial data normalises to `editorialSignals: []` at the public trust boundary;
- no `isKijktip` field or source/provider identity is added to canonical `Programme`.

Source/matching:
- source is `https://www.tvgids.nl/tips.rss`, decoded from response bytes using its declared charset before XML parsing;
- rights status: the product owner confirms the intended Teevee Kijktip use of `tips.rss` is rights-cleared; this editorial source is therefore **not a Kijktip release blocker**. The separate production EPG-provider redistribution, channel-logo and programme-artwork rights gates remain unchanged;
- current source items provide GUID/link/title/`channel_name`/start/end/`pubDate`;
- Tier A exists only for a future authorized stable broadcast identity and is not active for the current RSS;
- Tier B = explicit channel mapping + deliberately small normalized-title equality + start within ±5 minutes + exactly one candidate;
- Tier C = mapped channel + exact start + exactly one candidate, only after Tier B title failure;
- ambiguity, unsupported channels, unavailable coverage, title mismatch plus start drift and all non-deterministic cases fail closed.

Persistence/lifecycle:
- `teevee.programme_editorial_signals` is private/service-role-only and keeps both canonical-programme uniqueness and the separate unique `(source, signal_type, source_item_id)` identity constraint;
- it deliberately has **no FK/cascade to `teevee.programmes`**, because ADR 0007 schedule-window replacement deletes/reinserts programme rows;
- each successful source refresh validates/deduplicates incoming matched signals under the existing per-source advisory lock and stale-write guard;
- reconciliation happens **before incoming upsert**: an incoming `sourceItemId` explicitly rematched to a different canonical programme first removes its obsolete binding, then orphaned rows are cleaned, then omitted future signals are retracted, and only then are incoming rows inserted/updated. This is required because canonical `Programme.id` contains broadcast start and can therefore change after an EPG start-time correction;
- for a canonical programme that is still **future** at the refresh timestamp, omission from a later successful TVgids snapshot remains authoritative and may retract/remove that Kijktip;
- once `programme.start_at <= refreshedAt`, **simple omission** preserves the Kijktip as historical broadcast metadata; an explicit same-`sourceItemId` rematch is different evidence and safely rekeys that source item to the corrected canonical programme;
- historical signals remain readable only while the canonical programme remains in Teevee's retained schedule store; orphan cleanup removes them after that canonical row leaves retention;
- the deployed PR #127 forward migration includes one deliberately narrow, idempotent historical recovery allowlist backed by **direct PR #120 `tips.rss` capture evidence**, not by article/title inference. It recovered the owner-observed NPO 1 `De slimste mens` broadcast of 22 September only because explicit channel + exact title + ±5-minute start resolved to exactly one retained canonical candidate; ambiguity/missing evidence still fails closed;
- the recovery URL is used solely because it was the GUID/link of that explicit `tips.rss` item. General TVgids news articles remain outside the Kijktip source contract;
- `teevee.editorial_source_state` records latest successful refresh/freshness and prevents an older concurrent refresh from overwriting newer state; recovery may refresh only its diagnostic signal count and never rewrites freshness;
- a failed feed fetch/decode/match/persistence run leaves previously persisted editorial state untouched;
- executable PostgreSQL-17 lifecycle smoke evidence is recorded in `docs/EDITORIAL_PERSISTENCE_RECOVERY_2026-09-23.md`;
- `editorial-refresh` is an independent protected Edge Function with its own Vault-backed cron token and hourly `:41` cadence; it is not part of `epg-refresh` or Guide read critical path.

Transport/runtime:
- public `guide-schedule` reads stored signals only after a canonical schedule is available and catches editorial-store failures to `[]`;
- serialized signals are runtime-validated separately and may reference only programmes inside that bounded schedule response;
- D/D+1 mobile loading merges/deduplicates signal identity independently from schedule conflict semantics;
- runtime stores signals beside, not inside, the installed canonical schedule; editorial-only updates do not replace/remount the canonical schedule, while Per-zender and Nu & Straks derive Kijktip presentation only from exact canonical programme IDs in the separate signal set.

External data flows through:

`EpgProvider -> explicit channel mapping -> normalisation/diagnostics -> canonical ScheduleRepository -> GuideScheduleApi -> hosted transport -> mobile runtime source/cache -> Guide`

Provider-specific IDs, raw XMLTV, credentials and storage details stop at the server boundary.

## TMDB commercial-use status

Owner confirmation on 2026-09-23: the required commercial TMDB licensing for Teevee production API/data/image use is arranged. The TMDB commercial-use gate is **closed** for the Premium Artwork & Content Identity track.

Confidential contract terms, commercial details and credentials are not stored in the repository. Production code must still implement credential ownership, rate-limit/retry/timeout/caching policy and any applicable attribution/branding obligations from the agreed contract. This does not alter the separate production EPG-provider redistribution-rights gate, channel-logo provenance requirements or rights for any non-TMDB artwork source.

## EPG identity evidence production boundary — issue #157 / PR #158

The external-identity source research (#154) and TMDB matching research (#156) proved that the current XMLTV source contains a small evidence bundle that materially improves high-confidence Film/Series identity resolution without broadening canonical `Programme`.

The production provider boundary therefore retains this evidence **transiently and server-side only** on `ExternalProgramme`:

```ts
type ExternalProductionDate = {
  raw: string;
  year?: number;
};

type ExternalProgrammeCredits = {
  director: string[];
  actor: string[];
  producer: string[];
};
```

Rules:
- raw XMLTV `<date>` text is kept as opaque provider evidence; the current adapter exposes `year` only for an exact four-digit `YYYY` value and does **not** parse arbitrary provider values as universal full dates;
- Film year and Series year retain different semantics: Film year is strong identity evidence, while Series year is episode-era/context evidence and must never be assumed to equal Series first-air year;
- credit roles are preserved exactly as `director`, `actor` and `producer`; the provider boundary does not rename `actor` to cast because the source also encodes factual hosts/presenters as actors;
- empty names are dropped and exact normalized duplicates are collapsed deterministically while preserving source order;
- complete categories, structured episode-number values, description and live/repeat evidence keep their existing contracts;
- the existing `hasDirectorCredit` boolean remains the only credit-derived input consumed by the current classification algorithm, so richer evidence does not alter classification semantics;
- canonical `Programme`, `GuideSchedule`, Guide/Search/Vanavond transport and mobile runtime receive none of these richer provider fields;
- no identity-evidence persistence/table is introduced by this foundation.

Current replay limitation is explicit. The provider can be re-fetched within its available horizon, but PR #152's controlled D0 recovery observed **512 provider candidates / 319 exact matches / 193 unmatched**. Therefore later external-identity bootstrap for already-retained broadcasts must not assume that a future provider refetch will still exactly match every canonical broadcast. The next external-identity production increment must own that bootstrap/replay lifecycle explicitly; this foundation does not add fuzzy broadcast reconciliation or a generic enrichment framework.

Source evidence: `docs/PROGRAMME_EXTERNAL_IDENTITY_SOURCE_RESEARCH_2026-09-23.md`. Matching evidence: `docs/TMDB_MATCHING_RESEARCH_2026-09-23.md`.

## TMDB Film/Series external content identity foundation — issue #159 / PR #161

Proposed durable architecture authority: `docs/decisions/0011-broadcast-keyed-external-content-identity.md`.

Production flow:

`same provider observation -> canonical Programme + ProgrammeClassification -> authoritative schedule write -> fail-open TMDB Film/Series matching -> private programme_external_content_references sibling`

Hard boundaries:
- canonical `Programme`, `GuideSchedule`, Search/Vanavond transport and mobile types remain unchanged;
- mobile never calls TMDB, receives `TMDB_API_READ_ACCESS_TOKEN` or receives raw production-date/credit/provider evidence;
- entry gates use only central provider-independent high-confidence classification helpers; canonical `Programme.genre` is never semantic authority;
- no Sport, TMDB episode ID, artwork URL, poster/backdrop, image proxy/cache, recommendation or generic Teevee catalogue is introduced.

Film matching:
- exact current-provider production year is required;
- year must be within TMDB release year ±1;
- at least one director overlap is required;
- direct primary/original-title identity may resolve only when exactly one candidate qualifies;
- alternative/localized-title-only identity additionally requires at least two actor overlaps;
- direct ambiguity fails closed;
- only after zero direct qualifying candidates may the bounded director-filmography fallback inspect at most two directors and three year-compatible Film IDs, then apply the same acceptance rules.

Series matching:
- full provider title first;
- conservative title identity, including the researched leading-article variation;
- actor overlap is required;
- coherent explicit S/E evidence is validated when present;
- only after full-title failure may a clear base-title fallback run;
- coherent base-title fallback requires at least two actor overlaps;
- the researched numbering-disagreement fallback requires at least four actor overlaps and resolves only Series identity;
- provider production year is not treated as TMDB first-air year;
- no episode ID is produced.

TMDB request policy:
- server/Edge secret only: `TMDB_API_READ_ACCESS_TOKEN`;
- 2.5 s per-attempt timeout;
- at most one retry for safe retryable network/timeout, 5xx or bounded 429 failures;
- 429 `Retry-After` is honored only inside a 1 s retry budget;
- 4xx and malformed JSON are non-retryable;
- one enrichment run uses a shared owner AbortSignal capped at 20 s for both TMDB HTTP work and the external-content PostgREST persistence request;
- required TMDB matching containers/collections, matching-critical element fields **and matching-critical optional scalars** are schema-strict: a valid empty array is legitimate empty evidence; season episode arrays are fully decoded before membership is derived so a trailing malformed element cannot be hidden by short-circuit evaluation; optional `release_date` may be missing/null/empty/whitespace-only and then means unknown year, but any other present value must itself be an exact valid calendar `YYYY-MM-DD` string with no surrounding whitespace; wrong-shaped or invalid required evidence is operational `malformed` and cannot create positive or negative identity evidence; non-matching crew roles only require the fields needed to identify/skip that role, so optional irrelevant fields are not promoted into errors;
- request-scope search/detail/credits/alternative-title/season caching;
- identical work deduplication;
- maximum three identity work items concurrently;
- no persistent TMDB catalogue/cache in this increment.

Persistence:
- private/service-role-only `teevee.programme_external_content_references`;
- one row per canonical broadcast, deliberately without a destructive FK cascade because ADR 0007 delete/reinserts programme rows during normal schedule refresh;
- many broadcasts may share one TMDB ID;
- only `tmdb`, `film|series`, positive content ID, `high`, matcher version, evidence observation timestamp and resolution timestamp are persisted;
- no provider people/date/category evidence and no artwork are stored;
- write RPC is bounded to 256 decisions, shares the canonical per-channel advisory lock, revalidates exact broadcast fields and requires schedule coverage generated by the **same provider observation**;
- newer coverage/reference state wins; late results are ignored;
- current deterministic unresolved/ambiguous decisions clear an older exact-broadcast reference;
- private `SECURITY INVOKER` ownership helpers use an empty `search_path` and are not executable by public/anon/authenticated roles;
- a before-write ownership trigger rejects references to unknown programme IDs;
- a deferred programme-side ownership trigger preserves an unchanged `id/channel/start/end/title` tuple across normal delete/reinsert refresh, but removes the reference before commit for a true correction/rekey/delete;
- provider/TMDB operational failures create no negative decision.

Lifecycle/bootstrap:
- only a successfully stored authoritative schedule observation is enrichment-eligible;
- partial/unattributed/no-safe/stale schedule observations cannot attach identity;
- guide-horizon writes all canonical windows before any TMDB request, so TMDB cannot transactionally block Guide ingest;
- current/future broadcasts are forward-filled; normal ADR-0007 refreshes preserve the sibling for the exact same concrete broadcast as it becomes D0, while a real replacement/delete removes it transactionally;
- there is no fuzzy/title-only historical D0 attachment;
- post-deployment retained broadcasts may temporarily lack identity until forward-fill/warm-up reaches them.

PR #152's dormant `20260923201300_recover_programme_classification_siblings.sql` / `teevee_recover_programme_classifications` remains classification-recovery history only. It is **superseded for external-content bootstrap** and PR #161 does not call it. Do not rewrite/remove applied migration history; any retirement is a future forward cleanup after verifying no remaining caller.

This foundation intentionally exposes no public/mobile external-content read contract. Artwork selection, language-neutral poster provenance, TMDB attribution/branding presentation and any image delivery/cache remain follow-up increments.

## Vanavond programme classification sibling — issue #142 / ADR 0010

The classification lane is derived from the same provider record that creates a canonical broadcast:

`ExternalProgramme full structured evidence -> canonical normalisation + central provider mapping -> ProgrammeClassification sibling -> atomic classified ScheduleRepository write`

Provider evidence kept **only server-side before canonicalization**:
- all XMLTV categories, not just the first category retained in `Programme.genre`;
- structured `episode-num` values;
- minimal `hasDirectorCredit` presence remains the only credit-derived classification input; richer role-preserving credit names may coexist on `ExternalProgramme` for server-side external identity but are ignored by the classifier;
- explicit provider live/repeat booleans when present;
- description only for narrow deterministic Sport subtype phrases after structured Sport evidence already exists.

Persisted/public semantics contain no provider vocabulary:
- content type: `film | series | sport | other | unknown`;
- series type: `scripted-episodic | non-scripted | unknown`;
- audience: `general-mainstream | primarily-children | unknown`;
- sport type: `event | highlights | talk | magazine-documentary | other | unknown`;
- live/repeat: `true | false | unknown`;
- confidence: `high | unknown`.

Eligibility is deliberately fail-closed. A future Vanavond module does not inspect `Programme.genre`: it consumes only high-confidence Teevee semantics.

Series precision is deliberately stricter than “S/E + a genre”: strong scripted-form categories survive broad subject labels unless a strong non-scripted format conflicts; generic recovery rejects broad context/subject categories and requires S/E plus either multiple compatible scripted categories or one compatible category with explicit director-credit evidence. **A generic-Series blocker is not positive `other` evidence.** Only strong structured non-scripted/other categories can produce `other/high`; broad context blockers that merely make scripted inference unsafe keep content type/confidence unknown unless another positive rule applies.

Audience certainty is orthogonal to content-type certainty. `Kinderen` / `Kids En Familie` may establish `audience: primarily-children` while `contentType` remains `unknown`; they never prove `other/high` by themselves. Semantic children's Series remains possible through the existing scripted evidence rules and is then excluded from `Series vanavond` by audience. Post-#5795818040 exact-live revalidation kept Film/general-Series/semantic-Series/Sport at 36/99/182/3 and moved one additional current evening row from `other/high` to `unknown/unknown` (other 620, unknown 118).

Persistence:
- private `teevee.programme_classifications` is one row per canonical broadcast;
- FK `programme_id -> teevee.programmes(id)` uses cascade lifecycle;
- `teevee.replace_schedule_window_classified` validates classification completeness, delegates the existing ADR-0007 authoritative schedule replacement, returns immediately on `ignored-stale`, then stores semantics in the same transaction;
- a canonical start correction naturally deletes/cascades the old programme/classification and writes the newly keyed pair;
- an authoritative empty/deleted programme cannot leave an orphan classification;
- repeated same-broadcast ingest is idempotent;
- no raw category set is persisted in the classification table.

Backfill/recovery:
- existing retained rows cannot be safely reconstructed from first-category `Programme.genre`;
- after reviewed migration/runtime deployment, one authoritative `epg-refresh` `guide-horizon` run re-fetches D-3..D+8 and rebuilds classifications from full provider evidence;
- stale classifications are cleaned by the normal schedule replacement/cascade lifecycle rather than a separate cleanup cron.

Read/transport:
- Guide `guide-schedule` payload remains unchanged;
- private `teevee.get_programme_classifications` + service-role bridge support a bounded **1..256** programme-ID read;
- public `programme-classifications` Edge transport returns only typed Teevee semantics;
- later Vanavond can read one bounded evening schedule and request those programme classifications; it must not eagerly preload D-2..D+7 or classify in a mobile render path.

Performance:
- XMLTV schedule parsing is incremental: every top-level programme block is scanned once, but full category/episode/date/credit/title evidence is materialised only after requested provider channel and `[from,to)` intersection are known; guide-horizon shares one provider bulk session across its independent windows;
- classification is O(number of categories + episode-number evidence) per normalized programme, with one precomputed director-presence boolean and description normalization only after structured Sport evidence;
- persistence adds one compact sibling row per retained programme inside the existing replacement transaction;
- classification reads are primary-key bounded and are not called by Guide;
- Guide startup/render payload/cost is therefore unchanged.

Empirical provider evidence: `docs/TONIGHT_CLASSIFICATION_SOURCE_EVIDENCE_2026-09-23.md`. Durable decision: ADR 0010.

Hosted deployment is complete and canonical:
- PR #144 merged as `ca738e3c80d714ad6f95833554c6319674647fdb`;
- hosted migration `20260923144656_create_programme_classification_foundation` contains the exact reviewed SQL blob `f39e728b2098806f31b237319396436fc0a4e618`;
- `epg-refresh` v7 and `programme-classifications` v1 are ACTIVE and their deployed runtime files match the merge SHA byte-for-byte;
- protected guide-horizon refresh request 118 returned HTTP 200 and populated every source-complete D+1..D+5 television-day window;
- the distinct stored scope contains 2,358 canonical programmes and exactly 2,358 classification siblings, with 0 missing, 0 outside-scope and 0 orphans;
- live HTTP smoke run `35878911866`, job `107241960510`, proved real Film/Series/Sport reads, absence of raw provider-field leakage and the 256-ID request bound.

Deployment evidence: `docs/TONIGHT_CLASSIFICATION_DEPLOYMENT_2026-09-23.md`.

## Vanavond mobile runtime boundary — issue #148 / PR #149

The first production Vanavond runtime consumes, but does not modify, the deployed schedule/editorial/classification lanes:

`one active 06:00→06:00 guide-schedule read -> editorialSignals + bounded relevant programme IDs -> programme-classifications -> mobile Tonight presentation`

Ownership rules:
- Vanavond has its own process-local loading/request-version state;
- it never installs its read into the shared Guide runtime or makes Guide startup/render wait for classification;
- only the active television day is fetched; no D-2..D+7 prefetch and no persistent Tonight schedule cache;
- Kijktip comes exclusively from the sibling editorial signals returned with the canonical schedule bundle;
- classification requests are restricted to current/future concrete broadcasts starting in [19:00,06:00), are bounded by the existing 256-ID contract, and fail closed instead of widening/chunking beyond that contract;
- selection/transformation work is bounded to the evening subset [18:00,06:00) of the one-day response;
- Film/Series/Sport eligibility uses only the provider-independent `ProgrammeClassification` helpers; no raw genre/category/provider rule exists in mobile Tonight code;
- current/ended presentation is recomputed from real canonical `startAt/endAt`; late old-day responses are rejected after the 06:00 television-day rollover;
- discovery failure never substitutes deterministic Guide fixtures as fake production categories.

Jouw gids remains local-first in the existing `ProgrammePersonalState` store. PR #149 upgrades the serialized schema from v1 to v2 by adding durable `hasUsedSave` without changing the native file/web key. Valid legacy saves/reminders survive parsing; retained v1 saves prove usage, empty legacy state remains conservatively false, and every successful new save makes usage permanently true. Exact canonical programme IDs may resolve to Programme Detail; unresolved snapshots remain visible but never trigger title-only reconciliation or fabricated details.

No programme-artwork source is introduced. The runtime is intentionally production-usable with its frozen no-artwork fallback media geometry; artwork/TMDB remains a later independent, rights-cleared enrichment.

## Phase 5A Guide Search data boundary

Canonical product contract: `docs/SEARCH_PRODUCT_DEFINITION.md`. Durable architecture authority: ADR 0009.

Search operates on existing canonical `Channel` and concrete canonical `Programme` broadcasts. It does not introduce a generic programme/title/series entity.

The mobile Guide runtime intentionally does not hold D-2..D+7 simultaneously. The accepted Search boundary therefore uses one provider-independent hosted request and one canonical-store repository/RPC call instead of downloading ten Guide schedules to mobile or the Edge layer.

Data semantics:
- the server derives the exact current D-2..D+7 television-day windows from shared `guideTime` primitives;
- authoritative coverage is evaluated per active canonical channel × television-day window;
- only programmes intersecting a fully covered pair may contribute results;
- aggregate programme scope reports `complete | partial | unavailable` independently from result count;
- canonical channel identity remains searchable even when programme coverage is unavailable;
- programme title and canonical channel-name fields are the Phase 5A query corpus;
- lexical normalization/ranking is exact → prefix → substring; no fuzzy/semantic/provider-specific matching;
- repeats remain separate canonical broadcasts;
- result limits are 24 programmes and 24 channels;
- Kijktip remains optional sibling metadata, queried only for returned programme IDs, and never changes Search ranking;
- corrected-start canonical identities supersede stale identities naturally because Search reads current canonical storage.

Current Supabase repository implementation is deployed and live-verified:
- `teevee.search_guide` reads private canonical storage;
- `public.teevee_search_guide` is a service-role-only PostgREST bridge;
- both use SECURITY INVOKER with empty `search_path`;
- `anon` / `authenticated` execute is revoked;
- `unaccent` lives in the `extensions` schema;
- public `guide-search` Edge transport holds the secret and returns only the typed canonical contract.
- hosted migration version: `20260923064120_create_guide_search_read_boundary`, exact reviewed SQL blob `d232eacbf3b809d23ae9c4eeb9a15ea2ffc20380`;
- `guide-search` v1 is ACTIVE and production endpoint smoke CI #986 proved canonical NPO channel retrieval plus a concrete NPO 1 broadcast result;
- deployment evidence: `docs/GUIDE_SEARCH_DEPLOYMENT_2026-09-23.md`.

Do not solve Search by adding SQLite/TanStack Query, extending AppPreferences into schedule storage, direct mobile Supabase-table access, or eager full-horizon Guide prefetch.

## Deterministic fixtures remain mandatory
Synthetic fixture data remains required for:
- normal CI;
- repeatable domain/UI tests;
- offline development;
- interaction regression testing;
- first-frame fallback while hosted canonical data loads.

Real schedule data supplements fixtures; it does not replace deterministic tests.

Do **not** map provider IDs onto synthetic fixture identities by assumption. The hosted development slice uses its own explicit narrow canonical channel catalog/mapping.

## Temporary development provider
The current server-side `XmltvEpgProvider` uses this default development feed:

`https://iptv-epg.org/files/epg-nl.xml`

This source is development-only. Public availability is not proof of commercial redistribution rights.

Observed real-feed evidence on 2026-09-14 via temporary unmerged inspection:
- 30,237,192 bytes;
- 184 channels;
- Belgian target-channel source check: `docs/BELGIAN_EPG_TARGET_CHANNEL_CHECK_2026-09-24.md`; the requested VRT/VTM/Play/Ketnet set is available in `epg-be.xml`, with Play/Play Fictie/Play Actie/Play Reality still exposed under legacy provider names Play4/5/6/7.
- owner-approved next channel-expansion target/order: `docs/CHANNEL_EXPANSION_TARGET_2026-09-24.md`; implementation must explicitly compose/map the required source records without leaking provider ordering or aliases into canonical Teevee channel identity.
- full live-source channel inventory: `docs/RAW_EPG_CHANNEL_INVENTORY_2026-09-24.md` (184 unique provider channel IDs, 40,282 programme rows observed 2026-09-24);
- 33,117 programme records;
- observed range `20260913000600 +0000` through `20260919235500 +0000`;
- verified IDs including NPO1/2/3, RTL4/5/7/8/Z, SBS6/9, Net5 and VeronicaDisneyXD.

Website counters and fetched payload totals disagreed. Teevee therefore derives correctness/coverage only from parsed feed content and explicit requested scope.

## Provider interface
```ts
type ProviderScheduleBatch = {
  coverage: 'complete' | 'partial';
  programmes: ExternalProgramme[];
};

interface EpgProvider {
  readonly key: string;
  getChannels(): Promise<ExternalChannel[]>;
  getSchedule(input: {
    from: Date;
    to: Date;
    channelIds?: string[];
  }): Promise<ProviderScheduleBatch>;
  getSchedules?(inputs: ProviderScheduleQuery[]): Promise<ProviderScheduleBatch[]>;
}
```

Raw required values may be malformed or absent at this boundary. Adapters preserve diagnosable input instead of inventing canonical values.

`complete` means the adapter can prove the requested provider channel/time scope is continuously covered and authoritative. `partial` may be inspected but cannot destructively replace canonical storage.

## XMLTV adapter rules
The development adapter:
- parses channel IDs/display names and optional icons;
- parses programme title, subtitle, description, complete categories, structured episode-number evidence and live/repeat flags;
- preserves raw `<date>` text and exposes a numeric production year only for exact `YYYY` values;
- preserves `director[]`, `actor[]` and `producer[]` names by source role, with deterministic empty/duplicate filtering;
- requires an explicit numeric timezone offset in XMLTV timestamps;
- normalises valid timestamps to UTC ISO;
- leaves malformed timestamps representable for downstream diagnostics;
- consumes `response.body` incrementally instead of calling `response.text()` for schedule reads;
- safely reassembles complete top-level `channel` / `programme` blocks across arbitrary network chunk boundaries, including CDATA/comment handling for closing-tag text;
- applies requested provider-channel filtering before programme timestamp parsing and applies `[from,to)` intersection before full programme evidence materialisation;
- retains only requested channel evidence, requested-window programme objects and the current unread/top-level XML block rather than a feed-wide `ParsedProgramme[]`;
- declares `complete` only when every requested channel continuously covers the full requested range; gaps/no-programme remain `partial`;
- keeps `getChannels()` isolated as the explicit all-channel discovery path; hosted refresh does not call it;
- uses an injectable `fetch` boundary so automated tests are deterministic.

Normal PR CI never calls the live feed.

## Channel mapping
Provider identity is never canonical Teevee identity.

Rules:
- mappings are explicit;
- unknown/invalid/duplicate mappings are diagnosed conservatively;
- canonical channel IDs belong to Teevee and may survive provider replacement;
- provider metadata outside requested replacement scope cannot overwrite unrelated canonical channels;
- the current hosted development slice maps only a narrow verified set of real channels rather than all source channels.

## Canonical domain model
### Channel
Required:
- `id` stable Teevee identity;
- `name`;
- `displayName`;
- `sortOrder`;
- `isActive`.

Optional:
- `logoUrl`;
- `shortName`.

No external logo is considered cleared for production merely because the feed references it.

### Programme
Required:
- `id` stable Teevee broadcast identity;
- `channelId`;
- `startAt`;
- `endAt`;
- `title`.

Optional:
- `subtitle`;
- `description`;
- `genre`;
- `isLive`;
- `isRepeat`.

Artwork/cast/episode enrichment remains optional to core Guide usability.

## Time handling
- canonical programme timestamps are UTC ISO and are never shifted to emulate a television day;
- Dutch MVP renders/interprets Guide grouping in `Europe/Amsterdam`;
- XMLTV adapter does not guess timezone when an offset is missing;
- current-programme and query semantics are `[start,end)`;
- DST transitions remain explicit deterministic test cases.

### Television-day semantics — ADR 0008
Guide grouping/navigation uses a **television day** rather than a strict midnight calendar day:
- television day starts at **06:00 Europe/Amsterdam** and ends at 06:00 the next calendar day;
- between 00:00 and 05:59, the active television day is still the preceding date/evening;
- midnight is not a Guide boundary;
- membership is derived from the real instant and timezone; storage timestamps stay unchanged;
- continuous Guide surfaces may cross midnight and the 06:00 semantic boundary without fabricating programme times.

Let `D` be the current television day. Totaal and Per zender must support at least **D-2 through D+7**: ten complete television days. Nu & Straks remains a single active-day view using the same 06:00 definition.

## Stable IDs
External provider IDs are not product IDs by themselves.

Normalisation creates deterministic Teevee programme identities from provider namespace + canonical channel + provider programme identity + broadcast start, with a deterministic composite fallback when provider IDs are absent. This prevents repeated broadcasts from collapsing together.

## Canonical hosted storage — ADR 0007
Supabase implements the backend-independent semantics:
- explicit canonical channel/time replacement scope;
- programme intersection `start < to && end > from`;
- coverage/freshness stored separately from programme rows;
- covered-empty valid vs uncovered unavailable;
- conservative read freshness;
- stale overlapping writes atomically rejected before mutation;
- request-start freshness prevents slow older refreshes from winning.

Hosted project:
- `teevee` / `eokszvpityhtysbwdduy`;
- organization `teevee`;
- Free plan;
- `eu-west-2`.

Private `teevee` tables are not client-readable. Service-role-only RPC bridges back `SupabaseScheduleRepository`.

## Hosted schedule transport
The Phase-3 hosted transport is implemented and physically proven.

### Public read
`guide-schedule`:
- accepts runtime-validated serialized `from`, `to` and optional non-empty trimmed/deduplicated canonical channel IDs;
- returns `ok` for fully covered canonical scope, including zero programmes;
- returns `unavailable` for missing/incomplete canonical coverage;
- returns canonical UTC timestamps only;
- exposes no provider/database implementation detail;
- is deliberately bounded to narrow windows suitable for a public no-login Guide.

Those bounded windows are compatible with individual television-day requests. Phase 4 composes the required horizon from bounded windows rather than exposing one huge unbounded ten-day payload.

### Protected refresh
`epg-refresh` remains server-only:
- provider IDs stay behind the server boundary;
- anonymous/authenticated callers cannot refresh/write;
- partial provider coverage never destructively overwrites canonical data;
- trusted refresh may use the server secret-key route or the validated scheduled-refresh token;
- issue #167 production evidence is explicit: both a full `guide-horizon` request and an RTL4-only four-hour `window` request failed with HTTP 546 / `WORKER_RESOURCE_LIMIT` while the pre-#168 adapter materialised the complete Netherlands XMLTV document before filtering; external-content references remained 0.

### Automatic development refresh
A server-side `pg_cron` + `pg_net` job runs every six hours. The cron requests one protected `guide-horizon` refresh; the Edge Function derives independent **06:00 Europe/Amsterdam television-day windows** from D-3 through D+8. D-2..D+7 remains the selectable product horizon; D-3/D+8 are backend safety buffers only.

With the #167 correction, one XMLTV response body is fetched and incrementally scanned once per guide-horizon invocation. The optional provider bulk-session returns one independently classified batch per D-3..D+8 television-day window from that single scan; each window still passes through normal `complete | partial` authority and ADR 0007 replacement semantics. Partial windows are skipped and therefore cannot fabricate canonical coverage or erase previously retained authoritative history. Single-window refreshes use the same bounded streaming parser for only their requested provider channel/time scope.

The dedicated cron token is generated/stored encrypted in Supabase Vault; the real Supabase secret key stays inside the Edge Function environment.

The former implementation refreshed three **calendar-midnight** windows. That could leave a 06:00 television-day query only partially covered even while overlapping programme rows existed. The 2026-09-21 investigation and correction are recorded in `docs/EPG_HORIZON_INVESTIGATION_2026-09-21.md`.

## Mobile runtime source
The mobile boundary currently provides:
- immediate deterministic fixture schedule on first frame;
- hosted canonical read after startup;
- runtime validation of serialized responses;
- provider-independent merge/deduplication;
- one in-memory runtime schedule source shared across Totaal, Per zender and deferred Nu & Straks;
- independently bounded D and D+1 television-day reads derived from the 06:00 Europe/Amsterdam domain primitive;
- runtime schedule anchoring and lifecycle rollover at 06:00 rather than midnight;
- refresh on startup and app resume;
- freshness-only updates that do not remount the Guide;
- request-version protection against stale/out-of-order hosted responses;
- fallback/preservation when hosted data is unavailable, invalid or a network refresh fails.

PR #64 replaced the former Phase-3 strict-calendar today+tomorrow runtime assumption. Its deterministic tests cover 00:00, 05:59, exact 06:00, both Amsterdam DST transitions, bounded 23/25-hour reads, unavailable required windows, lifecycle refresh and stale response races. Independent exact-head QA found no code blocker, and focused iPhone evidence proved fixture-first -> hosted replacement plus same-television-day context retention after background/resume.

PR #66 completed user-selected D-2..D+7 access for Totaal and Per zender using bounded per-day reads. Nu & Straks remains a single active-television-day presentation.

## Phase ownership for horizon/retention
### Phase 3 — complete
Proved:
- provider-independent instant/window semantics;
- hosted canonical storage and bounded public read;
- protected real-provider refresh;
- mobile canonical runtime validation/replacement;
- deterministic fixture fallback;
- physical fixture -> hosted transition and context retention on iPhone.

The historical two-calendar-day mobile loader has been superseded by PR #64. The former rolling three-calendar-day development refresh buffer has been superseded by the server-side `guide-horizon` refresh. Development refresh now materialises independent 06:00 Europe/Amsterdam television-day windows from D-3 through D+8; D-3 and D+8 are operational safety buffers only and do not change the D-2..D+7 product horizon.

### Phase 4 — closed
Owns:
- shared 06:00 television-day primitives and query keys — implemented for the current runtime boundary;
- D-2..D+7 day selection/navigation in Totaal and Per zender — completed in PR #66;
- bounded hosted loading strategy for selected/needed television days;
- preservation of historical D-2/D-1 data while inside the guaranteed window;
- uninterrupted evening browsing through midnight;
- 06:00 television-day rollover and `Nu` behaviour;
- deterministic fixture support under the same semantics;
- context-preserving refresh/day changes;
- realistic payload/render/performance measurement before selecting persistent cache technology — completed for the observed cold Guide bottleneck; evidence pointed to render/mount cost rather than cache/network;
- explicit offline/stale-cache behaviour remains a later release-like hardening concern if persistent caching is introduced.

### Phase 8 — production provider / rights
The production EPG provider must prove:
- sufficient future horizon to guarantee D+7;
- sufficient historical retention/availability to guarantee D-2;
- freshness/correction behaviour compatible with the product;
- explicit paid-app redistribution rights for schedule/metadata and separately licensed logo/artwork where used.

A provider that cannot meet the minimum horizon is insufficient for the Teevee production promise.

## Schedule horizon
Minimum product guarantee for Totaal and Per zender is **D-2 through D+7 television days**, where `D` is derived with the 06:00 Amsterdam boundary.

Backend storage/cache should retain a safety buffer beyond the visible guarantee where practical, or retain the broader authoritative provider horizon when operationally cheap.

Preferred production target remains 14 days forward when the eventual licensed provider supports it. That is headroom, not a replacement for the D-2 historical guarantee.

The temporary development feed does **not** satisfy the full product horizon. A live 2026-09-21 inspection across all 12 mapped development channels found complete 06:00 television-day coverage only for **D0 through D+5**. D-2/D-1 were absent from the current feed payload and D+6/D+7 were incomplete. Canonical storage can retain already-ingested historical D-2/D-1 data because partial refreshes are non-destructive, but no backend windowing change can manufacture missing future D+6/D+7 provider data. Production provider selection must therefore prove the full D-2..D+7 guarantee independently.

## Persistent cache/offline
Persistent mobile schedule caching was **not selected at Phase 4 closeout**. The measured cold Guide bottleneck was render/mount work, not network/cache, and it was addressed with bounded rendering rather than a persistence layer.

Do not add SQLite, TanStack Query or another server-state/cache framework without new measured product/reliability evidence. AppPreferences remains a small-settings layer and must not become schedule storage.

Current graceful degradation uses deterministic fixture-first rendering and preserves existing usable runtime state across failed refreshes. The MVP product requirement for local caching/graceful offline fallback remains a release requirement; a true no-network cold start and any concrete persistent-cache technology decision remain a release-like Phase 9 standalone/dev-build gate because Expo Go itself requires Metro/network after force-quit.

## Updates and corrections
- only `complete` batches may destructively replace canonical windows;
- `partial` batches never clear existing authoritative coverage;
- complete empty windows may legitimately clear stale rows;
- errors attributable to one mapped channel can block that channel without blocking unrelated safe channels;
- unattributed malformed data blocks destructive replacement;
- late stale refreshes are rejected;
- mobile refresh must preserve accepted Guide context where practical;
- refresh/retention must not evict historical television days while they remain inside D-2..D+7 once that horizon is implemented;
- future production ingest must keep the guaranteed horizon continuously covered rather than only loading forward from the current instant.

## Data-quality diagnostics
Implemented diagnostics cover:
- invalid/ambiguous channel mappings;
- programmes on unmapped channels;
- invalid/missing timestamps;
- end <= start;
- missing titles;
- duplicate broadcasts;
- overlapping programmes.

Do not invent freshness/volume thresholds until real-feed measurements justify them.

## Testing expectations
Normal CI remains deterministic and offline from external providers.

Relevant automated layers include:
- XMLTV parsing/mapping/normalisation;
- canonical repository coverage/replacement/freshness;
- stale concurrency protection;
- Supabase RPC mapping/runtime validation;
- typed public schedule request/response contract;
- hosted response -> runtime validation -> shared mobile schedule;
- unavailable/network failure -> existing usable state/fallback.

Phase 4 television-day/horizon work is high risk under `ENGINEERING_QUALITY_POLICY.md`. Direct tests must cover, where relevant:
- 00:00, 05:59 and exactly 06:00;
- both Amsterdam DST transitions, including 23-hour and 25-hour television days;
- exactly D-2 through D+7;
- contiguous window derivation;
- `Nu` and selected-day context;
- context-preserving refresh/day changes.

Physical device evidence is required when user-facing Guide navigation/scroll context changes; CI alone is not device acceptance.

## Production rights gate
Before public paid release, Teevee needs explicit answers to:
1. production schedule provider;
2. paid-app redistribution rights;
3. freshness/SLA;
4. minimum D-2 historical and D+7 future horizon;
5. included metadata;
6. channel-logo and programme-artwork rights;
7. provider-failure fallback.

An authorized Bindinc/TVgids source remains preferred when available. EPGdata.tv and Gracenote remain candidates. Public/free/scrapeable availability alone is never licensing evidence.

## Frozen decisions
- provider independence is mandatory;
- client never parses XMLTV or calls external EPG URLs directly;
- deterministic fixtures remain mandatory;
- public/free/scraped accessibility is not licensing evidence;
- authoritative coverage must be explicit before destructive replacement;
- coverage/freshness is distinct from programme rows;
- stale writes cannot roll newer schedule state backwards;
- canonical programme timestamps remain real instants;
- Guide grouping follows ADR 0008's 06:00 television-day boundary;
- Totaal and Per zender must support at least D-2..D+7 television days;
- enrichment is optional to core Guide functionality.
