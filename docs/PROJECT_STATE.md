# Teevee — Canonical Project State

Last updated: 2026-09-14.
Status: ACTIVE — **Phase 3 Real Data Vertical Slice**.
Current phase: **Phase 3 — Real Data Vertical Slice**
Next phase after Phase 3 closure: **Phase 4 — Core Guide MVP hardening**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository.

## Product and source-of-truth constraints
- Teevee is a premium, paid, ad-free TV-guide app for iOS and Android under Bindinc/TVgids.nl supervision.
- Guide-first; no mandatory account for core Guide use.
- Expo SDK 57 / React Native 0.86 / React 19 / strict TypeScript.
- Light, dark and system appearance.
- Provider-independent Teevee EPG model; mobile never consumes/parses an external EPG provider directly.
- Deterministic fixtures remain mandatory after real data is introduced.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility and larger system text are product-quality requirements.
- `PROJECT_STATE.md` is canonical current state; `DEVLOG.md` is historical context; timestamped evidence docs contain device detail.
- Relevant ADRs: `0001` through `0007` in `docs/decisions/`.

## Phase status
1. **Phase 1A — Totaal:** complete and physically accepted on iPhone.
2. **Phase 1B — Per zender / Nu & Straks:** complete and physically accepted on iPhone.
3. **Phase 2 — App Shell:** complete and physically accepted on iPhone.
4. **Phase 3 — Real Data Vertical Slice:** active; real provider -> hosted ingest -> canonical persistence -> public typed read is proven end-to-end. Mobile still consumes deterministic fixtures.
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

The compact 24pt Nu & Straks following-programme rows remain explicit non-blocking accessibility debt. Do not solve them with overlapping `hitSlop` or blindly make every row 44pt; revisit density-aware during Phase 4 with physical evidence.

## Phase 3 implementation ledger
### PRs #37–#39 — provider-independent contracts
Implemented and CI-proven:
- neutral server-only `EpgProvider` trust boundary;
- explicit provider -> Teevee channel mapping;
- canonical UTC normalisation and deterministic programme identities;
- data-quality diagnostics;
- serialisable `GuideScheduleQuery`;
- backend-independent `ScheduleRepository`;
- explicit `[from,to)` replacement/read scope;
- authoritative coverage distinct from programme presence;
- covered-empty versus unavailable semantics;
- conservative freshness and atomic `ignored-stale` protection;
- safe complete/partial ingestion orchestration;
- provider-request-start freshness for race safety;
- typed provider/database-independent `GuideScheduleApi`.

ADR 0007 is the durable canonical schedule-semantics contract.

### PR #40 — hosted canonical persistence
Merged as `da08c10e170ea8fe3843e16b76247eccd6c0502a` after exact PR-head CI #283 passed both jobs.

Dedicated Teevee Supabase backend:
- project `teevee`, ref `eokszvpityhtysbwdduy`;
- organization `teevee`;
- Free plan, `eu-west-2`;
- private `teevee` schema with channels, programmes and authoritative coverage;
- transactional replacement/stale-write semantics matching ADR 0007;
- `anon`/`authenticated` have no table/function access;
- service-role-only RPC bridges;
- `SupabaseScheduleRepository` behind `ScheduleRepository`;
- no privileged Supabase/provider secret in the mobile bundle.

Security Advisor has no Teevee WARN/ERROR findings. RLS-with-no-policy INFO on the private Teevee tables is intentional.

### PR #42 — temporary real development provider
Merged as `4ea4a73bb38580cc8ab0acf454ccfc5849350bab`; exact head CI #290 passed `quality` + `android-native`.

`XmltvEpgProvider` is server-side only and currently reads `https://iptv-epg.org/files/epg-nl.xml` for development. It parses XMLTV, requires explicit timezone offsets, normalises to UTC, preserves malformed input for diagnostics, respects `[from,to)` and marks coverage `complete` only when the full requested channel/time scope is continuously covered.

Live inspection evidence from temporary PR #43 (closed without merge):
- ~30.2 MB XML;
- 184 channels;
- 33,117 programme records;
- observed range 2026-09-13 through 2026-09-19;
- verified IDs include NPO1/2/3, RTL4/5/7/8/Z, SBS6/9, Net5 and VeronicaDisneyXD.

### PR #45 — explicit development channel catalog
Merged as `051781682b4522fa300fb657056ea8ac1fc0c59b`.

The Phase 3 real-data slice uses 12 explicit Teevee-owned canonical channels. Canonical IDs are independent from provider IDs; the mobile synthetic 48-channel fixture is not used as mapping truth.

### PR #48 — hosted transport and full real-data proof
Merged as `9e5d19b2f50f72651378723d2fb7dac60951098f` after exact feature-head CI #304 passed.

Implemented:
- bounded public `guide-schedule` Edge Function returning only canonical Teevee `ok`/`unavailable` data;
- protected `epg-refresh` Edge Function with provider-ID allowlist and server-only Supabase secret-key use;
- dependency-free `SupabaseRestRpcClient` for server-side PostgREST RPC;
- existing provider, ingest, repository and schedule-service contracts reused rather than duplicated;
- no mobile runtime, Guide interaction, dependency or native-config change.

Live infrastructure evidence from temporary verification PRs #46/#47 (closed without merge):
- actual Supabase Edge fetch of the ~30.2 MB XML: ~1.326 s fetch, ~0.702 s parse, ~2.054 s wall-clock, ~68.7 MB heap;
- full protected end-to-end path succeeded: XMLTV -> normalisation -> `epg-refresh` -> canonical Supabase write -> public `guide-schedule` read;
- ingest stored 12 channels / 523 programmes with 0 warnings and 0 errors;
- public read returned the same 12 channels / 523 programmes, ~192 KB, with no provider IDs exposed;
- an uncovered range returned exactly `unavailable`;
- anonymous refresh callers receive 401.

Temporary PR #49 then seeded the two Amsterdam guide days needed for the current vertical slice and closed without merge. Current live database verification on 2026-09-14:
- 12 channels;
- 1,011 programme rows;
- 24 authoritative coverage rows;
- coverage from `2026-09-13T22:00:00Z` through `2026-09-15T22:00:00Z` (Amsterdam Sep 14 + Sep 15);
- public day reads measured ~193 KB / ~1.32 s for today and ~187 KB / ~1.26 s for tomorrow.

## Hosted transport safety
- mobile/public callers can only request allow-listed canonical channel IDs;
- provider IDs remain server-side;
- refresh/write is protected and is not a public client capability;
- public schedule transport is intentionally read-only and exposes no database schema/RPC detail;
- service/secret keys never belong in Expo public configuration;
- temporary inspection functions are inert (410) and JWT-protected.

## DST correctness
Teevee calendar days are Europe/Amsterdam days, not fixed 24-hour durations. `guideDayStart` already models 23/25-hour DST days. PR #50 is currently fixing the hosted transport window bound from 24h to 25h so the winter-time day can be read/refreshed without weakening the narrow transport policy. Do not connect the mobile real-data source before this contract is green/merged.

## Development-provider rights boundary
IPTV-EPG.org is **temporary development input only**. Public availability is not proof of commercial redistribution rights.

Rules:
- no direct mobile dependency on the external feed;
- no downloaded XMLTV payload or external artwork/logo committed to Git;
- fixtures remain deterministic CI/offline source;
- no production-rights claim is inferred from Phase 3;
- production EPG, logo, artwork and SLA rights remain a release gate.

EPG.PW and Schedules Direct are not selected for the commercial path under their published non-commercial/personal terms. EPGdata.tv and Gracenote remain possible production candidates if explicit commercial rights are obtained. An authorized Bindinc/TVgids production feed remains preferred when available.

## Next engineering slice
After PR #50 is green/merged:
1. add a provider-independent **mobile Teevee schedule datasource** that calls only the public `guide-schedule` contract;
2. load today + tomorrow using Amsterdam day boundaries and combine them into one canonical `GuideSchedule`;
3. render fixtures immediately and fall back to fixtures on unavailable/network/invalid responses;
4. share one schedule source across Totaal, Per zender and deferred Nu & Straks without changing their accepted interaction mechanics;
5. do **not** add SQLite or TanStack Query yet: measured payloads are only ~187–193 KB/day and no requirement currently justifies that complexity;
6. run automated tests and then a focused iPhone real-data smoke because the data source will finally cross the mobile Guide boundary.

A persistent schedule cache may be evaluated after the first real-device smoke and measured resume/offline behaviour. Deterministic fixtures remain available regardless.

## Android status
Physical Android interaction acceptance remains OPEN/DEFERRED because no Android device is available. CI proves Android JS/native export, clean prebuild and debug APK compilation, not system Back, nested-gesture feel or device performance.

## CI / reproducibility
- committed npm lockfile; CI uses `npm ci`;
- `quality`: strict TypeScript, lint, tests, iOS/Android/web exports;
- `android-native`: clean Expo Android prebuild + Gradle debug APK compile;
- Node 22 project runtime; supported GitHub action runtimes; workflow content permission read-only;
- live external EPG is not a normal CI dependency;
- never run `npm audit fix --force`.

## Repository coordination
- PR #28 (`docs/multi-agent-workflow`) remains isolated docs-only work owned by another thread; do not fold it into development changes.
- temporary evidence PRs #43, #46, #47 and #49 were intentionally closed without merge.

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
**Finish and merge PR #50 (25-hour Amsterdam DST hosted-window correctness), then connect the mobile Guide to the public provider-independent Teevee schedule API with immediate deterministic-fixture fallback. Preserve all frozen Guide mechanics and the deferred Nu & Straks import. Do not introduce SQLite/TanStack yet.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, this file, ADR 0007 and `PHASE_3_PROVIDER_RESEARCH_2026-09-14.md`. Phase 2 is closed. Phase 3 has a proven hosted real-data path through PR #48 and current live canonical data for Amsterdam today + tomorrow. Finish PR #50, then implement the smallest shared mobile schedule datasource over `guide-schedule`, fixture-first with safe fallback, without changing accepted Guide interactions.