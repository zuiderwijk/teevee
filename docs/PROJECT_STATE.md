# Teevee — Canonical Project State

Last updated: 2026-09-14 00:39 CEST.
Status: ACTIVE — **Phase 3 Real Data Vertical Slice**. Phase 1A/1B Guide interaction models and Phase 2 App Shell are closed and physically accepted on the available iPhone. The provider-independent Phase 3 normalisation core is merged; canonical storage/query semantics are the active implementation target. Physical Android interaction validation remains explicitly deferred because the owner currently has no Android device; native Android compilation is a CI gate but is not device acceptance.
Current phase: **Phase 3 — Real Data Vertical Slice**
Previous phase: **Phase 2 — App Shell: complete and physically accepted on iPhone**
Next phase after closure: **Phase 4 — Core Guide MVP hardening**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository.

## Product
Teevee is a premium, paid, ad-free television-guide app for iOS and Android under Bindinc/TVgids.nl supervision. The Guide is the product: fast, calm, reliable and polished. Netherlands first; no mandatory account for core Guide use.

## Source-of-truth constraints
- React Native / Expo SDK 57 and strict TypeScript for iOS and Android.
- Paid, ad-free and Guide-first; no mandatory account for core use.
- Light, dark and system appearance.
- Provider-independent Teevee EPG model; mobile never consumes or parses an external EPG provider directly.
- Deterministic fixtures remain mandatory for development/tests even after real data is introduced.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility and system text scaling are product-quality requirements.
- `PROJECT_STATE.md` is canonical cross-session memory; detailed history lives in `docs/DEVLOG.md` and timestamped evidence docs.

Relevant ADRs: `0001` through `0006` in `docs/decisions/`.

## Phase sequence
1. **Phase 1A — Totaal:** complete and physically accepted on iPhone.
2. **Phase 1B — Guide presentations:** complete and physically accepted on iPhone.
3. **Phase 2 — App Shell:** complete and physically accepted on iPhone.
4. **Phase 3 — Real Data Vertical Slice:** active.
5. **Phase 4 — Core Guide MVP hardening.**

## Frozen Guide interaction baseline
Do not retune accepted Guide mechanics during real-data work without concrete regression evidence.

### Totaal
- two-dimensional Guide with horizontal time and vertical channels;
- continuous timeline and real programme-duration geometry;
- `Vandaag · Morgen · Nu`;
- native inertia, bounce and directional lock;
- PR #9 partial-left title readability;
- PR #11 time-axis left mask;
- PR #13 VoiceOver and live system-theme response;
- PR #14/#15 post-horizontal-scroll performance architecture;
- direct Programme Detail path.

### Per zender
- vertical position represents wall-clock time;
- horizontal schedule swipes change adjacent channel while preserving the viewed time anchor;
- top channel strip can be browsed and distant channels selected directly;
- `Morgen`, `Vandaag` and `Nu` behave coherently;
- Programme Detail round-trip preserves relevant channel/day/time context;
- text-only channel identities use middle ellipsis when necessary so differentiating suffixes remain visible under larger text;
- no crash, white screen or nested-gesture collapse in final acceptance evidence.

### Nu & Straks
- one reference instant applies across all channel rows;
- live and browse modes are coherent;
- horizontal rail flings settle without ping-pong/tug-of-war;
- `Nu` returns to current reference;
- `Primetime` uses 20:30 as a prototype value, not yet a frozen commercial/product decision;
- vertical channel context remains stable while reference time changes;
- Programme Detail round-trip preserves relevant reference/vertical context;
- mixed vertical/time-rail gestures remain controllable.

## Nu & Straks startup rule
Do **not** restore a static `NowNextGuideView` startup import without separate physical evidence.

Accepted integration boundary:
- Totaal and Per zender may be in the startup module graph;
- Nu & Straks loads through `import()` only when requested or when restoring a persisted Nu & Straks preference after the shell has started;
- a late dynamic import may never override a newer user selection;
- load failure must leave the rest of Guide usable and surface a recoverable user-facing state.

## Programme Detail
- Direct from every Guide presentation; no intermediate preview sheet.
- Native React Native Modal presentation.
- Close/backdrop, `onRequestClose`, accessibility escape and deliberate swipe-down dismissal.
- Accepted future actions: `Herinner mij` + `Bewaar`; no share action. These actions and the contextual sticky copy are not implemented yet.
- Returning from detail preserves the originating Guide presentation and relevant context.
- Programme Detail is physically proven from all three Guide presentations and remained readable/closable at representative larger text.

## Phase 2 implementation ledger
- **PR #25 — app shell** → `2a5686c6d170ac0eb3b7206d152f3e2f358da204`: typed Totaal/Per zender/Nu & Straks contract, direct selector, stale deferred-import protection, Gids/Vanavond/Zoeken tabs.
- **PR #26 — local preferences** → `03b31f1ed4dfa3508ea9e1aeacb85cc19520aa9c`: versioned small JSON preferences and Guide-presentation persistence.
- **PR #27 — Settings / appearance** → `61785994632ce397afbebf1f7c82f677719c1d23`: secondary Settings route; System/Light/Dark; live application and persistence.
- **PR #29 — shared app-shell header** → `68f60bae8ac5888054bf92973ef92041694a19f8`: shared `AppScreenHeader`, safe-area-context and wrapping layout.
- **PR #30 — screen error recovery** → `9e2fe2035626c28ccb36f228cc907848034d5581`.
- **PR #31 — deferred Nu & Straks recovery** → `93f06c154087a14971f0ab1fcedfafeb82f40bdf`.
- **PR #32 — CI hardening** → `3650f15fd70d37088940d292ae3422aca7b450a9`.
- **PR #33 — shell accessibility** → `4516ce280ff2e274fb4f7df42570cc7ff5d2801e`.
- **PR #34 — compact Guide controls** → `62a50754ce71fc19606770a002152ee2e62c8b7f`.
- **PR #35 — large-text channel identity** → `f067cf8543921464dba70c3966b1870c1ac2666a`.

## Phase 2 physical acceptance — CLOSED
Broad evidence: `ScreenRecording_09-13-2026 23-10-50_1.MP4` / `docs/PHYSICAL_EVIDENCE_2026-09-13_2310.md`.
Final remediation evidence: `ScreenRecording_09-13-2026 23-56-18_1.MP4` / `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md`.

Physically accepted on the available iPhone:
- Settings behaves as secondary navigation;
- Light / System / Dark apply live;
- explicit appearance preference survives reload/restart;
- shared headers respect safe areas and remain readable;
- Totaal, Per zender and Nu & Straks remain operational under representative 135% iOS text;
- hardened Guide controls remain reachable;
- Nu & Straks reference controls reflow coherently;
- Programme Detail opens and closes under larger text;
- Per zender `Publiek 1/2/3` text fallbacks remain visually distinguishable after PR #35;
- direct channel selection and adjacent schedule paging keep the active strip state synchronised;
- no redbox, white screen, crash or broad interaction regression is present in final evidence.

**Conclusion: Phase 2 App Shell is complete.**

## Open accessibility boundary — Nu & Straks following rows
The compact interactive following-programme rows currently use a 24pt minimum height. This remains tracked accessibility/UX debt, but physical larger-text evidence did not produce a concrete tap failure.

Do not paper this over with overlapping `hitSlop`; adjacent sibling hit regions can compete. Do not silently enlarge every row to 44pt either, because that materially changes information density and visible channel count. Revisit deliberately during Core Guide MVP accessibility hardening with a density-aware layout and physical validation.

## Phase 3 — Real Data Vertical Slice
Goal: prove one provider-independent path from external schedule data through normalisation/storage/API into the existing mobile Guide without changing accepted Guide interaction models.

Required Phase 3 deliverables from `BUILD_SPEC.md`:
- provider adapter;
- XMLTV/feed ingestion as appropriate;
- channel mapping;
- canonical programme storage;
- data-quality diagnostics;
- typed client API;
- cache/refresh strategy;
- Guide consuming real data without provider-specific knowledge.

Constraints:
- the free/development provider is **not** production-approved merely because Phase 3 works;
- the mobile client must never parse XMLTV or call provider URLs directly;
- provider IDs/fields may not leak into Guide components;
- deterministic fixtures remain the default for automated tests and offline core development;
- real-data loading/error/offline behaviour must fail safely and may not destabilise frozen Guide mechanics;
- schedule refresh must preserve Guide context where practical;
- production schedule/logo/artwork usage rights remain a separate release gate.

## Phase 3 implementation ledger
- **PR #36 — Phase 2 closure / Phase 3 activation** → `589ce9110419866439cd0e22e1c761687b48eb04`: final 23:56 iPhone evidence, Phase 2 closure, Phase 3 architecture/testing baseline. Exact PR-head CI #255 / `34785599349` was fully green for `quality` and `android-native`.
- **PR #37 — provider-independent normalisation core** → `491bc728adfb4ec70d060833d49d17bca25bbdc9`: `GuideSchedule`, server-only `EpgProvider`, explicit channel mapping, canonical timestamp/ID normalisation and record-level data-quality diagnostics with deterministic tests. Exact PR-head CI #263 / `34786166182` was fully green for `quality` and `android-native`.
- Exact-main CI #264 for PR #36 and #265 for PR #37 were still running when this state was written; do not infer completion until their actual job conclusions are green.

Detailed technical intake: `docs/PHASE_3_INTAKE_2026-09-14.md`.

## Phase 3 provider / backend gate
Repository and connected-environment intake found:
- no Teevee backend/API project or database schema exists yet;
- no `services/api` or mobile schedule-cache implementation exists yet;
- no accepted live development EPG credential/feed exists in the repository;
- the connected Supabase account exposes an unrelated `ReelWorthy` project only; it must never be reused for Teevee;
- creating a Teevee Supabase project is a real organization/cost decision and requires explicit organization/cost confirmation before provisioning;
- provider credentials/rights remain a separate concrete gate and must never be committed or bundled into the mobile app.

This gate does **not** block backend-independent contracts, repository semantics, ingestion orchestration or deterministic integration tests.

## Active Phase 3 storage/query target
The next provider-independent layer is deliberately small:
- one serialisable `GuideScheduleQuery` contract;
- a canonical `ScheduleRepository` boundary;
- explicit refreshed-window replacement scope so partial-channel updates cannot erase unrelated channel data;
- `[start,end)` interval-intersection query semantics;
- deterministic in-memory reference storage for tests only, **not** as a production persistence decision;
- correction-window replacement that removes stale rows inside the refreshed scope while preserving neighbouring/out-of-scope data;
- fail-fast behaviour for broken canonical relations.

No Supabase dependency, database migration, mobile Guide refactor or new state library belongs in this increment.

## Local preference architecture — ADR 0006
- Small app preferences use a versioned JSON contract.
- Storage failure is non-fatal and falls back to defaults.
- No global state library is added merely for preferences.
- The preference layer is separate from future server state and EPG/offline cache.
- Real schedule caching remains a Phase 3 measured decision and may use SQLite or another appropriate store.

## Data / time baseline
- Teevee-owned `Channel`, `Programme` and provider-independent `GuideSchedule` types; `GuideFixture` remains the deterministic fixture alias.
- 48 synthetic channels and deterministic runtime schedule fixture aligned to Amsterdam calendar days.
- Calendar helpers cover normal days, 23-hour / 25-hour DST transitions and year rollover.
- Shared `[start,end)` current-programme semantics.
- Guide clock refreshes immediately on app resume.
- Finite fixture rebuilds when the Amsterdam calendar day changes.
- External provider records remain server-side and may represent malformed/missing raw fields so diagnostics happen at the trust boundary instead of being hidden by adapters.

## CI / reproducibility baseline
- `package-lock.json` v3 is committed.
- CI installs with `npm ci` and uses npm cache.
- `quality` runs strict TypeScript, lint, tests and iOS / Android / web Expo exports.
- `android-native` performs a clean Expo Android prebuild and Gradle `:app:assembleDebug`.
- GitHub Actions checkout/setup-node use supported v7 action runtimes while project commands remain on Node 22.
- Workflow permissions are explicitly read-only (`contents: read`) for the build/test pipeline.
- Never run `npm audit fix --force`; dependency advisories require targeted review.

Recent proven PR heads:
- PR #36 exact-head CI #255 / `34785599349`: fully green;
- PR #37 exact-head CI #263 / `34786166182`: fully green.

## Android validation status
Physical Android interaction acceptance remains **OPEN / DEFERRED** because no Android device is available.

Automated confidence covers Android JS/native bundle export, clean Expo Android prebuild and Gradle debug APK compilation. Still physically unproven: Android Back arbitration, nested-scroll/gesture feel, realistic device frame pacing and device-specific defects.

## Current repository coordination
- PR #28 (`docs/multi-agent-workflow`) remains an isolated docs-only workflow change owned by another thread. Do not fold unrelated Phase 3 work into it.

## Deferred but tracked
- physical Android validation when a suitable device becomes available;
- release-like performance outside Expo Go;
- Nu & Straks compact following-row accessibility/density hardening;
- targeted review of moderate dependency advisories;
- production EPG/logo/artwork rights and reliability;
- pricing/trial/paywall;
- production font licensing;
- final Tonight composition.

## EXACT NEXT STEP
**Finish the provider-independent canonical schedule storage/query increment: prove bounded `[start,end)` queries, explicit channel-scoped refresh-window replacement, correction/stale-row semantics and invalid-canonical-data failure behaviour with deterministic tests. Run the complete PR CI and merge only when both required jobs are green. Then add the small provider → normalisation → repository ingestion orchestration and typed API boundary. Do not provision Supabase or select/scrape a live provider until the explicit backend/provider gate is resolved.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md` and `PROJECT_STATE.md`. Phase 2 App Shell is closed and physically accepted on iPhone. Phase 3 Real Data Vertical Slice is active. PR #37 established the provider-independent normalisation boundary. Preserve frozen Guide mechanics and the deferred Nu & Straks startup boundary. Keep the mobile domain provider-independent and fixtures deterministic. Continue with canonical storage/query and ingestion/API contracts before any hosted-backend or live-provider coupling. Physical Android acceptance remains deferred. Record substantive Phase 3 work in PROJECT_STATE and the Dutch DEVLOG.
