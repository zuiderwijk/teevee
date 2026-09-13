# Teevee — Canonical Project State

Last updated: 2026-09-13 19:57 CEST.
Status: ACTIVE — **Phase 2 App Shell**. Phase 1A/1B Guide interaction models are physically accepted on the available iPhone. PR #25 app shell and PR #26 local Guide-presentation persistence are both physically accepted on iPhone. Physical Android interaction validation remains explicitly deferred because the owner currently has no Android device; native Android compilation is a CI gate but is not device acceptance.
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
- load failure must leave the rest of Guide usable and surface a diagnostic state.

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
- Never run `npm audit fix --force`; dependency advisories require targeted review.

## Android validation status
Physical Android interaction acceptance remains **OPEN / DEFERRED** because no Android device is available.

Automated confidence covers Android JS/native bundle export, clean Expo Android prebuild and Gradle debug APK compilation. Still physically unproven: Android Back arbitration, nested-scroll/gesture feel, realistic device frame pacing and device-specific defects.

## Phase 2 increment 3 — Settings / appearance
Branch: `feat/phase2-settings-appearance`. PR: #27.

Intake found CI #229 failed at TypeScript because React Native can report `unspecified`; `android-native` succeeded. Repair uses the installed native colour-scheme type, tests unspecified fallback and live provider integration, puts Settings controls into normal header flow, and enables tab history for return to the originating surface. The Settings screen uses cross-platform safe-area context and wraps its header for larger text. CI must be revalidated on the repaired head before merge.

Local verification: strict TypeScript, warning-free lint and 125 tests across 20 suites pass; all-platform exports pass. Browser visual verification is unavailable because the browser blocks the local server. No new native/device acceptance is claimed.

Intake and implementation gaps: `docs/INTAKE_2026-09-13.md`.

Implemented scope pending final CI and iPhone smoke:
- make Settings a secondary route without adding a fourth primary tab;
- expose a secondary Settings entry point in normal header flow rather than overlaying existing header labels;
- let the user select `Systeem`, `Licht` or `Donker`;
- persist appearance through the existing AppPreferences storage;
- make the chosen appearance apply live across the app shell and Guide views;
- retain system-following behaviour when `Systeem` is selected;
- add pure unit coverage for appearance resolution;
- do not retune Guide interaction mechanics.

## Remaining Phase 2 deliverables after increment 3
- further canonical shared Guide shell/chrome extraction where it can be done without destabilising frozen view mechanics;
- semantic design tokens/components where duplication now has proven value;
- robust loading/error boundaries;
- accessibility shell validation, including representative larger system text for Per zender/Nu & Straks;
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
**Finish the Settings/appearance increment on `feat/phase2-settings-appearance`, run the exact PR-head CI gates and merge only when `quality` and `android-native` are explicitly completed/success. Then perform the smallest iPhone appearance smoke pass: Settings opens as secondary navigation, `Donker` and `Licht` apply live, `Systeem` follows the device again, the chosen explicit appearance survives app restart, and Guide/Programme Detail remain usable.**

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md` and `PROJECT_STATE.md`. Phase 2 App Shell is active. PR #25 shell/navigation and PR #26 Guide-presentation persistence are physically accepted on iPhone. Preserve frozen Guide mechanics and the deferred Nu & Straks startup boundary. Current work is Settings/appearance on `feat/phase2-settings-appearance`: secondary settings navigation, persisted System/Light/Dark preference and live theme application. Update PROJECT_STATE and the Dutch timestamped DEVLOG after substantive increments; never substitute CI for physical interaction acceptance.
