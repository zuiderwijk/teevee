# Teevee — Canonical Project State

Last updated: 2026-09-13 22:41 CEST.
Status: ACTIVE — **Phase 2 App Shell**. Phase 1A/1B Guide interaction models are physically accepted on the available iPhone. PR #25 app shell and PR #26 local Guide-presentation persistence are physically accepted on iPhone. PR #27 Settings/appearance, PR #29 shared secondary/placeholder header chrome, PR #30 screen error recovery, PR #31 deferred Nu & Straks recovery, PR #33 shell accessibility hardening and PR #34 compact Guide-control hardening are technically merged. The focused iPhone appearance/header/larger-text acceptance pass remains open. Physical Android interaction validation remains explicitly deferred because the owner currently has no Android device; native Android compilation is a CI gate but is not device acceptance.
Current phase: **Phase 2 — App Shell**
Previous phase: **Phase 1B — Guide Presentation Prototypes: physically accepted on iPhone**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository.

## Product
Teevee is a premium, paid, ad-free television-guide app for iOS and Android under Bindinc/TVgids.nl supervision. The Guide is the product: fast, calm, reliable and polished. Netherlands first; no mandatory account for core Guide use.

## Frozen product / technical decisions
- React Native / Expo SDK 57 and strict TypeScript for iOS and Android.
- Paid, ad-free and Guide-first; no mandatory account for core Guide use.
- Light, dark and system appearance.
- Provider-independent Teevee EPG model; mobile never consumes or parses an external EPG provider directly.
- Deterministic fixtures keep core development and tests independent of external services.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility and system text scaling are product-quality requirements.
- `PROJECT_STATE.md` is canonical cross-session memory; detailed history lives in `docs/DEVLOG.md` and timestamped evidence docs.

Relevant ADRs: `0001` through `0006` in `docs/decisions/`.

## Phase sequence
1. **Phase 1A — Totaal:** complete and physically accepted on iPhone.
2. **Phase 1B — Guide presentations:** complete and physically accepted on iPhone for the interaction risks that motivated the phase.
3. **Phase 2 — App Shell:** active; turn the three proven Guide presentations into one maintainable app shell with local preferences/settings foundations.
4. **Phase 3 — Real Data Vertical Slice.**
5. **Phase 4 — Core Guide MVP hardening.**

Phase 2 does not pull production EPG integration, subscriptions, mandatory accounts or production channel-management behaviour forward.

## Frozen Guide interaction baseline
Do not retune accepted Guide mechanics during App Shell work without concrete regression evidence.

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
Accepted on the available iPhone:
- vertical position represents wall-clock time;
- horizontal schedule swipes change adjacent channel while preserving the viewed time anchor;
- top channel strip can be browsed and distant channels selected directly;
- `Morgen`, `Vandaag` and `Nu` behave coherently;
- Programme Detail round-trip preserves relevant channel/day/time context;
- no crash, white screen or nested-gesture collapse in acceptance evidence.

Physical evidence includes `ScreenRecording_09-13-2026 16-16-00_1.MP4` and `ScreenRecording_09-13-2026 17-43-36_1.MP4`.

### Nu & Straks
Accepted on the available iPhone:
- one reference instant applies across all channel rows;
- live and browse modes are coherent;
- horizontal rail flings settle without the former ping-pong/tug-of-war;
- `Nu` returns to current reference;
- `Primetime` uses 20:30 as a prototype value, not yet a frozen commercial/product decision;
- vertical channel context remains stable while reference time changes;
- Programme Detail round-trip preserves relevant reference/vertical context;
- mixed vertical/time-rail gestures remain controllable.

Key evidence:
- regression: `ScreenRecording_09-13-2026 17-07-22_1.MP4`;
- rail revalidation after PR #24: `ScreenRecording_09-13-2026 17-36-54_1.MP4`;
- final Phase 1B pass: `ScreenRecording_09-13-2026 17-43-36_1.MP4`.

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
- Accepted target actions: `Herinner mij` + `Bewaar`; no share action. These actions and the contextual sticky action bar are **not implemented yet**; the current prototype exposes only `Sluiten`. Delivery remains in Phase 4/6.
- Returning from detail preserves the originating Guide presentation and relevant context.
- Under the Phase 2 shell, owner explicitly confirmed Programme Detail opens successfully from **Totaal, Per zender and Nu & Straks**.

## Phase 2 increment 1 — PR #25 app shell
PR #25 merged to `main` as `2a5686c6d170ac0eb3b7206d152f3e2f358da204`.

Implemented:
- one typed contract for `Totaal`, `Per zender` and `Nu & Straks`;
- direct three-way Guide selector;
- stale deferred-import protection;
- Expo Router bottom tabs for `Gids`, `Vanavond` and `Zoeken`;
- intentionally minimal Vanavond/Zoeken placeholders;
- unit tests for the Guide presentation contract.

CI: PR-head green; exact-main CI #223 / `34768125136` green for `quality` and `android-native`.

Physical evidence: `ScreenRecording_09-13-2026 18-27-14_1.MP4` plus owner confirmation that Programme Detail works in all three Guide presentations. See `docs/PHYSICAL_EVIDENCE_2026-09-13_1827.md`.

Conclusion: **PR #25 shell smoke gate is physically closed on the available iPhone.**

## Phase 2 increment 2 — PR #26 local preferences
PR #26 merged to `main` as `03b31f1ed4dfa3508ea9e1aeacb85cc19520aa9c`.

Implemented:
- versioned `AppPreferences` contract with `guidePresentation` and foundational `appearance` fields;
- defensive parsing and safe default repair;
- native iOS/Android JSON preference file via Expo FileSystem;
- web equivalent via `localStorage`;
- storage hidden behind `services/storage`;
- Totaal and Per zender restore directly at startup;
- persisted Nu & Straks restores after first frame through the accepted deferred-import boundary;
- no global state library or Guide gesture retuning;
- tests for parsing, repair, serialisation and storage round-trip;
- ADR 0006 defines this as small-preference storage, not the future EPG cache.

CI:
- PR-head CI #227 / `34769387789`: `quality` and `android-native` completed/success;
- exact-main CI #228 / `34770761263`: `quality` and `android-native` completed/success, including native Android debug APK compile.

Physical restart evidence on iPhone, owner-confirmed 2026-09-13:
- select Per zender → close/restart app → Per zender is restored;
- select Nu & Straks → close/restart app → Nu & Straks is restored;
- restored Nu & Straks does not trigger the former startup redbox.

Full record: `docs/PHYSICAL_EVIDENCE_2026-09-13_1919.md`.

Conclusion: **Guide-presentation persistence is physically accepted on the available iPhone.**

## Local preference architecture — ADR 0006
- Small app preferences use a versioned JSON contract.
- Storage failure is non-fatal and falls back to defaults.
- No global state library is added merely for preferences.
- The preference layer is separate from future server state and EPG/offline cache.
- Real schedule caching remains a Phase 3/4 measured decision and may use SQLite or another appropriate store.

## Data / time baseline
- Teevee-owned `Channel`, `Programme` and `GuideFixture` types.
- 48 synthetic channels and deterministic runtime schedule fixture aligned to Amsterdam calendar days.
- Calendar helpers cover normal days, 23-hour / 25-hour DST transitions and year rollover.
- Shared `[start,end)` current-programme semantics.
- Guide clock refreshes immediately on app resume.
- Finite fixture rebuilds when the Amsterdam calendar day changes.

## CI / reproducibility baseline
- `package-lock.json` v3 is committed.
- CI installs with `npm ci` and uses npm cache.
- `quality` runs strict TypeScript, lint, tests and iOS / Android / web Expo exports.
- `android-native` performs a clean Expo Android prebuild and Gradle `:app:assembleDebug`.
- GitHub Actions checkout/setup-node use the supported v7 action runtimes while Teevee project commands remain on Node 22.
- Workflow permissions are explicitly read-only (`contents: read`) for the build/test pipeline.
- Never run `npm audit fix --force`; dependency advisories require targeted review.

## Android validation status
Physical Android interaction acceptance remains **OPEN / DEFERRED** because no Android device is available.

Automated confidence covers Android JS/native bundle export, clean Expo Android prebuild and Gradle debug APK compilation. Still physically unproven: Android Back arbitration, nested-scroll/gesture feel, realistic device frame pacing and device-specific defects.

## Phase 2 increment 3 — PR #27 Settings / appearance
PR #27 merged to `main` as `61785994632ce397afbebf1f7c82f677719c1d23`.

Implemented:
- Settings is a secondary route, not a fourth primary tab;
- `Systeem`, `Licht` and `Donker` persist through the existing versioned AppPreferences storage;
- appearance applies live across app shell and Guide views;
- `Systeem` follows the native colour scheme, including safe fallback for React Native `unspecified`;
- tab history returns Settings to the originating primary surface;
- Settings uses cross-platform safe-area context and a wrapping header for larger text;
- appearance resolution and provider integration are covered by tests;
- no global state library and no Guide gesture retuning.

Verification:
- repaired branch passed strict TypeScript, warning-free lint, tests and all-platform exports;
- exact-main CI #232 / `34774120843` on `61785994632ce397afbebf1f7c82f677719c1d23`: `quality` and `android-native` completed/success, including native Android debug APK compile.

Physical status: **OPEN**. The smallest iPhone appearance smoke still needs to confirm secondary Settings navigation, live Light/Dark/System behaviour, explicit appearance persistence after restart and continued Guide/Programme Detail usability.

Intake record: `docs/INTAKE_2026-09-13.md`.

## Phase 2 increment 4 — PR #29 shared app-shell header
PR #29 merged to `main` as `68f60bae8ac5888054bf92973ef92041694a19f8`.

Implemented:
- shared `AppScreenHeader` for Instellingen, Vanavond and Zoeken;
- one semantic screen title plus optional action slot;
- wrapping layout for larger text instead of overlay positioning;
- Vanavond and Zoeken migrated from React Native's legacy SafeAreaView to `react-native-safe-area-context`;
- Settings close/navigation and appearance semantics unchanged;
- focused component coverage for semantic title and optional action;
- no changes to Totaal, Per zender or Nu & Straks scroll/gesture/startup mechanics;
- no dependencies or native configuration changed.

Verification:
- exact PR-head `752b6efc66915025aeeec6705d9abcdd3e6e6bbf`;
- PR CI #233 / `34774978748`: `quality` and `android-native` completed/success;
- quality includes strict TypeScript, lint, tests and iOS/Android/web Expo exports;
- Android gate includes clean prebuild and Gradle debug-APK compile.

Physical status: combine this with the still-open PR #27 iPhone appearance smoke. No physical acceptance is inferred from CI.

## Phase 2 increment 5 — PR #30 route/screen error recovery
PR #30 merged to `main` as `9e2fe2035626c28ccb36f228cc907848034d5581`.

Implemented:
- Expo Router navigator-level screen error boundary using the framework-provided retry contract;
- themed, generic user-facing fallback without leaking internal exception text;
- accessible `Opnieuw proberen` action;
- tab navigation stays mounted so the user can leave a failed screen;
- no extra dependency and no Guide-mechanics changes.

Verification: exact PR-head CI #238 / `34775847949` completed/success for `quality` and `android-native`.

## Phase 2 increment 6 — PR #31 deferred Nu & Straks recovery
PR #31 merged to `main` as `93f06c154087a14971f0ab1fcedfafeb82f40bdf`.

Implemented:
- deferred Nu & Straks load failure no longer exposes raw technical exception text;
- generic recovery copy plus accessible retry;
- Totaal, Per zender and the presentation selector remain usable during a Nu & Straks import failure;
- proven deferred import/stale-selection boundary remains intact;
- no Nu & Straks rail/scroll/gesture changes.

Exact-main CI #242 / `34777604615` completed/success for `quality` and `android-native`.

## CI hardening — PR #32
PR #32 merged to `main` as `3650f15fd70d37088940d292ae3422aca7b450a9`.

- checkout/setup-node moved to supported v7 action majors;
- project runtime remains Node 22;
- CI token permissions explicitly restricted to `contents: read`;
- no app/runtime dependencies changed.

PR CI and exact-main CI #244 / `34778491517` completed/success, including Android debug APK compile.

## Phase 2 increment 7 — PR #33 shell accessibility recovery
PR #33 merged to `main` as `4516ce280ff2e274fb4f7df42570cc7ff5d2801e`.

Implemented:
- route error fallback is scrollable while retaining its centred normal-size presentation, so retry remains reachable under very large system text;
- global Guide presentation selector now has a 44pt minimum target;
- no changes to programme geometry, Guide gestures or deferred Nu & Straks loading.

Verification:
- parent exact-main CI #244 green;
- exact PR-head CI #245 / `34778627437` green for both `quality` and `android-native`;
- exact-main CI #246 / `34779883734` completed/success for both jobs, including Android debug APK compile.

## Phase 2 increment 8 — PR #34 compact Guide controls
PR #34 merged to `main` as `62a50754ce71fc19606770a002152ee2e62c8b7f`.

Implemented:
- Per zender `Vandaag`, `Morgen` and `Nu` controls: minimum target 36 → 44pt;
- Nu & Straks `Primetime` and `Nu` controls: minimum target 40 → 44pt;
- Nu & Straks reference/control row can wrap under larger system text instead of forcing a single horizontal row;
- existing 48pt time-rail targets and 62pt Per zender channel-strip targets remain unchanged;
- no schedule geometry, programme block dimensions, momentum, nested gestures, persistence or deferred-import behaviour changed.

Accessibility boundary deliberately left open:
- the 24pt interactive following-programme rows in Nu & Straks are **not** papered over with overlapping `hitSlop` or silently enlarged, because either approach can alter tap arbitration or the accepted information density;
- their final accessible layout remains a separate UX/accessibility decision informed by physical larger-text evidence.

Verification:
- exact PR-head `315d49a36b904221255f6ea8ef8c0da312766ec2`;
- PR CI #247 / `34780762055` completed/success for `quality` and `android-native`, including clean prebuild and Gradle debug-APK compile;
- exact-main CI #248 / `34781494594` started on merge commit `62a50754ce71fc19606770a002152ee2e62c8b7f`; at this document update typecheck/lint/tests were green, while exports and Android compile were still running. No completion is claimed here.

## Remaining Phase 2 deliverables
- one focused physical iPhone pass combining Settings appearance/persistence, shared header/safe-area presentation and representative larger system text in Per zender/Nu & Straks;
- use that pass to observe the compact following-programme rows before making a separate accessibility/UX decision about their final layout;
- further shared Guide chrome extraction only if concrete duplication justifies the regression risk;
- keep test harness / CI quality gates green;
- close Phase 2 only after the physical iPhone acceptance gate is recorded or a concrete defect is fixed and revalidated.

Deferred but tracked:
- physical Android validation when a suitable device becomes available;
- release-like performance outside Expo Go;
- targeted review of moderate dependency advisories;
- production EPG/logo/artwork rights and reliability;
- pricing/trial/paywall;
- production font licensing;
- final Tonight composition.

## EXACT NEXT STEP
**Run one focused iPhone acceptance session on current `main`: Settings as secondary navigation; Light/Dark/System live behaviour; explicit appearance persistence after restart; shared headers/safe areas; representative larger system text in Per zender and Nu & Straks; all three Guide presentations and Programme Detail still usable. Record the larger-text setting and any concrete regression. Do not retune frozen Guide mechanics or redesign the compact Nu & Straks following-programme rows without device evidence.**

The reproducible checklist is in `docs/TESTING.md`.

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md` and `PROJECT_STATE.md`. Phase 2 App Shell is active and technically implemented through PR #34. Preserve frozen Guide mechanics and the deferred Nu & Straks startup boundary. The next gate is a focused physical iPhone appearance/header/larger-text acceptance pass defined in `docs/TESTING.md`; CI is not device acceptance. Only change code in response to concrete findings or a separately justified architectural need. Update PROJECT_STATE, TESTING/architecture where relevant, and the Dutch timestamped DEVLOG after substantive increments.
