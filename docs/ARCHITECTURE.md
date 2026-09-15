# Teevee Architecture

Status: **Phase 4 Core Guide MVP hardening**. Phase 1A, 1B, 2 and 3 are closed on the available iPhone. The provider-independent path from external development EPG through canonical hosted storage/public read into the mobile Guide is implemented and physically proven. Phase 4 now owns the 06:00 television-day model, D-2..D+7 Guide horizon and MVP hardening. `docs/PROJECT_STATE.md` remains the canonical delivery status.

## Architecture goals
- one maintainable mobile codebase for iOS and Android;
- EPG-provider independence;
- deterministic local/CI development;
- high-performance Guide rendering;
- minimal operational surface area;
- production-grade correctness at external trust boundaries;
- straightforward migration to an authorized Bindinc/TVgids or other production provider later.

## Mobile foundation
- Expo SDK 57, React Native 0.86, React 19, strict TypeScript.
- Expo Router owns Guide / Tonight / Search; Settings is secondary.
- Light/Dark/System is persisted through the small versioned preferences layer.
- Navigator-level failures use recoverable themed boundaries.
- `NowNextGuideView` remains behind deferred `import()`; do not restore a static startup import without new physical evidence.
- All Guide presentations consume Teevee-owned `Channel` / `Programme` semantics.
- Guide interaction behaviour accepted during Phase 1/2/3 is frozen unless concrete regression evidence justifies change.
- No external provider parser, provider URL, database table or service-role secret belongs in the mobile bundle.

## Logical data path

`External EPG -> EpgProvider -> explicit channel mapping -> normalisation/diagnostics -> ScheduleRepository -> GuideScheduleApi -> hosted transport -> mobile runtime source -> Guide`

The boundaries are intentionally replaceable. The development XMLTV source and Supabase persistence are implementations behind contracts, not product-domain dependencies.

Phase 3 proved this complete boundary on a physical iPhone: the Guide renders deterministic fixture data immediately, then replaces it with canonical hosted data when a complete hosted schedule is available. Unavailable/network-failed hosted reads keep the Guide usable rather than clearing the current state.

## Provider boundary
`EpgProvider` returns neutral external channel/programme records and schedule batches classified as:
- `complete`: adapter can prove the requested provider channel/time scope is authoritative;
- `partial`: data may be inspected/diagnosed but must not destructively replace canonical coverage.

The ingestion request records freshness before starting the provider request. Completion order therefore cannot make an older slow request appear newer than a later refresh.

The current development-only `XmltvEpgProvider` reads `https://iptv-epg.org/files/epg-nl.xml` by default.

Adapter rules:
- explicit numeric timezone offset required for XMLTV timestamps;
- canonical timestamps become UTC;
- malformed external values remain diagnosable instead of being guessed;
- programme filtering uses `[from,to)` intersection;
- `complete` requires continuous coverage for every requested provider channel;
- normal CI uses injected deterministic XML samples, never the live internet feed.

The public development feed is temporary engineering input, not production licensing evidence.

## Canonical schedule semantics — ADR 0007
Every storage/transport implementation preserves:
- explicit replacement scope by canonical channels + `[from,to)`;
- programme intersection `start < to && end > from`;
- authoritative coverage/freshness independent from programme rows;
- covered-empty is valid; partly/uncovered is unavailable;
- read freshness is the oldest contributing coverage freshness;
- stale overlapping writes are rejected atomically before mutation;
- provider-specific fields/credentials never leak to the mobile contract.

The in-memory repository remains an executable reference/test implementation only.

## Television-day and horizon semantics — ADR 0008
Programme timestamps remain real UTC instants. Guide grouping/navigation derives a television day in `Europe/Amsterdam`:
- television day starts at 06:00 and ends at the following 06:00;
- 00:00–05:59 belongs to the preceding television day;
- midnight is not a Guide boundary;
- `Nu` selects the television day containing the actual current instant;
- Totaal and Per zender must expose at least D-2 through D+7, ten complete television days;
- Nu & Straks remains a single active-television-day presentation.

Phase 4 must implement this without shifting stored programme timestamps and without retuning the physically accepted Guide gesture model. The existing Phase-3 calendar-today/tomorrow loader is temporary compatibility code until this migration is complete.

## Hosted backend
Teevee has a dedicated Supabase project:
- project ref `eokszvpityhtysbwdduy`;
- organization `teevee`;
- Free plan;
- region `eu-west-2`.

Private schema `teevee` contains canonical channels, programmes and authoritative schedule coverage segments. Transactional replacement enforces ADR 0007 and stale-write protection.

### Security boundary
- private Teevee tables are unavailable to `anon` and `authenticated`;
- RLS is enabled with no client policies intentionally;
- storage RPC bridges are executable only by `service_role`;
- service-role credentials remain server-side;
- the mobile app never calls private schedule-storage RPCs directly.

`SupabaseScheduleRepository` maps the backend-independent repository contract onto those RPCs without adding `supabase-js` to the shared/mobile dependency graph.

## Hosted public read and protected refresh
The Phase-3 transport boundary is implemented.

### `guide-schedule`
Public/mobile read transport:
- returns only typed canonical Teevee `ok` / `unavailable` responses;
- runtime-validates serialized `from`, `to` and optional channel IDs;
- enforces bounded request windows suitable for the no-login Guide;
- uses privileged storage access only inside the Edge runtime;
- exposes no database/RPC/provider identifiers or write capability.

The bounded window is intentionally compatible with requesting individual television days. Phase 4 should compose the multi-day product horizon from bounded day windows rather than inventing one unbounded ten-day public payload.

### `epg-refresh`
Protected server-side refresh:
- provider IDs stay server-side and are allow-listed;
- direct anonymous/authenticated refresh is rejected;
- trusted calls may use the existing server secret-key path or the dedicated scheduled-refresh token;
- partial provider coverage cannot destructively replace canonical stored coverage.

### Automatic development freshness
`pg_cron` + `pg_net` enqueue the temporary development refresh every six hours. A rolling three-calendar-day Amsterdam buffer covers current day, tomorrow and one rollover day so the current Phase-3-derived today+tomorrow mobile loader does not immediately lose coverage at midnight.

A dedicated random cron token is generated/stored encrypted in Supabase Vault. The real Supabase secret key remains inside the Edge Function environment.

This three-calendar-day development buffer is operational support for the current development feed; it is **not** the final D-2..D+7 product implementation and does not prove that the temporary provider can satisfy the production horizon.

## Mobile runtime schedule boundary
The mobile app currently uses:
- deterministic fixture schedule for the immediate first frame;
- public hosted canonical reads after startup;
- runtime validation before accepting serialized hosted data;
- provider-independent merge/deduplication;
- a small in-memory runtime schedule bridge shared by Totaal, Per zender and deferred Nu & Straks;
- refresh after startup, app resume and the current temporary day rollover;
- content equality that ignores freshness-only metadata so harmless refreshes do not remount the Guide;
- deterministic fixture preservation when hosted data is unavailable, invalid, empty in the wrong way or the network fails.

The current mobile loader still composes Amsterdam calendar `today + tomorrow`. Its midnight rollover and calendar-day anchor are explicitly temporary Phase-3 implementation details and must be replaced with ADR 0008 television-day semantics during Phase 4.

## Caching/offline
Persistent mobile schedule caching is **not selected or implemented yet**. The current robust fallback is deterministic fixture-first + preservation of usable runtime state across failed refreshes.

Do not add SQLite, TanStack Query or another cache/server-state framework speculatively. Phase 4 should first define the multi-day query/cache-key semantics and measure realistic D-2..D+7 payload/access patterns.

A true no-network cold start cannot be validated through Expo Go after force-quit because Expo Go itself needs Metro/network to load the development bundle. Release-like offline cold-start validation remains deferred until a standalone/dev build is available.

## Phase 4 architecture increment
The next architecture work follows `PROJECT_STATE.md` exactly:
1. create shared 06:00 `Europe/Amsterdam` television-day primitives and D-2..D+7 horizon semantics;
2. migrate schedule/day-selection boundaries away from the temporary strict-calendar-day assumption;
3. wire the accepted compact date context into Totaal and Per zender while preserving their frozen gesture mechanics;
4. keep Nu & Straks deferred and single-active-day;
5. retain deterministic fixtures and controlled hosted fallback;
6. evaluate realistic full-horizon payload/render performance before introducing persistent caching or eager ten-day rendering.

Because television-day/date/horizon code is high risk under `ENGINEERING_QUALITY_POLICY.md`, the implementation requires deterministic boundary/DST tests and independent QA before merge. Physical iPhone evidence is required once user-facing Guide day navigation/scroll context changes; pure domain-foundation increments do not need to pretend CI is physical evidence.

## Data refresh invariants
- corrections replace only explicit refreshed channel/time scope;
- partial provider data never destructively clears authoritative canonical coverage;
- complete empty windows may clear stale rows;
- malformed records block only safely attributable channels where possible;
- unattributed malformed records block destructive replacement;
- stale/out-of-order refreshes cannot roll newer state backwards;
- provider/network failure must not crash the Guide;
- refresh must not arbitrarily reset accepted Guide presentation/channel/time context;
- historical data must not be evicted while it remains inside the D-2..D+7 guarantee once that horizon is implemented.

## Production provider / rights boundary
The free XMLTV source is a temporary engineering input, not production-approved data.

Before public paid release Teevee still needs explicit rights for:
- schedule redistribution in a paid consumer app;
- channel logos;
- programme artwork/enrichment;
- expected freshness/SLA and provider-failure handling;
- sufficient historical retention and future horizon to guarantee D-2..D+7.

An authorized Bindinc/TVgids source is preferred if available. EPGdata.tv and Gracenote remain possible commercial alternatives. Public/scrapeable availability alone is never considered sufficient licensing evidence.

## Testing
Quality requirements are canonical in `docs/ENGINEERING_QUALITY_POLICY.md` and operational detail in `docs/TESTING.md`.

Current principles:
- deterministic unit tests for time/day semantics, XMLTV parsing, mapping and normalisation;
- repository tests for coverage, scoped replacement, corrections, covered-empty and stale rejection;
- concurrency tests proving late older provider responses cannot win;
- hosted adapter/API/runtime-contract tests;
- normal PR CI never depends on a live external feed;
- high-risk Phase-4 television-day/horizon work gets direct boundary + DST tests and independent QA;
- physical iPhone validation is reserved for behaviour CI cannot prove;
- physical Android interaction validation remains deferred until suitable hardware exists.

## CI/CD
GitHub Actions are risk-scoped:
- every PR/push runs lockfile install, strict TypeScript, lint, tests and iOS/Android/web Expo export;
- docs/design-only PRs skip Android native compilation after deterministic scope detection;
- runtime/config PRs compile an `arm64-v8a` Android debug APK;
- pushes to `main` run the full Android ABI debug build as the release-like safety net;
- exact PR-head and exact-main runs are distinct evidence.

Expo Application Services remains the intended later build/distribution path when production-like mobile distribution becomes necessary.

## Explicit non-goals
Do not introduce microservices, Kubernetes, event buses, GraphQL, generalized multi-provider orchestration, speculative native modules or a large new state/cache framework without measured need.

## Security
- no committed secrets;
- no provider/service-role secrets in client bundles;
- validate every serialized/external trust boundary;
- private canonical storage remains least privilege;
- anonymous mobile read exposes only intentionally public canonical schedule data;
- ingestion/write capability remains separately protected;
- account identity stays optional for core Guide use unless a later product decision changes this.
