# Teevee — Canonical Project State

Last updated: 2026-09-13 18:42 CEST.
Status: ACTIVE — **Phase 2 App Shell**. Phase 1A Totaal and Phase 1B Per zender / Nu & Straks interaction models are physically accepted on the available iPhone. PR #25 introduced the first real app shell and is now physically smoke-accepted on iPhone, including Programme Detail from all three Guide presentations. Phase 2 is continuing with local preference persistence in PR #26. Physical Android interaction validation remains explicitly deferred because the owner currently has no Android device; native Android compilation is a CI gate but is not device acceptance.
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
- `PROJECT_STATE.md` is canonical cross-session memory; detailed historical development evidence lives in `docs/DEVLOG.md` and timestamped physical-evidence docs.

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
Physical evidence includes `ScreenRecording_09-13-2026 16-16-00_1.MP4` and final Phase 1B pass `ScreenRecording_09-13-2026 17-43-36_1.MP4`.

Accepted behaviour on the available iPhone:
- vertical position represents wall-clock time;
- horizontal schedule swipes change adjacent channel while preserving the viewed time anchor;
- top channel strip can be browsed and distant channels selected directly;
- `Morgen`, `Vandaag` and `Nu` behave coherently;
- Programme Detail round-trip preserves relevant channel/day/time context;
- no crash, white screen or nested-gesture collapse in acceptance evidence.

### Nu & Straks
Accepted behaviour on the available iPhone:
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

Current accepted integration boundary:
- Totaal and Per zender may be in the startup module graph;
- Nu & Straks loads through `import()` only when requested or when restoring a persisted Nu & Straks preference after the shell has started;
- a late dynamic import may never override a newer user selection;
- load failure must leave the rest of Guide usable and surface a diagnostic state.

## Programme Detail
- Direct from every Guide presentation; no intermediate preview sheet.
- Native React Native Modal presentation.
- Close/backdrop, `onRequestClose`, accessibility escape and deliberate swipe-down dismissal.
- Current-phase actions: `Herinner mij` + `Bewaar`; no share action in this phase.
- Returning from detail preserves the originating Guide presentation and relevant context.
- After PR #25, the owner explicitly confirmed Programme Detail opens successfully from **Totaal, Per zender and Nu & Straks** under the new shell.

## Phase 2 increment 1 — PR #25 app shell
PR #25 merged to `main` as `2a5686c6d170ac0eb3b7206d152f3e2f358da204`.

Implemented:
- one typed contract for `Totaal`, `Per zender` and `Nu & Straks`;
- direct three-way Guide selector replacing temporary Phase 1B cycle scaffolding;
- stale deferred-import protection;
- Expo Router bottom tabs for `Gids`, `Vanavond` and `Zoeken`;
- intentionally minimal Vanavond/Zoeken placeholders; their real feature work remains later-phase scope;
- unit tests for the Guide presentation contract.

CI:
- PR-head required jobs completed successfully before merge;
- exact-main CI #223 / `34768125136` subsequently completed successfully for both `quality` and `android-native`.

Physical shell evidence:
- `ScreenRecording_09-13-2026 18-27-14_1.MP4` shows clean startup, direct Guide switching, deferred Nu & Straks, bottom navigation and safe return to Gids;
- owner then confirmed Programme Detail opens from all three Guide presentations;
- full record: `docs/PHYSICAL_EVIDENCE_2026-09-13_1827.md`.

Conclusion: **PR #25 shell smoke gate is physically closed on the available iPhone.**

## Phase 2 increment 2 — PR #26 local preferences
Branch: `feat/phase2-guide-preference-persistence`.
PR: #26 — `Persist the selected Guide presentation`.

Implemented on the branch:
- versioned `AppPreferences` contract with `guidePresentation` and foundational `appearance` fields;
- defensive parsing: missing/corrupt/unsupported fields repair to safe defaults rather than blocking startup;
- native iOS/Android preference storage as a tiny JSON file in the app document directory via Expo FileSystem;
- web development/export equivalent via `localStorage`;
- storage hidden behind `services/storage` rather than leaking into Guide components;
- Totaal and Per zender restore directly at startup;
- persisted Nu & Straks restores through the existing deferred-import boundary, never through a static startup import;
- user selection writes the presentation preference without introducing global state or Zustand;
- unit tests for preference parsing/repair/serialization and storage-contract round-trip;
- ADR 0006 records that this storage is for small app preferences only, **not** the future production EPG cache.

No frozen Guide scrolling/gesture implementation is changed by this increment.

## Local preference architecture — ADR 0006
- Small app preferences use a versioned JSON contract.
- Storage failure is non-fatal and falls back to defaults.
- No global state library is added merely for preferences.
- The preference layer is intentionally separate from future server state and EPG/offline cache.
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

Automated confidence covers:
- Android JS/native bundle export;
- clean Expo Android prebuild;
- Gradle debug APK compilation;
- Programme Detail Android-request-close wiring and equivalent integration logic.

Still physically unproven:
- Android system / hardware Back arbitration;
- nested-scroll / gesture feel;
- realistic Android frame pacing and performance;
- device-specific visual/runtime defects.

## Remaining Phase 2 deliverables
- finish locally remembered Guide presentation preference through CI + physical restart validation;
- settings foundation/UI for secondary app preferences;
- wire appearance preference to light/dark/system without breaking live system behaviour;
- further canonical shared Guide shell/chrome extraction where it can be done without destabilising frozen view mechanics;
- semantic design tokens/components where duplication now has proven value;
- robust loading/error boundaries;
- accessibility shell validation, including dark mode and representative larger system text for Per zender/Nu & Straks;
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
**Finish PR #26 on its exact current head through both required CI jobs. If `quality` and `android-native` are explicitly `completed/success` and the PR remains mergeable, merge it. Then perform the smallest physical iPhone restart test: persist Per zender across a real app restart, then persist Nu & Straks across a real app restart and confirm deferred restore does not reintroduce a startup redbox.**

If that physical restart test is clean, continue autonomously with the Settings/appearance foundation; do not ask for broader Guide retesting unless concrete regression evidence appears.

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md` and `PROJECT_STATE.md`. Phase 2 App Shell is active. PR #25 shell/navigation is physically accepted on iPhone, including Programme Detail from all three Guide presentations. Preserve frozen Guide mechanics and the deferred Nu & Straks startup boundary. Complete PR #26 preference persistence via exact-head CI, merge when the required jobs are truly green, then request only the two short restart persistence observations described in EXACT NEXT STEP. Update PROJECT_STATE and the Dutch timestamped DEVLOG after substantive increments; never substitute CI for physical interaction acceptance.
