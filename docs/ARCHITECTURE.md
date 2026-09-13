# Teevee Architecture

Status: Phase 3 Real Data Vertical Slice. Phase 1/2 mobile interaction and app-shell foundations are implemented and physically accepted on the available iPhone. Backend, provider ingestion, canonical server storage/API and mobile real-data caching are the active architectural work; current delivery status is governed by `PROJECT_STATE.md`.

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
- TanStack Query for future server state **only when Phase 3 client-server behaviour demonstrates the need**; not installed merely because it is common
- local component state by default; Zustand only where cross-feature client state has a demonstrated need
- SQLite or another Expo-supported persistent local store selected during caching work based on measured needs
- Zod or equivalent validation at external/feed/API trust boundaries when justified; not installed prematurely

## Backend baseline
Use a thin backend/data service between providers and clients. Initial preference is PostgreSQL/Supabase for storage and operational simplicity, but the mobile domain contract must not depend on Supabase-specific APIs.

Logical flow:

`EPG Provider -> Provider Adapter -> Normalisation -> Teevee datastore/API -> Mobile cache -> UI`

The app never parses provider XMLTV or calls a provider URL directly.

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

The smallest complete Phase 3 slice is preferred over broad infrastructure. Do not build production-scale ingestion orchestration, generalized multi-provider frameworks or speculative caching abstractions before one provider-independent path works end-to-end.

## Domain boundaries
Suggested structure:

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
server-or-ingestion-boundary/
  providers/
  normalisation/
  diagnostics/
tests/
docs/
```

Exact folders may evolve when implementation exists; boundaries matter more than names. Backend/ingestion code does not need to live in the mobile bundle merely to share a repository.

## Data-provider boundary
All external schedule sources implement a provider adapter and normalise into Teevee domain types. Provider-specific IDs and fields must not leak into presentation components.

A development/free provider is an implementation aid, not a production-rights decision. Production data supplier and rights remain a separate gate.

## Canonical server storage / API
Phase 3 should introduce only the storage/API shape needed by the vertical slice. At minimum it must support:
- stable Teevee channel identity plus provider mapping;
- canonical programme start/end/title/channel relation;
- provider refresh/upsert/correction semantics;
- bounded schedule queries by time range and channels;
- explicit empty/error behaviour;
- data-quality diagnostics outside the mobile UI.

The API contract should be serialisable, typed and backend-implementation independent. The mobile app must not require Supabase table names, provider URLs, XMLTV concepts or privileged credentials.

## Caching/offline
The app should retain recently fetched schedule data and channel preferences locally. Cached schedules are allowed to be shown while stale when offline, but the UI must communicate staleness when materially relevant.

Cache policy is an active Phase 3 design task and should be derived from the first real-data slice. Evaluate actual payload size, refresh behaviour and Guide read patterns before selecting SQLite or another persistent store. Small AppPreferences storage must remain separate from schedule caching.

## Data refresh invariants
- schedule corrections may replace/upsert canonical entries;
- refresh must not arbitrarily reset the user's selected Guide presentation/channel/time context;
- Amsterdam day boundaries and `[start,end)` semantics remain canonical in client behaviour;
- provider/network failure must not crash the Guide;
- a usable cached/fixture fallback should remain possible during development and offline/failure scenarios.

## Subscriptions
RevenueCat is the preferred abstraction over Apple App Store and Google Play subscriptions. Subscription implementation is deferred until the core product demonstrates value.

## Notifications
Use Expo Notifications where it meets reminder requirements, backed by APNs/FCM as necessary. Prefer local scheduled notifications for simple programme reminders when reliable and platform-compliant; add server push only for requirements that need it.

## Observability
Sentry is the preferred crash/error/performance observability layer. Analytics must be deliberately minimal and privacy-conscious. No advertising SDKs.

For Phase 3 ingestion, lightweight structured diagnostics for data quality/freshness are required before broad production observability infrastructure.

## CI/CD
GitHub Actions for repository quality gates. Expo Application Services (EAS) for mobile builds/distribution unless a concrete limitation emerges.

Phase 3 server/ingestion additions must gain their own deterministic tests/checks in CI when introduced. Do not rely on a live external feed for normal PR determinism.

## Testing
- unit tests for provider parsing, normalisation, schedule/domain transformations and business logic;
- data-quality fixture tests for malformed/edge provider records;
- component/integration tests for important mobile behaviour;
- deterministic fixtures for repeatability and offline development;
- integration coverage for typed API/client boundaries;
- physical iPhone smoke when a new real-data/cache path reaches the Guide;
- physical Android validation remains a separate gate when suitable hardware is available;
- performance validation of Guide with realistic data volume.

## Explicit non-goals
Do not introduce microservices, Kubernetes, event buses, GraphQL, elaborate dependency injection, a large design-system framework, native Swift/Kotlin modules, generalized multi-provider orchestration or speculative infrastructure without a measured requirement.

## Performance risk
The two-dimensional Guide remains the primary mobile technical risk. Phase 1 validated the rendering/gesture model and Phase 2 accepted the shell/accessibility integration. Real-data work must preserve that frozen interaction baseline unless measurement or device evidence justifies a change.

The first real-data slice should measure realistic payload/programme volume before adding client caching/virtualisation complexity.

## Security
- no provider/API secrets in the client if they grant privileged access;
- no committed secrets;
- validate external feed data;
- minimise collected personal data;
- keep account identity optional for core guide use unless a later product decision changes this;
- backend service credentials remain server-side;
- public client credentials, if a selected backend requires them, must expose only intentionally public least-privilege capabilities.
