# Teevee Programme Data Strategy

Status: Phase 0 baseline.

## Goal
Teevee must be able to develop and validate the complete core product without depending on internal Bindinc availability, while remaining able to migrate to Bindinc/TVgids production data later without rewriting the mobile client.

## Core rule
The mobile client never consumes an external EPG feed directly.

All providers must be translated into a Teevee-owned domain model through a provider adapter and normalisation layer.

## Development provider strategy
Initial development uses a free external EPG source with XMLTV-compatible data where practical. This source is a development dependency only. It is not assumed to be suitable, complete, reliable or licensed for commercial production.

Before public release, the production data source and usage rights must be explicitly approved.

## Provider interface
Every provider implementation must satisfy the same conceptual contract:

```ts
interface EpgProvider {
  getChannels(): Promise<ExternalChannel[]>;
  getSchedule(input: {
    from: Date;
    to: Date;
    channelIds?: string[];
  }): Promise<ExternalProgramme[]>;
}
```

Expected provider implementations over time:
- `FixtureEpgProvider`
- `FreeExternalEpgProvider`
- `BindincEpgProvider`
- optional commercial provider adapter

Provider-specific fields must be removed or mapped before data reaches feature/UI code.

## Canonical domain model
### Channel
Required:
- `id`: stable Teevee identifier
- `name`
- `displayName`
- `sortOrder`
- `isActive`

Optional:
- `logoUrl`
- `shortName`
- `providerRefs`

### Programme
Required:
- `id`: stable Teevee identifier
- `channelId`
- `startAt`
- `endAt`
- `title`

Optional:
- `subtitle`
- `description`
- `genre`
- `imageUrl`
- `seasonNumber`
- `episodeNumber`
- `episodeTitle`
- `year`
- `cast`
- `isLive`
- `isRepeat`
- `providerRefs`

Derived values such as duration, progress and current/upcoming state should normally be calculated from canonical timestamps rather than persisted redundantly.

## Time handling
- Persist times in UTC.
- Retain provider timezone information only for ingestion diagnostics when needed.
- Render in Europe/Amsterdam for the Dutch MVP unless user/platform requirements later require another timezone.
- Explicitly test daylight-saving transitions.

## Stable IDs
External provider IDs cannot be trusted as permanent product IDs. The normalisation layer should maintain provider mappings and generate Teevee-owned stable identities where possible. For early fixtures a deterministic composite key is acceptable.

## Schedule horizon
Development target: at least 7 days forward when the selected external feed supports it. Preferred production target: 14 days forward. The product must degrade gracefully when a source supplies a shorter horizon.

## Updates and corrections
The ingestion layer must support upsert/replacement of schedule entries because broadcasters change schedules. Data refresh must not force the client to lose the user's scroll/time context.

## Data-quality expectations
Ingestion should detect and log at minimum:
- programme ending before it starts;
- overlapping programmes on the same channel;
- impossible or missing timestamps;
- missing required titles;
- duplicate provider records;
- unknown channel mappings;
- unexpectedly stale feeds;
- unexpectedly low/high programme volume.

Data-quality warnings must not necessarily block ingestion if usable schedule data remains.

## Fixtures
A deterministic fixture dataset is mandatory from the beginning.

Minimum fixture scope:
- representative Dutch channels (for example public, commercial, film/series and sport profiles);
- at least 48 hours of schedule;
- short and long programmes;
- programmes crossing midnight;
- simultaneous prime-time starts;
- missing descriptions/artwork;
- live programmes;
- gaps and edge cases;
- realistic title lengths.

Fixtures are the default source for automated tests and may be used for UI development without internet access.

## Enrichment
Artwork, cast, series metadata, editorial selections and recommendations are an optional enrichment layer. Core Guide, Search and Programme Detail must remain useful when enrichment is absent.

## Channel logos and artwork rights
Channel-logo and programme-artwork usage rights are separate dependencies from schedule data. No externally sourced logo/artwork should be treated as cleared for public commercial use without confirmation.

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
- free external EPG data is development-only until production rights are approved;
- enrichment is optional to core guide functionality.
