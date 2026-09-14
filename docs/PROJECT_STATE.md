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
- Deterministic fixtures remain mandatory even after real data is introduced.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility and larger system text are product-quality requirements.
- `PROJECT_STATE.md` is canonical current state; `DEVLOG.md` is historical context; timestamped evidence docs contain device detail.
- Relevant ADRs: `0001` through `0007` in `docs/decisions/`.

## Phase status
1. **Phase 1A — Totaal:** complete and physically accepted on iPhone.
2. **Phase 1B — Per zender / Nu & Straks:** complete and physically accepted on iPhone.
3. **Phase 2 — App Shell:** complete and physically accepted on iPhone.
4. **Phase 3 — Real Data Vertical Slice:** active; hosted canonical persistence and a development-only real XMLTV provider adapter are now implemented.
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

## Phase 3 implemented foundation
### Provider-independent contracts — PRs #37–#39
Implemented and CI-proven:
- neutral server-only `EpgProvider` trust boundary;
- explicit provider -> Teevee channel mapping;
- canonical UTC normalisation and deterministic programme identities;
- record-level data-quality diagnostics;
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

### Hosted canonical persistence — PR #40
PR #40 merged as `da08c10e170ea8fe3843e16b76247eccd6c0502a` after exact PR-head CI #283 completed successfully for both `quality` and `android-native`.

Teevee now has a dedicated hosted Supabase backend:
- project: `teevee`;
- project ref: `eokszvpityhtysbwdduy`;
- organization: `teevee`;
- plan: Free;
- region: `eu-west-2`.

Applied/versioned migrations:
1. `20260914001257_create_canonical_schedule_store`;
2. `20260914001410_harden_default_rls_helper_permissions`;
3. `20260914001538_create_schedule_rpc_bridge`.

Implemented:
- private `teevee` schema for channels, programmes and authoritative schedule coverage;
- transactional replacement/stale-write semantics matching ADR 0007;
- private tables not exposed to `anon`/`authenticated`;
- service-role-only public RPC bridges for repository access;
- `SupabaseScheduleRepository` behind the existing `ScheduleRepository` contract;
- no Supabase/provider secret in the mobile bundle.

Security advisor WARN/ERROR findings were cleared after hardening. RLS-with-no-policy INFO on the private Teevee tables is intentional because client access is denied entirely.

### Temporary real development provider — PR #42
PR #42 merged as `4ea4a73bb38580cc8ab0acf454ccfc5849350bab` after exact head `2af9d6cc6afb8b0618b196eebdc33b1b940d25d9` passed CI #290 (`quality` + `android-native` completed/success).

Implemented `XmltvEpgProvider`:
- server-side only, behind `EpgProvider`;
- default development URL: `https://iptv-epg.org/files/epg-nl.xml`;
- parses XMLTV channels, titles, subtitles, descriptions, genres, live/repeat flags;
- requires explicit timezone offsets and normalises valid XMLTV timestamps to UTC;
- preserves malformed external timestamps for downstream diagnostics instead of guessing;
- query output obeys `[from,to)` intersection;
- reports provider coverage `complete` only when every requested channel continuously covers the requested window; otherwise `partial` prevents destructive ingest;
- deterministic tests inject `fetch`; normal PR-CI does not depend on the live feed.

A first CI run exposed a real CDATA parsing bug; it was fixed in the parser before merge and the final exact-head run is green.

## Live development-feed evidence
Temporary inspection PR #43 was deliberately closed without merge after a one-off GitHub Actions fetch of the public feed.

Observed on 2026-09-14:
- content type: `text/xml; charset=utf-8`;
- payload size: 30,237,192 bytes;
- 184 channel records;
- 33,117 programme records;
- observed feed range: `20260913000600 +0000` through `20260919235500 +0000`;
- verified IDs include `NPO1.nl`, `NPO2.nl`, `NPO3.nl`, `RTL4.nl`, `RTL5.nl`, `RTL7.nl`, `RTL8.nl`, `RTLZ.nl`, `SBS6.nl`, `SBS9.nl`, `Net5.nl`, `VeronicaDisneyXD.nl`, `ESPN.nl` and `ZiggoSport.nl`.

The feed itself is the technical evidence source. Public overview counters currently disagree with the fetched payload and therefore must not drive coverage/correctness logic.

## Development-provider rights boundary
IPTV-EPG.org is **temporary development input only**. Its public availability is not treated as proof of commercial redistribution rights.

Rules:
- no direct mobile dependency on the external feed;
- no downloaded XMLTV payload or externally sourced artwork/logo committed to Git;
- fixtures remain the deterministic CI/offline source;
- no production-rights claim is inferred from the Phase 3 development integration;
- production EPG, channel-logo, programme-artwork and SLA rights remain an explicit release gate.

EPG.PW is not the selected development source; its published terms restrict use to personal/non-commercial purposes. Schedules Direct remains rejected for the commercial Teevee path under its published subscriber terms. EPGdata.tv and Gracenote remain possible production candidates if explicit commercial rights are obtained. An authorized Bindinc/TVgids production feed remains preferred when available.

See `docs/PHASE_3_PROVIDER_RESEARCH_2026-09-14.md`.

## What Phase 3 still needs
The old backend/provider-human gate is resolved sufficiently for development. The remaining engineering path is now:
1. define a narrow explicit development channel catalog/mapping using the verified XMLTV IDs — do not guess mappings from the synthetic mobile fixture;
2. add the thinnest hosted server/Edge execution path that keeps service-role access server-side;
3. ingest one narrow real schedule window into the canonical Supabase store;
4. query it back through the typed Teevee schedule boundary and prove `ok`/`unavailable` behaviour end-to-end;
5. measure provider fetch, parse, canonical payload size and refresh behaviour on the real ~30 MB source;
6. only then choose the mobile cache/source mechanics;
7. connect the Guide to the provider-independent API/cache with loading/error/offline fallback while preserving frozen interaction state;
8. run a focused iPhone real-data smoke when the new data path reaches the Guide.

Do not introduce TanStack Query, SQLite, generalized multi-provider orchestration or broad infrastructure before measurements demonstrate the need.

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
- PR #28 (`docs/multi-agent-workflow`) remains isolated docs-only work owned by another thread; do not fold Phase 3 development into it.
- PR #41 was closed without merge because its immediate EPGdata.tv selection was superseded by the owner's temporary free-development-feed decision.
- PR #43 was a temporary inspection branch and was closed without merge.

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
**Build the smallest hosted real-data vertical slice from the verified free development XMLTV source into the existing canonical Supabase repository. Start with a narrow explicit real-channel mapping and server-side ingest/query path; measure the real source before adding mobile caching. Do not map provider IDs onto the synthetic fixture by assumption, do not expose service-role credentials, and do not treat the development feed as production-licensed.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, this file, ADR 0007 and `PHASE_3_PROVIDER_RESEARCH_2026-09-14.md`. Phase 2 is closed. Phase 3 has hosted Supabase canonical persistence through PR #40 and a development-only XMLTV provider through PR #42. Preserve frozen Guide mechanics and deferred Nu & Straks startup. Continue with a narrow explicit development channel mapping and hosted end-to-end ingest/query slice; production EPG rights remain separate.