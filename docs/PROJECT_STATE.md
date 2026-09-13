# Teevee — Canonical Project State

Last updated: 2026-09-13 06:28 CEST
Status: ACTIVE
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
- Expo SDK 57 / React Native / Expo Router project foundation;
- strict TypeScript;
- semantic light/dark theme tokens and system theme resolver;
- Teevee-owned `Channel`, `Programme` and `GuideFixture` domain types;
- deterministic source fixture with 49 hours of programme data;
- runtime fixture rebasing around app-start time so manual tests remain useful on any date while CI fixtures stay deterministic;
- edge cases for varied duration/title length, missing metadata, live/repeat flags and a deliberate schedule gap;
- pure Guide time-to-pixel geometry with automated tests;
- a real two-dimensional Guide viewport;
- fixed/anchored channel column and horizontally scrollable timeline;
- synchronised vertical channel movement;
- programme widths based on real duration;
- compact rendering mode for very narrow programme cells;
- live current-time marker and current-programme progress refreshed every 30 seconds;
- `Nu` action;
- minimal today/tomorrow switching;
- programme selection with a simple bottom-sheet-style detail modal;
- physical-device testing via Expo Go;
- first iPhone validation and targeted scroll retest completed;
- horizontal offset preservation across day switching;
- differentiated native scroll inertia;
- native bounce at guide boundaries;
- test fixture expanded from 16 to 48 synthetic channels for realistic vertical-scroll validation;
- `docs/TESTING.md` plus `docs/DEVICE_TEST_REPORT.md` for repeatable physical-device validation;
- GitHub Actions CI for install, typecheck, lint, tests and Expo web export.

No external EPG provider has been integrated. No production channel logos or programme artwork are used.

## Verification status
The iPhone scroll retest is accepted by the product owner: horizontal back-in-time behaviour, day-switch time-context preservation and native boundary bounce no longer block progression. General scrolling remains smooth enough to keep the standard React Native scroll architecture.

The 48-channel fixture increment is now also **GREEN in CI** across install, TypeScript, lint, tests and Expo web export. One observation remains deliberately unclassified: a vertical downward swipe may feel slightly slow, but the prior 16-channel fixture was too short to judge inertial travel reliably. No vertical deceleration change should be made until the longer 48-channel fixture has been tested on device.

## Phase 1 objective
Validate the defining UX/technical risk: a high-performance touch-native two-dimensional TV Guide using realistic deterministic fixture data.

## Phase 1 remaining work
- retest vertical swipe travel with the 48-channel fixture before changing vertical deceleration;
- test `Nu`, current-time/progress, narrow cells, programme detail and light/dark on device;
- record device model/OS when available;
- perform representative Android validation before Phase 1 exit;
- decide only from device evidence whether specialised virtualisation is necessary.

## Phase 1 exit gate
Do not leave Phase 1 until the Guide is smooth at realistic volume, movement preserves time/channel context, Now is predictable, current/progress state is understandable, programme cells remain useful at practical density, light/dark both work, programme selection works, geometry/domain logic is tested, and the Guide interaction is strong enough to justify proceeding.

## Known risks
### Primary technical risk
Standard React Native scroll primitives perform well in the first iPhone validation and remain the preferred simple architecture. Vertical inertial travel still needs one realistic-length check before its tuning is frozen.

### Production data gate — later
The external development EPG source is not approved for commercial production. Production schedule, metadata, channel-logo and artwork rights remain later gates.

### Commercial gate — later
Exact subscription price, trial and paywall timing are not decided and do not block Phase 1.

### Design gate — later
Visual Direction 01 is not a frozen UI design. Avoid expensive brand polishing before Guide interaction and performance are validated.

## EXACT NEXT STEP
**Retest one or more long vertical swipes on the same iPhone using the 48-channel fixture. Only if vertical travel still feels materially too short with realistic scroll distance should `decelerationRate` be adjusted. Record the result in `docs/DEVICE_TEST_REPORT.md`.**

After that retest, continue the remaining Phase 1 device checks: `Nu`, current-time/progress, narrow cells, programme detail and light/dark. Android validation remains required before Phase 1 exit.

Do not introduce real EPG, subscriptions, accounts, Tonight, enrichment or specialised virtualisation before this evidence exists.

## Resume instruction
> Read `AGENTS.md` and `docs/PROJECT_STATE.md` from `zuiderwijk/teevee`. Treat PROJECT_STATE as canonical. Execute the EXACT NEXT STEP autonomously, follow the Definition of Done, and update PROJECT_STATE and the Dutch `docs/DEVLOG.md` when finished. Ask only when a decision crosses the human-approval boundaries in AGENTS.md.
