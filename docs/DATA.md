# Teevee Programme Data Strategy

Status: Phase 3 provider-independent data contracts implemented; concrete hosted backend and authorized live development provider remain pending.

## Goal
Teevee must be able to develop and validate the complete core product without depending on one EPG supplier, while remaining able to migrate to Bindinc/TVgids production data later without rewriting the mobile Guide.

## Core rule
The mobile client never consumes an external EPG feed directly.

All providers are translated into a Teevee-owned domain model through a server-side/provider ingestion boundary. Provider-specific identifiers, credentials, XMLTV concepts and payload fields do not leak into Guide components or the public mobile schedule contract.

## Development provider strategy
Deterministic fixtures remain the default source for automated tests and offline core development until an authorized live development source is available.

Do **not** assume that a free, public or technically scrapeable guide is licensed for Teevee. Public accessibility is not a usage-rights decision.

Current provider order:
1. prefer an authorized Bindinc/TVgids.nl development feed/API when available;
2. otherwise evaluate a commercial provider with Netherlands coverage and explicit development/redistribution rights;
3. never adopt a scraper feed merely to complete Phase 3.

Current research is recorded in `PHASE_3_PROVIDER_RESEARCH_2026-09-14.md`.

Schedules Direct is explicitly rejected under its currently published personal/non-commercial terms. Gracenote On API and EPGdata.tv are technically relevant candidates, but neither is approved for Teevee until access, commercial rights and Netherlands scope are confirmed.

A development provider is not automatically production-approved by completing Phase 3.

## Provider interface
The implemented server-side provider contract is intentionally neutral:

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
}
```

Raw external fields that Teevee requires canonically are allowed to be missing at this boundary. Malformed input must remain representable so normalisation can diagnose/reject it instead of forcing adapters to invent values.

`coverage: complete` means the adapter considers the requested time/channel scope authoritative, including a legitimate empty window. `partial` data may be inspected/diagnosed but may not destructively replace canonical storage.

## Channel mapping
Provider channel identity is never treated as Teevee channel identity.

- provider -> canonical channel mappings are explicit;
- unknown or invalid canonical mappings are diagnosed;
- repeated provider IDs are treated conservatively as ambiguous and excluded;
- a partial refresh declares the exact canonical channel scope it may replace;
- channel metadata outside that scope cannot be overwritten by the refresh.

## Canonical domain model
### Channel
Required:
- `id`: stable Teevee identifier;
- `name`;
- `displayName`;
- `sortOrder`;
- `isActive`.

Optional:
- `logoUrl`;
- `shortName`.

Provider references belong at the ingestion/mapping boundary, not in Guide presentation contracts.

### Programme
Required:
- `id`: stable Teevee identifier;
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

Future enrichment may add image/cast/episode fields without making them structural requirements for Guide usability.

Derived values such as duration, progress and current/upcoming state should normally be calculated from canonical timestamps rather than persisted redundantly.

## Time handling
- Canonical timestamps use UTC ISO values.
- Provider timezone information is retained only where ingestion diagnostics need it.
- Render in Europe/Amsterdam for the Dutch MVP unless user/platform requirements later require another timezone.
- Explicitly test daylight-saving transitions.
- Current-programme semantics remain `[start,end)`.

## Stable IDs
External provider IDs cannot be trusted as permanent Teevee product IDs by themselves.

The current normalisation layer produces deterministic Teevee programme identities from provider namespace + canonical channel + provider programme identity + broadcast start. This allows a provider to reuse a content/programme ID for multiple broadcasts without collapsing those broadcasts into one programme row.

When a provider has no usable ID, a deterministic composite identity is used. Schedule-window replacement handles later corrections so stale canonical rows can be removed safely.

## Canonical storage / query semantics
ADR 0007 defines the durable backend-independent rules.

- Reads use serialisable `GuideScheduleQuery` time/channel scope.
- A programme intersects a read window when `start < to && end > from`.
- Replacement writes declare explicit canonical channel IDs and a `[from,to)` window.
- Authoritative coverage/freshness is tracked per channel/time segment independently from programme rows.
- A covered empty window is valid schedule data; uncovered/partly covered scope is unavailable.
- Read freshness is conservative: report the oldest freshness contributing to the requested scope.
- An older incoming write that overlaps newer authoritative coverage is rejected atomically as `ignored-stale`.
- Ingest freshness is captured when the provider request starts so response completion order cannot roll data backwards.

The current in-memory repository is only an executable reference/test implementation. The production persistence engine remains open.

## Schedule horizon
Development target: at least 7 days forward when the selected provider supports it. Preferred production target: 14 days forward. The product must degrade gracefully when a source supplies a shorter horizon.

A concrete provider adapter may choose smaller ingestion chunks for rate limits/API constraints while canonical coverage still represents the actual authoritative range stored.

## Updates and corrections
Broadcasters change schedules, so ingestion is replacement/correction-oriented rather than append-only.

- complete provider batches can replace stale canonical rows only inside their explicit time/channel scope;
- partial provider batches never destructively replace canonical windows;
- malformed records attributed to one canonical channel can block that channel while allowing other safe channels to update;
- an unattributed malformed record blocks the destructive write because its affected scope cannot be proven;
- delayed older refreshes are rejected instead of overwriting newer canonical schedule data;
- mobile refresh must not force the user to lose Guide presentation/channel/time context.

## Data-quality expectations
Implemented normalisation diagnostics cover:
- invalid/ambiguous channel mappings;
- programmes on unmapped provider channels;
- programme ending before/equal to its start;
- invalid or missing timestamps;
- missing required titles;
- duplicate provider broadcast records;
- overlapping programmes on one canonical channel.

Future provider-specific hardening should additionally define sensible freshness and unexpectedly low/high volume diagnostics once real provider behaviour and requested horizon are known. Thresholds should not be guessed before that evidence exists.

Data-quality warnings do not necessarily block ingestion if usable schedule data remains. Errors block destructive replacement only where the affected canonical scope can be established safely.

## Typed Teevee schedule API
The public/mobile-facing contract exposes only canonical `GuideSchedule` values.

- serialised query input is validated at runtime, not trusted merely because TypeScript types exist;
- valid timestamps are canonicalised to UTC;
- provided channel ID lists must be non-empty, are trimmed and deduplicated;
- a fully covered canonical query returns `ok` even when it contains zero programmes;
- unavailable canonical coverage returns explicit `unavailable`;
- provider IDs/raw records/database details are not exposed.

The HTTP/Edge Function transport itself is intentionally not selected yet.

## Fixtures
A deterministic fixture dataset remains mandatory.

Minimum fixture scope:
- representative Dutch channels (public, commercial, film/series and sport profiles);
- at least 48 hours of schedule;
- short and long programmes;
- programmes crossing midnight;
- simultaneous prime-time starts;
- missing descriptions/artwork;
- live programmes;
- gaps and edge cases;
- realistic title lengths.

Fixtures remain the default source for automated tests and can be used for UI development without internet access.

## Enrichment
Artwork, cast, series metadata, editorial selections and recommendations are an optional enrichment layer. Core Guide, Search and Programme Detail remain useful when enrichment is absent.

## Channel logos and artwork rights
Channel-logo and programme-artwork usage rights are separate dependencies from schedule data. No externally sourced logo/artwork is treated as cleared for public commercial use without confirmation.

## Backend / credentials gate
The connected environment currently has no Teevee backend project. The visible Supabase project belongs to another product (`ReelWorthy`) and must not be reused.

Creating a Teevee hosted backend requires an explicit organization/cost decision. Provider credentials likewise require an authorized source and must never be committed or shipped in the mobile bundle.

## Production gate
Before a public paid release, the project must have explicit answers to:
1. Who supplies production schedule data?
2. What usage rights cover a paid consumer app?
3. What freshness/SLA is expected?
4. What programme metadata is included?
5. What image/logo rights are included?
6. What is the fallback plan during provider failure?

## Frozen decisions
- provider independence is mandatory;
- the client does not parse XMLTV or depend on a provider URL;
- fixtures are mandatory;
- public/free/scraped availability is not sufficient evidence of usage rights;
- authoritative provider coverage must be explicit before destructive schedule replacement;
- canonical coverage/freshness is distinct from programme rows;
- stale overlapping refreshes cannot roll newer schedule state backwards;
- enrichment is optional to core Guide functionality.
