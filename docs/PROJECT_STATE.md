# Teevee — Canonical Project State

Last updated: 2026-09-14 01:25 CEST.
Status: ACTIVE — **Phase 3 Real Data Vertical Slice**. Phase 1A/1B Guide interaction models and Phase 2 App Shell are closed and physically accepted on the available iPhone. The backend-independent Phase 3 foundation is now implemented through provider normalisation, canonical schedule storage/query semantics, safe ingestion orchestration and a typed schedule-service boundary. The next real vertical slice requires a Teevee hosted backend plus an authorized development EPG source/credentials; those are explicit human cost/credential/rights gates.
Current phase: **Phase 3 — Real Data Vertical Slice**
Next phase after Phase 3 closure: **Phase 4 — Core Guide MVP hardening**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository.

## Product and source-of-truth constraints
- Teevee is a premium, paid, ad-free TV-guide app for iOS and Android under Bindinc/TVgids.nl supervision.
- Guide-first; no mandatory account for core Guide use.
- Expo SDK 57 / React Native 0.86 / React 19 / strict TypeScript.
- Light, dark and system appearance.
- Provider-independent Teevee EPG model; mobile never consumes/parses an external EPG provider directly.
- Deterministic fixtures remain mandatory even after real data is introduced.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility and larger system text are product-quality requirements.
- `PROJECT_STATE.md` is canonical current state; `DEVLOG.md` is historical context; timestamped evidence docs contain device detail.
- Relevant ADRs: `0001` through `0007` in `docs/decisions/`.

## Phase status
1. **Phase 1A — Totaal:** complete and physically accepted on iPhone.
2. **Phase 1B — Per zender / Nu & Straks:** complete and physically accepted on iPhone.
3. **Phase 2 — App Shell:** complete and physically accepted on iPhone.
4. **Phase 3 — Real Data Vertical Slice:** active; backend-independent contract foundation complete through PR #39.
5. **Phase 4 — Core Guide MVP hardening:** next after Phase 3 exit criteria.

## Frozen Guide interaction baseline
Do not retune accepted Guide mechanics during real-data work without concrete regression evidence.

### Totaal
- two-dimensional horizontal-time / vertical-channel Guide;
- real schedule-duration geometry;
- `Vandaag · Morgen · Nu`;
- native inertia, bounce and directional lock;
- accepted partial-left-title and time-axis readability behaviour;
- physically accepted detail response/performance.

### Per zender
- vertical wall-clock schedule;
- horizontal schedule swipe changes adjacent channel while preserving time anchor where practical;
- horizontally browsable/direct-tap channel strip remains available;
- `Morgen`, `Vandaag`, `Nu` coherent;
- Programme Detail round-trip preserves relevant context;
- text-only fallback identities preserve distinguishing suffixes at larger text.

### Nu & Straks
- shared reference instant across channels;
- live/browse modes, `Nu` and `Primetime`;
- stable vertical channel context while reference time changes;
- reference programme + three following programmes;
- accepted time-rail fling/settle and mixed-gesture behaviour.

### Nu & Straks startup rule
`NowNextGuideView` stays behind deferred `import()`. Do **not** restore a static startup import without separate physical evidence. A failed deferred load must leave Totaal/Per zender and the presentation selector usable.

## Programme Detail
- Direct from all three Guide presentations; no intermediate preview sheet.
- Accepted current action scope is `Herinner mij` + `Bewaar`; Share is not required.
- Actions/sticky bottom copies remain future work.
- Returning from detail preserves originating Guide context.

## Phase 2 physical acceptance — CLOSED
Evidence:
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2310.md`
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md`

Final iPhone acceptance includes Settings secondary navigation, live/persisted Light/Dark/System, shared safe-area headers, all three Guide presentations at representative 135% iOS text, Programme Detail, Per zender channel identity/select/swipe synchronisation and no broad crash/white-screen/gesture regression.

The compact 24pt Nu & Straks following-programme rows remain explicit non-blocking accessibility debt. Do not solve them with overlapping `hitSlop` or blindly make every row 44pt; revisit density-aware during Phase 4 with physical evidence.

## Phase 3 implementation ledger
### PR #36 — Phase 2 closure / Phase 3 activation
- merge: `589ce9110419866439cd0e22e1c761687b48eb04`;
- exact PR-head CI #255 / `34785599349`: `quality` + `android-native` completed/success.

### PR #37 — provider-independent normalisation core
- merge: `491bc728adfb4ec70d060833d49d17bca25bbdc9`;
- exact PR-head `cf3b8c37b1199ee22035a863ab7b1a9f4faf8a8d`;
- CI #263 / `34786166182`: `quality` + `android-native` completed/success;
- exact-main CI #265 / `34787285080`: completed/success.

Implemented:
- provider-independent `GuideSchedule`;
- server-only neutral `EpgProvider` boundary;
- explicit provider -> Teevee channel mapping;
- UTC/canonical normalisation and deterministic Teevee programme IDs;
- record-level data-quality diagnostics;
- provider ID reuse across broadcasts and timezone-equivalent duplicates handled safely.

### PR #38 — canonical schedule repository semantics
- merge: `5d997e58cd86de75a7de83367cc0e47b783657a2`;
- exact PR-head `b2d45175cc98fb7a1530692d76f9b8c715c2f8f9`;
- CI #272 / `34787934051`: `quality` + `android-native` completed/success;
- exact-main CI #279 / `34788786630`: completed/success.

Implemented:
- serialisable `GuideScheduleQuery`;
- backend-independent `ScheduleRepository`;
- explicit channel/time replacement scope;
- `[start,end)` interval-intersection reads;
- authoritative coverage/freshness per channel/time segment;
- covered-empty versus unavailable distinction;
- conservative read freshness;
- atomic `ignored-stale` protection for older overlapping writes;
- deterministic in-memory executable reference (not a production persistence choice).

### PR #39 — safe ingestion + typed schedule service
- merge: `a39f5e432f0f3dcba946f5e8ca49bdd060ad0928`;
- exact PR-head `518baf1ee764a9f661afe8435631fc4074f3222b`;
- CI #280 / `34788836524`: `quality` + `android-native` completed/success;
- exact-main CI #281 / `34789673546`: **in progress at this document update; do not infer success until both jobs explicitly complete**.

Implemented:
- shared conservative channel-mapping/diagnostic logic;
- provider batch coverage classified `complete` vs `partial`;
- only authoritative complete batches may destructively replace canonical windows;
- malformed attributable data blocks only the affected canonical channel; unattributed malformed data blocks destructive replacement;
- authoritative empty windows may clear stale canonical data;
- ingest freshness captured at provider-request start;
- late completion of an older request is proven unable to roll newer data backwards;
- typed provider/database-independent `GuideScheduleApi`;
- runtime validation/canonicalisation of serialised schedule queries;
- provider -> normalisation -> repository -> service deterministic integration/concurrency tests.

No PR #38/#39 change touched Guide layout/scroll/gesture/deferred-import mechanics, mobile runtime data source, dependency graph or native configuration. No additional iPhone interaction pass is required for these backend-independent increments.

## Canonical schedule semantics — ADR 0007
Every future production repository/API implementation must preserve:
- replacement scope explicit by canonical channels + `[from,to)`;
- authoritative coverage stored separately from programme presence;
- covered-empty is valid; partially/uncovered scope is unavailable;
- query intersection `programme.start < to && programme.end > from`;
- returned freshness is the oldest freshness contributing to the requested scope;
- older overlapping writes cannot partly or wholly roll newer canonical state backwards;
- provider request observation time is taken before remote fetch;
- provider-specific fields/credentials never leak into the mobile schedule contract.

A future PostgreSQL/Supabase implementation must reproduce these semantics transactionally; the current in-memory implementation is tests/reference only.

## Provider research / rights gate
See `docs/PHASE_3_PROVIDER_RESEARCH_2026-09-14.md`.

Current conclusion:
- **Preferred:** authorized Bindinc/TVgids development feed/API if available.
- **Rejected:** Schedules Direct under currently published personal/non-commercial terms; do not build Teevee on it without separate written commercial rights.
- **Candidate:** Gracenote On API; Netherlands (`NLD`) lineup support is documented, but Teevee still needs authorized development/commercial access, credentials and rights confirmation.
- **Candidate:** EPGdata.tv; Netherlands is listed, but Teevee still needs feed/API specification, credentials, commercial redistribution terms and rights confirmation.
- Public/scrapeable guide data is not treated as licensed merely because it can technically be fetched.

## Hosted backend gate
No Teevee hosted backend exists yet.

Connected Supabase context currently exposes only an unrelated `ReelWorthy` project. **Never reuse it for Teevee.**

Creating a Teevee Supabase project is a real cost/organization decision. Before provisioning:
1. owner selects the intended Supabase organization;
2. fetch the current project cost for that organization;
3. state the exact cost and obtain explicit confirmation;
4. only then create the project.

Provider credentials/URLs that grant privileged access must stay server-side and out of Git/release bundles.

## What Phase 3 still needs after the gate
Once backend organization/cost and an authorized development provider are resolved:
1. provision the Teevee backend;
2. implement production canonical storage/coverage semantics behind `ScheduleRepository`;
3. implement one authorized provider adapter/parser and explicit channel mappings;
4. add a thin hosted transport for `GuideScheduleApi`;
5. ingest/query one real schedule end-to-end;
6. measure payload/refresh behaviour;
7. choose and implement the mobile schedule/cache source based on those measurements;
8. switch Guide to the provider-independent real-data source with loading/error/offline fallback while preserving frozen interaction state;
9. perform a focused iPhone real-data smoke; Android physical validation remains deferred until hardware is available.

Do not introduce TanStack Query, SQLite, Supabase client code, generalized multi-provider orchestration or broad infrastructure before the concrete hosted slice demonstrates a need.

## Android status
Physical Android interaction acceptance remains OPEN/DEFERRED because no Android device is available. CI proves Android JS/native export, clean prebuild and debug APK compilation, not system Back, nested-gesture feel or device performance.

## CI / reproducibility
- committed npm lockfile; CI uses `npm ci`;
- `quality`: strict TypeScript, lint, tests, iOS/Android/web exports;
- `android-native`: clean Expo Android prebuild + Gradle debug APK compile;
- Node 22 project runtime; supported GitHub action runtimes; workflow content permission read-only;
- never run `npm audit fix --force`.

## Repository coordination
- PR #28 (`docs/multi-agent-workflow`) remains an isolated docs-only workflow change owned by another thread. Do not fold Phase 3 implementation into it.

## Deferred but tracked
- physical Android validation;
- release-like performance outside Expo Go;
- Nu & Straks following-row accessibility/density hardening;
- targeted dependency-advisory review;
- production EPG/logo/artwork rights/SLA;
- Programme Detail `Herinner mij` / `Bewaar` implementation;
- pricing/trial/paywall;
- production typography licensing;
- final Tonight composition.

## EXACT NEXT STEP
**Human gate reached. Do not invent a backend organization, incur cost, reuse ReelWorthy, scrape a TV-guide site or hard-code an unlicensed provider. The owner must identify the Supabase organization intended for Teevee and whether an authorized Bindinc/TVgids development EPG feed/API is available. If Supabase is selected, fetch and explicitly confirm the current project cost before provisioning. If no internal EPG source is available, obtain authorized development/commercial access to a vetted external candidate (currently Gracenote On API or EPGdata.tv) before building the concrete adapter.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, `PROJECT_STATE.md`, ADR 0007 and `PHASE_3_PROVIDER_RESEARCH_2026-09-14.md`. Phase 2 is closed. Phase 3 backend-independent contracts are complete through PR #39. Preserve frozen Guide mechanics and deferred Nu & Straks startup. Do not reuse the ReelWorthy Supabase project. Continue only after the explicit Teevee backend organization/cost and authorized-provider gate is resolved; then implement the smallest hosted end-to-end real-data slice behind the existing `ScheduleRepository` and `GuideScheduleApi` contracts.
