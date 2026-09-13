# Teevee — Canonical Project State

Last updated: 2026-09-13 06:58 CEST (Europe/Amsterdam)
Status: ACTIVE — implementation verified; targeted iPhone retest pending
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
The current Phase 1 prototype on `main` includes:
- Expo SDK 57 / React Native / Expo Router foundation and strict TypeScript;
- semantic light/dark theme tokens and system theme resolver;
- Teevee-owned `Channel`, `Programme` and `GuideFixture` domain types;
- 48 synthetic channels and 49 elapsed hours of deterministic programme data;
- a runtime fixture aligned to the start of the Amsterdam calendar day at app launch;
- pure `guideDayStart` calendar logic shared by the fixture and the Guide's next-day navigation;
- tests for Amsterdam midnight, winter/summer time, 23/25-hour transition days, and year rollover;
- fixture checks for programme availability after 16:00 on both guide days, determinism, preserved ids/durations/metadata and no source mutation;
- a continuous timeline spanning the fixture, rather than separate 12-hour windows per day;
- programme widths based on actual duration, half-hour ticks and compact narrow cells;
- fixed channel column, synchronised vertical movement, and native boundary bounce;
- `decelerationRate="normal"` on both horizontal and vertical interactive ScrollViews;
- live current-time marker and programme progress refreshed every 30 seconds;
- `Nu` requests animated scrolling to the current time within the same mounted timeline;
- day buttons request animated scrolling to their calendar-day start; active-day highlighting follows horizontal scroll position;
- programme selection with a simple bottom-sheet-style detail modal;
- physical-device testing via Expo Go;
- GitHub Actions CI for install, typecheck, lint, Vitest and Expo web export.

No external EPG provider has been integrated. No production channel logos or programme artwork are used. No new package or native module was added in the latest increment.

## Latest device evidence
The product owner accepted the earlier back-scroll/day-position/bounce changes on the first iPhone. A subsequent test with 48 channels confirmed that vertical scrolling still decelerated too quickly: a strong swipe travelled approximately one screen, compared with approximately two screens in the owner's TVgids.nl comparison. These are subjective observations, not instrumented velocity/frame measurements.

The same test exposed an artificial end around 16:00 on both days and a reload-like return from the next day to `Nu`. The continuous timeline was introduced in response. The intermediate vertical value `0.995` was not established as superior to platform defaults; after discussion the owner authorised proceeding with the platform-standard baseline instead.

Do not mark these latest fixes as device-accepted until a new retest is reported. Device model, iOS version and Expo Go version are still unknown. See `docs/DEVICE_TEST_REPORT.md`.

## Verification status
- Previous CI run **#48 failed**: the runtime-fixture test still asserted the old now-minus-19-hours start while the implementation had moved to midnight.
- Code commit **`b13a7c5263cd663ed1d7ea35e3cfb46d70a8988a`** is verified by **CI run #49**, job `103675561490`: dependency installation, TypeScript, lint, tests and Expo web export all succeeded.
- The calendar helper was additionally executed in the agent container against explicit expected timestamps under UTC, Europe/Amsterdam, America/Los_Angeles and Asia/Tokyo process timezones. This is domain verification, not an iPhone gesture test.
- The full mobile runtime was not run in the agent container. CI web export is not a native build, device-performance benchmark or visual acceptance test.
- This documentation snapshot follows the verified code commit. A later documentation-only CI run is separate evidence, not presumed to have passed.

## Scroll baseline
Use platform defaults first. Keep both interactive axes at `normal` and retain the existing bounce/directional lock for the next test. Do not tune to a target of exactly two screens or multiply finger movement. Deviations require a specific problem demonstrated on a known device. The earlier assumption that vertical navigation inherently needs faster braking is not a product requirement.

## Phase 1 objective and exit gate
Validate the defining UX/technical risk: a high-performance touch-native two-dimensional TV Guide using realistic deterministic fixtures. Do not leave Phase 1 until movement preserves context, Now is predictable, current/progress state is understandable, cells remain useful at practical density, light/dark both work, selection works, domain/layout logic is tested and representative iOS/Android interaction is validated.

## Remaining checks and known risks
- Retest standard vertical inertia, continuous browsing past 16:00, and animated return to `Nu` across midnight on the iPhone.
- Recheck label synchronisation during the longer fling and top/bottom bounce; no new synchronisation result has been reported.
- Test `Nu`, progress, narrow cells, programme detail, text scaling and light/dark on device; record model/OS and findings.
- Android validation and native release-like performance measurement remain outstanding.
- The 49-hour fixture is finite and anchored at launch, not an infinite guide. Long-running sessions, resume after midnight and behaviour after the fixture expires need a later lifecycle pass. The final partial day also needs explicit date-label treatment before Phase 1 exit.
- Standard ScrollViews currently render the fixture without specialised virtualisation. The full 48-channel/multi-day rendering load still needs device measurement; prior small-fixture acceptance is not proof of production performance.
- CI still generates its lockfile before `npm ci`; dependency reproducibility needs cleanup. Run #48 reported 15 moderate dependency advisories, not yet triaged. Do not use a forced dependency upgrade as an automatic fix.
- Production schedule/metadata/logo/artwork rights, supplier reliability, exact subscription price/trial/paywall and final visual design remain later gates.

## EXACT NEXT STEP
**Retest code commit `b13a7c5` or a descendant with the same code on the same iPhone: compare several vertical flings away from the list edges, browse beyond 16:00 on both days and across midnight, then press `Nu` from the next day and observe the animated return without a screen replacement. Record actual observations in `docs/DEVICE_TEST_REPORT.md`; only change inertia again if this standard baseline has a concrete device problem.**

The owner's Mac is at `~/projects/teevee`. GitHub changes do not update that checkout automatically. Stop Metro with Control+C, use `git pull --ff-only`, then `npm run start:clean` and reopen via Expo Go. Dependencies did not change in this increment. Do not require `npm ci` merely to receive these source changes.

Do not introduce real EPG, subscriptions, accounts, Tonight, enrichment or specialised virtualisation as part of this retest.

## Resume instruction
> Read `AGENTS.md` and `docs/PROJECT_STATE.md` from `zuiderwijk/teevee`. Execute the EXACT NEXT STEP autonomously where possible, follow the Definition of Done, and update PROJECT_STATE and the Dutch timestamped DEVLOG with evidence. Ask only when a choice crosses the approval boundaries or when physical-device input is genuinely required. Never substitute CI success for device acceptance.
