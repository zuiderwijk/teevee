# Teevee — Canonical Project State

Last updated: 2026-09-13 07:04 CEST (Europe/Amsterdam; acceptance-recording session)
Status: ACTIVE — targeted iPhone scroll retest accepted; remaining Phase 1 checks open
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

No external EPG provider has been integrated. No production channel logos or programme artwork are used. No new package or native module was added in the latest code increment. The latest acceptance-recording change edits documentation only.

## Latest device evidence
On 13 September 2026 the product owner replied **"perfect"** to the requested iPhone retest of standard vertical inertia, continuous browsing beyond 16:00/across midnight, and the animated return from the next day using `Nu`.

Record this as **qualitative acceptance of that targeted change set**, not as an instrumented result or approval of the entire app. The earlier scroll blockers can close for this iPhone baseline. No exact new swipe distance, velocity, frame rate, animation duration or per-check measurement was supplied. The actual local commit SHA, device model, iOS version and Expo Go version remain unreported. The retest was requested against code `b13a7c5` or its documentation-only descendant `0e9be91`.

Prior evidence remains relevant history: the 48-channel test with faster braking travelled roughly one screen, compared with roughly two in the owner's TVgids.nl comparison. The owner also reported the artificial 16:00 end and a reload-like return to `Nu`. These led to the now-accepted standard-inertia/continuous-timeline changes. See `docs/DEVICE_TEST_REPORT.md` for scope and outstanding checks.

## Verification status
- Previous CI run **#48 failed**: the runtime-fixture test still asserted the old now-minus-19-hours start while the implementation had moved to midnight.
- Code commit **`b13a7c5263cd663ed1d7ea35e3cfb46d70a8988a`** is verified by **CI run #49**, job `103675561490`: dependency installation, TypeScript, lint, tests and Expo web export all succeeded.
- Documentation-only descendant **`0e9be9103ec2ff96ec63e702476b56dfd8669603`** passed **CI run #50**, as verified in the preceding development session.
- The calendar helper was additionally executed in the agent container against explicit expected timestamps under UTC, Europe/Amsterdam, America/Los_Angeles and Asia/Tokyo process timezones. This is domain verification, not an iPhone gesture test.
- Targeted iPhone scroll retest: now qualitatively accepted by the owner. This does not validate unrelated flows, Android or release performance.
- The full mobile runtime was not run in the agent container. CI web export is not a native build, device-performance benchmark or visual acceptance test.
- This acceptance record changes documentation only; any new documentation CI run has its own result and is not presumed successful.

## Accepted scroll baseline
Keep platform-standard `normal` on both interactive axes and retain the current native bounce/directional lock and continuous timeline. Do not tune to exactly two screens, multiply finger movement, or reopen the accepted scroll-feel check without a concrete new problem. The earlier assumption that vertical navigation inherently needs faster braking is not a product requirement.

This is the working iPhone interaction baseline, not a claim that the current renderer is proven at production volume or on Android.

## Phase 1 objective and exit gate
Validate the defining UX/technical risk: a high-performance touch-native two-dimensional TV Guide using realistic deterministic fixtures. Do not leave Phase 1 until movement preserves context, Now is predictable, current/progress state is understandable, cells remain useful at practical density, light/dark both work, selection works, domain/layout logic is tested and representative iOS/Android interaction is validated.

## Remaining checks and known risks
- Validate programme detail opening/closing, missing descriptions, narrow cells, larger system text and light/dark on device; record model/OS and findings.
- Programme progress correctness and accessibility still need explicit checks. The word "perfect" is not evidence for these separate flows.
- No separately reported measurement of label synchronisation during longer flings/bounce; include it in later performance checks, without requiring another identical scroll-feel retest now.
- Android validation and native release-like performance measurement remain outstanding.
- The 49-hour fixture is finite and anchored at launch, not an infinite guide. Long-running sessions, resume after midnight and behaviour after the fixture expires need a lifecycle pass. The final partial day also needs explicit date-label treatment before Phase 1 exit.
- Standard ScrollViews currently render the fixture without specialised virtualisation. The full 48-channel/multi-day rendering load still needs device measurement; qualitative iPhone acceptance is not proof of production performance.
- CI still generates its lockfile before `npm ci`; dependency reproducibility needs cleanup. Run #48 reported 15 moderate dependency advisories, not yet triaged. Do not use a forced dependency upgrade as an automatic fix.
- Production schedule/metadata/logo/artwork rights, supplier reliability, exact subscription price/trial/paywall and final visual design remain later gates.

## EXACT NEXT STEP
**Complete a focused Phase 1 programme-detail and readability validation pass: inspect the current implementation, add or run appropriate automated regression checks where possible, and obtain only the remaining device observations for opening/closing detail, missing metadata, short programme cells, larger system text and light/dark. Record each actual result in `docs/DEVICE_TEST_REPORT.md`; keep the accepted scroll baseline unchanged.**

The owner's Mac is at `~/projects/teevee`. GitHub changes do not update that checkout automatically. Stop Metro with Control+C, use `git pull --ff-only`, then `npm run start:clean` when new app code is ready. The current acceptance record changes documentation only, so the owner need not reload or reinstall for it.

Do not introduce real EPG, subscriptions, accounts, Tonight, enrichment or specialised virtualisation in this validation pass. Android and the other open Phase 1 gates remain required before Phase 2.

## Resume instruction
> Read `AGENTS.md` and `docs/PROJECT_STATE.md` from `zuiderwijk/teevee`. Execute the EXACT NEXT STEP autonomously where possible, follow the Definition of Done, and update PROJECT_STATE and the Dutch timestamped DEVLOG with evidence. Ask only when a choice crosses the approval boundaries or when physical-device input is genuinely required. Never substitute CI success for device acceptance.
