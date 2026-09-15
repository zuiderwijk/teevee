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
4. **Phase 3 — Real Data Vertical Slice:** active; real provider -> hosted ingest -> canonical persistence -> public typed read -> mobile canonical datasource is implemented. Physical iPhone real-data smoke remains the active exit gate.
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

### PR #50 — DST-correct hosted windows
Merged as `b60e2501ee757a20a080de393f618101b0970f90`.

The hosted read/refresh policy now allows an exact maximum of 25 hours, which matches Europe/Amsterdam winter-time calendar days while still rejecting broader requests. Exact merge-commit CI run #315 passed both `quality` and `android-native`.

### PR #51 — mobile canonical hosted schedule
Merged as `0886cbe61272703323ba30cd2deb9cbc037754a8` after exact feature head `08497e10ab65803c1ce91ca5b3b060fdfb0166f2` passed CI run #323 for both `quality` and `android-native`.

Implemented:
- runtime validation of serialized public schedule responses;
- dependency-free `HostedGuideScheduleClient` using only public `guide-schedule`;
- Amsterdam-correct today + tomorrow loading and merge;
- boundary-programme deduplication;
- provider-independent in-memory runtime schedule store;
- first-frame fixture-first rendering;
- fallback to deterministic fixtures on unavailable/network/invalid/empty hosted data;
- refresh after startup, on app resume and on Amsterdam day rollover;
- freshness-only updates do not remount accepted Guide presentations;
- only user-visible schedule changes bump the app-shell data version;
- one shared runtime source feeds Totaal, Per zender and deferred Nu & Straks through the existing fixture boundary;
- no SQLite, TanStack Query, new dependency or native-config change.

Frozen Guide view implementations and Programme Detail mechanics were not modified by PR #51.

## Hosted transport safety
- mobile/public callers can only request allow-listed canonical channel IDs;
- provider IDs remain server-side;
- refresh/write is protected and is not a public client capability;
- public schedule transport is intentionally read-only and exposes no database schema/RPC detail;
- service/secret keys never belong in Expo public configuration;
- temporary inspection functions are inert (410) and JWT-protected.

Current deployed functions on 2026-09-14:
- `guide-schedule` v5, public read (`verify_jwt=false`) by design;
- `epg-refresh` v3, protected by its own explicit secret/auth contract;
- both keep privileged Supabase/provider access server-side.

## DST correctness
Teevee calendar days are Europe/Amsterdam days, not fixed 24-hour durations. `guideDayStart` models 23/25-hour DST days and the hosted transport now allows the required 25-hour winter-time bound. Mobile today+tomorrow loading uses those same Amsterdam day boundaries.

## Development-provider rights boundary
IPTV-EPG.org is **temporary development input only**. Public availability is not proof of commercial redistribution rights.

Rules:
- no direct mobile dependency on the external feed;
- no downloaded XMLTV payload or external artwork/logo committed to Git;
- fixtures remain deterministic CI/offline source;
- no production-rights claim is inferred from Phase 3;
- production EPG, logo, artwork and SLA rights remain a release gate.

EPG.PW and Schedules Direct are not selected for the commercial path under their published non-commercial/personal terms. EPGdata.tv and Gracenote remain possible production candidates if explicit commercial rights are obtained. An authorized Bindinc/TVgids production feed remains preferred when available.

## Current Phase 3 exit gate
The hosted path and mobile integration are implemented and CI-proven. Phase 3 is **not yet physically closed** because PR #51 crosses the mobile Guide data boundary for the first time.

Required focused iPhone smoke:
1. launch remains stable and first frame appears immediately from local data;
2. Totaal transitions to real canonical data without gesture/readability regression;
3. Per zender retains direct channel strip, adjacent swipe and time/context behaviour;
4. deferred Nu & Straks still loads and retains accepted rail/mixed-gesture behaviour;
5. Programme Detail opens/returns correctly from all three presentations;
6. app background/resume with unchanged hosted content does not discard user context;
7. offline/unavailable hosted data remains usable through deterministic fixture fallback.

Do not introduce persistent caching before this smoke and actual resume/offline behaviour justify it.

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
**Perform and document the focused physical iPhone real-data smoke for PR #51 across Totaal, Per zender, deferred Nu & Straks, Programme Detail, fixture→real transition, resume context retention and fallback behaviour. Do not change frozen Guide mechanics or add persistent caching before this evidence exists.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, this file, ADR 0007 and `PHASE_3_PROVIDER_RESEARCH_2026-09-14.md`. Phase 2 is closed. PR #50 fixed hosted 25-hour DST windows and PR #51 connected the mobile Guide to the provider-independent canonical hosted schedule with fixture-first safe fallback. The active Phase 3 gate is now a focused physical iPhone real-data smoke; only after that evidence may Phase 3 be closed and Phase 4 begin.