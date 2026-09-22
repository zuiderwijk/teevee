# Teevee Architecture

Status: **Kijktip enrichment vertical slice before Phase 5 Search**. Phase 4 is closed. The provider-independent EPG path remains the core Guide authority; PR #126 adds optional editorial enrichment beside that path without making Guide availability depend on it. `docs/PROJECT_STATE.md` remains the canonical delivery status.

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

Optional editorial enrichment is a parallel, non-authoritative lane:

`TVgids tips.rss -> editorial-refresh -> deterministic canonical programme match -> private editorial lifecycle store -> guide-schedule editorialSignals sibling -> mobile runtime editorial state`

The two lanes meet only on canonical `Programme.id`. Editorial source identity never becomes EPG identity, `Programme` is not mutated, and enrichment failure cannot make a canonical schedule unavailable.

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

Phase 4 must implement this without shifting stored programme timestamps and without retuning the physically accepted Guide gesture model. PR #62 established the shared 06:00/horizon primitives and PR #64 migrated the current mobile hosted runtime to D + D+1 television-day loading/anchoring with a 06:00 rollover. User-facing D-2..D+7 selection/navigation remains the next boundary.

## Hosted backend
Teevee has a dedicated Supabase project:
- project ref `eokszvpityhtysbwdduy`;
- organization `teevee`;
- Free plan;
- region `eu-west-2`.

Private schema `teevee` contains canonical channels, programmes, authoritative schedule coverage segments, and the separate optional `programme_editorial_signals` / `editorial_source_state` enrichment store. Transactional schedule replacement continues to enforce ADR 0007 and stale-write protection. Editorial signals intentionally do not FK/cascade to programme rows because normal schedule-window replacement deletes/reinserts programmes. The editorial writer keeps a per-source advisory lock and stale guard, then reconciles source-item rekeys, orphans and omitted-future rows **before** incoming upsert. This preserves the unique source-item constraint when a normal EPG start correction changes canonical `Programme.id`, while simple omission after `start_at` still retains historical Kijktip metadata. Reads continue to join current programmes. The PR #127 forward migration also contains one fail-closed, idempotent recovery from direct historical `tips.rss` evidence; no general article/title inference is introduced.

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
- exposes no database/RPC/provider identifiers or write capability;
- after a valid canonical schedule read, optionally composes persisted `ProgrammeEditorialSignal[]` as a sibling field; editorial read/validation failure yields an empty signal list and never downgrades the schedule.

The bounded window is intentionally compatible with requesting individual television days. Phase 4 composes the product horizon from bounded day windows rather than inventing one unbounded ten-day public payload.

### `epg-refresh`
Protected server-side refresh:
- provider IDs stay server-side and are allow-listed;
- direct anonymous/authenticated refresh is rejected;
- trusted calls may use the existing server secret-key path or the dedicated scheduled-refresh token;
- partial provider coverage cannot destructively replace canonical stored coverage.

### `editorial-refresh`
Independent protected Kijktip refresh:
- fetches/decodes TVgids `tips.rss` server-side only;
- applies the deterministic PR #120 channel/title/start matcher against canonical schedule reads;
- reconciles one authoritative TVgids source snapshot only after a successful complete run: explicit same-source-item canonical rekeys, orphan cleanup and future omissions are resolved before upsert; current/future feed membership stays authoritative, while a simply omitted already-started broadcast retains historical Kijktip metadata until canonical schedule retention expires;
- uses a dedicated Vault-backed cron token and a simple hourly `:41` schedule;
- records non-user diagnostics for feed count, Tier A/B/C matches, ambiguity, title mismatch, unsupported channel, coverage miss, invalid/undecodable records, duplicates and unmatched items;
- is not called by `epg-refresh`, `guide-schedule` or the mobile client.

### Automatic development freshness
`pg_cron` + `pg_net` enqueue the temporary development refresh every six hours. A rolling three-calendar-day Amsterdam buffer covers current day, tomorrow and one rollover day. That buffer is sufficient for the current development runtime's bounded D + D+1 television-day reads around midnight/06:00, but it is not the final multi-day product strategy.

A dedicated random cron token is generated/stored encrypted in Supabase Vault. The real Supabase secret key remains inside the Edge Function environment.

This three-calendar-day development buffer is operational support for the current development feed; it is **not** the final D-2..D+7 product implementation and does not prove that the temporary provider can satisfy the production horizon.

## Mobile runtime schedule boundary
The mobile app currently uses:
- deterministic fixture schedule for the immediate first frame;
- public hosted canonical reads after startup;
- runtime validation before accepting serialized hosted data;
- provider-independent merge/deduplication;
- a small in-memory runtime schedule bridge shared by Totaal, Per zender and deferred Nu & Straks;
- D and D+1 television-day hosted reads derived with the shared 06:00 Europe/Amsterdam primitive;
- independently bounded one-day requests, including 23/25-hour DST television days;
- refresh after startup, app resume and 06:00 television-day rollover;
- content equality that ignores freshness-only metadata so harmless refreshes do not remount the Guide;
- request-version protection so late older hosted responses cannot replace newer state;
- deterministic fixture preservation when hosted data is unavailable, invalid, empty in the wrong way or the network fails.

PR #64 replaced the former strict calendar today+tomorrow/midnight semantics. Its exact reviewed head was automation-proven and physically accepted on iPhone for fixture-first -> hosted replacement and same-television-day background/resume context retention. The next runtime/UI boundary is selected-day D-2..D+7 access for Totaal and Per zender; Nu & Straks remains single-active-day.

## Caching/offline
Persistent mobile schedule caching was **not selected at Phase 4 closeout**. The current robust fallback is deterministic fixture-first + preservation of usable runtime state across failed refreshes.

Phase 4 measurement showed the dominant cold Guide bottleneck was React/render + mount work rather than network/cache; bounded rendering resolved that path without persistent caching, eager D-2..D+7 prefetch or a new server-state dependency. Do not add SQLite, TanStack Query or another cache/server-state framework without new measured need.

A true no-network cold start cannot be validated through Expo Go after force-quit because Expo Go itself needs Metro/network to load the development bundle. The product-level local caching/graceful-offline requirement remains for release, but release-like offline cold-start validation and any concrete persistent-cache technology decision are deferred to Phase 9 when a standalone/dev build is available.

## Phase 4 architecture increment
The architecture sequence follows `PROJECT_STATE.md` exactly:
1. **DONE** — create shared 06:00 `Europe/Amsterdam` television-day primitives and D-2..D+7 horizon semantics (PR #62);
2. **DONE for current runtime boundary** — migrate hosted runtime anchoring/loading away from strict calendar-day assumptions to D + D+1 television-day semantics (PR #64);
3. **NEXT** — wire the accepted compact date context/day selector into Totaal and Per zender, with functional D-2..D+7 selection backed by bounded per-day reads while preserving frozen gesture mechanics;
4. keep Nu & Straks deferred and single-active-day;
5. retain deterministic fixtures and controlled hosted fallback;
6. evaluate realistic full-horizon payload/render performance before introducing persistent caching or eager ten-day rendering.

Because television-day/date/horizon code is high risk under `ENGINEERING_QUALITY_POLICY.md`, the implementation requires deterministic boundary/DST/selection tests and independent QA before merge. Physical iPhone evidence is required when user-facing Guide day navigation/scroll context changes.

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
The Kijktip editorial source is already rights-cleared for its intended product use: the product owner confirms Teevee may use TVgids `https://www.tvgids.nl/tips.rss` for the Kijktip implementation, so that source is **not a Kijktip release blocker**. This clearance is deliberately scoped to the editorial Kijktip source and does not clear the eventual production EPG provider, channel logos or programme artwork.

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
