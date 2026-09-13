# Teevee Architecture

Status: Phase 2 App Shell. Implemented mobile foundations are listed below; backend, server-state, caching and operational services remain planned until their implementation phase. Current delivery status is governed by `PROJECT_STATE.md`.

## Architecture goals
- one maintainable mobile codebase for iOS and Android;
- simple enough for autonomous agents to reason about safely;
- EPG-provider independence;
- deterministic local development;
- high-performance guide rendering;
- minimal operational surface area;
- straightforward migration to Bindinc/TVgids production data later.

## Implemented foundations
- Expo SDK 57, React Native 0.86, React 19 and strict TypeScript.
- Expo Router owns Gids / Vanavond / Zoeken; Settings is secondary.
- Navigator-level screen failures use an Expo Router error boundary with themed retry while the tab navigator remains mounted.
- Nu & Straks keeps its deferred startup boundary; deferred-import failures recover inline so Totaal, Per zender and the presentation selector remain usable.
- Three Guide presentations consume the same fixture/domain model. Nu & Straks retains its deferred startup boundary.
- Local presentation state and memoised Guide surfaces preserve detail round-trip context.
- Versioned small JSON preferences use Expo FileSystem on native and localStorage on web (ADR 0006).
- Settings appearance uses a small React Context for live cross-screen updates; no global state library is installed.
- Semantic colour tokens are implemented.
- `AppScreenHeader` owns the shared title/action chrome for Settings, Vanavond and Zoeken; those screens use `react-native-safe-area-context`. Guide-specific chrome remains local until extraction can be proven not to destabilise accepted Guide mechanics.
- Production typography and broader Guide-specific shared chrome remain pending.
- CI runs typecheck, lint, tests, all-platform exports and a clean native Android debug compile. GitHub Actions use supported checkout/setup-node runtimes and read-only repository-content permission for the build/test workflow.

## Target mobile stack
- React Native with Expo
- TypeScript, strict mode
- Expo Router
- TanStack Query for future server state (not installed yet)
- local component state by default; Zustand only where cross-feature client state has a demonstrated need
- SQLite or another Expo-supported persistent local store selected during the caching implementation based on measured needs
- Zod at future external/feed boundaries (not installed yet)

## Backend baseline
Use a thin backend/data service between providers and clients. Initial preference is PostgreSQL/Supabase for storage and operational simplicity, but the mobile domain contract must not depend on Supabase-specific APIs.

Logical flow:

`EPG Provider -> Provider Adapter -> Normalisation -> Teevee datastore/API -> Mobile cache -> UI`

The app never parses provider XMLTV or calls a provider URL directly.

## Domain boundaries
Suggested feature structure after bootstrap:

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
tests/
docs/
```

Exact folders may evolve when code exists; boundaries matter more than names.

## Data-provider boundary
All external schedule sources implement a provider adapter and normalise into Teevee domain types. Provider-specific IDs and fields must not leak into presentation components.

## Caching/offline
The app should retain recently fetched schedule data and channel preferences locally. Cached schedules are allowed to be shown while stale when offline, but the UI must communicate staleness when materially relevant. Cache policy will be specified alongside the real-data vertical slice.

## Subscriptions
RevenueCat is the preferred abstraction over Apple App Store and Google Play subscriptions. Subscription implementation is deferred until the core product demonstrates value.

## Notifications
Use Expo Notifications where it meets reminder requirements, backed by APNs/FCM as necessary. Prefer local scheduled notifications for simple programme reminders when reliable and platform-compliant; add server push only for requirements that need it.

## Observability
Sentry is the preferred crash/error/performance observability layer. Analytics must be deliberately minimal and privacy-conscious. No advertising SDKs.

## CI/CD
GitHub Actions for repository quality gates. Expo Application Services (EAS) for mobile builds/distribution unless a concrete limitation emerges.

## Testing
- unit tests for schedule/domain transformations and business logic;
- component/integration tests for important UI behaviour;
- physical iPhone acceptance for interaction, appearance and representative larger system text where automated layout tests cannot prove device behaviour;
- physical Android validation remains a separate gate when suitable hardware is available;
- Maestro for critical device-level flows when an appropriate development-build path exists;
- deterministic fixture data for repeatability;
- performance validation of Guide with realistic data volume.

## Explicit non-goals
Do not introduce microservices, Kubernetes, event buses, GraphQL, elaborate dependency injection, a large design-system framework, native Swift/Kotlin modules, or generalized abstractions without a measured requirement.

## Performance risk
The two-dimensional Guide is the primary technical risk. Phase 1 validated the core rendering/gesture model; later changes must preserve that frozen interaction baseline unless measurement or device evidence justifies a change. Architecture may use specialised list/virtualisation primitives if measurement shows standard React Native primitives are insufficient.

## Security
- no provider/API secrets in the client if they grant privileged access;
- no committed secrets;
- validate external feed data;
- minimise collected personal data;
- keep account identity optional for core guide use unless a later product decision changes this.
