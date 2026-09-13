# Teevee — Canonical Project State

Last updated: 2026-09-13 17:57 CEST.
Status: ACTIVE — **Phase 2 App Shell**. Phase 1A Totaal and Phase 1B Per zender / Nu & Straks interaction models are physically accepted on the available iPhone. The accepted Guide interactions remain frozen unless concrete regression evidence exists. Physical Android interaction validation remains explicitly deferred because the owner currently has no Android device; native Android compilation remains a CI gate but is not device acceptance.
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
- `PROJECT_STATE.md` is canonical cross-session memory; important history remains in `docs/DEVLOG.md`.

Relevant ADRs: `0001` through `0005` in `docs/decisions/`.

## Phase sequence
1. **Phase 1A — Totaal:** complete and physically accepted on iPhone.
2. **Phase 1B — Guide presentations:** complete and physically accepted on iPhone for the interaction risks that motivated the phase.
3. **Phase 2 — App Shell:** active now; turn the three proven Guide presentations into one maintainable app shell.
4. **Phase 3 — Real Data Vertical Slice.**
5. **Phase 4 — Core Guide MVP hardening.**

Phase 2 does not pull production EPG integration, subscriptions, mandatory accounts or production channel-management behaviour forward.

## Phase 1B acceptance evidence
### Totaal
Totaal remains the frozen Phase 1A baseline:
- two-dimensional Guide with horizontal time and vertical channels;
- continuous timeline and real programme-duration geometry;
- `Vandaag · Morgen · Nu`;
- native inertia, bounce and directional lock;
- PR #9 partial-left title readability;
- PR #11 time-axis left mask;
- PR #13 VoiceOver and live system-theme response;
- PR #14/#15 post-horizontal-scroll performance architecture;
- Programme Detail direct-open / dismiss path.

Do not retune this implementation from App Shell work unless concrete regression evidence exists.

### Per zender
Core physical evidence came from `ScreenRecording_09-13-2026 16-16-00_1.MP4` and the residual pass `ScreenRecording_09-13-2026 17-43-36_1.MP4`.

Accepted interaction behaviour on the available iPhone:
- vertical time-axis schedule remains coherent during strong movement;
- horizontal schedule swipes change adjacent channel while preserving the viewed wall-clock anchor;
- the horizontal channel strip can be browsed and a distant channel can be selected directly;
- `Morgen`, `Vandaag` and `Nu` behave coherently;
- Programme Detail opens and returns without losing the relevant channel/day/time context, including around channel switching;
- no crash, white screen or nested-gesture collapse was observed in the acceptance recordings.

### Nu & Straks
PR #21 introduced the prototype. PR #22 restored startup after a static-import regression. PR #23 retained Nu & Straks behind deferred module loading. PR #24 fixed the serious rail momentum feedback loop found in the first interaction recording.

Accepted interaction behaviour on the available iPhone:
- deferred Nu & Straks loading opens successfully after startup;
- live mode and browse mode share one reference instant across all channel rows;
- horizontal time-rail flings settle without the earlier ping-pong / tug-of-war;
- `Nu` returns to the current reference and recentres;
- `Primetime` moves to the prototype 20:30 reference;
- vertical channel context remains stable while reference time changes;
- Programme Detail round-trip preserves the relevant reference time and vertical context;
- mixed vertical movement and time-rail interaction remains controllable;
- no crash, white screen or obvious performance collapse was observed in the accepted residual pass.

Physical recordings:
- regression evidence: `ScreenRecording_09-13-2026 17-07-22_1.MP4`;
- PR #24 rail revalidation: `ScreenRecording_09-13-2026 17-36-54_1.MP4`;
- final residual Phase 1B pass: `ScreenRecording_09-13-2026 17-43-36_1.MP4`.

The final residual pass did not separately sample dark mode or a larger system-text setting. The owner had explicitly been told those did not need a separate Phase 1B recording; they remain tracked accessibility/theme quality gates and must not be silently forgotten during Phase 2 / Phase 4 hardening.

## Nu & Straks startup rule
Do **not** restore a static `NowNextGuideView` startup import without separate evidence.

Current accepted integration boundary:
- Totaal and Per zender may be in the startup module graph;
- Nu & Straks loads via `import()` only when requested;
- load failure must leave the rest of the Guide usable and surface a diagnostic state;
- deferred loading is a risk-containment decision, not the final persistence model.

## Programme Detail
- Direct from every Guide presentation; no intermediate preview sheet.
- Native React Native Modal presentation.
- Close/backdrop, `onRequestClose`, accessibility escape and deliberate swipe-down dismissal.
- Current-phase actions: `Herinner mij` + `Bewaar`; no share action in this phase.
- Returning from detail preserves the originating Guide presentation and relevant context.

## Data / time baseline
- Teevee-owned `Channel`, `Programme` and `GuideFixture` types.
- 48 synthetic channels and deterministic runtime schedule fixture aligned to Amsterdam calendar days.
- Calendar helpers cover normal days, 23-hour / 25-hour DST transitions and year rollover.
- Shared `[start,end)` current-programme semantics.
- Guide clock refreshes immediately on app resume.
- Finite fixture rebuilds when the Amsterdam calendar day changes.
- Nu & Straks helper tests cover reference boundaries, following programmes, schedule gaps, day clamping, DST slot generation and nearest-slot positioning.

## CI / reproducibility baseline
- `package-lock.json` v3 is committed.
- CI installs with `npm ci` and uses npm cache.
- `quality` runs strict TypeScript, lint, tests and iOS / Android / web Expo exports.
- `android-native` performs a clean Expo Android prebuild and Gradle `:app:assembleDebug`.
- Never run `npm audit fix --force`; dependency advisories require targeted review.

Important evidence:
- PR #18 established reproducible installs.
- PR #19 established the Android native compile gate.
- PR #20 Per zender passed full PR and exact-main CI.
- PR #21 Nu & Straks passed JS / TS / export gates before merge.
- PR #23 deferred Nu & Straks reintegration passed quality CI and physically opened on iPhone.
- PR #24 head CI #215 / `34765048160` passed both required jobs; merge `1ce614a097ee15c20e4805424302fe711c58d339` exact-main CI #216 / `34765990513` subsequently completed successfully, including both `quality` and `android-native`.

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

## Phase 2 goal
Turn the proven Guide interaction models into one coherent maintainable app without destabilising the accepted Guide mechanics.

Phase 2 deliverables from `BUILD_SPEC.md`:
- routing / primary navigation;
- canonical shared Guide shell / chrome;
- one typed Guide presentation-state contract;
- locally remembered presentation preference;
- settings foundation and local preference persistence;
- semantic design tokens/components;
- robust loading/error boundaries;
- test harness / CI quality gates;
- accessibility baseline.

Architecture rule: keep state local by default. Do not introduce Zustand or another global store unless a demonstrated cross-feature state requirement justifies it.

## Phase 2 increment 1 — in PR #25
Branch: `feat/phase2-guide-shell`.

Implemented in the branch:
- canonical typed IDs for `Totaal`, `Per zender` and `Nu & Straks`;
- direct three-way Guide selector replacing the Phase 1B cycle button;
- stale deferred-import protection so a late Nu & Straks import cannot override a newer presentation choice;
- Expo Router bottom-tab navigation for `Gids`, `Vanavond` and `Zoeken`;
- intentionally minimal placeholder routes for Vanavond and Zoeken; their substantive feature work remains later-phase scope;
- unit tests for the Guide presentation contract.

The accepted Guide view internals have **not** been retuned in this increment.

## Deferred but tracked
- physical Android interaction validation when a suitable device becomes available;
- release-like performance outside Expo Go;
- physical dark-mode / representative larger-text sampling for Per zender and Nu & Straks;
- targeted review of moderate dependency advisories;
- production EPG/logo/artwork rights and reliability;
- pricing/trial/paywall;
- production font licensing;
- final Tonight composition.

## EXACT NEXT STEP
**Finish PR #25 through its real CI gate; if all required PR jobs are explicitly completed/success and the PR is mergeable, merge it. Then run one short iPhone shell smoke test before building persistence/settings on top of the new navigation.**

Smoke-test target after merge:
1. Teevee starts normally into Gids/Totaal.
2. The three-way selector can move directly Totaal ↔ Per zender ↔ Nu & Straks.
3. Nu & Straks still deferred-loads without startup redbox.
4. Bottom navigation moves between Gids, Vanavond and Zoeken and back.
5. Returning to Gids does not produce a crash/blank screen.
6. Programme Detail still opens/closes from the Guide after the shell change.

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md` and `PROJECT_STATE.md`. Phase 1B is closed on the available iPhone. Phase 2 App Shell is active. Preserve the physically accepted Guide interaction mechanics and the deferred Nu & Straks startup boundary. Complete PR #25 using the PR/CI protocol in AGENTS.md, then obtain the smallest necessary iPhone smoke evidence for the new shell before layering preference persistence/settings on top. Update PROJECT_STATE and the Dutch timestamped DEVLOG after each substantive increment. Never substitute CI for physical interaction acceptance.
