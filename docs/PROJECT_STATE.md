# Teevee — Canonical Project State

Last updated: 2026-09-15.
Status: ACTIVE — **Phase 4 Core Guide MVP hardening**.
Current phase: **Phase 4 — Core Guide MVP hardening**
Previous phase: **Phase 3 — Real Data Vertical Slice — CLOSED**

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
- `docs/VISUAL_BASELINE.md` plus `design/current/` select the exact current accepted visual references; do not infer them from chat history or Library recency.
- Relevant ADRs: `0001` through `0008` in `docs/decisions/`.

## Phase status
1. **Phase 1A — Totaal:** complete and physically accepted on iPhone.
2. **Phase 1B — Per zender / Nu & Straks:** complete and physically accepted on iPhone.
3. **Phase 2 — App Shell:** complete and physically accepted on iPhone.
4. **Phase 3 — Real Data Vertical Slice:** **complete and physically accepted on iPhone**; real provider -> hosted ingest -> canonical persistence -> public typed read -> mobile canonical datasource is proven, including fixture-first startup, real-data transition, fallback and context retention.
5. **Phase 4 — Core Guide MVP hardening:** **active**; the shared 06:00 television-day / D-2..D+7 domain foundation and the mobile runtime migration to television-day-aware D + D+1 bounded loading/anchoring are merged. The runtime boundary is independently QA-reviewed and physically accepted on iPhone. The next boundary is user-facing D-2..D+7 day selection/date context for Totaal and Per zender using the already accepted Guide day-selector design.

## Canonical visual source of truth
The accepted visual starting point for existing surfaces is no longer inferred from chat history or historical generated images.

- `docs/VISUAL_BASELINE.md` is the canonical visual index.
- `design/current/` contains per-surface manifests and the exact persistent Teevee Library asset ids/paths to inspect.
- Totaal, Per zender and Nu & Straks have accepted current visual manifests.
- Programme Detail has an accepted direction/reference; Tonight remains explicitly provisional.
- Behaviour in this file, `PRODUCT.md`, `UX.md` and accepted ADRs overrides any stale control visible in an otherwise accepted screenshot.
- New visual work is exploration until the owner explicitly approves it and the visual manifest update is merged to `main`.
- Older visuals stay discoverable through Git/Library history but are never selected by recency, similarity or apparent completeness.

## Frozen television-day and Guide-horizon semantics
ADR 0008 is the durable product/architecture contract for Guide day grouping and horizon.

- A Teevee television day runs **06:00 Europe/Amsterdam -> 06:00 the following calendar day**.
- Midnight is not a Guide boundary and must not force a day switch.
- Between 00:00 and 05:59, `Nu` still belongs to the preceding television day.
- Programme timestamps remain real canonical UTC timestamps; television-day membership is derived rather than encoded by shifting timestamps.
- Let `D` be the current television day. Totaal and Per zender must support at least **D-2 through D+7**, i.e. ten complete television days.
- A user opening at 19:00 must be able to navigate backward through the same television day and forward through programmes after midnight without an explicit date change.
- `Nu` always jumps to the actual current instant and selects the television day containing that instant.
- Nu & Straks remains a single active-day presentation, but that active day is the current television day rather than the strict calendar day; until 06:00 its `Primetime` context may therefore refer to the preceding evening.
- Phase 3 proved that the data/query architecture is not locked to one provider and that canonical hosted schedule data can safely cross the mobile boundary.
- Phase 4 owns the full product implementation and physical acceptance of D-2..D+7 navigation, midnight continuity, 06:00 rollover, historical access, forward access and context-preserving refresh.
- Phase 8 production-provider selection must prove sufficient horizon, history/retention, freshness and rights to satisfy this product promise.

## Frozen Guide interaction baseline
Do not retune accepted Guide mechanics during Phase 4 without concrete regression evidence.

### Totaal
- two-dimensional horizontal-time / vertical-channel Guide;
- real schedule-duration geometry;
- current prototype controls use `Vandaag · Morgen · Nu`; Phase 4 replaces/extends this as required by ADR 0008 without changing the accepted gesture model;
- native inertia, bounce and directional lock;
- accepted partial-left-title and time-axis readability behaviour;
- physically accepted detail response/performance.

### Per zender
- vertical wall-clock schedule;
- horizontal schedule swipe changes adjacent channel while preserving time anchor where practical;
- horizontally browsable/direct-tap channel strip remains available;
- the accepted design direction uses explicit date context plus sibling `Primetime` and `Nu` utility actions; the old expanded Per-zender time picker is superseded;
- `Primetime` jumps the selected television day to 20:30; between 00:00 and 05:59 that means the preceding television-day evening;
- Programme Detail round-trip preserves relevant context;
- text-only fallback identities preserve distinguishing suffixes at larger text.

### Nu & Straks
- shared reference instant across channels;
- live/browse modes, `Nu` and `Primetime`;
- stable vertical channel context while reference time changes;
- reference programme + three following programmes;
- accepted time-rail fling/settle and mixed-gesture behaviour;
- active-day semantics follow ADR 0008 (06:00 television-day boundary), not strict midnight calendar-day rollover.

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

## Phase 3 physical acceptance — CLOSED
Evidence:
- `docs/PHYSICAL_EVIDENCE_2026-09-15_PHASE3.md`

Physical iPhone evidence proved:
- stable fixture-first startup;
- deterministic fixture fallback when hosted coverage is unavailable;
- fixture -> real canonical hosted transition on-device;
- Totaal, Per zender and deferred Nu & Straks remain usable with real data;
- Programme Detail round-trips from all three presentations;
- adjacent-channel navigation in Per zender;
- Nu & Straks horizontal reference-time movement plus vertical mixed-gesture behaviour;
- background/resume preserves selected reference time and visible Guide context;
- runtime network loss leaves the existing Guide usable.

A true no-network cold start remains deferred to a standalone/dev build because Expo Go itself needs Metro/network access after a force-quit. This is an environment limitation rather than a failed Teevee fallback test and is not a Phase 3 blocker.

## Phase 4 runtime-boundary physical acceptance — CLOSED FOR PR #64 SCOPE
Evidence:
- `docs/PHYSICAL_EVIDENCE_2026-09-15_PHASE4_RUNTIME.md`

On exact PR #64 head `5356877fd1effb05e7ed5ce1a87c36544ac1dcf7`, iPhone 13 / iOS 26.6 physical evidence proved:
- immediate fixture-first Guide availability;
- fixture -> hosted canonical replacement without blank/stuck/crash behaviour;
- same-television-day background/resume preserving a non-default Nu & Straks `23:00` reference time and visible programme context.

The tester explicitly confirmed the checkout SHA with `git rev-parse HEAD`. Exact 00:00/05:59/06:00 and DST branches remain automation-proven rather than device-clock-manipulated. This closes the physical lifecycle gate for PR #64 only; future user-facing multi-day navigation still requires its own focused physical acceptance.

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

ADR 0007 is the durable canonical schedule-semantics contract. ADR 0008 defines the television-day/horizon product semantics layered on top of those timestamp/window primitives.

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

RLS-with-no-policy INFO on the private Teevee tables is intentional.

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

Temporary PR #49 then seeded the two Amsterdam guide days needed for the vertical slice and closed without merge. Historical verification on 2026-09-14:
- 12 channels;
- 1,011 programme rows;
- 24 authoritative coverage rows;
- coverage from `2026-09-13T22:00:00Z` through `2026-09-15T22:00:00Z` (Amsterdam Sep 14 + Sep 15);
- public day reads measured ~193 KB / ~1.32 s for today and ~187 KB / ~1.26 s for tomorrow.

This two-day seed was test evidence only and does not define the final Guide horizon in ADR 0008.

### PR #50 — DST-correct hosted windows
Merged as `b60e2501ee757a20a080de393f618101b0970f90`.

The hosted read/refresh policy allows an exact maximum of 25 hours, which matches Europe/Amsterdam winter-time calendar days while still rejecting broader requests. Exact merge-commit CI run #315 passed both `quality` and `android-native`.

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

Frozen Guide view implementations and Programme Detail mechanics were not modified by PR #51. Its midnight/today+tomorrow rollover remains intentionally temporary Phase 3 behaviour to be generalized to ADR 0008 semantics in Phase 4.

### PR #59 — automatic development-EPG freshness
PR #59 adds server-side automatic refresh for the temporary development feed without changing the mobile trust boundary:
- `pg_cron` + `pg_net` refresh a rolling three-calendar-day Amsterdam buffer every six hours;
- current day, tomorrow and one rollover day are enqueued so midnight does not create a temporary today+tomorrow coverage gap;
- a dedicated random cron token is generated inside Postgres and stored encrypted in Supabase Vault;
- the real Supabase secret key remains only inside the Edge Function environment;
- `epg-refresh` accepts the existing trusted secret-key route or the dedicated validated cron token;
- `anon` / `authenticated` cannot enqueue or invoke the protected refresh;
- a service-role-only enqueue RPC supports trusted operations/testing;
- partial current-day provider coverage is conservatively skipped rather than overwriting authoritative stored coverage.

Live end-to-end verification on 2026-09-15 proved Vault token -> `pg_net` enqueue -> protected refresh -> canonical persistence -> public `guide-schedule`: 12 channels / 498 programmes for the current day, 12 / 485 for tomorrow and 12 / 489 for the rollover day. Anonymous direct refresh remained 401. The temporary smoke helper was then made inert (410) and JWT-protected again.

Supabase Security Advisor currently reports the generic `extension_in_public` WARN for `pg_net`; the hosted extension is non-relocatable and Supabase's official setup uses `create extension pg_net`, while its operational HTTP API lives in schema `net`. Treat this as a known platform-extension advisor note rather than a Teevee table/RLS exposure.

## Hosted transport safety
- mobile/public callers can only request allow-listed canonical channel IDs;
- provider IDs remain server-side;
- refresh/write is protected and is not a public client capability;
- public schedule transport is intentionally read-only and exposes no database schema/RPC detail;
- service/secret keys never belong in Expo public configuration;
- temporary inspection/smoke functions are inert and JWT-protected after use.

Current deployed functions on 2026-09-15:
- `guide-schedule` v5, public read (`verify_jwt=false`) by design;
- `epg-refresh` v4, protected by explicit secret-key / dedicated cron-token auth;
- temporary `epg-cron-smoke` is inert (410) and `verify_jwt=true`;
- privileged Supabase/provider access remains server-side.

## DST correctness
Canonical programme timestamps and repository query windows remain real instants. `guideDayStart` remains the strict Europe/Amsterdam calendar-day primitive for calendar-specific code, while `guideTelevisionDayStart` and `guideTelevisionDayHorizon` are the Guide product-domain primitives. PR #62 introduced the 06:00 boundary and exact D-2..D+7 ten-window horizon with deterministic 00:00/05:59/06:00, 23-hour spring-DST and 25-hour fall-DST coverage. PR #64 migrated the mobile hosted loader/runtime to independently bounded D + D+1 television-day reads, television-day runtime anchoring and 06:00 lifecycle rollover while preserving midnight continuity. The hosted transport's 25-hour maximum remains sufficient for one television-day request.

## Development-provider rights boundary
IPTV-EPG.org is **temporary development input only**. Public availability is not proof of commercial redistribution rights.

Rules:
- no direct mobile dependency on the external feed;
- no downloaded XMLTV payload or external artwork/logo committed to Git;
- fixtures remain deterministic CI/offline source;
- no production-rights claim is inferred from Phase 3;
- production EPG, logo, artwork and SLA rights remain a release gate;
- final production provider must also satisfy ADR 0008's minimum D-2..D+7 product horizon.

EPG.PW and Schedules Direct are not selected for the commercial path under their published non-commercial/personal terms. EPGdata.tv and Gracenote remain possible production candidates if explicit commercial rights are obtained. An authorized Bindinc/TVgids production feed remains preferred when available.

## Phase 4 implementation ledger
### PR #62 — television-day domain foundation
Merged to `main` as `36468ed19eca7411079d2845763ca8de36c8d10f` from exact reviewed head `2d83c101b749083c39530ed2473103319f1311cf`.

Implemented without touching Guide UI/runtime behaviour:
- `GUIDE_TELEVISION_DAY_START_HOUR = 6`;
- exact typed D-2..D+7 offsets and ten-window horizon helper;
- Amsterdam/DST-safe `guideTelevisionDayStart()`;
- shared wall-clock resolver while preserving temporary `guideDayStart()` semantics;
- deterministic coverage for exact 00:00, 05:59:59, 06:00, both Amsterdam DST transitions, contiguous D-2..D+7 horizons, pre-06:00 anchoring and invalid/out-of-range offsets.

Independent QA first found a blocking test-evidence gap on an earlier head. The final head added the missing exact-midnight, DST-horizon and oversized-offset coverage; QA re-reviewed the exact final head with no blocking or non-blocking findings. Exact PR-head CI run #362 passed `quality` and `android-native`. No physical-device gate was required because the PR did not migrate any runtime/UI path.

### PR #64 — mobile television-day runtime boundary
Merged to `main` as `ad71bcbb569affcaa9b9b4be12ed583489018b94` from exact reviewed head `5356877fd1effb05e7ed5ce1a87c36544ac1dcf7`.

Implemented without changing Guide visuals/gestures:
- hosted mobile loading now composes D and D+1 television-day windows via the shared 06:00 primitive;
- each hosted read remains independently bounded to one 23/24/25-hour television day;
- in-memory runtime schedule anchoring and rollover move from midnight to 06:00;
- midnight no longer invalidates an installed canonical schedule;
- fixture-first startup, deterministic fallback, content equality, request-version protection, resume refresh and provider-independent merge/deduplication are preserved;
- no day selector, persistent cache, new dependency or static `NowNextGuideView` startup import was introduced.

Exact-head CI run #366 passed `quality` and `android-native` with 230 tests across 41 files plus Expo iOS/Android/web export and clean Android PR arm64 compilation. Independent QA found no blocking code issue and required only the focused physical lifecycle gate. That gate passed on exact head on iPhone 13 / iOS 26.6; evidence is in `docs/PHYSICAL_EVIDENCE_2026-09-15_PHASE4_RUNTIME.md`. Post-merge `main` CI run #367 is the separate exact-main safety gate and must be green before the Lead closes the merge cycle.

## Phase 4 active scope
Phase 3's mobile real-data boundary is closed. The 06:00 Guide domain foundation and current-day runtime boundary are now implemented. Phase 4 may continue with user-facing multi-day navigation against the frozen product semantics.

Primary Phase 4 responsibilities:
- implement television-day-aware D-2..D+7 schedule access and day navigation for Totaal and Per zender;
- preserve accepted Totaal, Per zender and Nu & Straks gesture behaviour while multi-day navigation is introduced;
- implement the accepted date-selector/date-context behaviour, including the Per zender `Primetime` + `Nu` utility actions;
- validate midnight continuity, 06:00 rollover, history/future navigation and refresh context physically;
- revisit known Nu & Straks density/accessibility debt without creating overlapping touch targets;
- decide and implement appropriate local persistence/cache behaviour only as needed for the hardened MVP, keeping deterministic fixtures as the development/offline baseline.

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
- PR #28 (`docs/multi-agent-workflow`) merged as `d295333356ff4d4078d65b3ebff7c6c3d9ffdf1c`; `docs/THREAD_PLAYBOOK.md` is active repository policy for specialised ChatGPT threads.
- PR #53 (`docs/tv-day-horizon`) merged as `88315f1b7db468aa75b36a268091f72a8e007272`; ADR 0008 and the D-2..D+7 / 06:00 television-day rules are canonical.
- PR #62 (`feat/phase4-television-day-foundation`) merged as `36468ed19eca7411079d2845763ca8de36c8d10f`; exact final head QA/CI are complete and the domain foundation is now on `main`.
- PR #64 (`feat/phase4-television-day-runtime`) merged as `ad71bcbb569affcaa9b9b4be12ed583489018b94`; exact final head QA/CI and focused iPhone lifecycle acceptance are complete.
- temporary evidence PRs #43, #46, #47 and #49 were intentionally closed without merge.
- `docs/PHYSICAL_EVIDENCE_2026-09-15_PHASE3.md` is the canonical Phase 3 physical iPhone acceptance record.
- `docs/PHYSICAL_EVIDENCE_2026-09-15_PHASE4_RUNTIME.md` is the focused PR #64 lifecycle acceptance record.

## Deferred but tracked
- physical Android validation;
- true offline cold-start validation in a standalone/dev build rather than Expo Go;
- release-like performance outside Expo Go;
- production EPG/logo/artwork rights/SLA and D-2..D+7 horizon proof;
- Programme Detail `Herinner mij` / `Bewaar` implementation;
- pricing/trial/paywall;
- production typography licensing;
- final Tonight composition.

## EXACT NEXT STEP
**Wire the accepted shared Guide day selector/date context into Totaal and Per zender and make television-day selection functional across exactly D-2..D+7 using bounded per-day hosted reads and the merged 06:00 primitives. Preserve the viewed wall-clock time when changing day where practical; `Nu` must restore the actual instant and its containing television day; Per zender `Primetime` must keep the selected television day and jump to 20:30. Keep Nu & Straks single-active-day with no date selector. Do not eagerly fetch one unbounded ten-day payload or introduce persistent cache/dependencies without measurement. Treat this user-facing day-navigation increment as HIGH risk with deterministic horizon/selection/lifecycle tests, independent exact-head QA and focused physical iPhone acceptance while preserving all frozen Guide gesture mechanics.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, this file, `docs/ENGINEERING_QUALITY_POLICY.md`, ADR 0007, ADR 0008, `design/current/guide/GUIDE_DAY_SELECTOR.md` and the relevant Guide/runtime/loader tests before changing the repository. Phase 1A, Phase 1B, Phase 2 and Phase 3 are closed on iPhone. Phase 4 is active. PR #62 merged the 06:00 television-day / D-2..D+7 domain foundation and PR #64 migrated the mobile hosted runtime to D + D+1 television-day boundaries with exact-head QA plus focused iPhone lifecycle acceptance. The next increment is the accepted D-2..D+7 day selector/date-context implementation for Totaal and Per zender with bounded day loading; preserve deterministic fixtures, frozen Guide gestures and deferred `NowNextGuideView`. Physical Android validation remains deferred.