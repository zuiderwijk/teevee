# Teevee Architecture

Status: Phase 3 Real Data Vertical Slice. Phase 1/2 mobile interaction and app-shell foundations are physically accepted on the available iPhone. Provider-independent normalisation, safe ingestion, canonical schedule semantics, hosted Supabase persistence and a development-only XMLTV adapter are implemented. Hosted public schedule transport, real canonical ingest/query and the mobile real-data/cache path remain active Phase 3 work. `PROJECT_STATE.md` governs delivery status.

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
- Expo Router owns Gids / Vanavond / Zoeken; Settings is secondary.
- Light/Dark/System is persisted through the small versioned preferences layer.
- Navigator-level failures use recoverable themed boundaries.
- Nu & Straks remains behind deferred `import()`; do not restore a static startup import without new physical evidence.
- All Guide presentations consume Teevee-owned `Channel` / `Programme` semantics.
- Guide interaction behaviour accepted during Phase 1/2 is frozen unless concrete regression evidence justifies change.
- No external provider parser, provider URL, database table or service-role secret belongs in the mobile bundle.

## Logical data path

`External EPG -> EpgProvider -> explicit channel mapping -> normalisation/diagnostics -> ScheduleRepository -> GuideScheduleApi -> hosted transport -> mobile source/cache -> Guide`

The boundaries are intentionally replaceable. The development XMLTV source and Supabase persistence are implementations behind contracts, not product-domain dependencies.

## Provider boundary
`EpgProvider` returns neutral external channel/programme records and schedule batches classified as:
- `complete`: adapter can prove the requested provider channel/time scope is authoritative;
- `partial`: data may be inspected/diagnosed but must not destructively replace canonical coverage.

The ingestion request records freshness before starting the provider request. Completion order therefore cannot make an older slow request appear newer than a later refresh.

PR #42 adds `XmltvEpgProvider` for Phase 3 development only. Its default source is the public Netherlands XMLTV feed at `https://iptv-epg.org/files/epg-nl.xml`.

Adapter rules:
- explicit numeric timezone offset required for XMLTV timestamps;
- canonical timestamps become UTC;
- malformed external values remain diagnosable instead of being guessed;
- programme filtering uses `[from,to)` intersection;
- `complete` requires continuous coverage for every requested provider channel;
- normal CI uses injected deterministic XML samples, never the live internet feed.

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

## Hosted backend
Teevee has a dedicated Supabase project:
- project ref `eokszvpityhtysbwdduy`;
- organization `teevee`;
- Free plan;
- region `eu-west-2`.

PR #40 implements hosted canonical persistence behind `ScheduleRepository`.

### Database shape
Private schema `teevee` contains:
- canonical channels;
- canonical programmes;
- authoritative schedule coverage segments.

Coverage uses half-open ranges and non-overlap constraints per channel. Transactional replacement enforces ADR 0007 and stale-write protection.

### Security boundary
- private Teevee tables are not available to `anon` or `authenticated`;
- RLS is enabled with no client policies intentionally;
- public RPC bridge functions are `SECURITY INVOKER` and executable only by `service_role`;
- service-role credentials remain server-side;
- the mobile app must never call the private schedule-storage RPCs directly.

Applied migrations:
1. `20260914001257_create_canonical_schedule_store`;
2. `20260914001410_harden_default_rls_helper_permissions`;
3. `20260914001538_create_schedule_rpc_bridge`.

`SupabaseScheduleRepository` maps the backend-independent repository contract onto these RPCs without adding `supabase-js` to the shared/mobile dependency graph.

## Hosted transport — next boundary
A public/mobile schedule transport is not implemented yet.

The first transport must:
- expose only the typed `GuideScheduleApi` response (`ok` + canonical schedule or `unavailable`);
- validate serialized `from`, `to` and optional non-empty `channelIds` at runtime;
- use service-role access only inside the server/Edge runtime;
- impose narrow request bounds suitable for a public no-login Guide;
- expose no write/refresh operation to anonymous mobile clients;
- keep ingestion/admin refresh separately protected;
- preserve a future path for abuse/rate controls without inventing broad infrastructure now.

## Development real-data slice
The live development feed was measured once through a temporary unmerged GitHub Actions inspection:
- ~30.2 MB XML;
- 184 channels;
- 33,117 programme records;
- roughly a one-week observed schedule window;
- explicit IDs such as `NPO1.nl`, `RTL4.nl`, `SBS6.nl`, `Net5.nl`.

The public website's overview counters did not match the fetched file exactly. Correctness and `complete`/`partial` decisions therefore derive only from the parsed payload and requested scope.

Next architecture increment:
1. define a narrow real development channel catalog + explicit provider mappings from verified IDs;
2. execute provider ingest server-side into the Supabase repository;
3. query canonical schedule back through the typed service/transport;
4. measure fetch/parse/write/read payload and latency;
5. choose mobile cache mechanics only from that evidence.

Do not map provider IDs onto synthetic fixture channels by assumption. Deterministic mobile fixtures remain a separate development/test source.

## Caching/offline
The eventual mobile client should retain recently fetched schedule data and degrade gracefully offline. Cache technology is deliberately not selected yet.

Evaluate actual canonical payload size, refresh frequency and Guide access patterns before adding SQLite, TanStack Query or another server-state/cache layer. AppPreferences is a separate small-settings layer and must not become schedule storage.

## Data refresh invariants
- corrections replace only explicit refreshed channel/time scope;
- partial provider data never destructively clears authoritative canonical coverage;
- complete empty windows may clear stale rows;
- malformed records block only safely attributable channels where possible;
- unattributed malformed records block destructive replacement;
- stale/out-of-order refreshes cannot roll newer state backwards;
- provider/network failure must not crash the Guide;
- refresh must not arbitrarily reset accepted Guide presentation/channel/time context.

## Production provider / rights boundary
The free XMLTV source is a temporary engineering input, not production-approved data.

Before public paid release Teevee still needs explicit rights for:
- schedule redistribution in a paid consumer app;
- channel logos;
- programme artwork/enrichment;
- expected freshness/SLA and provider-failure handling.

An authorized Bindinc/TVgids source is preferred if available. EPGdata.tv and Gracenote remain possible commercial alternatives. Public/scrapeable availability alone is never considered sufficient licensing evidence.

## Testing
- deterministic unit tests for XMLTV parsing, mapping and normalisation;
- repository tests for coverage, scoped replacement, corrections, covered-empty and stale rejection;
- concurrency tests proving late older provider responses cannot win;
- Supabase adapter tests for RPC mapping/runtime payload checks;
- typed request-contract tests;
- normal PR CI never depends on a live external feed;
- physical iPhone smoke only when the new real-data path actually reaches the Guide;
- physical Android interaction validation remains deferred until suitable hardware exists.

## CI/CD
GitHub Actions remain the repository quality gate:
- `npm ci`;
- strict TypeScript;
- lint;
- tests;
- iOS/Android/web Expo exports;
- clean Android prebuild + Gradle debug APK compile.

Expo Application Services remains the intended later build/distribution path when production-like mobile distribution becomes necessary.

## Explicit non-goals
Do not introduce microservices, Kubernetes, event buses, GraphQL, generalized multi-provider orchestration, speculative native modules or a large new state/cache framework without measured need.

## Security
- no committed secrets;
- no provider/service-role secrets in client bundles;
- validate every serialized/external trust boundary;
- private canonical storage remains least privilege;
- anonymous mobile read capability, when added, must expose only intentionally public schedule data;
- ingestion/write capability remains separately protected;
- account identity stays optional for core Guide use unless a later product decision changes this.