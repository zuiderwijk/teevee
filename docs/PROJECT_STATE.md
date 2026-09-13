# Teevee — Canonical Project State

Last updated: 2026-09-13, programme-detail response increment. Code revision `85e3d408` recorded at 07:18:07 CEST (Europe/Amsterdam); exact documentation commit time is in GitHub.
Status: ACTIVE — scroll baseline accepted; detail render isolation CI-verified, iPhone response retest pending
Current phase: **Phase 1 — Guide Interaction Prototype**
Previous phase: **Phase 0 — Project Foundation: COMPLETE**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository.

## Product
Teevee is a new premium, paid and ad-free television-guide app for iOS and Android, developed under supervision of Bindinc/TVgids.nl. The Guide is the product: fast, calm, reliable and polished. Netherlands first; no mandatory account for core Guide use.

## Frozen decisions
- iOS + Android via React Native/Expo and strict TypeScript.
- Paid, ad-free, Guide-first.
- Light, dark and system appearance.
- No mandatory account for core Guide use.
- Provider-independent Teevee EPG domain model.
- Mobile client never consumes/parses external EPG directly.
- Deterministic fixtures are mandatory.
- Free external EPG data is development-only until rights/reliability are approved.
- Core Guide cannot depend on artwork/enrichment.
- `docs/PROJECT_STATE.md` is canonical cross-session agent memory.
- Complexity requires evidence.

Relevant ADRs: `0001` through `0004` in `docs/decisions/`.

## Working hypotheses
Primary navigation later: Guide / Tonight / Search. RevenueCat preferred for subscriptions. Supabase/PostgreSQL is the initial real-data backend preference. Sentry is preferred for observability. These are not required for Phase 1.

## Visual state
Existing light/dark concepts are **Visual Direction 01 — reference, not specification**. Preserve calm premium utility, hierarchy, restrained chrome and functional density. Light is the primary exploration direction; both themes are required.

## Implementation reality
- Expo SDK 57 / React Native / Expo Router foundation and strict TypeScript.
- Semantic light/dark tokens and system theme resolver.
- Teevee-owned `Channel`, `Programme` and `GuideFixture` types.
- 48 synthetic channels and 49 elapsed hours of deterministic data, aligned at runtime to Amsterdam midnight at app launch.
- Shared `guideDayStart` calendar logic with tests for timezones, winter/summer time, 23/25-hour transition days and year rollover.
- Fixture checks for availability after 16:00 on both days, determinism, preserved ids/durations/metadata and no source mutation.
- One continuous timeline, duration-based programme widths, half-hour ticks and compact narrow cells.
- Fixed channel column, synchronised vertical movement, native bounce/directional lock and `normal` deceleration on both interactive axes.
- Live current-time/progress updates every 30 seconds. `Nu` and day buttons animate within the same timeline; active day follows scroll position.
- Programme detail is now a separate `ProgrammeDetail` component, alongside a memoized `GuideView`. The small route component owns selection and supplies stable callbacks.
- Detail open/close no longer invalidates the Guide solely because selection changes. Guide clock/day/theme state remains local and can still update the Guide.
- Closing hides the native Modal but retains its selected content during dismissal. Backdrop and sheet are siblings; taps on detail text do not dismiss it.
- Programme cells and close button have pressed-opacity feedback. Activation remains `onPress`, not `onPressIn`, to avoid opening on the start of a scroll.
- The native detail `animationType="slide"` remains unchanged intentionally. No invented animation duration, artificial timeout or gesture-speed multiplier.
- CI: install, TypeScript, lint, domain tests, React/jsdom state/render regression tests and Expo web export.

No external EPG provider, production logos or artwork are integrated. This increment adds only test-time `jsdom` 29.1.1 and React DOM type declarations (`~19.2.0`); no mobile runtime/native dependency or specialised scroll library.

## Latest device evidence
The owner previously answered **"perfect"** after testing standard inertia, the continuous timeline past 16:00/across midnight and animated `Nu`. This is qualitative acceptance of that targeted iPhone scroll baseline, not of every feature or production performance.

The subsequent detail test reports:
- opening works;
- both the delay after tapping a programme and the delay after pressing Sluiten feel slow, subjectively and not measured;
- **Guide position remains preserved**.

Functional opening/closing and position retention are confirmed on the pre-fix version. Response time is not accepted. No new device feedback exists yet for the render-isolation change. Local SHA, device model, iOS version and Expo Go version remain unreported. Do not fabricate timings or per-device scores.

## Verification status
- Historical code `b13a7c5` passed CI #49; docs descendant `0e9be91` passed #50. Scroll-acceptance docs commit `4bab4c7` passed #51.
- The new change is developed in **PR #1**, branch `fix/detail-render-isolation`, before integration into `main`.
- First PR CI **#52 failed during dependency resolution**: the caret React DOM types range resolved to 19.3, conflicting with the Expo-compatible React 19.2 types. Fixed by restricting the new type package to `~19.2.0`; no force/legacy-peer-deps workaround and no runtime upgrade.
- **CI #53**, run `34739960655`, job `103677884599`, passed for branch head **`85e3d408cfbbe73c0f7402baadaae22089650f92`**: installation, strict TypeScript, lint, tests and Expo web export.
- Four reducer cases cover open, close-with-content-retention, repeated close and selecting another programme. Five React/jsdom cases cover repeated open/close, no extra Guide renders, same mounted scroll hosts/offsets, correct subsequent content and absent/blank descriptions.
- The React integration tests use actual route/Guide/detail components and the 48-channel fixture, with mocked native hosts and clock. They are NOT native layout, gesture, animation, accessibility or response-time benchmarks.
- Local repository download in the agent container was unavailable (network/DNS). Full checks ran in GitHub Actions, not locally or on a physical device.
- This documentation revision and any resulting merge have their own CI outcome; verify them before claiming the latest main is green.

## Diagnosis and boundaries
The previous route stored selection beside the entire Guide rendering loop. Changing selection therefore also traversed the large programme tree. This is a concrete unnecessary render path and a plausible contributor to latency, not an instrumented proof of the entire perceived delay. The memo boundary removes that path; tests guard it. Native presentation and development-mode overhead may still contribute and must be distinguished if the same-device retest remains slow.

Keep native slide unchanged for this comparison. Do not claim an exact latency gain or shorten/disable the animation merely to hide unmeasured render work.

## Accepted scroll baseline
Keep platform-standard `normal` on both axes, current bounce/directional lock, timeline geometry, day navigation and `Nu`. Do not target exactly two screens per swipe or multiply finger movement. This is the accepted working iPhone baseline, not proof of production volume or Android behaviour.

## Phase 1 objective and exit gate
Validate a high-performance touch-native two-dimensional Guide with realistic fixtures. Do not leave Phase 1 until movement preserves context, Now is predictable, progress understandable, cells usable, light/dark and selection work, domain/layout logic is tested and representative iOS/Android interaction is validated.

## Remaining checks and risks
- Same-device detail responsiveness retest after this fix, including position retention and repeated open/close. Native slide has not been timed.
- Missing metadata, short cells, larger system text, light/dark, screen-reader behaviour and progress correctness still need explicit device checks. Detail height/large-text reachability remains open; this increment does not claim to solve that.
- Label synchronisation during longer flings/bounce needs measurement; do not demand another identical scroll-feel acceptance test without a regression.
- Android and native release-like performance remain open. Full 48-channel/multi-day load still needs instrumented measurement.
- Fixture is finite and anchored at launch. Resume after midnight, expiry and final partial-day labels need a lifecycle pass.
- Guide clock updates still trigger Guide work independently of modal selection; profile and address if device evidence warrants it.
- CI still generates a lockfile before `npm ci`. Dependency reproducibility and the 15 moderate advisories reported in earlier CI remain untriaged; do not force-upgrade dependencies.
- Production data/metadata/logo/artwork rights, supplier reliability, subscription price/trial/paywall and final design remain later gates.

## EXACT NEXT STEP
**After verifying integration CI, retest programme-detail responsiveness on the same iPhone with the updated checkout: open/close several different programmes, compare delay before movement versus the slide itself, and confirm the Guide retains its time/channel position. Record only actual observations in `docs/DEVICE_TEST_REPORT.md`. If latency persists, profile the JS commit and native presentation separately before tuning animation; otherwise proceed to the remaining readability/accessibility checks. Keep the accepted scroll baseline unchanged.**

The owner's Mac checkout is `~/projects/teevee`. GitHub changes do not update it automatically. Stop Metro with Control+C, `git pull --ff-only`, `npm install` to include the added test tooling, then `npm run start:clean` and reopen through Expo Go. No Expo Go reinstall/native rebuild is required by this source-only runtime change. Do not suggest `npm audit fix --force`.

Do not introduce real EPG, subscriptions, accounts, Tonight, enrichment or specialised virtualisation here. Phase 1 remains open.

## Resume instruction
> Read `AGENTS.md` and `docs/PROJECT_STATE.md`. Execute EXACT NEXT STEP where possible, respect the Definition of Done, and update PROJECT_STATE and Dutch timestamped DEVLOG with evidence. Ask only for genuine product choices or physical-device input. Never substitute CI success for device acceptance.
