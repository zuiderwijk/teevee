# Teevee Architecture

Status: Phase 3 Real Data Vertical Slice. Phase 1/2 mobile interaction and app-shell foundations are implemented and physically accepted on the available iPhone. Provider-independent normalisation, canonical schedule storage/query semantics and the typed ingestion/service boundary are implemented; a hosted Teevee backend, authorized live development provider and mobile real-data/cache path remain pending. Current delivery status is governed by `PROJECT_STATE.md`.

## Architecture goals
- one maintainable mobile codebase for iOS and Android;
- simple enough for autonomous agents to reason about safely;
- EPG-provider independence;
- deterministic local development;
- high-performance guide rendering;
- minimal operational surface area;
- straightforward migration to Bindinc/TVgids production data later.

## Implemented mobile foundations
- Expo SDK 57, React Native 0.86, React 19 and strict TypeScript.
- Expo Router owns Gids / Vanavond / Zoeken; Settings is secondary.
- Navigator-level screen failures use an Expo Router error boundary with themed retry while the tab navigator remains mounted.
- Nu & Straks keeps its deferred startup boundary; deferred-import failures recover inline so Totaal, Per zender and the presentation selector remain usable.
- Three Guide presentations consume the same Teevee fixture/domain model.
- Local presentation state and memoised Guide surfaces preserve detail round-trip context.
- Versioned small JSON preferences use Expo FileSystem on native and localStorage on web (ADR 0006).
- Settings appearance uses a small React Context for live cross-screen updates; no global state library is installed.
- Semantic colour tokens are implemented.
- `AppScreenHeader` owns shared title/action chrome for Settings, Vanavond and Zoeken; those screens use `react-native-safe-area-context`.
- Per zender text-only channel fallback preserves differentiating suffixes under larger text without changing strip/pager geometry.
- CI runs typecheck, lint, tests, all-platform exports and a clean native Android debug compile. GitHub Actions use supported checkout/setup-node runtimes and read-only repository-content permission.

## Target mobile stack
- React Native with Expo
- TypeScript, strict mode
- Expo Router
- TanStack Query for future server state **only when the real mobile client-server path demonstrates the need**; not installed merely because it is common
- local component state by default; Zustand only where cross-feature client state has a demonstrated need
- SQLite or another Expo-supported persistent local store selected during caching work based on measured needs
- runtime validation at serialized/external trust boundaries; do not add a validation dependency unless it provides concrete value beyond the current explicit parsers

## Backend baseline
Use a thin backend/data service between providers and clients. Initial preference remains PostgreSQL/Supabase for storage and operational simplicity, but the mobile domain contract and canonical repository semantics do not depend on Supabase-specific APIs.

Implemented logical boundary:

`EPG Provider -> Channel mapping -> Normalisation/diagnostics -> ScheduleRepository -> GuideScheduleApi -> future transport/cache -> Guide`

The app never parses provider XMLTV or calls a provider URL directly.

## Phase 3 implemented core
The backend-independent core now defines:
- neutral external channel/programme records at the provider trust boundary;
- explicit provider -> Teevee channel mappings;
- canonical normalisation into `GuideSchedule`;
- record-level data-quality diagnostics;
- deterministic Teevee programme identities;
- canonical `GuideScheduleQuery` reads;
- explicit channel/time-scoped replacement writes;
- authoritative coverage/freshness per channel/time segment;
- stale-overlap rejection;
- a deterministic in-memory repository as executable reference only;
- provider schedule batches marked `complete` or `partial`;
- safe provider -> normalisation -> repository ingestion orchestration;
- runtime validation of serialized schedule queries;
- a thin repository-backed `GuideScheduleApi` service exposing no provider/database details.

No hosted database, HTTP/Edge transport or live provider adapter is implied by these contracts.

## Phase 3 execution boundary
The Real Data Vertical Slice must prove one complete vertical path without turning the first provider or backend implementation into a permanent product coupling.

Required boundaries:
- provider-specific parsing/configuration lives server-side or in ingestion tooling;
- an adapter normalises provider channels/programmes into Teevee-owned canonical values;
- provider identifiers are retained only as mappings/diagnostics where needed;
- canonical storage/API exposes Teevee concepts, not provider payloads;
- the mobile client consumes a typed Teevee service boundary;
- deterministic fixtures remain first-class and are not deleted when real data becomes available;
- Guide components continue to consume provider-independent `Channel` / `Programme` semantics;
- real-data refresh/caching must preserve accepted Guide interaction context where practical.

The smallest complete Phase 3 slice is preferred over broad infrastructure. Do not build generalized multi-provider orchestration or speculative caching layers before one authorized provider/backend path works end-to-end.

## Domain boundaries
Current/target structure:

```
app/
components/
features/
  guide/
  tonight/
  search/
  programme/
  settings/
services/
  api/
  storage/
  notifications/
data/
  fixtures/
  domain/
server/
  epg/
    provider contract
    channel mapping
    normalisation/diagnostics
    ingestion
    canonical repository
    typed schedule service

docs/
```

Exact folders may evolve with implementation; boundaries matter more than names. Server/ingestion code must not be pulled into the mobile bundle merely because the repository is shared.

## Data-provider boundary
All external schedule sources implement a provider adapter and normalize into Teevee domain types. Provider-specific IDs and fields must not leak into presentation components.

Provider adapters return an explicit coverage classification:
- `complete`: the requested channel/time scope is authoritative, including an empty result;
- `partial`: the data can be diagnosed but may not destructively replace canonical coverage.

The ingestion request records its freshness timestamp **before** the remote provider call starts. That makes response completion order safe: an older slow request cannot return later and masquerade as newer data.

A development provider is an implementation aid, not a production-rights decision. Production supplier and rights remain a separate gate.

## Canonical server storage / API — ADR 0007
Any production storage implementation must preserve the semantics proven by the reference repository:
- replacement scope is explicit by canonical channel IDs and `[from,to)` window;
- a programme intersects a query when `start < to && end > from`;
- canonical coverage/freshness is represented independently of programme rows;
- a covered empty schedule is valid; an uncovered/partly covered query is unavailable;
- read `generatedAt` is conservative: the oldest freshness contributing to the requested scope;
- an incoming write overlapping newer coverage is rejected atomically as `ignored-stale`;
- channel metadata outside the replacement scope is untouched;
- malformed external records never force guessed canonical values.

The in-memory repository is not a persistence choice. A future PostgreSQL/Supabase implementation must reproduce the same behaviour with transactional guarantees.

The typed schedule service returns only:
- `ok` + canonical `GuideSchedule` for fully covered scope;
- `unavailable` when canonical coverage is absent/incomplete.

A future HTTP/Edge transport validates serialized request input before invoking the repository-backed service. The mobile app does not know database table names, provider URLs or privileged credentials.

## Caching/offline
The app should retain recently fetched schedule data and channel preferences locally. Cached schedules may be shown while stale when offline, but the UI must communicate staleness when materially relevant.

Cache policy remains an active Phase 3 task after the hosted API path exists. Evaluate actual payload size, refresh behaviour and Guide read patterns before selecting SQLite or another persistent store. Small AppPreferences storage remains separate from schedule caching.

Do not implement the production mobile cache merely against the in-memory server reference; first measure one real canonical API payload/refresh path.

## Data refresh invariants
- schedule corrections replace canonical rows only inside explicit refreshed channel/time scope;
- partial provider data never destructively clears authoritative canonical coverage;
- complete empty windows may legitimately clear stale rows;
- an error safely attributable to one canonical channel may block that channel while unrelated safe channels update;
- an unattributed malformed record blocks destructive replacement because its scope cannot be proven;
- stale/out-of-order overlapping refreshes cannot roll newer canonical data backwards;
- refresh must not arbitrarily reset the user's selected Guide presentation/channel/time context;
- Amsterdam day boundaries and `[start,end)` semantics remain canonical in client behaviour;
- provider/network failure must not crash the Guide;
- a usable cached/fixture fallback remains possible during development and offline/failure scenarios.

## Backend / provider provisioning gate
No Teevee hosted backend is currently provisioned. The connected Supabase environment exposes an unrelated `ReelWorthy` project only; it must not be reused for Teevee.

Creating a Teevee Supabase project requires an explicit organization and cost confirmation. A concrete provider adapter likewise requires an authorized feed/API and credentials. Provider credentials stay server-side.

Provider research is recorded in `PHASE_3_PROVIDER_RESEARCH_2026-09-14.md`. Schedules Direct is rejected under its published non-commercial terms; Gracenote On API and EPGdata.tv remain candidates pending authorized commercial/development access. An authorized Bindinc/TVgids development feed is preferred when available.

## Subscriptions
RevenueCat is the preferred abstraction over Apple App Store and Google Play subscriptions. Subscription implementation is deferred until the core product demonstrates value.

## Notifications
Use Expo Notifications where it meets reminder requirements, backed by APNs/FCM as necessary. Prefer local scheduled notifications for simple programme reminders when reliable and platform-compliant; add server push only for requirements that need it.

## Observability
Sentry is the preferred crash/error/performance observability layer. Analytics must be deliberately minimal and privacy-conscious. No advertising SDKs.

For Phase 3 ingestion, lightweight structured diagnostics for data quality/freshness are required before broad production observability infrastructure.

## CI/CD
GitHub Actions are the repository quality gates. Expo Application Services (EAS) remains the intended mobile build/distribution path unless a concrete limitation emerges.

Phase 3 server/ingestion additions are covered by deterministic unit/integration tests and do not depend on a live external feed in normal PR CI.

## Testing
- unit tests for provider mapping, normalisation, repository semantics and schedule/domain transformations;
- data-quality tests for malformed/edge provider records;
- repository tests for coverage, corrections, scoped replacement, covered-empty and stale-write rejection;
- integration tests for provider -> normalisation -> repository -> typed service;
- concurrency tests proving late completion of an older request cannot replace a newer refresh;
- runtime request-validation tests for future serialized transport input;
- component/integration tests for important mobile behaviour;
- deterministic fixtures for repeatability and offline development;
- physical iPhone smoke when a new real-data/cache path actually reaches the Guide;
- physical Android validation remains a separate gate when suitable hardware is available;
- performance validation of Guide with realistic data volume.

## Explicit non-goals
Do not introduce microservices, Kubernetes, event buses, GraphQL, elaborate dependency injection, a large design-system framework, native Swift/Kotlin modules, generalized multi-provider orchestration or speculative infrastructure without a measured requirement.

## Performance risk
The two-dimensional Guide remains the primary mobile technical risk. Phase 1 validated the rendering/gesture model and Phase 2 accepted the shell/accessibility integration. Real-data work must preserve that frozen interaction baseline unless measurement or device evidence justifies a change.

The first hosted real-data slice should measure realistic payload/programme volume before adding client caching/virtualisation complexity.

## Security
- no provider/API secrets in the client if they grant privileged access;
- no committed secrets;
- validate serialized API input and external feed data;
- minimise collected personal data;
- keep account identity optional for core Guide use unless a later product decision changes this;
- backend service/provider credentials remain server-side;
- public client credentials, if a selected backend requires them, expose only intentionally public least-privilege capabilities;
- a future exposed Supabase schema must follow the project-specific RLS/security model rather than relying on client secrecy.
