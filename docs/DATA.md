# Teevee Programme Data Strategy

Status: **Phase 4 Core Guide MVP hardening**. Phase 3 completed and physically proved the provider-independent path from external development EPG through canonical hosted persistence/public read into the mobile Guide. Phase 4 now owns television-day-aware loading/navigation, the D-2..D+7 product horizon and multi-day cache/query semantics. Production provider selection and rights remain a later release gate.

## Goal
Teevee must support the complete core Guide without coupling the mobile experience to one EPG supplier. Replacing the temporary development source with an authorized Bindinc/TVgids or commercial provider must not require a Guide rewrite.

## Core rule
The mobile client never consumes an external EPG feed directly.

External data flows through:

`EpgProvider -> explicit channel mapping -> normalisation/diagnostics -> canonical ScheduleRepository -> GuideScheduleApi -> hosted transport -> mobile runtime source/cache -> Guide`

Provider-specific IDs, raw XMLTV, credentials and storage details stop at the server boundary.

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
}
```

Raw required values may be malformed or absent at this boundary. Adapters preserve diagnosable input instead of inventing canonical values.

`complete` means the adapter can prove the requested provider channel/time scope is continuously covered and authoritative. `partial` may be inspected but cannot destructively replace canonical storage.

## XMLTV adapter rules
The development adapter:
- parses channel IDs/display names and optional icons;
- parses programme title, subtitle, description, category, live/repeat flags;
- requires an explicit numeric timezone offset in XMLTV timestamps;
- normalises valid timestamps to UTC ISO;
- leaves malformed timestamps representable for downstream diagnostics;
- filters programmes by `[from,to)` intersection;
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
- trusted refresh may use the server secret-key route or the validated scheduled-refresh token.

### Automatic development refresh
A server-side `pg_cron` + `pg_net` job runs every six hours and refreshes a rolling three-calendar-day Amsterdam development buffer: current day, tomorrow and one rollover day.

The dedicated cron token is generated/stored encrypted in Supabase Vault; the real Supabase secret key stays inside the Edge Function environment.

The buffer currently supports the development runtime's bounded D + D+1 television-day reads around midnight/06:00. It does **not** define the final product horizon and does not prove that the temporary feed can satisfy D+7 or historical D-2 in production.

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

The next Phase-4 mobile boundary is user-selected D-2..D+7 access for Totaal and Per zender using bounded per-day reads. Nu & Straks remains a single active-television-day presentation.

## Phase ownership for horizon/retention
### Phase 3 — complete
Proved:
- provider-independent instant/window semantics;
- hosted canonical storage and bounded public read;
- protected real-provider refresh;
- mobile canonical runtime validation/replacement;
- deterministic fixture fallback;
- physical fixture -> hosted transition and context retention on iPhone.

The historical two-calendar-day mobile loader has been superseded by PR #64. The rolling three-calendar-day development refresh buffer remains temporary operational support only.

### Phase 4 — active
Owns:
- shared 06:00 television-day primitives and query keys — implemented for the current runtime boundary;
- D-2..D+7 day selection/navigation in Totaal and Per zender — next;
- bounded hosted loading strategy for selected/needed television days;
- preservation of historical D-2/D-1 data while inside the guaranteed window;
- uninterrupted evening browsing through midnight;
- 06:00 television-day rollover and `Nu` behaviour;
- deterministic fixture support under the same semantics;
- context-preserving refresh/day changes;
- realistic payload/render/performance measurement before selecting persistent cache technology;
- explicit offline/stale-cache behaviour as persistent caching is introduced later.

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

The temporary development feed was observed to expose roughly one week in September 2026. That is development evidence only and cannot satisfy or prove the production contract by itself.

## Persistent cache/offline
Persistent mobile schedule caching is not selected yet.

Do not add SQLite, TanStack Query or another server-state/cache framework before measuring the television-day query pattern, payload sizes and realistic D-2..D+7 access behaviour. AppPreferences remains a small-settings layer and must not become schedule storage.

Current graceful degradation uses deterministic fixture-first rendering and preserves existing usable runtime state across failed refreshes. A true no-network cold start remains a release-like standalone/dev-build gate because Expo Go itself requires Metro/network after force-quit.

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
