# Teevee — Canonical Project State

Last updated: 2026-09-13 22:12 CEST.
Status: ACTIVE — **Phase 2 App Shell**. Phase 1A/1B Guide interaction models are physically accepted on the available iPhone. PR #25 app shell and PR #26 local Guide-presentation persistence are physically accepted on iPhone. PR #27 Settings/appearance, PR #29 shared secondary/placeholder header chrome, PR #30 screen error recovery, PR #31 deferred Nu & Straks recovery and PR #33 shell accessibility hardening are technically merged. The combined small iPhone appearance/header/larger-text smoke remains open. Physical Android interaction validation remains explicitly deferred because the owner currently has no Android device; native Android compilation is a CI gate but is not device acceptance.
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
- exact-main CI #246 / `34779883734` is still running at this document update; `quality` is already completed/success and Android-native is in the Gradle compile step.

## Active Phase 2 increment — compact Guide controls
Branch: `fix/phase2-guide-compact-controls`.

Current scoped changes:
- Per zender `Vandaag`, `Morgen` and `Nu` controls: minimum target 36 → 44pt;
- Nu & Straks `Primetime` and `Nu` controls: minimum target 40 → 44pt;
- Nu & Straks reference/control row can wrap under larger system text instead of forcing a single horizontal row;
- existing 48pt time-rail targets and 62pt Per zender channel-strip targets are already sufficient and remain unchanged;
- 24pt interactive following-programme rows in Nu & Straks are **not silently redesigned in this slice** because increasing them materially changes information density; they remain a tracked accessibility/UX question.

No schedule geometry, programme block dimensions, momentum, nested gestures, persistence or deferred import behaviour is modified.

## Remaining Phase 2 deliverables
- finish exact CI gates and merge the active compact-control slice only when green;
- physical iPhone appearance/header smoke for PR #27/#29;
- representative larger-system-text iPhone pass for shell, Per zender and Nu & Straks, including the newly hardened controls;
- decide separately how to make compact interactive programme rows meet accessibility expectations without destroying the accepted information-density/temporal presentation;
- further shared Guide chrome extraction only if concrete duplication justifies the risk;
- keep test harness / CI quality gates green.

Deferred but tracked:
- physical Android validation when a suitable device becomes available;
- release-like performance outside Expo Go;
- targeted review of moderate dependency advisories;
- production EPG/logo/artwork rights and reliability;
- pricing/trial/paywall;
- production font licensing;
- final Tonight composition.

## EXACT NEXT STEP
**Wait for exact-main CI #246 on PR #33 to complete successfully, then open the compact-control PR from `fix/phase2-guide-compact-controls`. Require exact PR-head `quality` and `android-native` success before merge. After the accessibility-control slices are technically green, the next high-value gate is one focused iPhone session combining Settings Light/Dark/System + restart persistence, shared header/safe-area presentation and representative larger system text in Per zender/Nu & Straks.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md` and `PROJECT_STATE.md`. Phase 2 App Shell is active. Preserve frozen Guide mechanics and the deferred Nu & Straks startup boundary. PR #30/#31 error recovery, PR #32 CI hardening and PR #33 shell accessibility are merged; compact Guide-control accessibility hardening is active on `fix/phase2-guide-compact-controls`. Do not infer physical acceptance from CI. Update PROJECT_STATE and the Dutch timestamped DEVLOG after substantive increments.
