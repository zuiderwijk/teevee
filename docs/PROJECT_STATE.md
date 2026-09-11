# Teevee — Canonical Project State

Last updated: 2026-09-11 19:05 CEST
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
- deterministic fixture generator with 16 synthetic channels and 49 hours of programme data;
- edge cases for varied duration/title length, missing metadata, live/repeat flags and a deliberate schedule gap;
- pure Guide time-to-pixel geometry with automated tests;
- a real two-dimensional Guide viewport;
- fixed/anchored channel column and horizontally scrollable timeline;
- synchronised vertical channel movement;
- programme widths based on real duration;
- compact rendering mode for very narrow programme cells;
- current-time marker;
- `Nu` action;
- current-programme progress indication;
- live device-time source refreshed every 30 seconds for current-time/progress behaviour;
- minimal day switching between today and tomorrow;
- programme selection with a simple bottom-sheet-style detail modal;
- first documented physical-device test path through Expo Go;
- GitHub Actions CI for install, typecheck, lint and tests.

No external EPG provider has been integrated. No production channel logos or programme artwork are used.

## Verification status
GitHub Actions runs through the physical-device test-path increment are green, including narrow-programme rendering. The newest live-clock increment has been committed and must complete CI before it is considered verified.

## Phase 1 objective
Validate the defining UX/technical risk: a high-performance touch-native two-dimensional TV Guide using realistic deterministic fixture data.

## Phase 1 remaining work
- keep latest CI green and resolve any failures;
- perform first physical-device validation through the documented Expo Go path;
- validate rendering/scroll behaviour under realistic mobile conditions;
- inspect whether the current nested ScrollView strategy remains smooth enough before adding specialised virtualisation;
- verify programme selection/detail interaction on device;
- verify light/dark appearance on device;
- perform representative iOS and Android performance validation;
- capture findings and only then decide whether specialised virtualisation is justified.

## Phase 1 exit gate
Do not leave Phase 1 until the Guide is smooth at realistic volume, movement preserves time/channel context, Now is predictable, current/progress state is understandable, programme cells remain useful at practical density, light/dark both work, programme selection works, geometry/domain logic is tested, and the Guide interaction is strong enough to justify proceeding.

## Known risks
### Primary technical risk
The current implementation deliberately uses standard React Native primitives first. The nested scrolling/layout approach must be measured on real devices before introducing specialised virtualisation or gesture dependencies.

### Fixture-time limitation
The deterministic Phase 1 schedule covers a fixed development date/time range. Live device time is now used for current-state behaviour; outside the fixture window the app correctly omits current-time/progress markers. Before broader testing, fixtures may need a deterministic rolling-time strategy or a real development EPG source.

### Production data gate — later
The external development EPG source is not approved for commercial production. Production schedule, metadata, channel-logo and artwork rights remain later gates.

### Commercial gate — later
Exact subscription price, trial and paywall timing are not decided and do not block Phase 1.

### Design gate — later
Visual Direction 01 is not a frozen UI design. Avoid expensive brand polishing before Guide interaction and performance are validated.

## EXACT NEXT STEP
**Verify CI for the live-clock increment and fix any failure autonomously. Once green, execute the first physical-device validation path for Phase 1 or, if this environment cannot run a physical device, make the repository test-ready for the product owner and provide the smallest exact test procedure. Do not introduce specialised virtualisation before measurement.**

For that increment:
1. verify the latest CI result before claiming success;
2. keep the current standard React Native primitives unless device evidence shows jank or synchronisation problems;
3. validate horizontal time scrolling, vertical channel scrolling, `Nu`, today/tomorrow, short programme cells, programme detail and light/dark;
4. record device model/OS and concrete UX/performance findings;
5. update `docs/DEVLOG.md` and this file with evidence and exactly one next step.

## Resume instruction
> Read `AGENTS.md` and `docs/PROJECT_STATE.md` from `zuiderwijk/teevee`. Treat PROJECT_STATE as canonical. Execute the EXACT NEXT STEP autonomously, follow the Definition of Done, and update PROJECT_STATE and the Dutch `docs/DEVLOG.md` when finished. Ask only when a decision crosses the human-approval boundaries in AGENTS.md.
