# Teevee Programme Data Strategy

Status: Phase 3 has provider-independent contracts, hosted Supabase canonical persistence and a development-only real XMLTV provider. Hosted ingest/query transport and the mobile real-data/cache path remain active work.

## Goal
Teevee must validate the complete core product with real schedules without coupling the mobile Guide to one provider. Switching later to an authorized Bindinc/TVgids or other commercial provider must not require a Guide rewrite.

## Core rule
The mobile client never consumes an external EPG feed directly.

External data flows through:

`EpgProvider -> explicit channel mapping -> normalisation/diagnostics -> canonical ScheduleRepository -> GuideScheduleApi -> hosted transport -> mobile source/cache`

Provider-specific IDs, raw XMLTV, credentials and storage details stop at the server boundary.

## Deterministic fixtures remain mandatory
The existing synthetic 48-channel fixture remains the default for:
- normal CI;
- repeatable domain/UI tests;
- offline development;
- interaction regression testing.

Real schedule data supplements fixtures; it does not replace deterministic tests.

Do **not** map real provider IDs onto the synthetic fixture by guessing. The first real vertical slice gets its own explicit narrow canonical channel catalog/mapping.

## Temporary development provider
PR #42 implements `XmltvEpgProvider` using this default development feed:

`https://iptv-epg.org/files/epg-nl.xml`

This source is development-only. Public availability is not proof of commercial redistribution rights.

Observed real feed evidence on 2026-09-14 via temporary unmerged PR #43:
- 30,237,192 bytes;
- 184 channels;
- 33,117 programmes;
- observed range `20260913000600 +0000` through `20260919235500 +0000`;
- verified IDs including `NPO1.nl`, `NPO2.nl`, `NPO3.nl`, `RTL4.nl`, `RTL5.nl`, `RTL7.nl`, `RTL8.nl`, `RTLZ.nl`, `SBS6.nl`, `SBS9.nl`, `Net5.nl` and `VeronicaDisneyXD.nl`.

Website overview counters and the fetched payload disagree in current totals. Teevee therefore uses only parsed feed content and explicit requested scope for technical correctness/coverage decisions.

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
}
```

Raw external required values may be malformed or absent at this boundary. Adapters must preserve diagnosable input instead of inventing canonical values.

`complete` means the adapter can prove that the requested provider channel/time scope is continuously covered and authoritative. `partial` may be inspected but cannot destructively replace canonical storage.

## XMLTV adapter rules
The current development adapter:
- parses channel IDs/display names and optional icons;
- parses programme title, subtitle, description, category, live/repeat flags;
- requires an explicit numeric timezone offset in XMLTV timestamps;
- normalises valid timestamps to UTC ISO;
- leaves malformed timestamps representable for downstream diagnostics;
- filters returned programmes by `[from,to)` intersection;
- declares `complete` only when every requested channel continuously covers the full requested range;
- uses an injectable `fetch` boundary so automated tests are deterministic.

Normal PR CI never calls the live feed.

## Channel mapping
Provider identity is never canonical Teevee identity.

Rules:
- mappings are explicit;
- unknown/invalid/duplicate mappings are diagnosed conservatively;
- canonical channel IDs belong to Teevee and may survive provider replacement;
- provider metadata outside requested replacement scope cannot overwrite unrelated canonical channels;
- the first hosted development ingest should map only a narrow verified set of real channels rather than all 184 source channels.

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
- Canonical programme timestamps are UTC ISO and never shifted to emulate a television day.
- Dutch MVP renders in `Europe/Amsterdam`.
- XMLTV adapter does not guess timezone when an offset is missing.
- Current-programme and query semantics are `[start,end)`.
- DST transitions remain explicit test cases.

### Television-day semantics — ADR 0008
Guide grouping/navigation uses a **television day** rather than a strict midnight calendar day:
- television day starts at **06:00 Europe/Amsterdam** and ends at 06:00 the next calendar day;
- between 00:00 and 05:59, the active television day is still the preceding date/evening;
- midnight is not a Guide boundary;
- membership in a television day is derived from the real instant and timezone; storage timestamps remain unchanged;
- continuous Guide surfaces may cross both midnight and the 06:00 semantic boundary without fabricating programme times.

Let `D` be the current television day. The Core Guide product guarantee is at least **D-2 through D+7** for Totaal and Per zender: ten complete television days. Nu & Straks remains a single active-day view using the same television-day definition.

## Stable IDs
External provider IDs are not used as Teevee product IDs by themselves.

Normalisation creates deterministic Teevee programme identities from provider namespace + canonical channel + provider programme identity + broadcast start, with a deterministic composite fallback when provider IDs are absent. This prevents repeated broadcasts from collapsing together.

## Canonical hosted storage — ADR 0007
Supabase now implements the backend-independent semantics:
- explicit canonical channel/time replacement scope;
- programme intersection `start < to && end > from`;
- coverage/freshness stored separately from programme rows;
- covered-empty valid vs uncovered unavailable;
- conservative read freshness;
- stale overlapping writes atomically rejected before mutation;
- request-start freshness prevents slow older requests from winning.

Hosted project:
- `teevee` / `eokszvpityhtysbwdduy`;
- organization `teevee`;
- Free plan;
- `eu-west-2`.

Private `teevee` tables are not client-readable. Service-role-only RPC bridges back `SupabaseScheduleRepository`.

## Phase ownership for horizon/retention
### Phase 3
- preserve provider-independent instant/window semantics;
- ensure backend contracts do not assume a permanent midnight boundary or permanent two-day horizon;
- treat the current today+tomorrow mobile loader as vertical-slice scope only;
- do not expand the current physical real-data smoke merely to implement the final multi-day UX.

### Phase 4
- implement television-day-aware loaders/cache keys and D-2..D+7 Guide navigation;
- preserve historical D-2/D-1 data while inside the guaranteed product window;
- support uninterrupted evening browsing through midnight;
- support the 06:00 television-day rollover and `Nu` behaviour;
- define/verify offline and stale-cache behaviour for the multi-day window.

### Phase 8
The production EPG provider must prove:
- sufficient future horizon to guarantee D+7;
- sufficient historical retention/availability to guarantee D-2;
- freshness/correction behaviour compatible with the product;
- explicit paid-app redistribution rights for schedule/metadata and separately licensed logo/artwork where used.

A provider that cannot meet the minimum horizon is not sufficient for Teevee's production product promise.

## Schedule horizon
Minimum product guarantee for Totaal and Per zender is **D-2 through D+7 television days**, where D is derived with the 06:00 Europe/Amsterdam boundary.

Backend storage/cache should retain a safety buffer beyond the visible guarantee where practical (for example D-3 through D+8), or simply retain the broader authoritative provider horizon when operationally cheap.

Preferred production target remains **14 days forward** when the eventual licensed provider supports it; the 14-day preference is additional headroom, not a replacement for the minimum D-2 historical guarantee.

The temporary development feed was observed to provide roughly one week on 2026-09-14. That observation is development evidence only and does not prove the final production horizon requirement.

## Updates and corrections
- only `complete` batches may destructively replace canonical windows;
- `partial` batches never clear existing authoritative coverage;
- complete empty windows may legitimately clear stale rows;
- errors attributable to one mapped channel can block that channel without blocking unrelated safe channels;
- unattributed malformed data blocks destructive replacement;
- late stale refreshes are rejected;
- mobile refresh must preserve accepted Guide context where practical;
- refresh/retention policy must not evict historical television days while they remain inside D-2..D+7;
- future automatic ingest should keep the guaranteed horizon continuously covered rather than only loading from the current instant forward.

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

## Typed Teevee schedule API
Mobile-facing output is canonical only:
- runtime validated serialized request;
- UTC canonical timestamps;
- optional non-empty trimmed/deduplicated channel list;
- `ok` for fully covered canonical scope, including zero programmes;
- `unavailable` for missing/incomplete canonical coverage;
- no provider/database detail in output.

The existing hosted API's bounded windows are compatible with requesting individual television days; Phase 4 should compose the required multi-day range rather than exposing one huge unbounded payload.

## Production rights gate
Before public paid release, Teevee needs explicit answers to:
1. production schedule provider;
2. paid-app redistribution rights;
3. freshness/SLA;
4. minimum D-2 historical and D+7 future horizon;
5. included metadata;
6. channel-logo and programme-artwork rights;
7. provider-failure fallback.

An authorized Bindinc/TVgids source remains preferred when available. EPGdata.tv and Gracenote remain candidates. EPG.PW and Schedules Direct are not approved for Teevee production under their published non-commercial/personal terms.

## Frozen decisions
- provider independence is mandatory;
- client never parses XMLTV or calls external EPG URLs directly;
- deterministic fixtures remain mandatory;
- public/free/scraped accessibility is not licensing evidence;
- authoritative coverage must be explicit before destructive replacement;
- coverage/freshness is distinct from programme rows;
- stale writes cannot roll newer schedule state backwards;
- canonical programme timestamps remain real instants;
- Guide day grouping follows ADR 0008's 06:00 television-day boundary;
- Totaal and Per zender must support at least D-2..D+7 television days;
- enrichment is optional to core Guide functionality.