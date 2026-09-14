# Teevee — Canonical Project State

Last updated: 2026-09-14 02:41 CEST.
Status: ACTIVE — **Phase 3 Real Data Vertical Slice**. Phase 1A/1B Guide interactions and Phase 2 App Shell are closed/physically accepted on iPhone. The provider-independent ingestion/service foundation and the first production Supabase persistence layer are implemented. The active external dependency is now an authorized development EPG feed; **EPGdata.tv is the selected first external route**, with Gracenote as fallback.
Current phase: **Phase 3 — Real Data Vertical Slice**
Next phase after Phase 3 closure: **Phase 4 — Core Guide MVP hardening**

> Mandatory start point for every development-agent session. Read `AGENTS.md`, this file, ADR 0007 and `PHASE_3_PROVIDER_RESEARCH_2026-09-14.md` before changing the repository.

## Product / source-of-truth constraints
- Teevee is a premium, paid, ad-free TV-guide app for iOS and Android under Bindinc/TVgids.nl supervision.
- GitHub `zuiderwijk/teevee` is canonical technical/project truth.
- Guide-first; no mandatory account for core Guide use.
- Expo SDK 57 / React Native 0.86 / React 19 / strict TypeScript.
- Light, dark and system appearance.
- Provider-independent Teevee EPG model; mobile never parses/calls external EPG providers directly.
- Deterministic fixtures remain first-class even after real data is introduced.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility/larger system text are quality requirements.
- `PROJECT_STATE.md` is canonical current state; `DEVLOG.md` is history.

## Phase status
1. **Phase 1A — Totaal:** complete and physically accepted on iPhone.
2. **Phase 1B — Per zender / Nu & Straks:** complete and physically accepted on iPhone.
3. **Phase 2 — App Shell:** complete and physically accepted on iPhone.
4. **Phase 3 — Real Data Vertical Slice:** active; backend + persistence foundation complete, real provider onboarding active.
5. **Phase 4 — Core Guide MVP hardening:** next after Phase 3 exit criteria.

## Frozen Guide interaction baseline
Do not retune accepted Guide mechanics during real-data work without concrete regression evidence.

### Totaal
- two-dimensional horizontal-time / vertical-channel Guide;
- real schedule-duration geometry;
- `Vandaag · Morgen · Nu`;
- native inertia, bounce and directional lock;
- accepted partial-left-title/time-axis behaviour.

### Per zender
- vertical wall-clock schedule;
- horizontal schedule swipe changes adjacent channel while preserving time anchor where practical;
- browsable/direct-tap channel strip remains available;
- `Morgen`, `Vandaag`, `Nu` coherent;
- detail round-trip preserves context;
- text-only channel identities preserve distinguishing suffixes at larger text.

### Nu & Straks
- shared reference instant across channels;
- live/browse modes, `Nu` and `Primetime`;
- stable channel context while reference time changes;
- reference programme + three following programmes;
- accepted rail fling/settle and mixed gestures.

### Startup rule
`NowNextGuideView` stays behind deferred `import()`. Do **not** restore a static startup import without separate physical evidence. A failed deferred load must leave Totaal/Per zender usable.

## Programme Detail
- Direct from all three Guide presentations.
- Accepted future action scope: `Herinner mij` + `Bewaar`; Share is not required.
- Returning preserves originating Guide context.

## Phase 2 acceptance
CLOSED. Evidence:
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2310.md`
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md`

The compact 24pt Nu & Straks following-programme rows remain explicit non-blocking accessibility debt. Do not solve them with overlapping `hitSlop` or blindly force every row to 44pt; revisit density-aware in Phase 4 with physical evidence.

## Phase 3 implementation ledger
### PR #36 — Phase 2 closure / Phase 3 activation
- merge `589ce9110419866439cd0e22e1c761687b48eb04`;
- exact PR-head CI #255 green.

### PR #37 — provider-independent normalisation core
- merge `491bc728adfb4ec70d060833d49d17bca25bbdc9`;
- exact PR-head CI #263 green; exact-main #265 green.

Implemented provider-neutral `GuideSchedule`, `EpgProvider`, mapping, UTC normalisation, deterministic programme IDs and record-level diagnostics.

### PR #38 — canonical repository semantics
- merge `5d997e58cd86de75a7de83367cc0e47b783657a2`;
- exact PR-head CI #272 green; exact-main #279 green.

Implemented explicit `[from,to)` replacement scope, independent coverage/freshness, covered-empty vs unavailable, conservative read freshness and atomic stale-overlap rejection.

### PR #39 — safe ingestion + typed schedule service
- merge `a39f5e432f0f3dcba946f5e8ca49bdd060ad0928`;
- exact PR-head CI #280 green.

Implemented complete/partial provider coverage semantics, malformed-data isolation, request-start freshness, concurrency protection and typed provider/database-independent `GuideScheduleApi`.

### PR #40 — Supabase-backed canonical schedule store
- merge `da08c10e170ea8fe3843e16b76247eccd6c0502a`;
- exact PR-head `efcd966c5998d2524e4b58f3304220a2a8c1e36c`;
- CI #283 / `34792237068`: `quality` + `android-native` completed/success.

Live Supabase project:
- project `teevee`, ref `eokszvpityhtysbwdduy`;
- organization `teevee`, Free plan;
- region `eu-west-2`;
- status verified healthy at provisioning time.

Applied/versioned migrations:
- `20260914001257_create_canonical_schedule_store`;
- `20260914001410_harden_default_rls_helper_permissions`;
- `20260914001538_create_schedule_rpc_bridge`.

Production persistence now includes canonical channels/programmes/coverage, transactionally scoped replacement, stale-write protection and service-role-only RPC bridges. Canonical tables live in a non-exposed `teevee` schema; `anon`/`authenticated` have no access. No service-role secret belongs in mobile or Git.

Supabase security advisors after hardening had no WARN/ERROR. Remaining INFO is expected for private RLS tables without client policies and unused indexes in the still-empty dataset.

## Canonical schedule semantics — ADR 0007
Every production repository/API implementation must preserve:
- replacement scope explicit by canonical channels + `[from,to)`;
- authoritative coverage stored separately from programme presence;
- covered-empty is valid, partially/uncovered scope is unavailable;
- query intersection `programme.start < to && programme.end > from`;
- returned freshness is oldest contributing coverage freshness;
- older overlapping writes cannot roll newer canonical state backwards;
- provider request observation time is taken before remote fetch;
- provider/database details never leak into the mobile schedule contract.

## External EPG decision
See `docs/PHASE_3_PROVIDER_RESEARCH_2026-09-14.md`.

Current development route:
- **Selected first:** EPGdata.tv for a compact Netherlands pilot/development feed.
- **Fallback:** Gracenote On API if EPGdata onboarding, format, rights or coverage are unsuitable.
- **Rejected:** Schedules Direct under published non-commercial terms.
- **Not preferred:** EPG Service despite sandbox availability; Netherlands fit/legal-procurement path is weaker than EPGdata/Gracenote.
- Public/scrapeable guide data is never treated as licensed merely because it can be fetched.

EPGdata publicly lists broad Netherlands coverage and custom exports, but its disclaimer explicitly says delivery itself does not imply publication rights. The access request therefore must explicitly cover both development use and display/redistribution in Teevee as a paid ad-free consumer app. Logos/artwork rights must be confirmed separately and are not required for the Phase 3 core slice.

## What Phase 3 still needs
1. obtain EPGdata development/pilot access, sample/feed specification and explicit usage-rights confirmation;
2. implement the smallest concrete EPGdata adapter/parser behind `EpgProvider` only after the actual format is known;
3. map a compact Dutch channel set to canonical Teevee IDs;
4. ingest a real authoritative schedule into the existing Supabase-backed `ScheduleRepository`;
5. add a thin hosted transport for `GuideScheduleApi`;
6. query one real schedule end-to-end and measure payload/refresh behaviour;
7. choose/implement mobile schedule cache/source based on those measurements;
8. switch Guide to provider-independent real data with loading/error/offline fallback while preserving frozen interaction state;
9. perform focused iPhone real-data smoke; physical Android remains deferred.

Do not introduce TanStack Query, SQLite, generalized multi-provider orchestration or provider-specific mobile code before the real hosted slice demonstrates a need.

## Android status
Physical Android interaction acceptance remains OPEN/DEFERRED because no Android device is available. CI proves exports/prebuild/debug APK compilation, not system Back, nested-gesture feel or device performance.

## CI / reproducibility
- committed npm lockfile; CI uses `npm ci`;
- `quality`: strict TypeScript, lint, tests, iOS/Android/web exports;
- `android-native`: clean Expo Android prebuild + Gradle debug APK compile;
- Node 22; workflow content permission read-only;
- never run `npm audit fix --force`.

## Repository coordination
PR #28 (`docs/multi-agent-workflow`) remains isolated docs-only work owned by another thread. Do not fold Phase 3 implementation into it.

## Deferred but tracked
- physical Android validation;
- release-like performance outside Expo Go;
- Nu & Straks following-row accessibility/density hardening;
- targeted dependency-advisory review;
- production EPG/logo/artwork rights/SLA;
- Programme Detail `Herinner mij` / `Bewaar`;
- pricing/trial/paywall;
- production typography licensing;
- final Tonight composition.

## EXACT NEXT STEP
**External provider onboarding. Contact EPGdata.tv for the smallest Netherlands development/pilot feed, actual API/feed specification/sample, credentials and explicit paid-consumer-app usage rights. Do not implement a provider parser before the concrete response format is known. When access arrives, build the EPGdata adapter behind `EpgProvider`, ingest into the already-provisioned Teevee Supabase store and prove one real schedule end-to-end.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, `PROJECT_STATE.md`, ADR 0007 and `PHASE_3_PROVIDER_RESEARCH_2026-09-14.md`. Phase 2 is closed. Phase 3 backend-independent contracts and production Supabase persistence are complete through PR #40. Preserve frozen Guide mechanics and deferred Nu & Straks startup. The selected temporary external provider route is EPGdata.tv, Gracenote fallback. Continue from the provider access response; do not scrape or invent a feed format.
